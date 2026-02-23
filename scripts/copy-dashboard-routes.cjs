/**
 * Copy public/dashboard/index.html to public/dashboard/<route>/index.html
 * so that /dashboard/jobs, /dashboard/login, etc. serve the dashboard app on GitHub Pages (refresh works).
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dashboardDir = path.join(root, "public", "dashboard");
const indexPath = path.join(dashboardDir, "index.html");

const ROUTES = ["jobs", "login", "referrals", "notes", "pending"];

if (!fs.existsSync(indexPath)) {
  console.warn("copy-dashboard-routes: public/dashboard/index.html not found, skipping.");
  process.exit(0);
}

const html = fs.readFileSync(indexPath, "utf8");
for (const route of ROUTES) {
  const dir = path.join(dashboardDir, route);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
}
console.log("copy-dashboard-routes: wrote dashboard index.html to", ROUTES.join(", "));
