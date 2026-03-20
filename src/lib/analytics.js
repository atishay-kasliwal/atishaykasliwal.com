const isDev = process.env.NODE_ENV !== 'production';

// ── UTM helpers ────────────────────────────────────────────────────────────────

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

const getUTMParams = () => {
  const params = new URLSearchParams(window.location.search);
  const result = {};
  UTM_KEYS.forEach((key) => {
    const value = params.get(key);
    if (value) result[key] = value;
  });
  return result;
};

let initialized = false;
let lastLocation = '';
let engagementScore = 0;
let engagementThresholdFired = false;
let activeCleanupFns = [];

const ctaKeywords = ['get started', 'sign up', 'try demo', 'documentation'];
const docKeywords = ['documentation', 'docs', 'guide', 'guides'];

const normalizeText = (value) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

const getPagePath = () => window.location.pathname || '/';
const getPageLocation = () => window.location.href || '';
const getPageTitle = () => document.title || '';

const emitEvent = (eventName, params = {}) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
  if (isDev) {
    // eslint-disable-next-line no-console
    console.log('Analytics Event:', eventName, params);
  }
};

const scoreForEvent = (eventName, params) => {
  if (eventName === 'page_view') return 1;
  if (eventName === 'scroll_depth' && Number(params?.percentage) === 50) return 2;
  if (eventName === 'feature_interest') return 3;
  if (eventName === 'cta_click') return 5;
  return 0;
};

const updateEngagementScore = (eventName, params) => {
  if (eventName === 'highly_engaged_user') return;
  const delta = scoreForEvent(eventName, params);
  if (!delta) return;
  engagementScore += delta;
  if (!engagementThresholdFired && engagementScore >= 10) {
    engagementThresholdFired = true;
    emitEvent('highly_engaged_user', {
      score: engagementScore,
      page_path: getPagePath()
    });
  }
};

export const trackEvent = (eventName, params = {}) => {
  emitEvent(eventName, params);
  updateEngagementScore(eventName, params);
};

export const trackPageView = (sourcePage) => {
  const pagePath = getPagePath();
  const utmParams = getUTMParams();
  trackEvent('page_view', {
    page_path: pagePath,
    page_title: getPageTitle(),
    page_location: getPageLocation(),
    ...utmParams
  });

  if (pagePath === '/') {
    const source = sourcePage || 'direct';
    trackEvent('landing_view', { source_page: source, ...utmParams });
  }
};

// ── Portfolio-specific events ──────────────────────────────────────────────────

export const trackProjectClick = (projectName, pagePath = getPagePath()) => {
  const name = normalizeText(projectName);
  if (!name) return;
  trackEvent('project_click', { project_name: name, page_path: pagePath });
};

export const trackContactClick = (method = 'email', pagePath = getPagePath()) => {
  trackEvent('contact_click', { contact_method: method, page_path: pagePath });
};

export const trackResumeDownload = (source = 'hero', pagePath = getPagePath()) => {
  trackEvent('resume_download', { source, page_path: pagePath });
};

export const trackScrollDepth = ({ pagePath = getPagePath(), thresholds = [25, 50, 75, 90] } = {}) => {
  const fired = new Set();
  const sorted = [...thresholds].sort((a, b) => a - b);

  const handler = () => {
    const doc = document.documentElement;
    const scrollTop = window.pageYOffset || doc.scrollTop || document.body.scrollTop || 0;
    const viewportHeight = window.innerHeight || doc.clientHeight || 0;
    const scrollHeight = Math.max(doc.scrollHeight, document.body.scrollHeight, viewportHeight);
    const percent = Math.round(((scrollTop + viewportHeight) / scrollHeight) * 100);

    sorted.forEach((threshold) => {
      if (percent >= threshold && !fired.has(threshold)) {
        fired.add(threshold);
        trackEvent('scroll_depth', {
          percentage: threshold,
          page_path: pagePath
        });
      }
    });
  };

  handler();
  window.addEventListener('scroll', handler, { passive: true });
  window.addEventListener('resize', handler);

  return () => {
    window.removeEventListener('scroll', handler);
    window.removeEventListener('resize', handler);
  };
};

