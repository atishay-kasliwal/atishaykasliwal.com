import { serviceAdminRoute, json } from "../../../../../_lib/admin.js";
import { getVersion, publishVersion, ResumeRequestError } from "../../../../../../src/resume-core/store.js";

// POST {"sha256": "...", "acknowledgeConflicts": true, "reason": "..."}: serve this version at the
// public résumé URL. Publishing an earlier version is recorded as a restore. The request must name
// the exact file (sha256), and a version with conflicts against the canonical profile needs an
// explicit acknowledgement; publishing never changes the profile itself.
export const onRequestPost = serviceAdminRoute(async ({ request, env, params }, admin) => {
  if (!String(request.headers.get("Content-Type")).startsWith("application/json")) throw new ResumeRequestError("expected JSON", 415);
  let body;
  try {
    body = await request.json();
  } catch {
    throw new ResumeRequestError("expected JSON");
  }
  const { row, version } = await getVersion(env.DB, params.id);
  if (body?.sha256 !== row.sha256) throw new ResumeRequestError("sha256 does not match this version", 409);
  const conflicts = version.report?.consistency?.summary?.conflict ?? 0;
  if (conflicts > 0 && body.acknowledgeConflicts !== true) {
    throw new ResumeRequestError(`This PDF has ${conflicts} conflict${conflicts === 1 ? "" : "s"} with the canonical profile; acknowledge them to publish.`, 409, { needsAcknowledgement: true });
  }
  if (!(await env.RESUMES?.head(row.r2_key))) throw new ResumeRequestError("the stored file is missing; upload it again", 409);
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 300) || null : null;
  const result = await publishVersion(env.DB, row.id, { at: new Date().toISOString(), actor: admin.email, reason });
  return json({ ...result, versionId: row.id, sha256: row.sha256 });
});
