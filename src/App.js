import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import './App.css';

import img1 from './assets/stony_brook_university_college_of_business_logo (1).jpeg';
import img8 from './assets/broadcast_co_logo.jpeg';
import img3 from './assets/symbiosis.jpg';
import img4 from './assets/shriffle.png';
import img5 from './assets/atrium_health_wake_forest_baptist_logo.jpeg';
import img6 from './assets/stony_brook_university_logo.jpeg';
import img7 from './assets/Bounteous_idOCx6cSKH_0.jpeg';
import img2 from './assets/Accolite Digital_iduk-Sna9f_3.png';
import img9 from './assets/Screenshot 2025-07-10 at 7.52.42 AM.png';
import StoryTimeline from './StoryTimeline';

const experienceEducation = [
  '• AI, ML research, data analytics @Atrium Health Wake Forest (2025)',
  '• Business research, data modeling assistant @Stony Brook (2024–2025)',
  '• Full-stack software engineering, team projects @Accolite (2021–2024)',
  '• Backend systems development and software @Shriffle (2020–2021)',
  '• AI project development and research @Verzeo Learning (2020)',
  '• Data analysis, crime pattern research @Crime Branch Indore (2020)',
  '• Web app design and frontend development @N-TIER Pvt Ltd (2019–2020)',
  '',
  '• MS in Data Science from Stony Brook University (Machine Learning)',
  '• BTech. from Symbiosis University of Applied Sciences (CSIT)'
];