export const trackSectionView = ({ pagePath = getPagePath() } = {}) => {
  const sections = Array.from(document.querySelectorAll('[data-analytics-section]'));
  const seen = new Set();

  if (!('IntersectionObserver' in window)) {
    sections.forEach((section) => {
      const name = section.getAttribute('data-analytics-section');
      if (!name || seen.has(name)) return;
      seen.add(name);
      trackEvent('section_view', { section_name: name, page_path: pagePath });
    });
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const name = entry.target.getAttribute('data-analytics-section');
        if (!name || seen.has(name)) return;
        seen.add(name);
        trackEvent('section_view', { section_name: name, page_path: pagePath });
      });
    },
    { threshold: 0.35 }
  );

  sections.forEach((section) => observer.observe(section));

  return () => observer.disconnect();
};

export const trackFeatureInterest = (featureName, pagePath = getPagePath()) => {
  const name = normalizeText(featureName);
  if (!name) return;
  trackEvent('feature_interest', { feature_name: name, page_path: pagePath });
};

export const trackEngagement = ({ pagePath = getPagePath(), milestones = [30, 60, 120] } = {}) => {
  const fired = new Set();
  const sorted = [...milestones].sort((a, b) => a - b);
  let activeSeconds = 0;
  let lastActive = Date.now();

  const markActive = () => {
    lastActive = Date.now();
  };

  const activityEvents = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
  activityEvents.forEach((evt) => window.addEventListener(evt, markActive, { passive: true }));

  const timer = setInterval(() => {
    if (document.hidden) return;
    const now = Date.now();
    if (now - lastActive > 15000) return;

    activeSeconds += 1;
    sorted.forEach((milestone) => {
      if (activeSeconds >= milestone && !fired.has(milestone)) {
        fired.add(milestone);
        trackEvent(`engaged_${milestone}s`, { page_path: pagePath });
      }
    });
  }, 1000);

  return () => {
    clearInterval(timer);
    activityEvents.forEach((evt) => window.removeEventListener(evt, markActive));
  };
};

export const trackOutboundLinks = () => {
  const handler = (event) => {
    const target = event.target;
    if (!target) return;
    const link = target.closest('a[href]');
    if (!link) return;

    const url = new URL(link.href, window.location.origin);
    if (url.origin !== window.location.origin) {
      trackEvent('outbound_click', {
        destination_url: url.href,
        link_text: normalizeText(link.innerText || link.textContent),
        page_path: getPagePath()
      });
    }
  };

  document.addEventListener('click', handler, true);
  return () => document.removeEventListener('click', handler, true);
};

export const trackErrors = () => {
  const onError = (event) => {
    trackEvent('javascript_error', {
      message: event.message || 'Unknown error',
      file: event.filename || '',
      line: event.lineno || 0,
      column: event.colno || 0
    });
  };

  const onRejection = (event) => {
    const reason = event.reason;
    trackEvent('javascript_error', {
      message: reason?.message || String(reason || 'Unhandled rejection'),
      file: '',
      line: 0,
      column: 0
    });
  };

  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);

  return () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onRejection);
  };
};

const getSectionPosition = (element) => {
  if (!element) return 'unknown';
  const section = element.closest('[data-analytics-section]');
  return section?.getAttribute('data-analytics-section') || 'unknown';
};

const isCta = (text, element) => {
  const label = normalizeText(text).toLowerCase();
  if (!label) return false;
  if (ctaKeywords.some((keyword) => label.includes(keyword))) return true;
  if (!element) return false;
  const className = String(element.className || '').toLowerCase();
  return (
    className.includes('cta') ||
    className.includes('featured-hero__cta-primary') ||
    className.includes('btn-primary-action') ||
    className.includes('project-text-button') ||
    className.includes('project-card-link')
  );
};

