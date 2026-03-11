import React, { useEffect, useState, useLayoutEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import './HighlightDetail.css';

// Import project data
import { projectsData } from './Projects';
import { getProjectArticleByUuid } from './project list';

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const getArticleMeta = (projectUuid) => {
  switch (projectUuid) {
    case 'a1b2c3d4-e5f6-4789-a012-3456789abcde':
      return { date: '14 May 2025', readingTime: '6 min read' };
    case 'b2c3d4e5-f6a7-4890-b123-456789abcdef':
      return { date: '02 Apr 2025', readingTime: '7 min read' };
    case 'c3d4e5f6-a7b8-4901-c234-56789abcdef0':
      return { date: '19 Mar 2025', readingTime: '5 min read' };
    case 'd4e5f6a7-b8c9-4012-d345-6789abcdef01':
      return { date: '11 Feb 2025', readingTime: '8 min read' };
    default:
      return { date: '2025', readingTime: '5 min read' };
  }
};

// Hoisted to module scope so it can be used both inside hooks and render
const getDocumentInfo = (uuid) => {
  const documentMap = {
    'a1b2c3d4-e5f6-4789-a012-3456789abcde': {
      topDoc: {
        path: 'https://docs.google.com/presentation/d/1gde6FEXKTStqaU2QD5GolMvQp0qijGjk/edit?usp=sharing&ouid=100140551720252713559&rtpof=true&sd=true',
        type: 'pptx',
        source: 'googledrive',
      },
      bottomDoc: {
        path: 'https://docs.google.com/document/d/1XnR8zq8dbEB7etLmzfMcjpAyqYk04W-pKQaH477Kkl0/edit?usp=sharing',
        type: 'pdf',
        source: 'googledrive',
      },
    },
    'b2c3d4e5-f6a7-4890-b123-456789abcdef': {
      topDoc: {
        path: 'https://docs.google.com/presentation/d/1NZ_KKAm-ppS29vNwj-ZIx2BOPrpaMLJS/edit?usp=sharing&ouid=100140551720252713559&rtpof=true&sd=true',
        type: 'pptx',
        source: 'googledrive',
      },
      bottomDoc: {
        path: 'https://docs.google.com/document/d/1XnR8zq8dbEB7etLmzfMcjpAyqYk04W-pKQaH477Kkl0/edit?usp=sharing',
        type: 'pdf',
        source: 'googledrive',
      },
    },
    'c3d4e5f6-a7b8-4901-c234-56789abcdef0': {
      topDoc: {
        path: 'https://docs.google.com/presentation/d/1rkBiHmmfEWZUHpQoekizPKddYo5k9thF2h2UDsXPlKw/edit?slide=id.p1#slide=id.p1',
        type: 'pptx',
        source: 'googledrive',
      },
      bottomDoc: {
        path: 'https://docs.google.com/document/d/1XnR8zq8dbEB7etLmzfMcjpAyqYk04W-pKQaH477Kkl0/edit?usp=sharing',
        type: 'pdf',
        source: 'googledrive',
      },
    },
    'd4e5f6a7-b8c9-4012-d345-6789abcdef01': {
      topDoc: {
        path: '/documents/healthcare-presentation.pptx',
        type: 'pptx',
        source: 'local',
      },
      bottomDoc: {
        path: 'https://docs.google.com/document/d/1XnR8zq8dbEB7etLmzfMcjpAyqYk04W-pKQaH477Kkl0/edit?usp=sharing',
        type: 'pdf',
        source: 'googledrive',
      },
    },
  };
  return documentMap[uuid] || null;
};

const getPresentationEmbedUrl = (docInfo) => {
  if (!docInfo?.path?.includes('docs.google.com/presentation')) return null;
  const fileIdMatch = docInfo.path.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!fileIdMatch) return null;
  return `https://docs.google.com/presentation/d/${fileIdMatch[1]}/embed?start=false&loop=false&delayms=3000`;
};

const getDocumentViewerUrl = (docInfo) => {
  const { path, type, source } = docInfo;

  if (path.includes('docs.google.com/document')) {
    const fileIdMatch = path.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch) {
      return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
    }
  }

  if (path.includes('docs.google.com/presentation')) {
    const fileIdMatch = path.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch) {
      return `https://docs.google.com/presentation/d/${fileIdMatch[1]}/export/pdf`;
    }
    if (path.includes('/preview') || path.includes('/embed')) {
      const fileIdMatch2 = path.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch2) {
        return `https://docs.google.com/presentation/d/${fileIdMatch2[1]}/export/pdf`;
      }
    }
  }

  if (source === 'googledrive' || path.includes('drive.google.com/file')) {
    const fileIdMatch = path.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch) {
      return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
    }
    if (path.includes('/preview')) return path;
  }

  if (type === 'pptx') {
    const fullUrl = window.location.origin + path;
    return `https://docs.google.com/viewer?url=${encodeURIComponent(fullUrl)}&embedded=true`;
  }

  return `${path}#toolbar=0`;
};

