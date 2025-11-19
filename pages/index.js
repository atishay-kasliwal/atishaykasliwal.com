// Next.js Homepage - Deployed via Cloudflare Pages
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import emailjs from '@emailjs/browser';
// Images moved to public folder - use direct paths
const img1 = '/FidelityLogo.png';
const img8 = '/atrium_health_wake_forest_baptist_logo.jpeg';
const img3 = '/T-Mobile_logo_202.png';
const img4 = '/bt-logo-redesign-sq-1.jpg';
const img5 = '/broadcast_co_logo.jpeg';
const img6 = '/stony_brook_university_logo.jpeg';
const img7 = '/Accolite Digital_iduk-Sna9f_3.png';
const img2 = '/Bounteous_idOCx6cSKH_0.jpeg';
const img9 = '/shriffle.png';
const ankitPhoto = '/Ankit Jain.jpeg';
const wencuiPhoto = '/Prof.jpeg';
const nehaPhoto = '/Neha gupta.jpeg';
const goldyPhoto = '/goldey.jpeg';
const daMaPhoto = '/da ma.jpeg';
const gunjanPhoto = '/gunjanjain.jpg';
import StoryTimeline from '../components/StoryTimeline';
import SkillsSection from '../components/SkillsSection';

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

export default function HomePage() {
  const landingImages = [img1, img2, img3, img4, img6, img5, img8, img7, img9];
  const gridImages = landingImages;
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    message: ''
  });
  const [formStatus, setFormStatus] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.message) {
      setFormStatus('Please fill in all required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormStatus('Please enter a valid email address.');
      return;
    }

    try {
      setFormStatus('Sending message...');
      
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'service_41gb29b';
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'template_lngej99';
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '482xxVfxQh18uEiHh';
      
      const templateParams = {
        from_name: `${formData.firstName} ${formData.lastName}`,
        from_email: formData.email,
        message: formData.message,
        to_email: 'katishay@gmail.com'
      };
      
      await emailjs.send(serviceId, templateId, templateParams, publicKey);
      
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        message: ''
      });
      
      setFormStatus('Thank you! Your message has been sent successfully.');
      
      setTimeout(() => {
        setFormStatus('');
      }, 5000);
      
    } catch (error) {
      console.error('EmailJS Error:', error);
      setFormStatus('Sorry, there was an error sending your message. Please try again or email me directly at katishay@gmail.com');
    }
  };

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
  
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    if (typeof window === 'undefined') return;
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
      <Head>
        <title>Atishay Kasliwal — Full-Stack Engineer & Data Scientist | Portfolio & Resume</title>
        <link rel="canonical" href="https://atishaykasliwal.com/" />
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
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
          })
        }} />
      </Head>
      
      {/* Note: Header and Footer are in _app.js */}
      
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
                  padding: windowWidth <= 768 ? '1rem' : '1.2rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.8rem'
                }}
                translate="no"
              >
                <p style={{ margin: 0, lineHeight: '1.5' }} translate="no">{t.text}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: 'auto' }} translate="no">
                  <img 
                    src={t.photo} 
                    alt={t.name} 
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      objectFit: 'cover' 
                    }} 
                    translate="no"
                  />
                  <div translate="no">
                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }} translate="no">{t.name}</div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.8 }} translate="no">{t.post}, {t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Skills Section */}
      <SkillsSection />
      
      {/* Story Timeline */}
      <StoryTimeline />
      
      {/* Contact Form Section */}
      <div className="contact-section" style={{ 
        width: '100%', 
        maxWidth: '1540px', 
        margin: '3rem auto 0',
        padding: '0 2rem'
      }} translate="no">
        <div style={{ 
          display: 'flex', 
          flexDirection: windowWidth <= 768 ? 'column' : 'row',
          gap: '3rem',
          alignItems: 'flex-start'
        }} translate="no">
          <div style={{ flex: windowWidth <= 768 ? '1' : '1', minWidth: 0 }} translate="no">
            <h2 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 'bold', 
              marginBottom: '1.5rem',
              color: '#fff'
            }} translate="no">Get in Touch</h2>
            <p style={{ 
              fontSize: '1.1rem', 
              lineHeight: '1.6', 
              color: '#fff',
              marginBottom: '2rem'
            }} translate="no">
              Have a project in mind or want to collaborate? Feel free to reach out. I'm always open to discussing new opportunities and ideas.
            </p>
          </div>
          <div style={{ flex: windowWidth <= 768 ? '1' : '1', minWidth: 0, width: '100%' }} translate="no">
            <form onSubmit={handleSubmit} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }} translate="no">
              <div style={{ display: 'flex', gap: '1rem', flexDirection: windowWidth <= 768 ? 'column' : 'row' }} translate="no">
                <div style={{ flex: 1 }} translate="no">
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '1rem',
                    color: '#fff'
                  }} translate="no">
                    First Name (required)
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
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
                <div style={{ flex: 1 }} translate="no">
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '1rem',
                    color: '#fff'
                  }} translate="no">
                    Last Name (required)
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
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
    </>
  );
}

