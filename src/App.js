import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import emailjs from '@emailjs/browser';
import './App.css';

import img1 from './assets/FidelityLogo.png';
import img8 from './assets/atrium_health_wake_forest_baptist_logo.jpeg';
import img3 from './assets/T-Mobile_logo_202.png';
import img4 from './assets/bt-logo-redesign-sq-1.jpg';
import img5 from './assets/broadcast_co_logo.jpeg';
import img6 from './assets/stony_brook_university_logo.jpeg';
import img7 from './assets/Accolite Digital_iduk-Sna9f_3.png';
import img2 from './assets/Bounteous_idOCx6cSKH_0.jpeg';
import img9 from './assets/shriffle.png';
import ankitPhoto from './assets/Ankit Jain.jpeg';
import wencuiPhoto from './assets/Prof.jpeg';
import nehaPhoto from './assets/Neha gupta.jpeg';
import goldyPhoto from './assets/goldey.jpeg';
import daMaPhoto from './assets/da ma.jpeg';
import gunjanPhoto from './assets/gunjanjain.jpg';
import StoryTimeline from './StoryTimeline';
import Projects from './Projects';
import HighlightDetail from './HighlightDetail';

const experienceEducation = [
  '- Artificial Intelligence and Analytics  <strong>Atrium Health Wake Forest</strong> (2025)',
  '- Research Assistant <strong>Stony Brook University</strong> (2024–2025)',
  '- Senior Software Engineer <strong>Fidelity Investments</strong> (2021–2024)',
  '- Software Developer <strong>Shriffle</strong> (2020–2021)',
  '- Artificial Intelligence Project Development <strong>Verzeo Learning</strong> (2020)',
  '- Data Analyst <strong>Crime Branch Indore</strong> (2020)',
  '- Web Application Developer <strong>N-TIER Pvt Ltd</strong> (2019–2020)',
  '',
  '- MS in Data Science from <strong>Stony Brook University</strong> ',
  '- Bachelor of Technology in CSIT <strong>Symbiosis University of Applied Sciences</strong>'
];


