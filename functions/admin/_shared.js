const ADMIN_DESCRIPTION =
  'Private editorial workspace for managing portfolio content and publishing operations.';

function buildAdminBootPayload(pathname) {
  const signInRoute = pathname === '/admin' || pathname.startsWith('/admin/sign-in');
  const title = signInRoute
    ? 'Admin Sign-In | Atishay Kasliwal'
    : 'Admin Workspace | Atishay Kasliwal';
  const eyebrow = signInRoute ? 'Admin Sign-In' : 'Admin Workspace';
  const heading = signInRoute
    ? 'Opening the editorial workspace'
    : 'Loading the admin workspace';
  const message = signInRoute
    ? 'Preparing the secure sign-in screen for the private CMS.'
    : 'Restoring the private CMS route and loading your session.';

  return {
    title,
    shell: `
      <div style="min-height:100svh;display:flex;align-items:center;justify-content:center;padding:40px 24px;background:radial-gradient(circle at top, rgba(37,99,235,0.18), transparent 38%), #050505;color:#f5f1eb;font-family:Inter, system-ui, sans-serif;">
        <div style="width:min(680px,100%);border:1px solid rgba(245,241,235,0.12);border-radius:28px;padding:32px;background:rgba(12,12,12,0.92);box-shadow:0 28px 80px rgba(0,0,0,0.32);">
          <p style="margin:0 0 14px;color:#7aa2ff;font-size:12px;letter-spacing:0.28em;text-transform:uppercase;">${eyebrow}</p>
          <h1 style="margin:0 0 16px;font-family:'Iowan Old Style','Palatino Linotype','Book Antiqua',Palatino,Georgia,serif;font-size:clamp(2.2rem,6vw,4.4rem);line-height:0.96;font-weight:500;">${heading}</h1>
          <p style="margin:0;color:rgba(245,241,235,0.72);font-size:1rem;line-height:1.7;max-width:44ch;">${message}</p>
        </div>
      </div>
    `,
  };
}

class RootHandler {
  constructor(shell) {
    this.shell = shell;
  }

  element(element) {
    element.removeAttribute('data-prerendered');
    element.setInnerContent(this.shell, { html: true });
  }
}

class TitleHandler {
  constructor(title) {
    this.title = title;
  }

  element(element) {
    element.setInnerContent(this.title);
  }
}

class StaticAttributeHandler {
  constructor(attribute, value) {
    this.attribute = attribute;
    this.value = value;
  }

  element(element) {
    element.setAttribute(this.attribute, this.value);
  }
}

class CanonicalHandler {
  constructor(url) {
    this.url = url;
  }

  element(element) {
    element.setAttribute('href', this.url);
  }
}

class RemoveElementHandler {
  element(element) {
    element.remove();
  }
}

export async function handleAdminRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const { title, shell } = buildAdminBootPayload(url.pathname);

  const assetResponse = await env.ASSETS.fetch(new URL('/', request.url));
  const rewritten = new HTMLRewriter()
    .on('title', new TitleHandler(title))
    .on('meta[name="description"]', new StaticAttributeHandler('content', ADMIN_DESCRIPTION))
    .on('meta[name="robots"]', new StaticAttributeHandler('content', 'noindex, nofollow'))
    .on('meta[name="googlebot"]', new StaticAttributeHandler('content', 'noindex, nofollow'))
    .on('link[rel="canonical"]', new CanonicalHandler(url.href))
    .on('script[type="application/ld+json"]', new RemoveElementHandler())
    .on('#root', new RootHandler(shell))
    .transform(assetResponse);

  const headers = new Headers(rewritten.headers);
  headers.set('cache-control', 'no-store');
  headers.set('x-robots-tag', 'noindex, nofollow');

  return new Response(rewritten.body, {
    status: rewritten.status,
    statusText: rewritten.statusText,
    headers,
  });
}

export { buildAdminBootPayload };
