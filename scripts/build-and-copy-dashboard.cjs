/**
 * Build the dashboard app (Vite) and copy the output to public/dashboard
 * so the main site build and deploy include the latest dashboard.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const webApp = path.join(root, "UI interface", "apps", "web");
const distDir = path.join(webApp, "dist", "dashboard");
const publicDashboard = path.join(root, "public", "dashboard");

console.log("Building dashboard app...");
execSync("npm run build", {
  cwd: webApp,
  stdio: "inherit",
});

if (!fs.existsSync(distDir)) {
  console.error("Dashboard build output not found at", distDir);
  process.exit(1);
}

if (!fs.existsSync(publicDashboard)) {
  fs.mkdirSync(publicDashboard, { recursive: true });
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      copyRecursive(path.join(src, name), path.join(dest, name));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Clear existing content (keep dir) then copy new build
for (const name of fs.readdirSync(publicDashboard)) {
  const p = path.join(publicDashboard, name);
  if (fs.statSync(p).isDirectory()) {
    fs.rmSync(p, { recursive: true });
  } else {
    fs.unlinkSync(p);
  }
}

for (const name of fs.readdirSync(distDir)) {
  copyRecursive(path.join(distDir, name), path.join(publicDashboard, name));
}

console.log("Dashboard build copied to public/dashboard");
