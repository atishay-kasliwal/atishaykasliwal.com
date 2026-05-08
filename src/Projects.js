import React from 'react';
import { Link } from 'react-router-dom';
import HeroCarousel from './HeroCarousel';
import SiteHeader from './SiteHeader';
import './Projects.css';
import { Helmet } from 'react-helmet';
import wakeforeststudent from './assets/WakeForsetstudent.JPG';
import conference from './assets/confremce.JPG';
import MRIimage from './assets/atrium health.jpg';
import wakeatishay from './assets/wakwforest.jpg';
import braint1 from './assets/T1.png';
// Banner block content - customize these arrays for different banner content
// Each item can be:
//   - A string: displays as text (e.g., 'MACHINE LEARNING')
//   - An object with 'image': displays an image (e.g., { image: 'https://...' })
//   - An object with 'image' and 'alt': displays an image with alt text (e.g., { image: 'https://...', alt: 'Description' })

const bannerBlocksTop = [
 
  { image: '/fidelity-logo.png', alt: 'Fidelity Investments' },
  { image: '/accolite-logo.png', alt: 'Accolite Digital' },
  { image: '/sbu-logo.png', alt: 'Stony Brook University' },
  { image: '/suas-logo.png', alt: 'Symbiosis University of Applied Sciences' },
  { image: '/atrium-logo.png', alt: 'Atrium Health Wake Forest Baptist' },
  { image: '/wfu-logo.png', alt: 'Wake Forest University' },
  { image: '/bt-group-logo.png', alt: 'BT Group' },
  { image: '/bounteous-logo.png', alt: 'Bounteous' },
  { image: '/banner-logo.png', alt: 'Logo' },
  { image: '/t-mobile-logo.png', alt: 'T-Mobile' }
  // Add more images like this:
  // { image: '/your-image.png', alt: 'Description' },
  // { image: 'https://your-image-url.com/image.jpg', alt: 'Description' },
];

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

// Bottom banner is currently commented out - uncomment if needed
// const bannerBlocksBottom = [
//   'Software Developer',
//   'Research Assistant',
//   'Artificial Intelligence Intern',
//   'Software Intern',
//   'Senior Software Engineer'
//   // Add images like this:
//   // { image: 'https://your-image-url.com/image.jpg', alt: 'Description' },
//   // { image: 'https://your-image-url.com/image2.jpg' },
// ];

