/**
 * When running the main site (npm start), proxy /dashboard/* to the dashboard dev server (npm run dev:dashboard on port 5173)
 * so the iframe loads the live dashboard with hot reload.
 * If public/dashboard exists, the dev server may serve it first; temporarily rename it to public/dashboard.bak to use the proxy.
 */
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/dashboard",
    createProxyMiddleware({
      target: "http://localhost:5173",
      changeOrigin: true,
      ws: true,
    })
  );
};
