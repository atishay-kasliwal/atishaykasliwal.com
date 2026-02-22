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
  // Demo metadata (can be replaced with real dates later)
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

  // Reset iframe loading state when UUID changes - keep iframes hidden initially
  useEffect(() => {
    setShouldLoadIframes(false);
    // Immediately scroll to top when UUID changes
    window.scrollTo(0, 0);
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }
  }, [identifier]);

  // Scroll to top AFTER content renders - use useLayoutEffect to run synchronously after DOM updates
  useLayoutEffect(() => {
    // Function to scroll to top - more aggressive
    const scrollToTop = () => {
      // Force scroll to top using multiple methods
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
      // Also try scrolling the html element
      const html = document.documentElement;
      if (html.scrollTop !== 0) {
        html.scrollTop = 0;
      }
      if (html.scrollLeft !== 0) {
        html.scrollLeft = 0;
      }
    };
    
    // Scroll immediately after layout (content should be rendered now)
    scrollToTop();
    scrollToTop(); // Call twice to ensure it sticks
    
    // Also scroll after multiple delays to catch any remaining layout shifts
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
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [identifier]);
  
  // Scroll to top once when project changes; enable iframes after short delay (no scroll blocking)
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
  // Delay this to allow initial scroll-to-top to complete first
  useEffect(() => {
    // Wait a bit before setting up iframe scroll prevention to allow initial scroll-to-top
    const setupIframeScrollPrevention = setTimeout(() => {
      let savedScrollPosition = window.scrollY;
      let isIframeInteraction = false;
      let scrollLockTimeout = null;
      let pageLoadTime = Date.now();
      const PAGE_LOAD_DELAY = 500; // Don't prevent scroll during initial page load
      
      // Save scroll position before any potential scroll events
      const saveScrollPosition = () => {
        savedScrollPosition = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      };
      
      // Lock scroll position temporarily when iframe is interacted with
      const lockScroll = () => {
        // Don't lock scroll during initial page load
        if (Date.now() - pageLoadTime < PAGE_LOAD_DELAY) {
          return;
        }
        isIframeInteraction = true;
        saveScrollPosition();
        
        // Clear any existing timeout
        if (scrollLockTimeout) {
          clearTimeout(scrollLockTimeout);
        }
        
        // Release lock after a short delay
        scrollLockTimeout = setTimeout(() => {
          isIframeInteraction = false;
        }, 300);
      };
      
      // Prevent scroll-to-top when clicking on iframe container
      const handleContainerClick = (e) => {
        // Check if click is on the embed container or iframe
        // Ensure e.target exists and is an Element with closest method
        if (e && e.target && typeof e.target.closest === 'function') {
          const container = e.target.closest('.document-embed-container');
          if (container) {
            lockScroll();
          }
        }
      };
      
      // Monitor scroll events and prevent unwanted scroll-to-top
      let lastScrollTime = Date.now();
      const handleScroll = (e) => {
        // Don't interfere with scroll during initial page load
        if (Date.now() - pageLoadTime < PAGE_LOAD_DELAY) {
          return;
        }
        
        const currentScroll = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
        const now = Date.now();
        
        // If we're in an iframe interaction period and scroll jumped significantly toward top, restore it
        if (isIframeInteraction && currentScroll < savedScrollPosition - 50 && savedScrollPosition > 200) {
          // This is likely an unwanted scroll-to-top, prevent it
          e.preventDefault();
          e.stopImmediatePropagation();
          
          // Immediately restore scroll position
          window.scrollTo({
            top: savedScrollPosition,
            left: 0,
            behavior: 'instant'
          });
          document.documentElement.scrollTop = savedScrollPosition;
          if (document.body) {
            document.body.scrollTop = savedScrollPosition;
          }
          return false;
        } else if (now - lastScrollTime > 100) {
          // Only update saved position if it's been a moment (not rapid fire from iframe)
          // This allows normal scrolling but catches sudden jumps
          if (Math.abs(currentScroll - savedScrollPosition) < 50 || !isIframeInteraction) {
            savedScrollPosition = currentScroll;
          }
          lastScrollTime = now;
        }
      };
      
      // Prevent focus from causing scroll
      const handleFocus = (e) => {
        try {
          // Ensure e.target exists and is an Element with closest method
          // Focus events on window/document might not have a valid target
          if (e && e.target && typeof e.target.closest === 'function') {
            const container = e.target.closest('.document-embed-container');
            if (container) {
              lockScroll();
              // Prevent default scroll-into-view behavior
              if (typeof e.target.scrollIntoView === 'function') {
                e.target.scrollIntoView = () => {};
              }
            }
          }
        } catch (error) {
          // Silently ignore errors from focus events (e.g., cross-origin iframe issues)
          console.debug('Focus event handling error:', error);
        }
      };
      
      // Prevent hash change from scrolling
      const handleHashChange = () => {
        lockScroll();
      };
      
      // Add event listeners with high priority
      document.addEventListener('click', handleContainerClick, true); // Use capture phase
      window.addEventListener('scroll', handleScroll, { passive: false, capture: true }); // Non-passive, capture phase
      // Listen on document instead of window for more reliable focus events
      document.addEventListener('focusin', handleFocus, true); // Use focusin instead of focus for better compatibility
      window.addEventListener('hashchange', handleHashChange);
      
      // Also prevent scroll on iframe load and mouse events near iframe
      const iframes = document.querySelectorAll('.document-iframe');
      iframes.forEach(iframe => {
        iframe.addEventListener('load', lockScroll);
        // Lock scroll when mouse is over iframe (user might be about to click navigation)
        iframe.addEventListener('mouseenter', lockScroll);
        iframe.addEventListener('mousedown', lockScroll);
      });
      
      // Use MutationObserver to catch dynamically added iframes
      const observer = new MutationObserver(() => {
        const newIframes = document.querySelectorAll('.document-iframe');
        newIframes.forEach(iframe => {
          if (!iframe.dataset.scrollLocked) {
            iframe.dataset.scrollLocked = 'true';
            iframe.addEventListener('load', lockScroll);
            iframe.addEventListener('mouseenter', lockScroll);
            iframe.addEventListener('mousedown', lockScroll);
          }
        });
      });
      
      observer.observe(document.body, { childList: true, subtree: true });
      
      // Store cleanup function
      window._iframeScrollCleanup = () => {
        document.removeEventListener('click', handleContainerClick, true);
        window.removeEventListener('scroll', handleScroll, { capture: true });
        document.removeEventListener('focusin', handleFocus, true);
        window.removeEventListener('hashchange', handleHashChange);
        iframes.forEach(iframe => {
          iframe.removeEventListener('load', lockScroll);
          iframe.removeEventListener('mouseenter', lockScroll);
          iframe.removeEventListener('mousedown', lockScroll);
        });
        observer.disconnect();
        if (scrollLockTimeout) {
          clearTimeout(scrollLockTimeout);
        }
      };
    }, 500); // Wait 500ms before setting up iframe scroll prevention
    
    return () => {
      clearTimeout(setupIframeScrollPrevention);
      if (window._iframeScrollCleanup) {
        window._iframeScrollCleanup();
        delete window._iframeScrollCleanup;
      }
    };
  }, [identifier]);

  if (!project) {
    return (
      <div className="highlight-detail-page">
        <div className="bg-art" translate="no" />
        <div className="page-content" translate="no">
          <div className="header" translate="no">
            <Link to="/" className="logo libertinus-mono" style={{ textDecoration: 'none', color: 'inherit' }}>
              Atishay Kasliwal
            </Link>
            <nav className="nav">
              <Link to="/highlights">HIGHLIGHTS</Link>
              <a href="/Atishay-Kasliwal-Resume.pdf?v=2" target="_blank" rel="noopener noreferrer">RESUME</a>
              <a href="https://www.linkedin.com/in/atishay-kasliwal/" target="_blank" rel="noopener noreferrer">LINKEDIN</a>
              <Link to="/art">ART</Link>
            </nav>
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

  // Get document paths and types based on UUID
  // Supports both local files and Google Drive links
  const getDocumentInfo = (uuid) => {
    const documentMap = {
      'a1b2c3d4-e5f6-4789-a012-3456789abcde': { 
        topDoc: { 
          path: 'https://docs.google.com/presentation/d/1gde6FEXKTStqaU2QD5GolMvQp0qijGjk/edit?usp=sharing&ouid=100140551720252713559&rtpof=true&sd=true', // Google Slides link
          type: 'pptx',
          source: 'googledrive' // Google Slides/Presentations
        },
        bottomDoc: { 
          path: 'https://docs.google.com/document/d/1XnR8zq8dbEB7etLmzfMcjpAyqYk04W-pKQaH477Kkl0/edit?usp=sharing', 
          type: 'pdf',
          source: 'googledrive' // Google Docs
        }
      },
      'b2c3d4e5-f6a7-4890-b123-456789abcdef': { 
        topDoc: { 
          path: 'https://docs.google.com/presentation/d/1NZ_KKAm-ppS29vNwj-ZIx2BOPrpaMLJS/edit?usp=sharing&ouid=100140551720252713559&rtpof=true&sd=true', 
          type: 'pptx',
          source: 'googledrive' // Google Slides
        },
        bottomDoc: { 
          path: 'https://docs.google.com/document/d/1XnR8zq8dbEB7etLmzfMcjpAyqYk04W-pKQaH477Kkl0/edit?usp=sharing', 
          type: 'pdf',
          source: 'googledrive' // Google Docs
        }
      },
      'c3d4e5f6-a7b8-4901-c234-56789abcdef0': { 
        topDoc: { 
          path: 'https://docs.google.com/presentation/d/1rkBiHmmfEWZUHpQoekizPKddYo5k9thF2h2UDsXPlKw/edit?slide=id.p1#slide=id.p1', 
          type: 'pptx',
          source: 'googledrive' // Google Slides
        },
        bottomDoc: { 
          path: 'https://docs.google.com/document/d/1XnR8zq8dbEB7etLmzfMcjpAyqYk04W-pKQaH477Kkl0/edit?usp=sharing', 
          type: 'pdf',
          source: 'googledrive' // Google Docs
        }
      },
      'd4e5f6a7-b8c9-4012-d345-6789abcdef01': { 
        topDoc: { 
          path: '/documents/healthcare-presentation.pptx', 
          type: 'pptx',
          source: 'local'
        },
        bottomDoc: { 
          path: 'https://docs.google.com/document/d/1XnR8zq8dbEB7etLmzfMcjpAyqYk04W-pKQaH477Kkl0/edit?usp=sharing', 
          type: 'pdf',
          source: 'googledrive' // Google Docs
        }
      }
    };
    return documentMap[uuid] || null;
  };

  const documentInfo = getDocumentInfo(projectUuid);
  const topDoc = documentInfo?.topDoc;
  const bottomDoc = documentInfo?.bottomDoc;

  const getPresentationEmbedUrl = (docInfo) => {
    if (!docInfo?.path?.includes('docs.google.com/presentation')) return null;
    const fileIdMatch = docInfo.path.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!fileIdMatch) return null;
    return `https://docs.google.com/presentation/d/${fileIdMatch[1]}/embed?start=false&loop=false&delayms=3000`;
  };

  const presentationSrc =
    articleFromFile?.presentationLink
      ? getPresentationEmbedUrl({ path: articleFromFile.presentationLink })
      : (topDoc ? getPresentationEmbedUrl(topDoc) : null);
  const showPresentationAfterDemo = Boolean(articleFromFile?.showPresentationAfterDemo && presentationSrc);

  // Get document viewer URL - supports local files, Google Drive, Google Slides, and Google Docs
  const getDocumentViewerUrl = (docInfo) => {
    const { path, type, source } = docInfo;
    
    // If it's a Google Docs link (check first, before other Google Drive links)
    if (path.includes('docs.google.com/document')) {
      const fileIdMatch = path.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        // Use Google Drive file viewer which can display the document
        // This will show it in a viewable format (may show as PDF-like pages if available)
        // The drive file viewer handles Google Docs and can display them properly
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }
    
    // If it's a Google Slides/Presentation link
    if (path.includes('docs.google.com/presentation')) {
      // Extract file ID from Google Slides link
      // Format: https://docs.google.com/presentation/d/FILE_ID/edit or /d/FILE_ID/view
      const fileIdMatch = path.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        // Scrollable mode: render Slides as an exported PDF (vertical scroll).
        // This avoids the "slide-by-slide" arrows UI in the embed viewer.
        return `https://docs.google.com/presentation/d/${fileId}/export/pdf`;
      }
      // If already in preview/embed format, convert to embed format
      if (path.includes('/preview') || path.includes('/embed')) {
        const fileIdMatch2 = path.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (fileIdMatch2) {
          const fileId = fileIdMatch2[1];
          return `https://docs.google.com/presentation/d/${fileId}/export/pdf`;
        }
      }
    }
    
    // If it's a Google Drive file link
    if (source === 'googledrive' || path.includes('drive.google.com/file')) {
      // Extract file ID from Google Drive share link
      // Format: https://drive.google.com/file/d/FILE_ID/view
      const fileIdMatch = path.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        // Use Google Drive's preview/embed URL
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
      // If already in preview format, return as is
      if (path.includes('/preview')) {
        return path;
      }
    }
    
    // For local PPTX files, use Google Docs Viewer
    if (type === 'pptx') {
      const fullUrl = window.location.origin + path;
      return `https://docs.google.com/viewer?url=${encodeURIComponent(fullUrl)}&embedded=true`;
    }
    
    // For local PDF files, return path with toolbar parameter
    return `${path}#toolbar=0`;
  };

  return (
    <div className="highlight-detail-page" translate="no">
      <Helmet>
        <title>{project.title} | Atishay Kasliwal</title>
        <meta name="description" content={project.description} />
        <meta property="og:title" content={`${project.title} | Atishay Kasliwal`} />
        <meta property="og:description" content={project.description} />
        <meta property="og:type" content="article" />
      </Helmet>

      <div className="bg-art" translate="no" />
      <div className="page-content" translate="no">
        <div className="header" translate="no">
          <Link to="/" className="logo libertinus-mono" style={{ textDecoration: 'none', color: 'inherit' }} onClick={() => setIsMobileMenuOpen(false)}>
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
          <nav className={`nav ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
            <Link to="/highlights">HIGHLIGHTS</Link>
            <a href="/Atishay-Kasliwal-Resume.pdf?v=2" target="_blank" rel="noopener noreferrer">RESUME</a>
            <a href="https://www.linkedin.com/in/atishay-kasliwal/" target="_blank" rel="noopener noreferrer">LINKEDIN</a>
            <Link to="/art">ART</Link>
          </nav>
        </div>

        <main className="highlight-blog" translate="no">
          <div className="highlight-blog-inner" translate="no">
            <button
              className="highlight-blog-back"
              onClick={(e) => {
                e.preventDefault();
                const currentScroll = window.scrollY;
                navigate('/highlights', { replace: false });
                setTimeout(() => window.scrollTo(0, currentScroll), 0);
              }}
            >
              ← Back to Highlights
            </button>

          <div className="highlight-blog-meta" translate="no">
            <span className="highlight-blog-date" translate="no">{articleMeta.date}</span>
            <span className="highlight-blog-dot" aria-hidden="true">•</span>
            <span className="highlight-blog-read" translate="no">{articleMeta.readingTime}</span>
          </div>

          <h1 className="highlight-blog-title" translate="no">{project.title}</h1>
          <p className="highlight-blog-subtitle" translate="no">{project.description}</p>

          <div className="highlight-blog-badges" translate="no">
            <span className="highlight-blog-badge">{project.category}</span>
            <a className="highlight-blog-badge highlight-blog-badge-link" href="#report">PDF at end</a>
            <span className="highlight-blog-badge highlight-blog-badge-muted">Demo text (placeholder)</span>
          </div>

          {/* Hero image */}
          {project.image && (
            <figure className="highlight-blog-hero" translate="no">
              <img src={project.image} alt={project.title} className="highlight-blog-hero-img" translate="no" />
            </figure>
          )}

          <article className="highlight-article" translate="no">
            <p className="highlight-lead" translate="no">
              {articleFromFile?.lead ||
                'This page is styled like a blog article. Edit the content in src/project list/*.js — the full PDF report is kept at the end.'}
            </p>

            {(articleFromFile?.sections || []).map((s, sectionIndex) => (
              <React.Fragment key={`${s.number}-${s.label}`}>
                <section translate="no">
                  <h2 className="highlight-h2" translate="no">{s.heading}</h2>
                {(s.paragraphs || []).map((p) => (
                  <p key={p} className="highlight-p" translate="no">{p}</p>
                ))}
                {Array.isArray(s.bullets) && s.bullets.length > 0 && (
                  <ul className="highlight-bullets" translate="no">
                    {s.bullets.map((b) => (
                      <li key={`${b.bold}-${b.text}`}>
                        <strong>{b.bold}</strong>: {b.text}
                      </li>
                    ))}
                  </ul>
                )}
                {s.quote && (
                  <div className="highlight-quote" translate="no">
                    <div className="highlight-quote-pill" translate="no">{s.quote.pill}</div>
                    <div className="highlight-quote-text" translate="no">“{s.quote.text}”</div>
                  </div>
                )}
                </section>

                {sectionIndex === 0 && showPresentationAfterDemo && (
                  <section className="highlight-ppt" translate="no">
                    <h2 className="highlight-h2" translate="no">Give it a try</h2>
                    <p className="highlight-p" translate="no">Presentation (slide-by-slide).</p>
                    {shouldLoadIframes ? (
                      <div className="highlight-ppt-frame" translate="no">
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
                      <div className="highlight-ppt-loading" translate="no">Loading presentation…</div>
                    )}
                  </section>
                )}
              </React.Fragment>
            ))}
          </article>

          {/* PDF at the end */}
          <section className="highlight-report" id="report" translate="no">
            <div className="highlight-section-number highlight-section-number-pdf" translate="no">
              <span className="highlight-section-rule" aria-hidden="true" />
              <span className="highlight-section-label" translate="no">PDF</span>
            </div>

            {bottomDoc && shouldLoadIframes && (
              <div className="highlight-report-frame" translate="no">
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
              <div className="highlight-report-loading" translate="no">
                Loading report…
              </div>
            )}
          </section>
          </div>
        </main>
      </div>
    </div>
  );
}

