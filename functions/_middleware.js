/**
 * Cloudflare Pages Functions middleware for SPA routing
 * This ensures all routes serve index.html for React Router
 */
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;
  
  // Allow static assets and files to pass through
  if (
    pathname.startsWith('/static/') ||
    pathname.startsWith('/resume/') ||
    pathname.startsWith('/documents/') ||
    pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|pdf|json|xml|txt|map|woff|woff2|ttf|eot)$/i) ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/humans.txt' ||
    pathname === '/security.txt' ||
    pathname === '/index.html'
  ) {
    return context.next();
  }
  
  // For all other routes (SPA routes), rewrite to index.html
  // This allows React Router to handle the routing client-side
  const newUrl = new URL(context.request.url);
  newUrl.pathname = '/index.html';
  return context.next({
    request: new Request(newUrl, context.request)
  });
}