// Projects data - you can customize these with your actual projects
export const projectsData = [
  {
    id: 3,
    title: 'FOMC Intelligence Dashboard',
    description: 'NLP pipeline surfacing rate signals and sentiment shifts from Federal Reserve transcripts.',
    seoTitle: 'FOMC Intelligence Dashboard — Fed Sentiment & Rate Signal Analysis',
    seoDescription: 'An NLP pipeline that parses Federal Reserve meeting transcripts, tags hawkish vs. dovish language shift by shift, and surfaces rate signals visually. Built with Python, spaCy, and Firebase — the Fed speaks plainly now.',
    image: '/fmocc.jpeg',
    link: '/highlights/d4e5f6a7-b8c9-4012-d345-6789abcdef01',
    uuid: 'd4e5f6a7-b8c9-4012-d345-6789abcdef01',
    category: 'NLP',
    size: 'medium',
    span: 2,
  },
  {
    id: 1,
    title: 'Healthcare AI Research',
    description: 'Machine learning research and healthcare data analytics at Atrium Health Wake Forest',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&h=800&auto=format&fit=crop',
    link: `/highlights/${slugify('Healthcare AI Research')}`,
    uuid: 'a1b2c3d4-e5f6-4789-a012-bcdef0123456',
    category: 'Research',
    size: 'tall',
    span: 2,
    layout: 'two-squares',
    squareImages: [
      conference,
      MRIimage
    ],
    textOverlay: true,
    noLink: true,
  },
  {
    id: 6,
    title: 'Policy Enforcement at Every Layer',
    description: 'Interactive data contract enforcement system with real-time architecture visualization.',
    seoTitle: 'Data Contracts That Enforce Themselves — PolicyFabric Live Architecture',
    seoDescription: 'Built a data contract enforcement engine that validates schemas, lineage, and SLAs at every pipeline layer in real time — with a live architecture diagram you can interact with and watch break. No more silent failures downstream.',
    image: '/5th%20image.jpeg',
    link: '/highlights/f6a7b8c9-d0e1-4234-f567-89abcdef0123',
    uuid: 'f6a7b8c9-d0e1-4234-f567-89abcdef0123',
    category: 'Systems',
    size: 'medium',
    span: 2,
  },
  {
    id: 4,
    title: 'Ask Your Documents Anything',
    description: 'Retrieval-augmented generation for querying legal filings in natural language.',
    seoTitle: 'No More Ctrl+F — Query Legal Documents in Plain English (RAG Built From Scratch)',
    seoDescription: 'Not a ChatGPT wrapper. A full retrieval-augmented generation pipeline — embeddings, vector search, reranking — that lets you interrogate contracts and SEC filings like a conversation. Ask once, get the paragraph that matters.',
    image: '/4th.jpeg',
    link: '/highlights/c3d4e5f6-a7b8-4901-c234-56789abcdef0',
    uuid: 'c3d4e5f6-a7b8-4901-c234-56789abcdef0',
    category: 'AI',
    size: 'medium',
    span: 2,
  },
  {
    id: 5,
    title: 'Tumor Detection Scan to Insight',
    description: 'CNN-powered MRI viewer with real-time tumor segmentation running in the browser.',
    seoTitle: 'Brain Tumor Segmentation in Your Browser — No Upload, No Server, No Wait',
    seoDescription: 'A CNN-powered MRI viewer that runs tumor segmentation entirely client-side via TensorFlow.js. Switch between T1, T2, FLAIR, and DWI modalities, see the overlay, and understand exactly what the model flagged — zero data leaves your machine.',
    image: '/mriimage.jpeg',
    link: '/highlights/e5f6a7b8-c9d0-4123-e456-789abcdef012',
    uuid: 'e5f6a7b8-c9d0-4123-e456-789abcdef012',
    category: 'Medical AI',
    size: 'medium',
    span: 2,
  },
  {
    id: 2,
    title: 'Data Analytics Platform',
    description: 'Data modeling and business intelligence solutions for enterprise clients',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&h=600&auto=format&fit=crop',
    link: `/highlights/${slugify('Healthcare AI Research')}`,
    uuid: 'd4e5f6a7-b8c9-4012-d345-6789abcdef01',
    category: 'Data Science',
    size: 'wide',
    span: 4, // Row 1: Double width (spans 2 columns)
    textOverlay: true,
    overlayLayout: 'split', // Split layout: text on left, image on right
    layout: 'text-carousel', // New layout: text blocks top, carousel bottom
    leftText: {
      label: 'Behind the Designs',
      title: 'Atirum Health Wake Forest Baptist Hospital',
      description: ""
    },
    rightText: {
      subtitle: "Let's Build Something Meaningful Together",
      buttonText: "Let's Connect",
      buttonHref: 'https://www.linkedin.com/in/atishay-kasliwal/',
    },
    carouselImages: [
      wakeforeststudent,
      wakeatishay,
      braint1
    ]
  },
  // {
  //   id: 3,
  //   title: 'Full-Stack Applications',
  //   description: 'Enterprise software engineering and team projects at Accolite Digital',
  //   image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=600&h=600&auto=format&fit=crop',
  //   link: '#',
  //   category: 'Software Engineering',
  //   size: 'medium',
  //   span: 2 // Row 2: Equal (1/3 width)
  // },
  // {
  //   id: 4,
  //   title: 'Backend Systems',
  //   description: 'Backend systems development and software architecture at Shriffle Technologies',
  //   image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=600&h=800&auto=format&fit=crop',
  //   link: '#',
  //   category: 'Backend',
  //   size: 'tall',
  //   span: 2 // Row 2: Equal (1/3 width)
  // },
  // {
  //   id: 5,
  //   title: 'AI Project Development',
  //   description: 'AI project development and research at Verzeo Learning',
  //   image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=800&h=500&auto=format&fit=crop',
  //   link: '#',
  //   category: 'AI/ML',
  //   size: 'wide',
  //   span: 2 // Row 2: Equal (1/3 width)
  // },
  // {
  //   id: 6,
  //   title: 'Predictive Analytics System',
  //   description: 'Advanced analytics platform for pattern recognition and predictive modeling in law enforcement',
  //   image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&h=600&auto=format&fit=crop',
  //   link: '#',
  //   category: 'Data Analysis',
  //   size: 'medium',
  //   span: 4, // Row 3: Double width (spans 2 columns)
  //   textOverlay: true,
  //   overlayLayout: 'split', // Split layout: text on left, image on right
  //   layout: 'text-carousel', // New layout: text blocks top, carousel bottom
  //   leftText: {
  //     label: 'Data Insights',
  //     title: 'Transforming Data Into Actionable Intelligence',
  //     description: "Leveraging advanced analytics and machine learning to uncover patterns and drive informed decision-making in law enforcement."
  //   },
  //   rightText: {
  //     subtitle: "Building Smarter Solutions Through Data",
  //     buttonText: 'View Project'
  //   },
  //   carouselImages: [
  //     'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&h=800&auto=format&fit=crop',
  //     'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600&h=800&auto=format&fit=crop',
  //     'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&h=800&auto=format&fit=crop'
  //   ]
  // },
  // {
  //   id: 7,
  //   title: 'Enterprise Web Platform',
  //   description: 'Full-stack web application development with modern UI/UX design principles',
  //   image: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?q=80&w=600&h=800&auto=format&fit=crop',
  //   link: '#',
  //   category: 'Frontend',
  //   size: 'tall',
  //   span: 2 // Row 3: Normal width
  // },
  // {
  //   id: 8,
  //   title: 'AI Trading System',
  //   description: 'LLM-powered trading simulation platform with real-time data visualization and analytics',
  //   image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=800&h=600&auto=format&fit=crop',
  //   link: '#',
  //   category: 'NLP',
  //   size: 'wide',
  //   span: 2 // Row 4: Equal (1/3 width)
  // },
  // {
  //   id: 10,
  //   title: 'Machine Learning Solutions',
  //   description: 'Comprehensive ML models and data science applications for business intelligence',
  //   image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&h=500&auto=format&fit=crop',
  //   link: '#',
  //   category: 'Data Science',
  //   size: 'wide',
  //   span: 2 // Row 4: Equal (1/3 width)
  // },
  // {
  //   id: 11,
  //   title: 'Enterprise Software',
  //   description: 'Senior software engineering projects and enterprise solutions',
  //   image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=600&h=800&auto=format&fit=crop',
  //   link: '#',
  //   category: 'Software Engineering',
  //   size: 'tall',
  //   span: 3 // Row 5: Equal (50% width each)
  // },
  // {
  //   id: 12,
  //   title: 'COVID-19 Analytics',
  //   description: 'Analytics and ML projects focused on COVID-19 data analysis',
  //   image: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?q=80&w=600&h=600&auto=format&fit=crop',
  //   link: '#',
  //   category: 'Data Analysis',
  //   size: 'medium',
  //   span: 3 // Row 5: Equal (50% width each)
  // }
];

