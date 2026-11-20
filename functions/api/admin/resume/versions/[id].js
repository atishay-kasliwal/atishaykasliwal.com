import { serviceAdminRoute, json } from "../../../../_lib/admin.js";
import { getVersion } from "../../../../../src/resume-core/store.js";

// GET: one version with its full validation and consistency report.
export const onRequestGet = serviceAdminRoute(async ({ env, params }) => json({ version: (await getVersion(env.DB, params.id)).version }));
