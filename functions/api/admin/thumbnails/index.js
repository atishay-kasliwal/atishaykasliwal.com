import { json, serviceAdminRoute } from "../../../_lib/admin.js";
import { listCards } from "../../../_lib/card-thumbnails.js";

// Every carousel card, its built-in image and the thumbnail chosen in Admin, if any.
export const onRequestGet = serviceAdminRoute(async ({ env }) => json({ cards: await listCards(env) }));