const isDocumentationLink = (text, href) => {
  const label = normalizeText(text).toLowerCase();
  const target = String(href || '').toLowerCase();
  return (
    docKeywords.some((keyword) => label.includes(keyword)) ||
    docKeywords.some((keyword) => target.includes(keyword))
  );
};

const isBlogLink = (href) => {
  if (!href) return false;
  const url = new URL(href, window.location.origin);
  return url.pathname.startsWith('/highlights/') || url.pathname.startsWith('/blog');
};

const trackContentInteraction = (eventName, contentName, pagePath) => {
  const name = normalizeText(contentName) || eventName;
  trackEvent(eventName, { content_name: name, page_path: pagePath });
};

const initClickTracking = () => {
  const handler = (event) => {
    const target = event.target;
    if (!target) return;

    const pagePath = getPagePath();
    const button = target.closest('button, [role="button"]');
    const link = target.closest('a[href]');
    const buttonLike = button || (link && String(link.className || '').toLowerCase().includes('btn') ? link : null);
    const linkIsButtonLike = link && buttonLike === link;

    if (buttonLike) {
      const buttonText = normalizeText(buttonLike.innerText || buttonLike.textContent);
      trackEvent('button_click', {
        button_text: buttonText,
        button_id: buttonLike.id || '',
        button_classes: buttonLike.className || '',
        page_path: pagePath
      });

      if (isCta(buttonText, buttonLike)) {
        trackEvent('cta_click', {
          cta_text: buttonText,
          page_path: pagePath,
          position: buttonLike.getAttribute('data-cta-position') || getSectionPosition(buttonLike)
        });

        const lower = buttonText.toLowerCase();
        if (lower.includes('sign up') || lower.includes('get started')) {
          trackEvent('signup_started', { source_page: pagePath });
        }
      }

      if (isDocumentationLink(buttonText, buttonLike.getAttribute('href'))) {
        trackContentInteraction('documentation_open', buttonText || 'Documentation', pagePath);
        trackEvent('docs_opened', { source_page: pagePath });
      }
    }

    if (link && link.href) {
      const linkText = normalizeText(link.innerText || link.textContent);

      if (isBlogLink(link.href)) {
        trackContentInteraction('blog_open', linkText || link.href, pagePath);
      }

      if (!linkIsButtonLike && isDocumentationLink(linkText, link.href)) {
        trackContentInteraction('documentation_open', linkText || 'Documentation', pagePath);
        trackEvent('docs_opened', { source_page: pagePath });
      }

      if (!linkIsButtonLike && isCta(linkText, link)) {
        trackEvent('cta_click', {
          cta_text: linkText,
          page_path: pagePath,
          position: link.getAttribute('data-cta-position') || getSectionPosition(link)
        });
      }
    }

    const featureEl = target.closest('[data-feature-name]');
    if (featureEl) {
      trackFeatureInterest(featureEl.getAttribute('data-feature-name'), pagePath);
    }

    // Auto-detect project card clicks via data-project-name attribute
    const projectEl = target.closest('[data-project-name]');
    if (projectEl) {
      trackProjectClick(projectEl.getAttribute('data-project-name'), pagePath);
    }

    // Auto-detect resume downloads (same-origin PDF links)
    if (link && link.href && link.href.toLowerCase().includes('.pdf')) {
      const isNav = String(link.className || '').includes('nav-resume');
      trackResumeDownload(isNav ? 'nav' : 'hero', pagePath);
    }

    // Auto-detect contact clicks (mailto: links)
    if (link && link.href && link.href.startsWith('mailto:')) {
      trackContactClick('email', pagePath);
    }
  };

  document.addEventListener('click', handler, true);
  return () => document.removeEventListener('click', handler, true);
};

const initCopyTracking = () => {
  const handler = () => {
    const selection = window.getSelection();
    const text = normalizeText(selection?.toString());
    if (!text) return;
    const anchorNode = selection?.anchorNode;
    const container = anchorNode?.parentElement?.closest('pre, code');
    if (!container) return;
    trackContentInteraction('code_copy', 'code_snippet', getPagePath());
  };

  document.addEventListener('copy', handler);
  return () => document.removeEventListener('copy', handler);
};

