// Server-side checks. The browser's MIME type is never trusted: the file's leading bytes decide.
export const MAX_ORIGINAL_BYTES = 40 * 1024 * 1024;
export const MAX_DISPLAY_BYTES = 6 * 1024 * 1024;

export function sniffImageType(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) return "webp";
  // HEIC uses an ISO-BMFF ftyp box. Inspect the declared compatible brands,
  // never the filename or MIME. Generic mif1 and AVIF/video brands alone are
  // insufficient to identify a supported HEVC still photo.
  if (bytes.length >= 20 && String.fromCharCode(...bytes.slice(4, 8)) === "ftyp") {
    const length = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0);
    if (length >= 20 && length <= bytes.length && length <= 4096 && length % 4 === 0) {
      for (let offset = 8; offset < length; offset += 4) {
        if (offset === 12) continue; // minor version, not a brand
        const brand = String.fromCharCode(...bytes.slice(offset, offset + 4));
        if (["heic", "heix", "hevc", "hevx"].includes(brand)) return "heic";
      }
    }
  }
  return null;
}

// Reads width and height from the header without decoding the image. Returns null when the
// header is unrecognised, which rejects the upload instead of guessing.
export function readDimensions(bytes, type) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (type === "png") {
    if (bytes.length < 24) return null;
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (type === "jpeg") {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) return null;
      const marker = bytes[offset + 1];
      const length = view.getUint16(offset + 2);
      const isFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
      if (isFrame) return { height: view.getUint16(offset + 5), width: view.getUint16(offset + 7) };
      offset += 2 + length;
    }
    return null;
  }
  if (type === "webp") {
    const chunk = String.fromCharCode(...bytes.slice(12, 16));
    if (chunk === "VP8X") {
      const width = 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16));
      const height = 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16));
      return { width, height };
    }
    return null;
  }
  return null;
}

export function validateUpload({ original, display, metadata }) {
  const errors = [];
  if (!original || !display) errors.push("Both an original and a display image are required.");
  if (original && original.length > MAX_ORIGINAL_BYTES) errors.push("Original is larger than 40 MB.");
  if (display && display.length > MAX_DISPLAY_BYTES) errors.push("Display image is larger than 6 MB.");
  const originalType = original ? sniffImageType(original) : null;
  const displayType = display ? sniffImageType(display) : null;
  if (original && !originalType) errors.push("Original is not a JPEG, PNG, WebP or HEIC/HEIF image.");
  if (display && displayType !== "jpeg" && displayType !== "webp") errors.push("Display image must be JPEG or WebP.");
  const originalDimensions = originalType && originalType !== "heic" ? readDimensions(original, originalType) : null;
  if (originalType && originalType !== "heic" && !originalDimensions) errors.push("Original dimensions could not be read.");
  // Public records describe the orientation-correct, resized display image.
  // This also handles iPhone JPEGs whose EXIF rotates the encoded original.
  const dimensions = displayType ? readDimensions(display, displayType) : null;
  if (display && (!dimensions || dimensions.width <= 0 || dimensions.height <= 0)) errors.push("Display dimensions could not be read.");
  const colors = Array.isArray(metadata?.colors) ? metadata.colors : [];
  if (colors.length > 12) errors.push("Too many colours supplied.");
  const alt = String(metadata?.alt ?? "").trim();
  if (alt.length > 300) errors.push("Alt text must be 300 characters or fewer.");
  return {
    ok: errors.length === 0,
    errors,
    originalType,
    displayType,
    dimensions,
    colors,
    alt,
  };
}

export function orientationOf(width, height) {
  if (width === height) return "square";
  return width > height ? "landscape" : "portrait";
}
