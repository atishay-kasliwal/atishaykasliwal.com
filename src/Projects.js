import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Projects.css';
import { Helmet } from 'react-helmet';

// Lightweight page that showcases project sections with alternating image mosaics and text
export default function Projects() {
  const sections = [
    {
      title: 'About Me',
      description:
        'Engineer and researcher passionate about building reliable products and human-centered data systems. I love working across the stack, crafting clean UIs, scalable services, and practical ML features.',
      layout: 'tpl-hero',
      images: [
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2070&auto=format&fit=crop',
      ],
      link: 'https://github.com/atishay-kasliwal',
    },
    {
      title: 'Project Name 2',
      description:
        'A visual exploration app that helps people browse large media libraries via fast search and compact layouts.',
      layout: 'tpl-reflect-banner',
      images: [
        'https://images.unsplash.com/photo-1505764706515-aa95265c5abc?q=80&w=2070&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2069&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?q=80&w=1974&auto=format&fit=crop',
      ],
      link: 'https://github.com/atishay-kasliwal',
    },
    {
      title: 'Project Name 6',
      description:
        'Built a geospatial pipeline to render location-aware stories. Optimized for mobile latency with prefetch and image tiling.',
      layout: 'tpl-grid-collage',
      images: [
        'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=2069&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=2070&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2069&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1964&auto=format&fit=crop',
      ],
      link: 'https://github.com/atishay-kasliwal',
    },
    {
      title: 'Project Name 8',
      description:
        'Multi-image stories laid out in a neat grid. Drag-and-drop editor with autosave and share links.',
      layout: 'tpl-split-banner',
      images: [
        'https://images.unsplash.com/photo-1433477155337-9aea4e790195?q=80&w=2070&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1496386260002-3e5b8c28f44b?q=80&w=1974&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2069&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2070&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2070&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1445307806294-bff7f67ff225?q=80&w=2071&auto=format&fit=crop',
      ],
      link: 'https://github.com/atishay-kasliwal',
    },
    {
      title: 'Project Name 10',
      description:
        'A clean storytelling template with emphasis on typography and edge-to-edge imagery.',
      layout: 'tpl-hero',
      images: [
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2070&auto=format&fit=crop',
      ],
      link: 'https://github.com/atishay-kasliwal',
    },
  ];

  // Google Analytics lightweight init and pageview for Projects
  useEffect(() => {
    const gaId = process.env.REACT_APP_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';
    if (!window.dataLayer) {
      window.dataLayer = window.dataLayer || [];
      function gtag(){ window.dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('config', gaId, { page_path: '/projects' });
    } else {
      window.dataLayer.push({ event: 'page_view', page_path: '/projects' });
    }
  }, []);

  return (
    <div className="projects-page">
      <Helmet>
        <title>Projects | Atishay Kasliwal</title>
      </Helmet>
      <div className="bg-art" />
      <div className="page-content">
        <div className="header">
          <Link to="/" className="logo libertinus-mono" style={{ textDecoration: 'none', color: 'inherit' }}>
            Atishay Kasliwal
          </Link>
          <nav className="nav">
            <a href="/Atishay_Kasliwal.pdf" target="_blank" rel="noopener noreferrer">RESUME</a>
            <a href="https://www.linkedin.com/in/atishay-kasliwal/" target="_blank" rel="noopener noreferrer">LINKEDIN</a>
            <Link to="/art">ART</Link>
            <Link to="/projects" className="active">PROJECTS</Link>
          </nav>
        </div>

        <div className="projects-list">
        {sections.map((s, idx) => (
          <section key={idx} className={`project-section ${s.layout}`}>
            {/* Template: Hero (large image + side text) */}
            {s.layout === 'tpl-hero' && (
              <>
                <div className="project-images hero-one">
                  <div className="project-img-tile">
                    <img src={s.images[0]} alt={`${s.title}-hero`} />
                  </div>
                </div>
                <aside className="project-text">
                  <h3>{s.title}</h3>
                  <p>{s.description}</p>
                  <div className="project-meta">
                    <span>Role: Software Engineer</span>
                    <span>Stack: React, Node, Python</span>
                  </div>
                  <a className="btn-theme btn-outline project-cta" href={s.link} target="_blank" rel="noopener noreferrer">View Project</a>
                </aside>
              </>
            )}

            {/* Template: Strip Cards (row of small cards over baseline) */}
            {s.layout === 'tpl-strip-cards' && (
              <>
                <div className="project-images strip-cards">
                  {s.images.map((src, i) => (
                    <div key={i} className="project-img-tile card">
                      <img src={src} alt={`${s.title}-${i}`} />
                    </div>
                  ))}
                </div>
                <aside className="project-text">
                  <h3>{s.title}</h3>
                  <p>{s.description}</p>
                  <div className="project-meta">
                    <span>Role: Software Engineer</span>
                    <span>Stack: React, Node, Python</span>
                  </div>
                  <a className="btn-theme btn-outline project-cta" href={s.link} target="_blank" rel="noopener noreferrer">View Project</a>
                </aside>
              </>
            )}

            {/* Template: Reflect Banner (hero with reflection + tall right image + text) */}
            {s.layout === 'tpl-reflect-banner' && (
              <>
                <div className="project-images reflect-left">
                  <div className="hero-with-reflect">
                    <img className="hero" src={s.images[0]} alt={`${s.title}-hero`} />
                    <div className="reflect-wrap">
                      <img className="reflect" src={s.images[0]} alt={`${s.title}-hero-reflect`} />
                    </div>
                  </div>
                  <div className="project-copy-card">
                    <h3>{s.title}</h3>
                    <p>{s.description}</p>
                    <a className="btn-theme btn-outline project-cta" href={s.link} target="_blank" rel="noopener noreferrer">View Project</a>
                  </div>
                </div>
                <aside className="project-text right-tall">
                  <div className="tall-image-wrap">
                    <img src={s.images[1]} alt={`${s.title}-tall`} />
                  </div>
                </aside>
              </>
            )}

            {/* Template: Grid Collage (balanced collage) */}
            {s.layout === 'tpl-grid-collage' && (
              <>
                <div className="project-images grid-collage">
                  {s.images.map((src, i) => (
                    <div key={i} className={`project-img-tile ${i === 0 ? 'span-2-row' : ''}`}>
                      <img src={src} alt={`${s.title}-${i}`} />
                    </div>
                  ))}
                </div>
                <aside className="project-text">
                  <h3>{s.title}</h3>
                  <p>{s.description}</p>
                  <div className="project-meta">
                    <span>Role: Software Engineer</span>
                    <span>Stack: React, Node, Python</span>
                  </div>
                  <a className="btn-theme btn-outline project-cta" href={s.link} target="_blank" rel="noopener noreferrer">View Project</a>
                </aside>
              </>
            )}

            {/* Template: Split Banner (tall image column + copy) */}
            {s.layout === 'tpl-split-banner' && (
              <>
                <div className="project-images split-banner">
                  {s.images.slice(0, 3).map((src, i) => (
                    <div key={i} className="project-img-tile tall">
                      <img src={src} alt={`${s.title}-tall-${i}`} />
                    </div>
                  ))}
                </div>
                <aside className="project-text">
                  <h3>{s.title}</h3>
                  <p>{s.description}</p>
                  <div className="project-meta">
                    <span>Role: Software Engineer</span>
                    <span>Stack: React, Node, Python</span>
                  </div>
                  <a className="btn-theme btn-outline project-cta" href={s.link} target="_blank" rel="noopener noreferrer">View Project</a>
                </aside>
              </>
            )}
          </section>
        ))}
        </div>
      </div>
    </div>
  );
}


