import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import './HighlightDetail.css';

// Import project data
import { projectsData } from './Projects';

// UUIDs for each highlight - Map UUID to project ID
const highlightUUIDs = {
  'a1b2c3d4-e5f6-4789-a012-3456789abcde': 13, // Gemma NLP Research
  'b2c3d4e5-f6a7-4890-b123-456789abcdef': 14, // Movie Data Analytics
  'c3d4e5f6-a7b8-4901-c234-56789abcdef0': 15, // Hospitality AI
  'd4e5f6a7-b8c9-4012-d345-6789abcdef01': 1   // Healthcare AI Research
};

export default function HighlightDetail() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const projectId = highlightUUIDs[uuid];
  const project = projectsData.find(p => p.id === projectId);
  
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Prevent scroll to top when interacting with iframe navigation
  useEffect(() => {
    let savedScrollPosition = window.scrollY;
    let isIframeInteraction = false;
    let scrollLockTimeout = null;
    
    // Save scroll position before any potential scroll events
    const saveScrollPosition = () => {
      savedScrollPosition = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
    };
    
    // Lock scroll position temporarily when iframe is interacted with
    const lockScroll = () => {
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
    
    return () => {
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
  }, []);

  if (!project) {
    return (
      <div className="highlight-detail-page">
        <div className="header" translate="no">
          <Link to="/" className="logo libertinus-mono" style={{ textDecoration: 'none', color: 'inherit' }}>
            Atishay Kasliwal
          </Link>
          <nav className="nav">
            <Link to="/highlights">HIGHLIGHTS</Link>
            <a href="/Atishay_Kasliwal.pdf" target="_blank" rel="noopener noreferrer">RESUME</a>
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

  const documentInfo = getDocumentInfo(uuid);
  const topDoc = documentInfo?.topDoc;
  const bottomDoc = documentInfo?.bottomDoc;
  
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
        // Use Google Slides embed URL with navigation controls
        // Remove rm=minimal to show navigation buttons, but keep start=false to prevent auto-play
        return `https://docs.google.com/presentation/d/${fileId}/embed?start=false&loop=false&delayms=3000`;
      }
      // If already in preview/embed format, convert to embed format
      if (path.includes('/preview') || path.includes('/embed')) {
        // Replace /preview with /embed if needed
        const embedPath = path.replace('/preview', '/embed').split('?')[0];
        // Remove rm=minimal to show navigation controls
        return `${embedPath}?start=false&loop=false&delayms=3000`;
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
          <a href="/Atishay_Kasliwal.pdf" target="_blank" rel="noopener noreferrer">RESUME</a>
          <a href="https://www.linkedin.com/in/atishay-kasliwal/" target="_blank" rel="noopener noreferrer">LINKEDIN</a>
          <Link to="/art">ART</Link>
        </nav>
      </div>

      <div className="highlight-detail-container">
        <div className="highlight-detail-header">
          <button 
            className="back-link"
            onClick={(e) => {
              e.preventDefault();
              // Navigate without scrolling to top
              const currentScroll = window.scrollY;
              navigate('/highlights', { replace: false });
              // Restore scroll position after navigation
              setTimeout(() => {
                window.scrollTo(0, currentScroll);
              }, 0);
            }}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              font: 'inherit',
              color: 'inherit',
              padding: 0,
              textDecoration: 'none'
            }}
          >
            ← Back to Highlights
          </button>
          <h1 className="highlight-title">{project.title}</h1>
          <p className="highlight-category">{project.category}</p>
          <p className="highlight-description">{project.description}</p>
        </div>

        {/* Top Document Section - Replaces hero image */}
        {topDoc && (
          <div className="highlight-document-section highlight-top-document">
            <h2>Project Presentation</h2>
            <div className="document-embed-container document-embed-presentation">
              <iframe
                src={getDocumentViewerUrl(topDoc)}
                title={`${project.title} Presentation`}
                className="document-iframe"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Content Section - Unique for each project */}
        <div className="highlight-content">
          {uuid === 'a1b2c3d4-e5f6-4789-a012-3456789abcde' && (
            <div className="highlight-section">
              <h2>Gemma NLP Research</h2>
              <p>This project explores advanced natural language processing techniques using the Gemma model for text understanding and generation.</p>
              {/* Add more unique content here */}
            </div>
          )}

          {uuid === 'b2c3d4e5-f6a7-4890-b123-456789abcdef' && (
            <div className="highlight-section">
              <h2>Movie Data Analytics</h2>
              <p>Comprehensive analysis of movie datasets to extract insights and patterns in the entertainment industry.</p>
              {/* Add more unique content here */}
            </div>
          )}

          {uuid === 'c3d4e5f6-a7b8-4901-c234-56789abcdef0' && (
            <div className="highlight-section">
              <h2>Hospitality AI Solutions</h2>
              <p>AI-powered solutions for the hospitality industry, focusing on customer experience and operational efficiency.</p>
              {/* Add more unique content here */}
            </div>
          )}

          {uuid === 'd4e5f6a7-b8c9-4012-d345-6789abcdef01' && (
            <div className="highlight-section">
              <h2>Healthcare AI Research</h2>
              <p>Machine learning research and healthcare data analytics at Atrium Health Wake Forest.</p>
              {/* Add more unique content here */}
            </div>
          )}

                {/* Bottom Embedded Document Section - Common for all */}
                {bottomDoc && (
                  <div className="highlight-document-section">
                    <h2>Project Report</h2>
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
        </div>
      </div>
    </div>
  );
}