const initVideoTracking = () => {
  const stateMap = new WeakMap();

  const getState = (video) => {
    if (!stateMap.has(video)) {
      stateMap.set(video, { started: false, mid: false, complete: false });
    }
    return stateMap.get(video);
  };

  const handlePlay = (event) => {
    const video = event.target;
    if (!(video instanceof HTMLVideoElement)) return;
    const state = getState(video);
    if (!state.started) {
      state.started = true;
      trackEvent('video_start', { page_path: getPagePath() });
      trackContentInteraction('video_play', video.getAttribute('aria-label') || 'video', getPagePath());
    }
  };

  const handleTimeUpdate = (event) => {
    const video = event.target;
    if (!(video instanceof HTMLVideoElement)) return;
    const state = getState(video);
    if (state.mid || !video.duration) return;
    if (video.currentTime / video.duration >= 0.5) {
      state.mid = true;
      trackEvent('video_progress_50', { page_path: getPagePath() });
    }
  };

  const handleEnded = (event) => {
    const video = event.target;
    if (!(video instanceof HTMLVideoElement)) return;
    const state = getState(video);
    if (!state.complete) {
      state.complete = true;
      trackEvent('video_complete', { page_path: getPagePath() });
    }
  };

  document.addEventListener('play', handlePlay, true);
  document.addEventListener('timeupdate', handleTimeUpdate, true);
  document.addEventListener('ended', handleEnded, true);

  return () => {
    document.removeEventListener('play', handlePlay, true);
    document.removeEventListener('timeupdate', handleTimeUpdate, true);
    document.removeEventListener('ended', handleEnded, true);
  };
};

const resetPerPageTrackers = () => {
  activeCleanupFns.forEach((fn) => fn && fn());
  activeCleanupFns = [];
  engagementScore = 0;
  engagementThresholdFired = false;

  activeCleanupFns.push(trackScrollDepth());
  activeCleanupFns.push(trackSectionView());
  activeCleanupFns.push(trackEngagement());
};

export const initAnalytics = () => {
  if (initialized || typeof window === 'undefined') return () => {};
  initialized = true;

  const cleanupFns = [];

  const handleRouteChange = () => {
    const currentLocation = getPageLocation();
    if (currentLocation === lastLocation) return;
    const previousPath = lastLocation ? new URL(lastLocation).pathname : 'direct';
    lastLocation = currentLocation;
    setTimeout(() => {
      resetPerPageTrackers();
      trackPageView(previousPath);
    }, 0);
  };

  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  window.history.pushState = function (...args) {
    const result = originalPushState.apply(this, args);
    window.dispatchEvent(new Event('analytics:navigation'));
    return result;
  };

  window.history.replaceState = function (...args) {
    const result = originalReplaceState.apply(this, args);
    window.dispatchEvent(new Event('analytics:navigation'));
    return result;
  };

  const onNavigation = () => handleRouteChange();

  window.addEventListener('popstate', onNavigation);
  window.addEventListener('analytics:navigation', onNavigation);

  cleanupFns.push(() => window.removeEventListener('popstate', onNavigation));
  cleanupFns.push(() => window.removeEventListener('analytics:navigation', onNavigation));
  cleanupFns.push(() => {
    window.history.pushState = originalPushState;
    window.history.replaceState = originalReplaceState;
  });

  cleanupFns.push(initClickTracking());
  cleanupFns.push(initCopyTracking());
  cleanupFns.push(initVideoTracking());
  cleanupFns.push(trackOutboundLinks());
  cleanupFns.push(trackErrors());

  const initialLocation = getPageLocation();
  lastLocation = initialLocation;
  setTimeout(() => {
    resetPerPageTrackers();
    trackPageView('direct');
  }, 0);

  return () => {
    cleanupFns.forEach((fn) => fn && fn());
    activeCleanupFns.forEach((fn) => fn && fn());
    activeCleanupFns = [];
    initialized = false;
  };
};
