// Shared by the public résumé route, the admin API, the build and the tests.

export const SITE = "https://atishaykasliwal.com";
export const RESUME_PATH = "/Atishay-Kasliwal-Resume.pdf";
export const RESUME_URL = `${SITE}${RESUME_PATH}`;
// The PDF committed in public/ and bundled with every deploy. It is served whenever no version has
// been published from the admin, or when D1 or R2 cannot be read.
export const BUNDLED_RESUME_FILE = "public/Atishay-Kasliwal-Resume.pdf";

export const LIMITS = {
  maxBytes: 5 * 1024 * 1024,
  minBytes: 1024,
  maxPages: 6,
  // Fewer non-space characters than this means the PDF is an image or the fonts carry no text.
  minTextChars: 300,
  // Decompressed bytes scanned for active content, so a crafted stream cannot exhaust memory.
  maxInflatedBytes: 32 * 1024 * 1024,
  // Lines of extracted text kept with a version, so it can be re-checked without the PDF parser.
  keptLines: 600,
};

export const versionIdOf = sha256 => sha256.slice(0, 16);

export async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}
