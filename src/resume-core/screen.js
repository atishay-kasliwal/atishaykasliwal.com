// The cheap half of the résumé PDF check: size, type, structure, encryption and active content
// (scripts, launch actions, attachments), including inside compressed object streams. It needs no
// PDF parser, so it fits the Pages Function's CPU budget on the Workers Free plan (about 1 ms for a
// one-page résumé). Reading the text (src/resume-core/pdf.js) runs in the admin's browser and in
// the build instead.
import { LIMITS } from "./constants.js";

// Formats that are never résumés and must never be stored, named so the error says what was sent.
const MAGIC = [
  [[0x4d, 0x5a], "a Windows executable"],
  [[0x7f, 0x45, 0x4c, 0x46], "a Linux executable"],
  [[0xcf, 0xfa, 0xed, 0xfe], "a macOS executable"],
  [[0xfe, 0xed, 0xfa, 0xcf], "a macOS executable"],
  [[0xca, 0xfe, 0xba, 0xbe], "a macOS or Java executable"],
  [[0x50, 0x4b, 0x03, 0x04], "a ZIP archive (or Office document)"],
  [[0x23, 0x21], "a script"],
];

// PDF names that run code, open other files or carry payloads. A résumé needs none of them.
const ACTIVE_CONTENT = [
  ["JavaScript", "JavaScript"],
  ["JS", "JavaScript"],
  ["Launch", "a launch action, which can start programs"],
  ["EmbeddedFile", "an embedded file"],
  ["EmbeddedFiles", "embedded files"],
  ["RichMedia", "embedded rich media"],
  ["XFA", "an XFA form"],
  ["SubmitForm", "a form submission action"],
  ["ImportData", "a data import action"],
  ["GoToE", "a link into an embedded file"],
  ["GoToR", "a link that opens another file"],
  ["AA", "automatic actions"],
].map(([name, label]) => ({ name, label, pattern: new RegExp(`/${name}(?=[\\s/<>\\[\\]()%{}]|$)`) }));

function latin1(bytes) {
  let text = "";
  for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return text;
}

// PDF names may hex-escape characters (/J#61vaScript); decode them so the scan cannot be dodged.
const decodeNames = text => text.replace(/#([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

async function inflate(bytes, budget) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate"));
  const reader = stream.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > budget.remaining) {
      await reader.cancel();
      throw new Error("decompressed size limit");
    }
    chunks.push(value);
  }
  budget.remaining -= size;
  const out = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

// Compressed object streams can hide dictionaries (and so actions) from a plain byte scan; inflate
// them and scan their contents too. Page content and image streams cannot hold actions and are skipped.
async function objectStreamText(bytes, raw, budget) {
  const texts = [];
  // Not the "stream" inside "endstream": after one object stream that would start a second, bogus one.
  const streamKeyword = /(?<!end)stream\r?\n/g;
  let match;
  while ((match = streamKeyword.exec(raw))) {
    const dictStart = raw.lastIndexOf("obj", match.index);
    const dict = raw.slice(dictStart, match.index);
    if (!/\/Type\s*\/ObjStm/.test(dict) || !/\/FlateDecode/.test(dict)) continue;
    const start = match.index + match[0].length;
    // \b keeps "/Length 12 0 R" (an indirect length) from matching as the number 1.
    const length = /\/Length\s+(\d+)\b(?!\s+\d+\s+R)/.exec(dict);
    let end = length ? start + Number(length[1]) : raw.indexOf("endstream", start);
    // Without a direct length the data ends at "endstream", less the end-of-line before it.
    if (!length && end > start) end -= raw[end - 2] === "\r" && raw[end - 1] === "\n" ? 2 : /[\r\n]/.test(raw[end - 1]) ? 1 : 0;
    if (end <= start || end > bytes.length) throw new Error("object stream runs past the end of the file");
    texts.push(latin1(await inflate(bytes.subarray(start, end), budget)));
    streamKeyword.lastIndex = end;
  }
  return texts.join("\n");
}

export async function screenPdf(input, { filename = "", contentType = "" } = {}) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const errors = [];
  const warnings = [];
  const checks = [];
  const info = { sizeBytes: bytes.length, pages: null, textChars: 0, pdfVersion: null, title: null, author: null, producer: null, creator: null };
  const check = (id, label, ok, detail) => {
    checks.push({ id, label, ok, detail });
    if (!ok) errors.push(detail);
    return ok;
  };
  const result = () => ({ ok: errors.length === 0, errors, warnings, checks, info });

  const sizeOk = check(
    "size",
    "File size",
    bytes.length >= LIMITS.minBytes && bytes.length <= LIMITS.maxBytes,
    bytes.length > LIMITS.maxBytes
      ? `The file is ${(bytes.length / 1048576).toFixed(1)} MB; the limit is ${LIMITS.maxBytes / 1048576} MB.`
      : bytes.length < LIMITS.minBytes
        ? `The file is ${bytes.length} bytes, too small to be a résumé.`
        : `${(bytes.length / 1024).toFixed(0)} KB`,
  );
  if (!sizeOk) return result();

  const lowerName = String(filename).toLowerCase();
  const declared = String(contentType).toLowerCase().split(";")[0].trim();
  check(
    "type",
    "File type",
    lowerName.endsWith(".pdf") && (!declared || declared === "application/pdf" || declared === "application/octet-stream"),
    lowerName.endsWith(".pdf") ? `Declared as ${declared || "unspecified"}; only application/pdf is accepted.` : "Only .pdf files are accepted.",
  );
  if (checks.at(-1).ok) checks.at(-1).detail = "application/pdf";

  const magic = MAGIC.find(([signature]) => signature.every((byte, i) => bytes[i] === byte));
  if (magic) {
    check("header", "PDF header", false, `This is ${magic[1]}, not a PDF.`);
    return result();
  }
  const raw = latin1(bytes);
  const header = /^%PDF-(1\.[0-7]|2\.0)/.exec(raw.slice(0, 16));
  if (!check("header", "PDF header", Boolean(header), header ? `PDF ${header[1]}` : "The file does not start with a PDF header.")) return result();
  info.pdfVersion = header[1];
  const tail = raw.slice(-2048);
  check(
    "trailer",
    "Complete file",
    tail.includes("%%EOF") && raw.includes("startxref"),
    tail.includes("%%EOF") && raw.includes("startxref") ? "Trailer and cross-reference present" : "The file is truncated: no end-of-file marker or cross-reference.",
  );
  check("encryption", "Not encrypted", !/\/Encrypt(?=[\s/<>\[\]()%{}])/.test(raw), /\/Encrypt\b/.test(raw) ? "Encrypted PDFs cannot be checked; export it without a password or restrictions." : "No encryption");

  let scanned = decodeNames(raw);
  try {
    scanned += decodeNames(await objectStreamText(bytes, raw, { remaining: LIMITS.maxInflatedBytes }));
  } catch (error) {
    check("active-content", "No active content", false, `Compressed objects could not be checked (${error.message}).`);
    return result();
  }
  const found = [...new Set(ACTIVE_CONTENT.filter(item => item.pattern.test(scanned)).map(item => item.label))];
  check("active-content", "No active content", found.length === 0, found.length ? `Contains ${found.join(", ")}.` : "No scripts, launch actions, forms or attachments");
  if (errors.length) return result();
  return result();
}
