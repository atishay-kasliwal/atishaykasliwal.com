// The full résumé PDF check: src/resume-core/screen.js, then pdf.js reads the text, page count and
// metadata. It runs in the admin's browser before an upload, in the build (for the bundled PDF)
// and in the tests; never in a Pages Function, where pdf.js would exceed the Workers Free plan's
// CPU limit. A file passes only if it is a well-formed, unencrypted PDF with no active content, a
// sensible page count and extractable text.
import { getDocumentProxy } from "unpdf";
import { LIMITS } from "./constants.js";
import { screenPdf } from "./screen.js";

// Text in reading order: pdf.js returns positioned runs; runs on the same baseline (within 2pt)
// form a line, read left to right.
async function pageLines(page) {
  const { items } = await page.getTextContent();
  const runs = items
    .filter(item => typeof item.str === "string" && item.str.trim())
    .map(item => ({ text: item.str, x: item.transform[4], y: item.transform[5] }))
    .sort((a, b) => b.y - a.y || a.x - b.x);
  const lines = [];
  for (const run of runs) {
    const line = lines.at(-1);
    if (line && Math.abs(line.y - run.y) <= 2) line.runs.push(run);
    else lines.push({ y: run.y, runs: [run] });
  }
  return lines
    .map(line => line.runs.sort((a, b) => a.x - b.x).map(run => run.text).join(" ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export async function inspectPdf(input, options = {}) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const screened = await screenPdf(bytes, options);
  const { errors, warnings, checks, info } = screened;
  const lines = [];
  const check = (id, label, ok, detail) => {
    checks.push({ id, label, ok, detail });
    if (!ok) errors.push(detail);
    return ok;
  };
  const result = () => ({ ok: errors.length === 0, errors, warnings, checks, info, lines });
  if (!screened.ok) return result();

  let pdf;
  try {
    pdf = await getDocumentProxy(bytes.slice(), { isEvalSupported: false, stopAtErrors: true, disableFontFace: true, useSystemFonts: false, verbosity: 0 });
  } catch (error) {
    const detail = error?.name === "PasswordException" ? "The PDF is password protected." : `The PDF could not be parsed (${error?.message ?? "unknown error"}).`;
    check("parse", "Parses cleanly", false, detail);
    return result();
  }
  try {
    const [metadata, jsActions, attachments] = await Promise.all([pdf.getMetadata().catch(() => null), pdf.getJSActions(), pdf.getAttachments()]);
    const meta = metadata?.info ?? {};
    Object.assign(info, { title: meta.Title || null, author: meta.Author || null, producer: meta.Producer || null, creator: meta.Creator || null });
    if (jsActions || attachments || meta.IsXFAPresent) {
      check("active-content", "No active content", false, "The PDF parser found scripts, attachments or an XFA form.");
      return result();
    }
    info.pages = pdf.numPages;
    check("pages", "Page count", pdf.numPages >= 1 && pdf.numPages <= LIMITS.maxPages, pdf.numPages > LIMITS.maxPages ? `${pdf.numPages} pages; the limit is ${LIMITS.maxPages}.` : `${pdf.numPages} page${pdf.numPages === 1 ? "" : "s"}`);
    if (meta.IsAcroFormPresent) warnings.push("The PDF contains form fields; they are not shown in the text check.");

    for (let number = 1; number <= Math.min(pdf.numPages, LIMITS.maxPages); number += 1) {
      lines.push(...(await pageLines(await pdf.getPage(number))));
    }
    const compact = lines.join("").replace(/\s/g, "");
    info.textChars = compact.length;
    check(
      "text",
      "Extractable text",
      compact.length >= LIMITS.minTextChars,
      compact.length >= LIMITS.minTextChars
        ? `${compact.length.toLocaleString("en-US")} characters`
        : `Only ${compact.length} characters of text could be extracted. A scanned or image-only PDF cannot be read by applicant tracking systems or crawlers.`,
    );
    const letters = (compact.match(/[A-Za-z]/g) ?? []).length;
    if (compact.length && letters / compact.length < 0.5) warnings.push("Much of the extracted text is not letters; the fonts may not map to readable characters.");
  } catch (error) {
    check("parse", "Parses cleanly", false, `The PDF could not be read (${error?.message ?? "unknown error"}).`);
  } finally {
    await (pdf.destroy?.() ?? pdf.cleanup?.())?.catch?.(() => {});
  }
  if (!checks.some(item => item.id === "parse")) checks.splice(checks.findIndex(item => item.id === "pages"), 0, { id: "parse", label: "Parses cleanly", ok: true, detail: "Read by pdf.js" });
  return result();
}