export default function HighlightDetail() {
  const { id, uuid } = useParams();
  const navigate = useNavigate();
  const identifier = id || uuid;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(identifier || '')
  );

  const project = isUuid
    ? projectsData.find((p) => p.uuid === identifier)
    : projectsData.find((p) => slugify(p.title) === String(identifier || '').toLowerCase());

  const projectUuid = project?.uuid;
  const articleFromFile = getProjectArticleByUuid(projectUuid);
  const articleMeta = articleFromFile
    ? { date: articleFromFile.date, readingTime: articleFromFile.readingTime }
    : getArticleMeta(projectUuid);

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // State to control iframe loading - delay iframe loading until after scroll-to-top
  const [shouldLoadIframes, setShouldLoadIframes] = useState(false);

  // Active section for scroll spy
  const [activeSection, setActiveSection] = useState('article-lead');

  // Reset iframe loading state when identifier changes
  useEffect(() => {
    setShouldLoadIframes(false);
    setActiveSection('article-lead');
    window.scrollTo(0, 0);
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }, [identifier]);

  // Scroll to top AFTER content renders - use useLayoutEffect to run synchronously after DOM updates
  useLayoutEffect(() => {
    const scrollToTop = () => {
      window.scrollTo(0, 0);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
        document.documentElement.scrollLeft = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
        document.body.scrollLeft = 0;
      }
      const html = document.documentElement;
      if (html.scrollTop !== 0) html.scrollTop = 0;
      if (html.scrollLeft !== 0) html.scrollLeft = 0;
    };

    scrollToTop();
    scrollToTop();

    const timeouts = [
      setTimeout(scrollToTop, 0),
      setTimeout(scrollToTop, 1),
      setTimeout(scrollToTop, 5),
      setTimeout(scrollToTop, 10),
      setTimeout(scrollToTop, 25),
      setTimeout(scrollToTop, 50),
      setTimeout(scrollToTop, 100),
      setTimeout(scrollToTop, 200),
    ];

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, [identifier]);

  // Scroll to top once when project changes; enable iframes after short delay
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo(0, 0);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
        document.documentElement.scrollLeft = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
        document.body.scrollLeft = 0;
      }
    };

    scrollToTop();
    const t = setTimeout(scrollToTop, 80);
    const enableIframesTimeout = setTimeout(() => setShouldLoadIframes(true), 400);

    return () => {
      clearTimeout(t);
      clearTimeout(enableIframesTimeout);
    };
  }, [identifier]);

  // Prevent scroll to top when interacting with iframe navigation
  useEffect(() => {
    const setupIframeScrollPrevention = setTimeout(() => {
      let savedScrollPosition = window.scrollY;
      let isIframeInteraction = false;
      let scrollLockTimeout = null;
      let pageLoadTime = Date.now();
      const PAGE_LOAD_DELAY = 500;

      const saveScrollPosition = () => {
        savedScrollPosition =
          window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      };

      const lockScroll = () => {
        if (Date.now() - pageLoadTime < PAGE_LOAD_DELAY) return;
        isIframeInteraction = true;
        saveScrollPosition();
        if (scrollLockTimeout) clearTimeout(scrollLockTimeout);
        scrollLockTimeout = setTimeout(() => {
          isIframeInteraction = false;
        }, 300);
      };

      const handleContainerClick = (e) => {
        if (e && e.target && typeof e.target.closest === 'function') {
          const container = e.target.closest('.document-embed-container');
          if (container) lockScroll();
        }
      };

      let lastScrollTime = Date.now();
      const handleScroll = (e) => {
        if (Date.now() - pageLoadTime < PAGE_LOAD_DELAY) return;
        const currentScroll =
          window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
        const now = Date.now();
        if (
          isIframeInteraction &&
          currentScroll < savedScrollPosition - 50 &&
          savedScrollPosition > 200
        ) {
          e.preventDefault();
          e.stopImmediatePropagation();
          window.scrollTo({ top: savedScrollPosition, left: 0, behavior: 'instant' });
          document.documentElement.scrollTop = savedScrollPosition;
          if (document.body) document.body.scrollTop = savedScrollPosition;
          return false;
        } else if (now - lastScrollTime > 100) {
          if (Math.abs(currentScroll - savedScrollPosition) < 50 || !isIframeInteraction) {
            savedScrollPosition = currentScroll;
          }
          lastScrollTime = now;
        }
      };

      const handleFocus = (e) => {
        try {
          if (e && e.target && typeof e.target.closest === 'function') {
            const container = e.target.closest('.document-embed-container');
            if (container) {
              lockScroll();
              if (typeof e.target.scrollIntoView === 'function') {
                e.target.scrollIntoView = () => {};
              }
            }
          }
        } catch (error) {
          console.debug('Focus event handling error:', error);
        }
      };

      const handleHashChange = () => lockScroll();

      document.addEventListener('click', handleContainerClick, true);
      window.addEventListener('scroll', handleScroll, { passive: false, capture: true });
      document.addEventListener('focusin', handleFocus, true);
      window.addEventListener('hashchange', handleHashChange);

      const iframes = document.querySelectorAll('.document-iframe');
      iframes.forEach((iframe) => {
        iframe.addEventListener('load', lockScroll);
        iframe.addEventListener('mouseenter', lockScroll);
        iframe.addEventListener('mousedown', lockScroll);
      });

      const observer = new MutationObserver(() => {
        const newIframes = document.querySelectorAll('.document-iframe');
        newIframes.forEach((iframe) => {
          if (!iframe.dataset.scrollLocked) {
            iframe.dataset.scrollLocked = 'true';
            iframe.addEventListener('load', lockScroll);
            iframe.addEventListener('mouseenter', lockScroll);
            iframe.addEventListener('mousedown', lockScroll);
          }
        });
      });

      observer.observe(document.body, { childList: true, subtree: true });

      window._iframeScrollCleanup = () => {
        document.removeEventListener('click', handleContainerClick, true);
        window.removeEventListener('scroll', handleScroll, { capture: true });
        document.removeEventListener('focusin', handleFocus, true);
        window.removeEventListener('hashchange', handleHashChange);
        iframes.forEach((iframe) => {
          iframe.removeEventListener('load', lockScroll);
          iframe.removeEventListener('mouseenter', lockScroll);
          iframe.removeEventListener('mousedown', lockScroll);
        });
        observer.disconnect();
        if (scrollLockTimeout) clearTimeout(scrollLockTimeout);
      };
    }, 500);

    return () => {
      clearTimeout(setupIframeScrollPrevention);
      if (window._iframeScrollCleanup) {
        window._iframeScrollCleanup();
        delete window._iframeScrollCleanup;
      }
    };
  }, [identifier]);

  // IntersectionObserver scroll spy for section navigation
  useEffect(() => {
    const sectionIds = ['article-lead'];
    (articleFromFile?.sections || []).forEach((_, i) => sectionIds.push(`section-${i}`));
    if (getDocumentInfo(projectUuid)) sectionIds.push('report');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      // Trigger when a section enters the top 15%–30% of the viewport
      { rootMargin: '-15% 0px -70% 0px' }
    );

    sectionIds.forEach((secId) => {
      const el = document.getElementById(secId);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [identifier, articleFromFile, projectUuid]);

  // Not found state - after all hooks
  if (!project) {
    return (
      <div className="highlight-detail-page">
        <div className="bg-art" translate="no" />
        <div className="page-content" translate="no">
          <div className="header" translate="no">
            <div className="header-inner">
              <Link
                to="/"
                className="logo libertinus-mono"
                style={{ textDecoration: 'none', color: 'inherit' }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Atishay Kasliwal
              </Link>
              <button
                className="mobile-menu-toggle"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
                translate="no"
              >
                {isMobileMenuOpen ? '✕' : '☰'}
              </button>
              <nav
                className={`nav ${isMobileMenuOpen ? 'open' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Link to="/highlights">HIGHLIGHTS</Link>
                <a
                  href="/Atishay-Kasliwal-Resume.pdf?v=2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  RESUME
                </a>
                <a
                  href="https://www.linkedin.com/in/atishay-kasliwal/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LINKEDIN
                </a>
                <Link to="/art">ART</Link>
              </nav>
            </div>
          </div>
          <div className="highlight-not-found">
            <h1>Highlight Not Found</h1>
            <p>The highlight you're looking for doesn't exist.</p>
            <Link to="/highlights">Back to Highlights</Link>
          </div>
        </div>
      </div>
    );
  }

  // Derived values (no hooks below this point)
  const documentInfo = getDocumentInfo(projectUuid);
  const topDoc = documentInfo?.topDoc;
  const bottomDoc = documentInfo?.bottomDoc;

  const presentationSrc = articleFromFile?.presentationLink
    ? getPresentationEmbedUrl({ path: articleFromFile.presentationLink })
    : topDoc
    ? getPresentationEmbedUrl(topDoc)
    : null;
  const showPresentationAfterDemo = Boolean(
    articleFromFile?.showPresentationAfterDemo && presentationSrc
  );

  // Section nav items for left sidebar
  const sectionNavItems = [
    { id: 'article-lead', label: 'Overview' },
    ...(articleFromFile?.sections || []).map((s, i) => ({
      id: `section-${i}`,
      label: s.heading || s.label || `Section ${i + 1}`,
    })),
    ...(bottomDoc ? [{ id: 'report', label: 'PDF Report' }] : []),
  ];

  // All projects for right sidebar (mark active)
  const currentSlug = slugify(project.title);

  // Category tags derived from project.category — split on &, comma, or /
  const categoryTags = project.category
    ? project.category.split(/[&,/]/).map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <div className="project-detail-page" translate="no">
      <Helmet>
        <title>{project.title} | Atishay Kasliwal</title>
        <meta name="description" content={project.description} />
        <meta property="og:title" content={`${project.title} | Atishay Kasliwal`} />
        <meta property="og:description" content={project.description} />
        <meta property="og:type" content="article" />
      </Helmet>

      <div className="bg-art" translate="no" />
      <div className="page-content" translate="no">
        {/* Navbar */}
        <div className="header" translate="no">
          <div className="header-inner">
            <Link
              to="/"
              className="logo libertinus-mono"
              style={{ textDecoration: 'none', color: 'inherit' }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Atishay Kasliwal
            </Link>
            <button
              className="mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
              translate="no"
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
            <nav
              className={`nav ${isMobileMenuOpen ? 'open' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Link to="/highlights">HIGHLIGHTS</Link>
              <a
                href="/Atishay-Kasliwal-Resume.pdf?v=2"
                target="_blank"
                rel="noopener noreferrer"
              >
                RESUME
              </a>
              <a
                href="https://www.linkedin.com/in/atishay-kasliwal/"
                target="_blank"
                rel="noopener noreferrer"
              >
                LINKEDIN
              </a>
              <Link to="/art">ART</Link>
            </nav>
          </div>
        </div>

        {/* 3-column layout */}
        <div className="project-detail-layout" translate="no">
          {/* LEFT SIDEBAR */}
          <aside className="project-detail-sidebar-left" translate="no">
            <button
              className="project-detail-back-btn"
              onClick={(e) => {
                e.preventDefault();
                const currentScroll = window.scrollY;
                navigate('/highlights', { replace: false });
                setTimeout(() => window.scrollTo(0, currentScroll), 0);
              }}
              translate="no"
            >
              ← Back to Highlights
            </button>

            <h2 className="project-detail-sidebar-title" translate="no">
              {project.title}
            </h2>

            <span className="project-detail-sidebar-badge" translate="no">
              {project.category}
            </span>

            <div className="project-detail-sidebar-meta" translate="no">
              <span translate="no">{articleMeta.date}</span>
              <span aria-hidden="true"> · </span>
              <span translate="no">{articleMeta.readingTime}</span>
            </div>

            {/* Section navigation */}
            <nav className="project-detail-nav" aria-label="Page sections" translate="no">
              {sectionNavItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`project-detail-nav-item${
                    activeSection === item.id ? ' project-detail-nav-item--active' : ''
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById(item.id);
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                    setActiveSection(item.id);
                  }}
                  translate="no"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Downloads block */}
            {documentInfo && (
              <div className="project-detail-downloads" translate="no">
                <div className="project-detail-downloads-title" translate="no">
                  Downloads
                </div>
                {bottomDoc && (
                  <a
                    href={bottomDoc.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-detail-download-btn"
                    translate="no"
                  >
                    <span aria-hidden="true">📄</span> PDF Report
                  </a>
                )}
                {topDoc && topDoc.source !== 'local' && (
                  <a
                    href={topDoc.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-detail-download-btn"
                    translate="no"
                  >
                    <span aria-hidden="true">📊</span> Presentation
                  </a>
                )}
              </div>
            )}

            {/* Tech stack / category tags */}
            {categoryTags.length > 0 && (
              <div className="project-detail-tags" translate="no">
                {categoryTags.map((tag) => (
                  <span key={tag} className="project-detail-tag" translate="no">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </aside>

          {/* CENTER CONTENT */}
          <main className="project-detail-content" translate="no">
            {/* Hero image */}
            {project.image && (
              <figure className="project-detail-hero" translate="no">
                <img
                  src={project.image}
                  alt={project.title}
                  className="project-detail-hero-img"
                  translate="no"
                />
              </figure>
            )}

            {/* Article lead */}
            <p id="article-lead" className="project-detail-lead" translate="no">
              {articleFromFile?.lead ||
                'This page is styled like a blog article. Edit the content in src/project list/*.js — the full PDF report is kept at the end.'}
            </p>

            {/* Article sections */}
            {(articleFromFile?.sections || []).map((s, sectionIndex) => (
              <React.Fragment key={`${s.number}-${s.label}`}>
                <section id={`section-${sectionIndex}`} translate="no">
                  <h2 className="project-detail-h2" translate="no">
                    {s.heading}
                  </h2>
                  {(s.paragraphs || []).map((p) => (
                    <p key={p} className="project-detail-p" translate="no">
                      {p}
                    </p>
                  ))}
                  {Array.isArray(s.bullets) && s.bullets.length > 0 && (
                    <ul className="project-detail-bullets" translate="no">
                      {s.bullets.map((b) => (
                        <li key={`${b.bold}-${b.text}`}>
                          <strong>{b.bold}</strong>: {b.text}
                        </li>
                      ))}
                    </ul>
                  )}
                  {s.quote && (
                    <div className="project-detail-quote" translate="no">
                      <div className="project-detail-quote-pill" translate="no">
                        {s.quote.pill}
                      </div>
                      <div className="project-detail-quote-text" translate="no">
                        {s.quote.text}
                      </div>
                    </div>
                  )}
                </section>

                {/* Presentation embed after first section if enabled */}
                {sectionIndex === 0 && showPresentationAfterDemo && (
                  <section className="project-detail-ppt" translate="no">
                    <h2 className="project-detail-h2" translate="no">
                      Give it a try
                    </h2>
                    <p className="project-detail-p" translate="no">
                      Presentation (slide-by-slide).
                    </p>
                    {shouldLoadIframes ? (
                      <div className="project-detail-frame-wrapper" translate="no">
                        <div className="document-embed-container document-embed-presentation">
                          <iframe
                            src={presentationSrc}
                            title={`${project.title} — Presentation`}
                            className="document-iframe"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="project-detail-loading" translate="no">
                        Loading presentation…
                      </div>
                    )}
                  </section>
                )}
              </React.Fragment>
            ))}

            {/* PDF report at the end */}
            <section id="report" className="project-detail-report" translate="no">
              <div className="project-detail-section-divider" translate="no">
                <span className="project-detail-section-rule" aria-hidden="true" />
                <span className="project-detail-section-label" translate="no">
                  PDF
                </span>
              </div>

              {bottomDoc && shouldLoadIframes && (
                <div className="project-detail-frame-wrapper" translate="no">
                  <div className="document-embed-container document-embed-pdf">
                    <iframe
                      src={getDocumentViewerUrl(bottomDoc)}
                      title={`${project.title} Report`}
                      className="document-iframe"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {bottomDoc && !shouldLoadIframes && (
                <div className="project-detail-loading" translate="no">
                  Loading report…
                </div>
              )}
            </section>
          </main>

          {/* RIGHT SIDEBAR */}
          <aside className="project-detail-sidebar-right" translate="no">
            <h3 className="project-detail-other-title" translate="no">
              Other Highlights
            </h3>
            {projectsData.map((p) => {
              const pSlug = slugify(p.title);
              const isActive = pSlug === currentSlug;
              return (
                <Link
                  key={p.id}
                  to={`/highlights/${pSlug}`}
                  className={`project-detail-other-card${
                    isActive ? ' project-detail-other-card--active' : ''
                  }`}
                  translate="no"
                >
                  <div className="project-detail-other-card-title" translate="no">
                    {p.title}
                  </div>
                  <div className="project-detail-other-card-desc" translate="no">
                    {p.description}
                  </div>
                  <span className="project-detail-other-card-badge" translate="no">
                    {p.category}
                  </span>
                </Link>
              );
            })}
          </aside>
        </div>
      </div>
    </div>
  );
}