function HomePage() {
  const landingImages = [img1, img2,  img3, img4, img6, img5, img8, img7, img9];
  // Show all images
  const gridImages = landingImages;

  // Testimonials
  const testimonials = [
    {
      
      text: "Atishay delivered our project ahead of schedule and exceeded expectations. He managed multiple priorities with ease and communicated clearly throughout. His leadership and technical skills made him an invaluable asset to our team.",
      name: "Ankit Jain",
      company: "Accolite Digital",
      post: "Technical Director",
      photo: "https://media.licdn.com/dms/image/v2/D5603AQFeoPNYwJWZSg/profile-displayphoto-shrink_400_400/B56Zd5wUFiHQAg-/0/1750094398497?e=1757548800&v=beta&t=MOsxtBZiVPbtotK2LLa_rafOz8fMGXE0GWyswi85apw"
    },
    {
      text: "Atishay developed an NLP pipeline to analyze central bank communications and used GPT-4 to evaluate sentiment and market impact. He designed an LLM-based trading simulation with audit-ready logs and clear visualizations.",
      name: "Wencui Han",
      company: "Stony Brook University",
      post: "Associate Professor",
      photo: "https://media.licdn.com/dms/image/v2/C4D03AQHoAL7zZmmKFQ/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1517393435717?e=1757548800&v=beta&t=j2HkMJKKNLbJAxxn7vB80vd6uFHV6F5eEFwNfh3pKQs"
    },
    {
      text: "Creative, reliable, and always ready to help. Atishay brought fresh ideas to our Computer Science projects and delivered actionable insights. He was a supportive student and fostered a collaborative work environment.",
      name: "Neha Gupta",
      company: "Symbiosis University",
      post: "Director SCSIT",
      photo: "https://media.licdn.com/dms/image/v2/C4E03AQGwZZBxpatX1g/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1616052715138?e=1757548800&v=beta&t=Ycq6iM4VsmRkOYS4RM14Spdq13ggnuwXWNREqIKyfCU"
    }
  ];
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  // Remove fade state
  const testimonialsPerRow = 3;
  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIdx(idx => (idx + testimonialsPerRow) % testimonials.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [testimonials.length]);
  const getCurrentTestimonials = () => {
    let result = [];
    for (let i = 0; i < testimonialsPerRow; i++) {
      result.push(testimonials[(testimonialIdx + i) % testimonials.length]);
    }
    return result;
  };

  return (
    <>
      <Helmet>
        <title>Atishay Kasliwal | Portfolio, Resume, Projects</title>
        <meta name="description" content="Official website of Atishay Kasliwal. Portfolio, resume, projects, and contact information." />
        <meta name="keywords" content="Atishay Kasliwal, portfolio, resume, data science, software engineer" />
        <meta name="author" content="Atishay Kasliwal" />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "Person",
              "name": "Atishay Kasliwal",
              "url": "https://atishay-kasliwal.github.io/",
              "sameAs": [
                "https://www.linkedin.com/in/atishay-kasliwal/",
                "https://github.com/atishay-kasliwal"
              ]
            }
          `}
        </script>
      </Helmet>
      {/* Artistic Background */}
      <div className="bg-art" />
      <div className="page-content">
        {/* Header */}
        <div className="header">
          <Link to="/" className="logo libertinus-mono" style={{ textDecoration: 'none', color: 'inherit' }}>
            Atishay Kasliwal
          </Link>
          <nav className="nav">
             <a href="/Atishay_Kasliwal.pdf" target="_blank" rel="noopener noreferrer">RESUME</a>
             <a href="https://www.linkedin.com/in/atishay-kasliwal/" target="_blank" rel="noopener noreferrer">LINKEDIN</a>
             <Link to="/art">ART</Link>
          </nav>
        </div>
        {/* Two-column Main Content */}
        <div className="landing-two-col">
          <div className="landing-left-text">
            <h1 style={{ minHeight: '3rem', textAlign: 'left', color: '#fff' }}>
              Hello, I am Atishay Kasliwal, a Software Engineer with over 5 years of professional experience, currently pursuing a Master's in Data Science from Stony Brook University.
            </h1>
            <div className="button-group-theme">
              <a href="/Atishay_Kasliwal.pdf" className="btn-theme btn-outline btn-lg" target="_blank" rel="noopener noreferrer">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.7em' }}>
                  <svg width="26" height="26" fill="none" viewBox="0 0 20 20"><path d="M10 2v12m0 0l-4-4m4 4l4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="16" width="14" height="2" rx="1" fill="#fff"/></svg>
                  CV
                </span>
              </a>
              <a
                href="https://mail.google.com/mail/?view=cm&to=katishay@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-theme btn-outline btn-lg"
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.7em' }}>
                  <svg width="26" height="26" fill="none" viewBox="0 0 20 20"><rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M2 4l8 7 8-7" stroke="currentColor" strokeWidth="2"/></svg>
                  Contact
                </span>
              </a>
              <a href="https://www.linkedin.com/in/atishay-kasliwal/" target="_blank" rel="noopener noreferrer" className="btn-theme btn-icon btn-lg" aria-label="LinkedIn">
                <svg width="26" height="26" fill="none" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm15.5 11.268h-3v-5.604c0-1.337-.025-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.967v5.7h-3v-10h2.881v1.367h.041c.401-.761 1.379-1.563 2.838-1.563 3.034 0 3.595 1.997 3.595 4.59v5.606z" fill="currentColor"/></svg>
              </a>
              <a href="https://github.com/atishay-kasliwal" target="_blank" rel="noopener noreferrer" className="btn-theme btn-icon btn-lg" aria-label="GitHub">
                <svg width="26" height="26" fill="none" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.084-.729.084-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.334-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.553 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.803 5.624-5.475 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576 4.765-1.588 8.199-6.084 8.199-11.386 0-6.627-5.373-12-12-12z" fill="currentColor"/></svg>
              </a>
            </div>
            <div className="exp-edu-list" style={{ textAlign: 'left', marginTop: '2rem', width: '100%' }}>
              {experienceEducation.map((line, idx) => {
                // Bold company/college names after '@' or 'from'
                let renderedLine = line;
                if (line.includes('@')) {
                  renderedLine = line.replace(/@(.+?)\s*([([])/, (match, p1, p2) => `@<b>${p1.trim()}</b> ${p2}`);
                } else if (line.includes('from')) {
                  renderedLine = line.replace(/from (.+?)\s*([([])/, (match, p1, p2) => `from <b>${p1.trim()}</b> ${p2}`);
                }
                // Render as HTML for bold tags
                if (idx === 7) {
                  return <div key={idx} style={{ minHeight: '1.5rem' }}>&nbsp;</div>;
                } else {
                  return <div key={idx} style={{ minHeight: '1.5rem' }} dangerouslySetInnerHTML={{ __html: renderedLine }} />;
                }
              })}
            </div>
          </div>
          <div className="landing-right-images">
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <div className="landing-grid-3x3">
                {gridImages.map((src, idx) => (
                  <img key={idx} src={src} alt={`Landing ${idx + 1}`} width="200" height="200" />
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Testimonial Rotator Full Width */}
        <div style={{ width: '100%', display: 'block', marginTop: '2.5rem' }}>
          <div className="testimonial-rotator-row" style={{ display: 'flex', gap: '2rem', justifyContent: 'center', width: '100%', maxWidth: 1504, margin: '0 auto' }}>
            {getCurrentTestimonials().map((t, idx) => (
              <div
                key={idx}
                className="testimonial-rotator"
                style={{ color: '#fff', fontSize: '0.96rem', fontStyle: 'normal', textAlign: 'left', maxWidth: 420, width: '100%', opacity: 0.92, letterSpacing: '0.01em', background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minHeight: 180 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                  <img src={t.photo} alt={t.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', marginRight: 16, border: '2px solid #fff', background: '#222' }} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '1.05em', fontStyle: 'normal' }}>{t.name}</div>
                    <div style={{ color: '#bbb', fontSize: '0.92em', fontStyle: 'normal' }}>{t.company} — {t.post}</div>
                  </div>
                </div>
                <div style={{ fontStyle: 'normal', color: '#fff', fontWeight: 400 }}>{t.text}</div>
              </div>
            ))}
          </div>
        </div>
        <StoryTimeline />
        <ImageCarousel />
      </div>
    </>
  );
}

function ArtPage() {
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
    <div className="art-page">
      <Helmet>
        <title>Atishay Kasliwal</title>
        <link rel="icon" type="image/png" href="/favicon.png" />
      </Helmet>
      <div className="art-header">
        <Link to="/" className="logo libertinus-mono" style={{ textDecoration: 'none', color: 'inherit' }}>
          Atishay Kasliwal
        </Link>
        <nav className="nav">
          <a href="/Atishay_Kasliwal.pdf" target="_blank" rel="noopener noreferrer">RESUME</a>
          <a href="https://www.linkedin.com/in/atishay-kasliwal/" target="_blank" rel="noopener noreferrer">LINKEDIN</a>
          <Link to="/art">ART</Link>
        </nav>
      </div>
      <h2 className="art-title">Welcome! Discover moments through my lens, where each photo tells a story.</h2>
      <div className="art-grid-fixed" style={{ minHeight: '90vh' }}>
        {images.map((src, idx) => (
          <div className="art-tile-fixed" key={idx}>
            <img src={src} alt={`artwork-${idx}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Image Carousel Component
function ImageCarousel() {
  const [currentSet, setCurrentSet] = useState(0);
  
  // Using the same images from your art page for the carousel
  const carouselImages = [
    'https://i.pinimg.com/736x/47/c2/f1/47c2f1c528654d76214860f6d2afc2ac.jpg', // Fire works 4th of July
    'https://i.pinimg.com/736x/b1/62/ce/b162ce51da3005c3e6f70dfe5fd3a88a.jpg', // Wake forest University
    'https://i.pinimg.com/736x/c7/de/6a/c7de6a1b54676e8a9070fbaa9601fc9e.jpg', // Blue Cloud Wake forest University
    'https://i.pinimg.com/736x/c7/7e/a5/c77ea537089d45b70afe9be7216ba432.jpg', // Wake forest University cloud out of the blue
    'https://i.pinimg.com/736x/83/5d/a0/835da0d88511880ba1b7a114adcc07f1.jpg', // Wake forest rainbow
    'https://i.pinimg.com/736x/38/ac/84/38ac84f183371337ffe68dd083c950ae.jpg', // Night Festival 
    'https://i.pinimg.com/736x/82/ec/b7/82ecb7744895473c92c42241c9afe5f8.jpg', // Sun with tree
    'https://i.pinimg.com/736x/97/32/e6/9732e6d233ae6561e97f87fd7ed47271.jpg', // Wake Forest Wilson Selom art
    'https://i.pinimg.com/736x/c1/ca/c4/c1cac4cddb0523efc6e88efa30142688.jpg', // New York Rain Horizontal
    'https://i.pinimg.com/736x/47/80/ba/4780bafefa14c368f7b14bcc29d1f95c.jpg', // Niagara Fall Rainbow
    'https://i.pinimg.com/736x/37/c0/48/37c048374a1a821113a64e026c47bf83.jpg', // lotus
    'https://i.pinimg.com/736x/ff/cf/ee/ffcfee499f19a898b02c2edfa0d50e29.jpg', // Charminar Hyderabad
  ];

  const imagesPerSet = 10;
  const totalSets = Math.ceil(carouselImages.length / imagesPerSet);

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

  return (
    <div className="image-carousel-section" style={{ 
      marginTop: '3rem', 
      padding: '2rem 0',
      background: 'rgba(255,255,255,0.02)',
      borderRadius: '16px',
      margin: '3rem auto',
      maxWidth: '90vw',
      width: '90%'
    }}>
      <h3 style={{ 
        textAlign: 'center', 
        color: '#fff', 
        marginBottom: '2rem',
        fontSize: '1.5rem',
        fontWeight: '500'
      }}>
        My Journey Through Photography
      </h3>
      
      <div style={{ 
        position: 'relative', 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: '0 1rem'
      }}>
        {/* Previous Button */}
        <button
          onClick={prevSet}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff',
            fontSize: '1.2rem',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.2)';
            e.target.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.1)';
            e.target.style.transform = 'scale(1)';
          }}
        >
          ←
        </button>

        {/* Images Container */}
        <div style={{ 
          display: 'flex', 
          gap: '1.5rem', 
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: '85vw',
          width: '100%'
        }}>
          {getCurrentImages().map((src, idx) => (
            <div key={idx} style={{
              width: '220px',
              height: '220px',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
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

        {/* Next Button */}
        <button
          onClick={nextSet}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff',
            fontSize: '1.2rem',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.2)';
            e.target.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.1)';
            e.target.style.transform = 'scale(1)';
          }}
        >
          →
        </button>
      </div>

      {/* Dots Indicator */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '0.5rem', 
        marginTop: '1.5rem' 
      }}>
        {Array.from({ length: totalSets }, (_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSet(idx)}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              border: 'none',
              background: idx === currentSet ? '#fff' : 'rgba(255,255,255,0.3)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (idx !== currentSet) {
                e.target.style.background = 'rgba(255,255,255,0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (idx !== currentSet) {
                e.target.style.background = 'rgba(255,255,255,0.3)';
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <span>© {new Date().getFullYear()} Atishay Kasliwal</span>
        <span className="footer-socials">
          <a href="https://www.linkedin.com/in/atishay-kasliwal/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <svg width="24" height="24" fill="#fff" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm15.5 11.268h-3v-5.604c0-1.337-.025-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.967v5.7h-3v-10h2.881v1.367h.041c.401-.761 1.379-1.563 2.838-1.563 3.034 0 3.595 1.997 3.595 4.59v5.606z"/></svg>
          </a>
          <a href="https://github.com/atishay-kasliwal" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <svg width="24" height="24" fill="#fff" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.084-.729.084-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.334-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.553 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.803 5.624-5.475 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576 4.765-1.588 8.199-6.084 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          </a>
          <a
            href="https://mail.google.com/mail/?view=cm&to=katishay@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Email"
          >
            <svg width="24" height="24" fill="#fff" viewBox="0 0 24 24"><path d="M12 13.065l-11.985-7.065v14c0 1.104.896 2 2 2h19.97c1.104 0 2-.896 2-2v-14l-11.985 7.065zm11.985-9.065c0-1.104-.896-2-2-2h-19.97c-1.104 0-2 .896-2 2v.217l12 7.083 11.97-7.083v-.217z"/></svg>
          </a>
        </span>
      </div>
    </footer>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/art" element={<ArtPage />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
