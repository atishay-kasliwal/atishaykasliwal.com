import { serviceAdminRoute, json } from "../../../_lib/admin.js";
import { bundledResume, servingState } from "../../../_lib/resume.js";
import { activeResume, listState } from "../../../../src/resume-core/store.js";
import { LIMITS, RESUME_PATH } from "../../../../src/resume-core/constants.js";

// GET: the published version, every uploaded version, the bundled fallback (checked against the
// canonical profile), what the public URL is serving now, and the audit log.
export const onRequestGet = serviceAdminRoute(async ({ request, env }) => {
  const [state, bundled, active] = await Promise.all([listState(env.DB), bundledResume({ withReport: true }), activeResume(env.DB)]);
  return json({
    ...state,
    bundled,
    serving: await servingState(env, active),
    publicPath: RESUME_PATH,
    limits: LIMITS,
    storageReady: Boolean(env.RESUMES),
  });
});
