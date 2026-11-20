// The full check of one résumé PDF: validation and text (pdf.js), then consistency with the
// canonical profile. The admin page runs it in the browser before uploading, the build runs it for
// the bundled PDF, and the tests run it in Node. Pages Functions never do: on the Workers Free plan
// pdf.js would exceed the CPU limit. The server repeats only the cheap safety screen
// (src/resume-core/screen.js) and checks that the report it receives is well formed.
import { inspectPdf } from "./pdf.js";
import { compareWithProfile } from "./consistency.js";
import { LIMITS, sha256Hex } from "./constants.js";

export async function checkResume(input, { filename, contentType, profile, reviewItems, at = new Date().toISOString() }) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const { lines, ...validation } = await inspectPdf(bytes, { filename, contentType });
  if (!validation.ok) return { ok: false, validation };
  return {
    ok: true,
    sha256: await sha256Hex(bytes),
    validation,
    consistency: compareWithProfile(lines, profile, reviewItems),
    text: lines.slice(0, LIMITS.keptLines),
    checkedAt: at,
  };
}

// Re-check a stored version against the profile as deployed now, from its kept text.
export const recheckText = (text, { profile, reviewItems }) => compareWithProfile(text, profile, reviewItems);
