import React from 'react';
import { Link } from 'react-router-dom';
import './Projects.css';

// Lightweight page that showcases project sections with alternating image mosaics and text
export default function Projects() {
  const sections = [
    {
      title: 'About Me',
      description:
        'Engineer and researcher passionate about building reliable products and human-centered data systems. I love working across the stack, crafting clean UIs, scalable services, and practical ML features.',
      layout: 'hero',
      images: [
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2070&auto=format&fit=crop',
      ],
    },
    {
      title: 'Project Name 2',
      description:
        'A visual exploration app that helps people browse large media libraries via fast search and compact layouts.',
      layout: 'mosaic-1',
      images: [
        'https://images.unsplash.com/photo-1505764706515-aa95265c5abc?q=80&w=2070&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2069&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?q=80&w=1974&auto=format&fit=crop',
      ],
    },
    {
      title: 'Project Name 6',
      description:
        'Built a geospatial pipeline to render location-aware stories. Optimized for mobile latency with prefetch and image tiling.',
      layout: 'mosaic-2',
      images: [
        'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=2069&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=2070&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2069&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1964&auto=format&fit=crop',
      ],
    },
    {
      title: 'Project Name 8',
      description:
        'Multi-image stories laid out in a neat grid. Drag-and-drop editor with autosave and share links.',
      layout: 'mosaic-3',
      images: [
        'https://images.unsplash.com/photo-1433477155337-9aea4e790195?q=80&w=2070&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1496386260002-3e5b8c28f44b?q=80&w=1974&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2069&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2070&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2070&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1445307806294-bff7f67ff225?q=80&w=2071&auto=format&fit=crop',
      ],
    },
    {
      title: 'Project Name 10',
      description:
        'A clean storytelling template with emphasis on typography and edge-to-edge imagery.',
      layout: 'mosaic-4',
      images: [
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2070&auto=format&fit=crop',
      ],
    },
  ];

  return (
    <div className="projects-page">
      <div className="projects-header">
        <Link to="/" className="logo libertinus-mono" style={{ textDecoration: 'none', color: 'inherit' }}>
          Atishay Kasliwal
        </Link>
        <nav className="nav black">
          <a href="/Atishay_Kasliwal.pdf" target="_blank" rel="noopener noreferrer">RESUME</a>
          <a href="https://www.linkedin.com/in/atishay-kasliwal/" target="_blank" rel="noopener noreferrer">LINKEDIN</a>
          <Link to="/art">ART</Link>
          <Link to="/projects" className="active">PROJECTS</Link>
        </nav>
      </div>

      {sections.map((s, idx) => (
        <section key={idx} className={`project-section ${s.layout}`}>
          {/* Image Grid */}
          <div className="project-images">
            {s.images.map((src, i) => (
              <div key={i} className="project-img-tile">
                <img src={src} alt={`${s.title}-${i}`} />
              </div>
            ))}
          </div>

          {/* Text Panel */}
          <aside className="project-text">
            <h3>{s.title}</h3>
            <p>{s.description}</p>
            <div className="project-meta">
              <span>Role: Software Engineer</span>
              <span>Stack: React, Node, Python</span>
            </div>
          </aside>
        </section>
      ))}
    </div>
  );
}