function HomePage() {
  const landingImages = [img1, img2,  img3, img4, img6, img5, img8, img7, img9];
  // Show all images
  const gridImages = landingImages;
  
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Contact form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    message: ''
  });
  const [formStatus, setFormStatus] = useState('');

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.message) {
      setFormStatus('Please fill in all required fields.');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormStatus('Please enter a valid email address.');
      return;
    }

    try {
      setFormStatus('Sending message...');
      
      // EmailJS configuration - Use environment variables for security
      const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_41gb29b';
      const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'template_lngej99';
      const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY || '482xxVfxQh18uEiHh';
      
      // Template parameters
      const templateParams = {
        from_name: `${formData.firstName} ${formData.lastName}`,
        from_email: formData.email,
        message: formData.message,
        to_email: 'katishay@gmail.com'
      };
      
      // Send email using EmailJS
      await emailjs.send(serviceId, templateId, templateParams, publicKey);
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        message: ''
      });
      
      setFormStatus('Thank you! Your message has been sent successfully.');
      
      // Clear status message after 5 seconds
      setTimeout(() => {
        setFormStatus('');
      }, 5000);
      
    } catch (error) {
      console.error('EmailJS Error:', error);
      setFormStatus('Sorry, there was an error sending your message. Please try again or email me directly at katishay@gmail.com');
    }
  };

  // Testimonials
  const testimonials = [
    {
      
      text: "Atishay delivered our project ahead of schedule and exceeded expectations. His technical skills made him invaluable.",
      name: "Ankit Jain⭐⭐⭐⭐⭐",
      company: "Accolite Digital",
      post: "Technical Director",
      photo: ankitPhoto
    },
    {
      text: "Atishay developed an NLP pipeline and designed an LLM-based trading simulation with clear visualizations.",
      name: "Wencui Han⭐⭐⭐⭐⭐",
      company: "Stony Brook University",
      post: "Professor",
      photo: wencuiPhoto
    },
    {
      text: "Creative and reliable, Atishay brought fresh ideas to our projects and fostered a collaborative environment.",
      name: "Neha Gupta⭐⭐⭐⭐⭐",
      company: "Symbiosis University",
      post: "Director SCSIT",
      photo: nehaPhoto
    },
    {
      text: "Atishay delivered our product on time with perfection. His technical expertise exceeded our expectations.",
      name: "Gunjan Jain⭐⭐⭐⭐⭐",
      company: "Brains and Taxes",
      post: "Private Limited",
      photo: gunjanPhoto
    },
    {
      text: "Atishay's ML expertise was instrumental in our research. His technical skills made our project a huge success.",
      name: "Dr. Goldy Khanna⭐⭐⭐⭐⭐",
      company: "Wake Forest University",
      post: "Cerebrovascular & Skull Base Neurosurgeon",
      photo: goldyPhoto
    },
    {
      text: "Working with Atishay was a pleasure. His innovative approach made him exceptional.",
      name: "Dr. Da Ma⭐⭐⭐⭐⭐",
      company: "Wake Forest University",
      post: "Assistant Professor",
      photo: daMaPhoto
    }
  ];
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const getCurrentTestimonials = () => {
    return windowWidth <= 768 ? testimonials.slice(0, 3) : testimonials;
  };

  return (
    <>
      <Helmet>
        <html lang="en" translate="no" />
        <title>Atishay Kasliwal — Full-Stack Engineer & Data Scientist | Portfolio & Resume</title>
        <link rel="canonical" href="https://atishaykasliwal.com/" />
        <meta name="google" content="notranslate" />
        <meta name="google-translate-customization" content="no" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Atishay Kasliwal — Full-Stack Engineer & Data Scientist" />
        <meta property="og:description" content="Portfolio & resume of Atishay Kasliwal — React/Next.js, Node, Python, GCP, AI/ML engineer. Software engineer with 5+ years experience, currently pursuing MS in Data Science at Stony Brook University." />
        <meta property="og:url" content="https://atishaykasliwal.com/" />
        <meta property="og:image" content="https://atishaykasliwal.com/atishaylogo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Atishay Kasliwal — Full-Stack Engineer & Data Scientist" />
        <meta name="twitter:description" content="Portfolio & resume of Atishay Kasliwal — React/Next.js, Node, Python, GCP, AI/ML engineer. Software engineer with 5+ years experience." />
        <meta name="description" content="Atishay Kasliwal — Full-Stack Engineer & Data Scientist. Portfolio, resume, and projects. Software engineer with 5+ years experience at Fidelity Investments, currently pursuing MS in Data Science at Stony Brook University. React, Next.js, Node, Python, GCP, AI/ML." />
        <meta name="keywords" content="Atishay Kasliwal, Atishay Kasliwal portfolio, Atishay Kasliwal resume, data scientist, software engineer, full-stack engineer, React developer, Python developer, Stony Brook University, Fidelity Investments, Atrium Health Wake Forest" />
        <meta name="author" content="Atishay Kasliwal" />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "Person",
              "@id": "https://atishaykasliwal.com/#person",
              "name": "Atishay Kasliwal",
              "url": "https://atishaykasliwal.com/",
              "image": "https://atishaykasliwal.com/atishaylogo.png",
              "description": "Full-Stack Engineer & Data Scientist — React / Next.js, Node, Python, GCP, AI/ML engineer.",
              "jobTitle": "Full-Stack Engineer & Data Scientist",
              "email": "katishay@gmail.com",
              "alumniOf": [
                {
                  "@type": "CollegeOrUniversity",
                  "name": "Stony Brook University"
                },
                {
                  "@type": "CollegeOrUniversity",
                  "name": "Symbiosis University of Applied Sciences"
                }
              ],
              "worksFor": [
                {
                  "@type": "Organization",
                  "name": "Atrium Health Wake Forest",
                  "jobTitle": "AI/ML Research & Analytics"
                },
                {
                  "@type": "Organization",
                  "name": "Stony Brook University",
                  "jobTitle": "Research Assistant"
                }
              ],
              "hasOccupation": {
                "@type": "Occupation",
                "name": "Software Engineer",
                "occupationLocation": {
                  "@type": "City",
                  "name": "New York"
                }
              },
              "sameAs": [
                "https://www.linkedin.com/in/atishay-kasliwal/",
                "https://github.com/atishay-kasliwal",
                "https://x.com/AtiahayKasliwal",
                "https://www.instagram.com/atishay_kasliwal/"
              ]
            }
          `}
        </script>
      </Helmet>
      {/* Artistic Background */}
      <div className="bg-art" translate="no" />
      <div className="page-content" translate="no">
        {/* Header */}
        <div className="header" translate="no">
          <Link to="/" className="logo libertinus-mono" style={{ textDecoration: 'none', color: 'inherit' }} onClick={() => setIsMobileMenuOpen(false)}>
            <strong>Atishay Kasliwal</strong>
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
            <a href="/resume/Atishay_Kasliwal_Resume.pdf" target="_blank" rel="noopener noreferrer">RESUME</a>
            <a href="https://www.linkedin.com/in/atishay-kasliwal/" target="_blank" rel="noopener noreferrer">LINKEDIN</a>
            <Link to="/art">ART</Link>
          </nav>
        </div>
        
        {/* Highlights Banner - Mobile Only */}
        <div className="landing-highlights-banner mobile-only" translate="no">
          <div className="landing-banner-container" translate="no">
            <div className="landing-running-banner landing-banner-row-top" translate="no">
              <div className="landing-banner-content" translate="no">
                {[...Array(2)].map((_, repeatIndex) => (
                  [
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
                  ].map((block, index) => {
                    const isImage = typeof block === 'object' && block.image;
                    const blockKey = `landing-banner-${repeatIndex}-${index}`;
                    const isAccolite = isImage && block.image === '/accolite-logo.png';
                    const isBannerLogo = isImage && block.image === '/banner-logo.png';
                    const isBounteous = isImage && block.image === '/bounteous-logo.png';
                    const isBTGroup = isImage && block.image === '/bt-group-logo.png';
                    const isAtrium = isImage && block.image === '/atrium-logo.png';
                    
                    return (
                      <div 
                        key={blockKey} 
                        className={`landing-banner-block ${isImage ? 'landing-banner-image' : 'landing-banner-text'}`}
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
          </div>
        </div>
        
        {/* Two-column Main Content */}
        <div className="landing-two-col" translate="no">
          <div className="landing-left-text" style={{ marginTop: '2.5rem' }} translate="no">
            <h1 style={{ minHeight: '3rem', textAlign: 'left', color: '#fff', fontSize: 'clamp(0.5rem, 4vw, 1.5rem)', fontWeight: 'inherit', lineHeight: '1.5' }} translate="no">
              Hello, I am <strong>Atishay Kasliwal</strong>, a Software Engineer with over <strong>5 years</strong> of professional experience, currently pursuing a Master's in Data Science from <strong>Stony Brook University</strong>.
            </h1>
            <div className="button-group-theme" style={{ justifyContent: 'flex-start' }}>
              <a href="/resume/Atishay_Kasliwal_Resume.pdf" className="btn-theme btn-primary-action btn-lg" target="_blank" rel="noopener noreferrer">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.75em' }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 20 20"><path d="M10 2v12m0 0l-4-4m4 4l4-4" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="16" width="14" height="2" rx="1" fill="#000"/></svg>
                  Resume (PDF)
                </span>
              </a>
              <a
                href="mailto:katishay@gmail.com"
                className="btn-theme btn-secondary btn-lg"
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.75em' }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 20 20"><rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M2 4l8 7 8-7" stroke="currentColor" strokeWidth="2"/></svg>
                  Contact
                </span>
              </a>
              <a href="https://www.linkedin.com/in/atishay-kasliwal/" target="_blank" rel="noopener noreferrer" className="btn-theme btn-icon btn-lg" aria-label="LinkedIn">
                <svg width="21" height="21" fill="none" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm15.5 11.268h-3v-5.604c0-1.337-.025-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.967v5.7h-3v-10h2.881v1.367h.041c.401-.761 1.379-1.563 2.838-1.563 3.034 0 3.595 1.997 3.595 4.59v5.606z" fill="currentColor"/></svg>
              </a>
              <a href="https://github.com/atishay-kasliwal" target="_blank" rel="noopener noreferrer" className="btn-theme btn-icon btn-lg" aria-label="GitHub">
                <svg width="21" height="21" fill="none" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.084-.729.084-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.334-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.553 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.803 5.624-5.475 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576 4.765-1.588 8.199-6.084 8.199-11.386 0-6.627-5.373-12-12-12z" fill="currentColor"/></svg>
              </a>
            </div>
            <div className="exp-edu-list" style={{ textAlign: 'left', marginTop: '2rem', width: '100%', fontSize: '1.33em' }} translate="no">
              {experienceEducation.map((line, idx) => {
                // Render as HTML for bold tags (already formatted with <strong> tags)
                if (idx === 7) {
                  return <div key={idx} style={{ minHeight: '1.5rem' }}>&nbsp;</div>;
                } else {
                  return <div key={idx} style={{ minHeight: '1.5rem' }} dangerouslySetInnerHTML={{ __html: line }} />;
                }
              })}
            </div>
          </div>
          <div className="landing-right-images" translate="no">
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }} translate="no">
              <div className="landing-grid-3x3" translate="no">
                {gridImages.map((src, idx) => (
                  <img key={idx} src={src} alt={`Landing ${idx + 1}`} width="200" height="200" translate="no" />
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Testimonials Grid */}
        <div id="testimonials-section" style={{ width: '100%', display: 'block', marginTop: '1rem', marginBottom: '0' }} translate="no">
          <div style={{ 
            width: '100%', 
            maxWidth: '1540px', 
            margin: '0 auto',
            padding: windowWidth <= 768 ? '1rem 2rem 0.2rem 2rem' : '1.2rem 2.5rem 0.3rem 2.5rem'
          }}>
            {/* Testimonials Container */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: windowWidth <= 768 ? 'repeat(1, 1fr)' : windowWidth <= 1024 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              gridTemplateRows: windowWidth <= 768 ? 'repeat(6, auto)' : windowWidth <= 1024 ? 'repeat(3, auto)' : 'repeat(2, auto)',
              gap: windowWidth <= 768 ? '0.8rem' : '1rem',
              justifyContent: 'center',
              width: '100%'
            }}>
            {getCurrentTestimonials().map((t, idx) => (
              <div
                key={idx}
                style={{ 
                  color: '#fff', 
                  fontSize: windowWidth <= 768 ? '0.89rem' : '1.01rem', 
                  fontStyle: 'normal', 
                  textAlign: 'left', 
                  width: '100%', 
                  opacity: 0.92, 
                  letterSpacing: '0.01em', 
                  background: 'transparent', 
                  borderRadius: 12, 
                  padding: windowWidth <= 768 ? '0.5rem 0.5rem 0.5rem 0.5rem' : '0.6rem 0.6rem 0.6rem 0.6rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'flex-start', 
                  height: 'auto',
                  justifyContent: 'space-between',
                  transition: 'all 0.3s ease',
                  border: 'none',
                  boxShadow: 'none',
                  margin: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <img src={t.photo} alt={t.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', marginRight: 16, border: '2px solid #fff', background: '#222' }} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '1.05em', fontStyle: 'normal', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{t.name.split('⭐⭐⭐⭐⭐')[0].trim()}</span>
                      <span style={{ color: '#ffd700', fontSize: '1.2em', marginLeft: '2.0rem' }}>⭐⭐⭐⭐⭐</span>
                    </div>
                    <div style={{ color: '#bbb', fontSize: '0.92em', fontStyle: 'normal' }}>{t.company} — {t.post}</div>
                  </div>
                </div>
                <div style={{ 
                  fontStyle: 'normal', 
                  color: '#fff', 
                  fontWeight: 400,
                  flex: 1,
                  display: 'flex',
                  alignItems: 'flex-start',
                  lineHeight: '1.5'
                }}>{t.text}</div>
              </div>
            ))}
            </div>
          </div>
        </div>
        <div id="journey-section" translate="no">
          <StoryTimeline />
        </div>
        <div id="skills-section" translate="no">
          <SkillsSection />
        </div>
        <div id="perspective-section" translate="no">
          <ImageCarousel />
        </div>
        
        {/* Contact Section */}
        <div id="contact-section" style={{
          padding: '4rem 2rem',
          background: 'transparent',
          color: '#fff',
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }} translate="no">
          <div style={{ 
            marginBottom: '0.7rem' 
          }} translate="no">
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              marginBottom: '2rem',
              color: '#fff',
              textAlign: 'center'
            }} translate="no">Contact me</h2>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            maxWidth: '80vw',
            width: '80vw',
            margin: '0 auto',
            gap: '2rem',
            alignItems: 'center'
          }} translate="no">
            {/* Contact Visual (left) - placeholder image for now */}
            <div style={{
              flex: '1.1',
              textAlign: 'left'
            }} translate="no">
              <div style={{
                position: 'relative',
                width: '100%',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)'
              }} translate="no">
                <img
                  src="https://i.pinimg.com/736x/e9/f6/5d/e9f65d058e6548b8fe4803922cda2a3e.jpg"
                  alt="Contact visual placeholder"
                  style={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  translate="no"
                />
              </div>
            </div>
            
            {/* Contact Form */}
            <div style={{
              flex: '1',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }} translate="no">
              <form onSubmit={handleSubmit} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
              }} translate="no">
                <div translate="no">
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '1rem',
                    color: '#fff'
                  }} translate="no">
                    Name (required)
                  </label>
                  <div style={{
                    display: 'flex',
                    gap: '1rem'
                  }} translate="no">
                    <input
                      type="text"
                      name="firstName"
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      style={{
                        flex: '1',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid #fff',
                        padding: '0.5rem 0',
                        color: '#fff',
                        fontSize: '1rem',
                        outline: 'none'
                      }}
                      translate="no"
                    />
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      style={{
                        flex: '1',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid #fff',
                        padding: '0.5rem 0',
                        color: '#fff',
                        fontSize: '1rem',
                        outline: 'none'
                      }}
                      translate="no"
                    />
                  </div>
                </div>
                
                <div translate="no">
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '1rem',
                    color: '#fff'
                  }} translate="no">
                    Email (required)
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid #fff',
                      padding: '0.5rem 0',
                      color: '#fff',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                    translate="no"
                  />
                </div>
                
                <div translate="no">
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '1rem',
                    color: '#fff'
                  }} translate="no">
                    Message (required)
                  </label>
                  <textarea
                    name="message"
                    placeholder="Message"
                    rows="4"
                    value={formData.message}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid #fff',
                      padding: '0.5rem 0',
                      color: '#fff',
                      fontSize: '1rem',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                    translate="no"
                  />
                </div>
                
                <button
                  type="submit"
                  style={{
                    alignSelf: 'flex-end',
                    background: '#fff',
                    color: '#000',
                    border: '1px solid #000',
                    padding: '0.8rem 2rem',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                  translate="no"
                >
                  SUBMIT
                </button>
                
                {/* Status Message */}
                {formStatus && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.8rem',
                    background: formStatus.includes('error') || formStatus.includes('Please') ? 'rgba(255, 0, 0, 0.1)' : 'rgba(0, 255, 0, 0.1)',
                    border: `1px solid ${formStatus.includes('error') || formStatus.includes('Please') ? '#ff6b6b' : '#51cf66'}`,
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    textAlign: 'center'
                  }} translate="no">
                    {formStatus}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ArtPage() {
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const images = [
    'https://i.pinimg.com/736x/b1/62/ce/b162ce51da3005c3e6f70dfe5fd3a88a.jpg', //701 Wke forest University
    'https://i.pinimg.com/736x/c7/de/6a/c7de6a1b54676e8a9070fbaa9601fc9e.jpg', //702 Blue Cloud Wke forest University
    'https://i.pinimg.com/736x/c7/7e/a5/c77ea537089d45b70afe9be7216ba432.jpg', //703 Wke forest University cloud out of the blue
    'https://i.pinimg.com/736x/83/5d/a0/835da0d88511880ba1b7a114adcc07f1.jpg', //704 eak eforest rainbow
    'https://i.pinimg.com/736x/38/ac/84/38ac84f183371337ffe68dd083c950ae.jpg', //1 Night Festival 
    'https://i.pinimg.com/736x/82/ec/b7/82ecb7744895473c92c42241c9afe5f8.jpg', //2 Sun with tree
    'https://i.pinimg.com/736x/97/32/e6/9732e6d233ae6561e97f87fd7ed47271.jpg', //3 Wake Forest wilsom selom art
    'https://i.pinimg.com/736x/47/c2/f1/47c2f1c528654d76214860f6d2afc2ac.jpg', // 4 Fire works 4th of July
    'https://i.pinimg.com/736x/c1/ca/c4/c1cac4cddb0523efc6e88efa30142688.jpg', //5 New York Rain Horizontal
    'https://i.pinimg.com/736x/47/80/ba/4780bafefa14c368f7b14bcc29d1f95c.jpg', // 6 Nigra Fall Rainbow
    'https://i.pinimg.com/736x/37/c0/48/37c048374a1a821113a64e026c47bf83.jpg', //7lotus
    'https://i.pinimg.com/736x/ff/cf/ee/ffcfee499f19a898b02c2edfa0d50e29.jpg', //8 Charminar Hyderbad
    'https://i.pinimg.com/736x/7f/85/02/7f8502daa513beb6f00c278823d5d309.jpg', //9 New York VErtical
    'https://i.pinimg.com/736x/1a/66/14/1a6614465d013fd7faadfb64562aa68e.jpg', //10 moon
    'https://i.pinimg.com/736x/12/69/61/126961d201f398910990b6ff90bfe04c.jpg', //11House Water
    'https://i.pinimg.com/736x/4a/6b/03/4a6b03442ebf89bbedbcfa1dd93565c2.jpg',// 29 Mountack
    'https://i.pinimg.com/736x/a6/83/d2/a683d26c47e3210adb0feb495da8670d.jpg', //30 GCT
    'https://i.pinimg.com/736x/3c/48/9b/3c489b06a81e11d13da06766405ea2e6.jpg', //32 {lane sunset}
    'https://i.pinimg.com/736x/07/94/f7/0794f76a9e6e89fd7a3445d9edc8974d.jpg', //31 Chicago
    'https://i.pinimg.com/736x/97/a8/82/97a882a77adbf8075e4d3befb4e9c289.jpg', //12 Shipyard
    'https://i.pinimg.com/736x/e8/67/1b/e8671b3a446bea5ca754dce360874c23.jpg', //13 New DElhih
    'https://i.pinimg.com/736x/0c/e6/53/0ce653ad09f10aa1d972ecf9d7b0ef3e.jpg', //14 WAterFAll
    'https://i.pinimg.com/736x/17/bb/7d/17bb7d82b05504e1577335952f19ca0a.jpg', //15  Jai Shree Mahakal
    'https://i.pinimg.com/736x/8b/3b/bc/8b3bbce8bcc7cd7b35fc4847aeb1477f.jpg', //16 New York Skyline
    'https://i.pinimg.com/736x/cb/ac/59/cbac59e9e06fa03f2db5600755832448.jpg', //17 Street Light with Sun
    'https://i.pinimg.com/736x/ed/0c/7e/ed0c7ef5a1b11af6fa307818a109b628.jpg', //18 Chicago Night Light
    'https://i.pinimg.com/736x/42/35/69/423569cdf592eec39b4cf5abf39680ee.jpg', //19 Vilone 
    'https://i.pinimg.com/736x/6d/0c/f0/6d0cf0dbb6a7479aa201bf781592c289.jpg', //20 Dumbo
    'https://i.pinimg.com/736x/03/fe/d0/03fed02a43dfdf13981e24f2485cb879.jpg', //21 New York From Sky
    'https://i.pinimg.com/736x/84/f9/cb/84f9cb28cbea4a133aa6d0030f0ac4d7.jpg', //22 Light House
    'https://i.pinimg.com/736x/24/db/7e/24db7e52d88a305235bdbd6178bf69a1.jpg', //23 Rocks
    'https://i.pinimg.com/736x/1a/a6/2b/1aa62bcb3a70e896abbff635a74050e6.jpg', //24 Chicago
    'https://i.pinimg.com/736x/f7/c0/ce/f7c0cef5c09f71605a8ccee99114e95c.jpg', //25 New York Yello Taxi
    'https://i.pinimg.com/736x/7b/30/ee/7b30ee92245350786bf70b88802c1a0a.jpg',// 26 MAn with Diya
    'https://i.pinimg.com/736x/be/24/58/be2458a58771772b60fa757d52214b70.jpg', // 27 Chicago In Day light skyline
    'https://i.pinimg.com/736x/e2/f0/e6/e2f0e616411462c8c7c431a1d72f47fc.jpg', // 28 Portyard 

  ];

  return (
    <div className="art-page" translate="no">
      <Helmet>
        <html lang="en" translate="no" />
        <title>Atishay Kasliwal</title>
        <link rel="canonical" href="https://atishaykasliwal.com/art" />
        <meta name="google" content="notranslate" />
        <meta name="google-translate-customization" content="no" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Art | Atishay Kasliwal" />
        <meta property="og:description" content="Photo stories and visual moments by Atishay Kasliwal." />
        <meta property="og:url" content="https://atishaykasliwal.com/art" />
        <meta property="og:image" content="https://atishaykasliwal.com/atishaylogo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" type="image/png" href="/favicon.png" />
      </Helmet>
      <div className="art-header" translate="no">
        <Link to="/" className="logo libertinus-mono" style={{ textDecoration: 'none', color: 'inherit' }} onClick={() => setIsMobileMenuOpen(false)} translate="no">
          Atishay Kasliwal
        </Link>
        <button 
          className="mobile-menu-toggle black" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
          translate="no"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
        <nav className={`nav black ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)} translate="no">
          <Link to="/highlights" translate="no">HIGHLIGHTS</Link>
          <a href="/Atishay_Kasliwal.pdf" target="_blank" rel="noopener noreferrer" translate="no">RESUME</a>
          <a href="https://www.linkedin.com/in/atishay-kasliwal/" target="_blank" rel="noopener noreferrer" translate="no">LINKEDIN</a>
          <Link to="/art" translate="no">ART</Link>
        </nav>
      </div>
      <h2 className="art-title" translate="no">Welcome! Discover moments through my lens, where each photo tells a story.</h2>
      <div className="art-grid-fixed" style={{ minHeight: '90vh' }} translate="no">
        {images.map((src, idx) => (
          <div className="art-tile-fixed" key={idx} translate="no">
            <img src={src} alt={`artwork-${idx}`} translate="no" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Skills Section Component
function SkillsSection() {
  const skillsData = {
    featured: [
      { name: 'Astro', icon: 'A' },
      { name: 'CSS', icon: '3' },
      { name: 'HTML', icon: '5' },
      { name: 'JavaScript', icon: 'JS' },
      { name: 'Nuxt', icon: '▲' },
      { name: 'PHP', icon: 'php' },
      { name: 'Svelte', icon: 'S' },
      { name: 'Tailwind CSS', icon: 'T' },
      { name: 'Vue', icon: 'V' }
    ],
    languages: [
      { name: 'CSS', icon: '3' },
      { name: 'HTML', icon: '5' },
      { name: 'JavaScript', icon: 'JS' },
      { name: 'PHP', icon: 'php' },
      { name: 'TypeScript', icon: 'TS' },
      { name: 'Python', icon: 'Py' },
      { name: 'Java', icon: 'J' },
      { name: 'SQL', icon: 'SQL' },
      { name: 'Go', icon: 'Go' }
    ],
    frontend: [
      { name: 'Astro', icon: 'A' },
      { name: 'Google Maps', icon: 'M' },
      { name: 'Nuxt', icon: '▲' },
      { name: 'React', icon: 'R' },
      { name: 'SASS', icon: 'S' },
      { name: 'Svelte', icon: 'S' },
      { name: 'SvelteKit', icon: 'SK' },
      { name: 'Tailwind CSS', icon: 'T' },
      { name: 'Vue', icon: 'V' }
    ],
    backend: [
      { name: 'Appwrite', icon: 'C' },
      { name: 'Express', icon: 'ex' },
      { name: 'Fastify', icon: 'F' },
      { name: 'Lucia', icon: 'L' },
      { name: 'Node.js', icon: 'N' },
      { name: 'Prisma', icon: '▲' },
      { name: 'MongoDB', icon: 'M' },
      { name: 'PostgreSQL', icon: 'Pg' }
    ]
  };

  return (
    <div className="story-timeline skills-section" style={{
      background: 'transparent',
      borderRadius: '16px'
    }} translate="no">
      <div style={{ 
        marginBottom: '0.7rem' 
      }} translate="no">
        <h2 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          marginBottom: '0.7rem',
          color: '#fff',
          textAlign: 'left'
        }} translate="no">Skills</h2>
      </div>
      
      <div className="skills-grid">
        {Object.entries(skillsData).map(([category, skills]) => (
          <div key={category} className="skills-category">
            <h3 translate="no">{category}</h3>
            <div className="skills-list">
              {skills.map((skill, idx) => (
                <div
                  key={idx}
                  className="skill-badge"
                  translate="no"
                >
                  <span>{skill.icon}</span>
                  <span>{skill.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Image Carousel Component
function ImageCarousel() {
  const [currentSet, setCurrentSet] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Using the same images from your art page for the carousel
  const carouselImages = [
    
    'https://i.pinimg.com/736x/fb/5e/63/fb5e63355a29e9b5729f2f2025a68119.jpg', // New York Rain Horizontal
    'https://i.pinimg.com/736x/1e/39/b9/1e39b962cf5f029bd99c3d7cdb227b10.jpg', // Niagara Fall Rainbow
    'https://i.pinimg.com/736x/d7/2c/4b/d72c4b63e3d6ad60a0265602decb658a.jpg', // lotus
    'https://i.pinimg.com/736x/1e/56/82/1e568265dad4a61cc7f035db615adb8c.jpg', // Charminar Hyderabad
    'https://i.pinimg.com/736x/96/95/34/9695344516d9f174350156e02015a02e.jpg', //25 New York Yello Taxi
    'https://i.pinimg.com/736x/7f/29/f6/7f29f634b5372c29ff87530b469663d8.jpg',// 26 MAn with Diya
    'https://i.pinimg.com/736x/28/6e/33/286e337b9da229cb1ab89b39a169fdb5.jpg', // 27 Chicago In Day light skyline
    'https://i.pinimg.com/736x/13/6f/cd/136fcde68735970c6d9d2243764556c4.jpg', // 28 Portyard 

    'https://i.pinimg.com/736x/b1/62/ce/b162ce51da3005c3e6f70dfe5fd3a88a.jpg', // Wake forest University
    'https://i.pinimg.com/736x/a6/8e/20/a68e209bc74c38891d4310997f59f6e2.jpg', // Wake Forest Wall Painting 
    'https://i.pinimg.com/736x/c7/7e/a5/c77ea537089d45b70afe9be7216ba432.jpg', // Wake forest University cloud out of the blue
    'https://i.pinimg.com/736x/97/32/e6/9732e6d233ae6561e97f87fd7ed47271.jpg', // Wake Forest Wilson Selom art
    'https://i.pinimg.com/736x/83/5d/a0/835da0d88511880ba1b7a114adcc07f1.jpg', // Wake forest rainbow
    'https://i.pinimg.com/736x/1d/92/68/1d926844a290cabf830e75fe1a0723d5.jpg', // Wake forest University Chumnny
    'https://i.pinimg.com/736x/c7/de/6a/c7de6a1b54676e8a9070fbaa9601fc9e.jpg', // Blue Cloud Wake forest University
    'https://i.pinimg.com/736x/47/c2/f1/47c2f1c528654d76214860f6d2afc2ac.jpg', // Fire works 4th of July




    'https://i.pinimg.com/736x/5a/17/a9/5a17a9694a69b5d675a7a99f491434ef.jpg',
    'https://i.pinimg.com/736x/ec/38/8b/ec388ba9f19539061ea051b50cd57c34.jpg',
    'https://i.pinimg.com/736x/2a/8e/e2/2a8ee2543d17c796c0050884ab30489f.jpg',
    'https://i.pinimg.com/736x/98/64/3d/98643dc406f955e9fef0b14f05352472.jpg',
    'https://i.pinimg.com/736x/6a/fb/19/6afb198eb9629d336993998181286468.jpg',
    'https://i.pinimg.com/736x/1f/9e/2a/1f9e2a5c420c15b931a11d52720f5f53.jpg',
    'https://i.pinimg.com/736x/12/8e/c7/128ec74a59fe5e278e6a8813639140bf.jpg',
    'https://i.pinimg.com/736x/f3/dc/5b/f3dc5be1c19424a96f255bbd4a55d86e.jpg',




   'https://i.pinimg.com/736x/fc/bc/4f/fcbc4ff8af26e6b958b526b8432e6317.jpg',
   'https://i.pinimg.com/736x/22/a8/67/22a867fdb6650b56f4f1cac8b610e543.jpg',
   'https://i.pinimg.com/736x/05/91/dc/0591dc0a54e52b00240c3640247611c6.jpg',
   'https://i.pinimg.com/736x/5e/28/39/5e2839adcfb7ced01c911b9ff7b5a809.jpg',
   'https://i.pinimg.com/736x/51/da/58/51da58d005c1102de3335bcf6eb13c91.jpg',
   'https://i.pinimg.com/736x/cb/d1/18/cbd11861876cd2bcdc85f60f65b18ec3.jpg',
   'https://i.pinimg.com/736x/1d/16/c9/1d16c98bfbc89ffd5d884c77f86350eb.jpg',
   'https://i.pinimg.com/736x/54/ae/d3/54aed3fb62679a7a844bfe44d08d546d.jpg',




  ];

  // Responsive grid configuration
  const getImagesPerSet = useCallback(() => {
    if (windowWidth <= 768) {
      return 4; // 2x2 for mobile
    } else if (windowWidth <= 1024) {
      return 6; // 3x3 for small screens
    } else {
      return 8; // 4x4 for full resolution
    }
  }, [windowWidth]);

  const imagesPerSet = getImagesPerSet();
  const totalSets = Math.ceil(carouselImages.length / imagesPerSet);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Recalculate imagesPerSet when window width changes
  useEffect(() => {
    const newImagesPerSet = getImagesPerSet();
    if (newImagesPerSet !== imagesPerSet) {
      // Reset to first set when changing grid size to avoid empty sets
      setCurrentSet(0);
    }
  }, [windowWidth, getImagesPerSet, imagesPerSet]);

  // Auto-advance carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSet((prev) => (prev + 1) % totalSets);
    }, 5000); // 5 seconds = 5000 milliseconds

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [totalSets]);

  // Text descriptions for each set of photos
  const setDescriptions = [
    "Fall is a season of reflection in my photography. Through golden trees, crisp air, and soft light, I capture how change feels gentle yet powerful in its silence.",
   
    "A glimpse of my summer in Wake Forest through my lens — moments of skies, art, and experiences that shaped my internship journey.",

    "My spring in New York was a tapestry of iconic skylines, city lights, sunsets, and unforgettable city adventures—each moment seen through my own lens.",

    "A breathtaking escape to Niagara Falls — a reminder of nature's power and beauty during my summer journey.",
  ];

  // Headings for each set of photos
  const setHeadings = [
    "Stony Brook University - Fall 2025", 
    "Wake Forest University - Atrium Health -  Summer 2025",
    "New York - Spring 2025",
    "Niagara Falls - Fall 2024",

  ];

  const nextSet = () => {
    setCurrentSet((prev) => (prev + 1) % totalSets);
  };

  const prevSet = () => {
    setCurrentSet((prev) => (prev - 1 + totalSets) % totalSets);
  };

  const getCurrentImages = () => {
    const startIndex = currentSet * imagesPerSet;
    return carouselImages.slice(startIndex, startIndex + imagesPerSet);
  };

  const getCurrentDescription = () => {
    return setDescriptions[currentSet] || setDescriptions[setDescriptions.length - 1];
  };

  const getCurrentHeading = () => {
    return setHeadings[currentSet] || setHeadings[setHeadings.length - 1];
  };

  return (
    <div className="story-timeline" style={{ 
      background: 'transparent',
      borderRadius: '16px'
    }} translate="no">
      <div style={{ 
        marginBottom: '0.7rem' 
      }} translate="no">
        <h2 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          marginBottom: '0.7rem',
          color: '#fff',
          textAlign: 'left'
        }} translate="no">Perspective</h2>
      </div>
      
      {/* Images Container */}
      <div style={{ 
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '0.7rem'
      }}>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : windowWidth <= 1024 ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)',
          gap: windowWidth <= 768 ? '0.7rem' : '1.3rem',
          justifyContent: 'center',
          maxWidth: windowWidth <= 768 ? '90vw' : '92vw',
          width: '100%',
          padding: windowWidth <= 768 ? '0 1rem' : '0'
        }}>
          {getCurrentImages().map((src, idx) => (
            <div 
              key={idx} 
              style={{
                aspectRatio: '1',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
              }}
            >
              <img 
                src={src} 
                alt={`Journey ${currentSet * imagesPerSet + idx + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.3s ease'
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Description Text */}
      <div style={{ 
        marginTop: '0.7rem',
        width: '95%',
        margin: '0.7rem auto 0 auto'
      }}>
        <h2 style={{
          color: '#fff',
          fontSize: windowWidth <= 480 ? '1rem' : windowWidth <= 768 ? '1.2rem' : '1.5rem',
          textAlign: 'center',
          marginBottom: windowWidth <= 480 ? '0.4rem' : '0.5rem',
          fontWeight: '600',
          opacity: '0.9',
          padding: windowWidth <= 480 ? '0 1rem' : '0'
        }}>
          {getCurrentHeading()}
        </h2>
        <p style={{
          color: '#fff',
          fontSize: windowWidth <= 480 ? '0.8rem' : windowWidth <= 768 ? '0.95rem' : '1.1rem',
          lineHeight: '1.6',
          width: windowWidth <= 480 ? '100%' : '95%',
          margin: '0 auto',
          opacity: '0.9',
          textAlign: 'center',
          padding: windowWidth <= 480 ? '0 1rem' : '0'
        }}>
          {getCurrentDescription()}
        </p>
      </div>

      {/* Navigation Buttons */}
      <div style={{ 
        display: 'flex',
        justifyContent: 'center',
        gap: windowWidth <= 768 ? '1rem' : '2rem',
        marginTop: '0.3rem'
      }}>
        <button
          onClick={prevSet}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fff',
            width: windowWidth <= 768 ? '180px' : '200px',
            height: windowWidth <= 768 ? '30px' : '36px',
            fontSize: windowWidth <= 768 ? '1.92rem' : '2.4rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            fontWeight: '200',
            opacity: '0.7'
          }}
          onMouseEnter={(e) => {
            e.target.style.opacity = '1';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.opacity = '0.7';
            e.target.style.transform = 'scale(1)';
          }}
        >
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
        <button
          onClick={nextSet}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fff',
            width: windowWidth <= 768 ? '180px' : '200px',
            height: windowWidth <= 768 ? '30px' : '36px',
            fontSize: windowWidth <= 768 ? '1.92rem' : '2.4rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            fontWeight: '200',
            opacity: '0.7'
          }}
          onMouseEnter={(e) => {
            e.target.style.opacity = '1';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.opacity = '0.7';
            e.target.style.transform = 'scale(1)';
          }}
        >
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

function Footer() {
  return (
    <footer className="site-footer" translate="no">
      <div className="footer-content" translate="no">
        <span translate="no">© {new Date().getFullYear()} <strong>Atishay Kasliwal</strong> — Full-Stack Engineer & Data Scientist</span>
        <span className="footer-socials" translate="no">
          <a href="https://www.linkedin.com/in/atishay-kasliwal/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" translate="no">
            <svg width="24" height="24" fill="#fff" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm15.5 11.268h-3v-5.604c0-1.337-.025-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.967v5.7h-3v-10h2.881v1.367h.041c.401-.761 1.379-1.563 2.838-1.563 3.034 0 3.595 1.997 3.595 4.59v5.606z"/></svg>
          </a>
          <a href="https://github.com/atishay-kasliwal" target="_blank" rel="noopener noreferrer" aria-label="GitHub" translate="no">
            <svg width="24" height="24" fill="#fff" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.084-.729.084-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.334-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.553 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.803 5.624-5.475 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576 4.765-1.588 8.199-6.084 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          </a>
          <a
            href="https://mail.google.com/mail/?view=cm&to=katishay@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Email"
            translate="no"
          >
            <svg width="24" height="24" fill="#fff" viewBox="0 0 24 24"><path d="M12 13.065l-11.985-7.065v14c0 1.104.896 2 2 2h19.97c1.104 0 2-.896 2-2v-14l-11.985 7.065zm11.985-9.065c0-1.104-.896-2-2-2h-19.97c-1.104 0-2 .896-2 2v.217l12 7.083 11.97-7.083v-.217z"/></svg>
          </a>
        </span>
      </div>
    </footer>
  );
}

function App() {
  // Handle scroll position on route changes
  useEffect(() => {
    // Disable automatic scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    
    // Scroll to top on route changes (except when going back)
    const handleRouteChange = () => {
      // Small delay to ensure route has changed
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        if (document.documentElement) {
          document.documentElement.scrollTop = 0;
        }
        if (document.body) {
          document.body.scrollTop = 0;
        }
      }, 0);
    };
    
    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/art" element={<ArtPage />} />
        <Route path="/highlights" element={<Projects />} />
        <Route path="/Highlights/:uuid" element={<HighlightDetail />} />
      </Routes>
      <Footer />
    </Router>
  );
}

// Component to scroll to top on route changes
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top immediately when route changes - do this synchronously first
    // Multiple methods to ensure it works across all browsers
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
      // Force scroll on html element
      const html = document.documentElement;
      if (html.scrollTop !== 0) html.scrollTop = 0;
      if (html.scrollLeft !== 0) html.scrollLeft = 0;
    };
    
    // Scroll immediately multiple times
    scrollToTop();
    scrollToTop();
    scrollToTop();
    
    // Also prevent any focus-related scrolling
    const preventFocusScroll = (e) => {
      // Prevent scroll-into-view on focus during initial page load
      if (e.target && typeof e.target.scrollIntoView === 'function') {
        // Temporarily disable scrollIntoView
        const originalScrollIntoView = e.target.scrollIntoView;
        e.target.scrollIntoView = function() {
          // Don't allow scroll-into-view during initial load
          return;
        };
        // Restore after a delay
        setTimeout(() => {
          e.target.scrollIntoView = originalScrollIntoView;
        }, 2000);
      }
    };
    
    // Prevent focus scroll during initial load
    document.addEventListener('focusin', preventFocusScroll, { capture: true, once: false });
    
    // Scroll multiple times aggressively to catch any late-rendering content
    const timeouts = [0, 1, 2, 5, 10, 25, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000].map(delay => 
      setTimeout(scrollToTop, delay)
    );
    
    // Also prevent scroll events that would move away from top during first 2 seconds
    let scrollPreventionActive = true;
    const preventScroll = (e) => {
      if (scrollPreventionActive) {
        const currentScroll = window.scrollY || window.pageYOffset || 0;
        if (currentScroll > 10) {
          e.preventDefault();
          e.stopImmediatePropagation();
          scrollToTop();
          return false;
        }
      }
    };
    
    window.addEventListener('scroll', preventScroll, { passive: false, capture: true });
    
    // Monitor scroll position and force back to top
    const scrollMonitor = setInterval(() => {
      if (scrollPreventionActive) {
        const currentScroll = window.scrollY || window.pageYOffset || 0;
        if (currentScroll > 10) {
          scrollToTop();
        }
      }
    }, 25);
    
    // Disable scroll prevention after 2.5 seconds
    setTimeout(() => {
      scrollPreventionActive = false;
      window.removeEventListener('scroll', preventScroll, { capture: true });
      document.removeEventListener('focusin', preventFocusScroll, { capture: true });
      clearInterval(scrollMonitor);
    }, 2500);
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
      window.removeEventListener('scroll', preventScroll, { capture: true });
      document.removeEventListener('focusin', preventFocusScroll, { capture: true });
      clearInterval(scrollMonitor);
    };
  }, [pathname]);

  return null;
}

export default App;