// Projects page with grid layout
export default function Projects() {
  return (
    <div className="projects-page" translate="no">
      <Helmet>
        <html lang="en" translate="no" />
        <title>Highlights | Atishay Kasliwal</title>
        <meta name="description" content="Portfolio of highlights by Atishay Kasliwal - AI/ML, Data Science, Software Engineering, and Full-Stack Development" />
        <meta name="google" content="notranslate" />
        <meta name="google-translate-customization" content="no" />
      </Helmet>
      <div className="page-content" translate="no">
        <SiteHeader />

        <div className="projects-container" translate="no">
              <div className="projects-banner-container" translate="no">
                {/* Top Row - blocks */}
                <div className="projects-running-banner projects-banner-row-top" translate="no">
                  <div className="projects-banner-content" translate="no">
                    {[...Array(2)].map((_, repeatIndex) => (
                      bannerBlocksTop.map((block, index) => {
                        const isImage = typeof block === 'object' && block.image;
                        const blockKey = `block-top-${repeatIndex}-${index}`;
                        const isAccolite = isImage && block.image === '/accolite-logo.png';
                        const isBannerLogo = isImage && block.image === '/banner-logo.png';
                        const isBounteous = isImage && block.image === '/bounteous-logo.png';
                        const isBTGroup = isImage && block.image === '/bt-group-logo.png';
                        const isAtrium = isImage && block.image === '/atrium-logo.png';
                        
                        return (
                          <div 
                            key={blockKey} 
                            className={`projects-banner-block ${isImage ? 'banner-block-image' : 'banner-block-text'} ${isAccolite ? 'accolite-logo' : ''} ${isBannerLogo ? 'banner-logo' : ''} ${isBounteous ? 'bounteous-logo' : ''} ${isBTGroup ? 'bt-group-logo' : ''} ${isAtrium ? 'atrium-logo' : ''}`}
                            translate="no"
                            style={isImage ? {
                              '--block-index': index,
                              backgroundImage: `url(${block.image})`,
                              backgroundSize: isAccolite ? '101%' : (isBannerLogo ? '71%' : (isBounteous ? '101%' : (isBTGroup ? '101%' : (isAtrium ? '52%' : 'contain')))),
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat'
                            } : { '--block-index': index }}
                          >
                            {!isImage && block}
                          </div>
                        );
                      })
                    ))}
                  </div>
                </div>
                {/* Bottom Row - blocks */}
                {/* <div className="projects-running-banner projects-banner-row-bottom" translate="no">
                  <div className="projects-banner-content" translate="no">
                    {[...Array(2)].map((_, repeatIndex) => (
                      bannerBlocksBottom.map((block, index) => {
                        const isImage = typeof block === 'object' && block.image;
                        const blockKey = `block-bottom-${repeatIndex}-${index}`;
                        
                        return (
                          <div 
                            key={blockKey} 
                            className={`projects-banner-block ${isImage ? 'banner-block-image' : 'banner-block-text'}`}
                            translate="no"
                            style={isImage ? {
                              '--block-index': index,
                              backgroundImage: `url(${block.image})`,
                              backgroundSize: 'contain',
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat'
                            } : { '--block-index': index }}
                          >
                            {!isImage && block}
                          </div>
                        );
                      })
                    ))}
                  </div>
                </div> */}
              </div>

          <section className="featured-hero section-wrap" data-analytics-section="cta" translate="no">
            <div className="featured-hero__label" translate="no">Currently Developing</div>
            <div className="featured-hero__media">
              <div className="featured-hero__media-inner">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="featured-hero__video"
                  aria-label="Atriveo demo video"
                >
                  <source src="/featured-project.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
            <div className="featured-hero__text" translate="no">
              <div className="featured-hero__text-left">
                Creating a platform to help track, manage, and optimize job applications using AI.
              </div>
              <div className="featured-hero__text-right">
                <a
                  href="https://www.atriveo.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="featured-hero__cta-primary"
                  data-cta-position="product_demo"
                >
                  View Product
                </a>
              </div>
            </div>
          </section>

          <HeroCarousel />

          <div className="projects-grid" translate="no">
            {projectsData
              .filter(project => ![3, 4, 5, 6, 11, 12].includes(project.id))
              .map((project, index) => {
                // Recalculate index after filtering for proper numbering
                const filteredProjects = projectsData.filter(p => ![5, 11, 12].includes(p.id));
                const displayIndex = filteredProjects.findIndex(p => p.id === project.id);
                const isClickableOverlayCard = project.textOverlay && project.link && String(project.link).startsWith('/') && !project.rightText?.buttonHref && !project.noLink;
                const CardWrapper = isClickableOverlayCard ? Link : 'div';
                const spanClass = project.span === 3 ? 'span-3' : project.span === 4 ? 'span-4' : project.span === 6 ? 'span-6' : 'span-2';
                const cardWrapperProps = isClickableOverlayCard
                  ? { to: project.link, className: `project-card-outer-link ${spanClass}`, style: { textDecoration: 'none', color: 'inherit' } }
                  : { className: `project-card-outer ${spanClass}` };
                return (
              <CardWrapper key={project.id} {...cardWrapperProps} data-project-name={project.title} translate="no">
                <div 
                  className={`project-card-grid project-card-${project.size || 'medium'} ${project.textOverlay ? 'text-overlay' : ''} ${project.noLink ? 'no-hover' : ''} notranslate`}
                  data-feature-name={project.title}
                  translate="no"
                >
                <div 
                  className={`project-card-image ${project.overlayLayout === 'split' ? 'overlay-split' : ''} ${project.layout === 'text-carousel' ? 'text-carousel-layout' : ''} ${project.layout === 'two-squares' ? 'two-squares-layout' : ''}`}
                  style={project.imageHeight ? { height: project.imageHeight } : {}}
                >
                  {project.layout === 'two-squares' ? (
                    <div className="project-square-images" translate="no">
                      {project.squareImages && project.squareImages.slice(0, 2).map((img, imgIndex) => (
                        <div
                          key={imgIndex}
                          className="project-square-image"
                          translate="no"
                        >
                          <img src={img} alt={`${project.title} - Square ${imgIndex + 1}`} translate="no" />
                        </div>
                      ))}
                    </div>
                  ) : project.layout === 'text-carousel' ? (
                    <div className="project-text-carousel-container" translate="no">
                      {/* Top Section: Two Text Blocks */}
                      <div className="project-text-blocks" translate="no">
                        <div className="project-text-block-left" translate="no">
                          {project.leftText?.label && (
                            <div className="project-text-label" translate="no">{project.leftText.label}</div>
                          )}
                          {project.leftText?.title && (
                            <h2 className="project-text-title" translate="no">{project.leftText.title}</h2>
                          )}
                          {project.leftText?.description && (
                            <p className="project-text-description" translate="no">{project.leftText.description}</p>
                          )}
                        </div>
                        <div className="project-text-block-right" translate="no">
                          {project.rightText?.subtitle && (
                            <p className="project-text-subtitle" translate="no">{project.rightText.subtitle}</p>
                          )}
                          {project.rightText?.buttonText && (
                            project.rightText.buttonHref ? (
                              <a
                                href={project.rightText.buttonHref}
                                className="project-text-button"
                                target="_blank"
                                rel="noopener noreferrer"
                                translate="no"
                              >
                                {project.rightText.buttonText}
                                <span className="button-arrow">→</span>
                              </a>
                            ) : project.uuid ? (
                              <Link
                                to={project.link}
                                className="project-text-button"
                                translate="no"
                              >
                                {project.rightText.buttonText}
                                <span className="button-arrow">→</span>
                              </Link>
                            ) : (
                              <a
                                href={project.link}
                                className="project-text-button"
                                target="_blank"
                                rel="noopener noreferrer"
                                translate="no"
                              >
                                {project.rightText.buttonText}
                                <span className="button-arrow">→</span>
                              </a>
                            )
                          )}
                        </div>
                      </div>
                      
                      {/* Bottom Section: Image Carousel - 3 images grid */}
                      {project.carouselImages && project.carouselImages.length > 0 && (
                        <div className="project-carousel-container" translate="no">
                          <div className="project-carousel-images" translate="no">
                            {project.carouselImages.slice(0, 3).map((img, imgIndex) => (
                              <div
                                key={imgIndex}
                                className="project-carousel-image"
                                translate="no"
                              >
                                <img src={img} alt={`${project.title} - ${imgIndex + 1}`} translate="no" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : project.overlayLayout === 'split' ? (
                    <>
                      <div className="project-card-split-content" translate="no">
                        <div className="project-card-split-text" translate="no">
                          <div className="project-card-number" translate="no">#{String(displayIndex + 1).padStart(2, '0')}</div>
                          <h3 className="project-card-title" translate="no">{project.title}</h3>
                          <p className="project-card-description" translate="no">{project.description}</p>
                          {project.uuid ? (
                            <Link 
                              to={project.link} 
                              className="project-card-link"
                              translate="no"
                            >
                              View
                            </Link>
                          ) : (
                            <a 
                              href={project.link} 
                              className="project-card-link"
                              target="_blank" 
                              rel="noopener noreferrer"
                              translate="no"
                            >
                              View
                            </a>
                          )}
                        </div>
                        <div className="project-card-split-image" translate="no">
                          <img src={project.image} alt={project.title} translate="no" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <img src={project.image} alt={project.title} translate="no" />
                      {project.textOverlay && (
                        <div className="project-card-overlay-content" translate="no">
                          <div className="project-card-number" translate="no">#{String(displayIndex + 1).padStart(2, '0')}</div>
                          <h3 className="project-card-title" translate="no">{project.title}</h3>
                          <p className="project-card-description" translate="no">{project.description}</p>
                          {/* {project.uuid ? (
                            <Link 
                              to={project.link} 
                              className="project-card-link"
                              translate="no"
                            >
                              View Project →
                            </Link>
                          ) : (
                            <a 
                              href={project.link} 
                              className="project-card-link"
                              target="_blank" 
                              rel="noopener noreferrer"
                              translate="no"
                            >
                              View Project →
                            </a>
                          )} */}
                        </div>
                      )}
                    </>
                  )}
                </div>
                {!project.textOverlay && (
                  <div className="project-card-content" translate="no">
                    <div className="project-card-number" translate="no">#{String(displayIndex + 1).padStart(2, '0')}</div>
                    <h3 className="project-card-title" translate="no">{project.title}</h3>
                    <p className="project-card-description" translate="no">{project.description}</p>
                    {project.uuid ? (
                      <Link 
                        to={project.link} 
                        className="project-card-link"
                        translate="no"
                      >
                        View
                      </Link>
                    ) : (
                      <a 
                        href={project.link} 
                        className="project-card-link"
                        target="_blank" 
                        rel="noopener noreferrer"
                        translate="no"
                      >
                        View
                      </a>
                    )}
                  </div>
                )}
                </div>
              </CardWrapper>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
