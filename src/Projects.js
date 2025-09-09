import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Projects.css';
import { Helmet } from 'react-helmet';

// Project carousel component
function ProjectCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Generate 20 projects with diverse images and proper titles
  const projects = [
    {
      id: 1,
      title: `Software Engineer`,
      description: `Accolite Digital`,
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: 2,
      title: `Web Developer Intern`,
      description: `N-tier Pvt Ltd`,
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: 3,
      title: `Frontend Developer`,
      description: `Shriffle Technologies`,
      image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: 4,
      title: `Full Stack Developer`,
      description: `Bounteous Accolite`,
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: 5,
      title: `UI/UX Designer`,
      description: `Freelance Projects`,
      image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: 6,
      title: `Web Developer Intern`,
      description: `N-tier Pvt Ltd`,
      image: 'https://i.pinimg.com/736x/15/bb/b9/15bbb97130b2971626b24f77d614a385.jpg',
    },
    // {
    //   id: 7,
    //   title: `ТУР №7`,
    //   description: `и получите незабываемые`,
    //   image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=400&auto=format&fit=crop',
    // },
    // {
    //   id: 8,
    //   title: `ТУР №8`,
    //   description: `и получите незабываемые`,
    //   image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=400&auto=format&fit=crop',
    // },
    // {
    //   id: 9,
    //   title: `ТУР №9`,
    //   description: `и получите незабываемые`,
    //   image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=400&auto=format&fit=crop',
    // },
    // {
    //   id: 10,
    //   title: `ТУР №10`,
    //   description: `и получите незабываемые`,
    //   image: 'https://images.unsplash.com/photo-1433477155337-9aea4e790195?q=80&w=400&auto=format&fit=crop',
    // },
    // {
    //   id: 11,
    //   title: `ТУР №11`,
    //   description: `и получите незабываемые`,
    //   image: 'https://images.unsplash.com/photo-1496386260002-3e5b8c28f44b?q=80&w=400&auto=format&fit=crop',
    // },
    // {
    //   id: 12,
    //   title: `ТУР №12`,
    //   description: `и получите незабываемые`,
    //   image: 'https://images.unsplash.com/photo-1445307806294-bff7f67ff225?q=80&w=400&auto=format&fit=crop',
    // },
    // {
    //   id: 13,
    //   title: `ТУР №13`,
    //   description: `и получите незабываемые`,
    //   image: 'https://images.unsplash.com/photo-1505764706515-aa95265c5abc?q=80&w=400&auto=format&fit=crop',
    // },
    // {
    //   id: 14,
    //   title: `ТУР №14`,
    //   description: `и получите незабываемые`,
    //   image: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=400&auto=format&fit=crop',
    // },
    // {
    //   id: 15,
    //   title: `ТУР №15`,
    //   description: `и получите незабываемые`,
    //   image: 'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?q=80&w=400&auto=format&fit=crop',
    // },
    // {
    //   id: 16,
    //   title: `ТУР №16`,
    //   description: `и получите незабываемые`,
    //   image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=400&auto=format&fit=crop',
    // },
    // {
    //   id: 17,
    //   title: `ТУР №17`,
    //   description: `и получите незабываемые`,
    //   image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=400&auto=format&fit=crop',
    // },
    // {
    //   id: 18,
    //   title: `ТУР №18`,
    //   description: `и получите незабываемые`,
    //   image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=400&auto=format&fit=crop',
    // },
    // {
    //   id: 19,
    //   title: `ТУР №19`,
    //   description: `и получите незабываемые`,
    //   image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=400&auto=format&fit=crop',
    // },
    // {
    //   id: 20,
    //   title: `ТУР №20`,
    //   description: `и получите незабываемые`,
    //   image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=400&auto=format&fit=crop',
    // }
  ];

  const projectsPerPage = windowWidth <= 768 ? 4 : 5;
  const maxIndex = projects.length - projectsPerPage;

  const nextSlide = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const currentProjects = projects.slice(
    currentIndex,
    currentIndex + projectsPerPage
  );

  return (
    <div className="project-carousel">
      <div className="carousel-header">
        <h2>Growth Milestones</h2>
        <p>Showcasing Milestones That Define My Story</p>
      </div>
      
      <div className="carousel-container">
        <div className="carousel-grid">
          {currentProjects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-image" style={{ backgroundImage: `url(${project.image})` }}>
                <div className="project-info">
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="carousel-navigation">
        <button className="carousel-btn prev" onClick={prevSlide}>
          <div style={{
            width: '100%',
            height: '2px',
            backgroundColor: '#fff',
            position: 'relative',
            opacity: '0.7'
          }}>
            <div style={{
              position: 'absolute',
              left: '0',
              top: '-6px',
              width: '0',
              height: '0',
              borderRight: '12px solid #fff',
              borderTop: '7px solid transparent',
              borderBottom: '7px solid transparent'
            }}></div>
          </div>
        </button>
        <button className="carousel-btn next" onClick={nextSlide}>
          <div style={{
            width: '100%',
            height: '2px',
            backgroundColor: '#fff',
            position: 'relative',
            opacity: '0.7'
          }}>
            <div style={{
              position: 'absolute',
              right: '0',
              top: '-6px',
              width: '0',
              height: '0',
              borderLeft: '12px solid #fff',
              borderTop: '7px solid transparent',
              borderBottom: '7px solid transparent'
            }}></div>
          </div>
        </button>
      </div>
    </div>
  );
}

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
    <div className="milestones-page">
      <Helmet>
        <title>Milestones | Atishay Kasliwal</title>
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
            <Link to="/projects" className="active">MILESTONES</Link>
          </nav>
        </div>

        <ProjectCarousel />

        {/* <div className="milestones-list">
        {sections.map((s, idx) => (
          <section key={idx} className={`project-section ${s.layout}`}>
            Template: Hero (large image + side text)
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

            Template: Strip Cards (row of small cards over baseline)
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

            Template: Reflect Banner (hero with reflection + tall right image + text)
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

            Template: Grid Collage (balanced collage)
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

            Template: Split Banner (tall image column + copy)
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
        </div> */}
      </div>
    </div>
  );
}


