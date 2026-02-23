const fs = require("fs");
const path = require("path");
const out = path.join(__dirname, "..", "dist", "_redirects");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, "/dashboard/*  /dashboard/index.html  200\n");
console.log("Wrote dist/_redirects");
