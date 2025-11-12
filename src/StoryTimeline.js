import React, { useState, useEffect } from 'react';
import './StoryTimeline.css';

import img1 from './assets/Symbiosis-Indore-Auditorium-Front-View.jpg';

const stories = [
  {
    image: 'https://myfox8.com/wp-content/uploads/sites/17/2016/07/promo293230600.jpg?w=640',
    date: '2025',
    title: 'AI ML - Wake Forest',
    description: ''
  },
  {
    image: 'https://sbmatters.stonybrook.edu/wp-content/uploads/2023/08/Umbilic-Torus.jpeg',
    date: '2024–2025',
    title: 'Research Assistant - SBU',
    description: ''
  },
  {
    image: 'https://i.pinimg.com/736x/fb/aa/bc/fbaabc9d28cce6c9fd9b92cde394a0c7.jpg',
    date: '2025',
    title: 'Graduate Assistant - Mailroom',
    description: ''
  },
  {
    image: 'https://www.jkokolakis.com/wp-content/uploads/2017/09/600-Bed-Residence-Hall-9-752x500.jpg',
    date: '2024–2025',
    title: 'Residencial Safety Program - SBU',
    description: ''
  },
  {
    image: 'https://www.stonybrook.edu/commcms/studentaffairs/for/images/dvtn.jpg',
    date: '2024-2026',
    title: 'Data Science - Graduate',
    description: ''
  },
  {
    image: 'https://i.ytimg.com/vi/MiZf2qRBQ7k/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLCsno81_sYAASs6LZHeei9o5v18iw',
    date: '2023–2024',
    title: 'Senior Software Engineer - Accolite',
    description: ''
  },
  {
    image: 'https://i.pinimg.com/736x/08/2c/54/082c54bd155c8d7de77d51ffd8678156.jpg',
    date: '2021–2023',
    title: 'Software Engineer - Accolite',
    description: ''
  },
  {
    image: 'https://i.pinimg.com/1200x/61/35/08/613508200fbe2933660602aebdd5ba38.jpg',
    date: '2021',
    title: 'Software Intern - Accolite Digital',
    description: ''
  },
  {
    image: img1,
    date: '2018-2022',
    title: 'Computer Science - Undergrad',
    description: ''
  },
  {
    image: 'https://i.pinimg.com/736x/27/fb/a0/27fba0a76dbf4e71440f44cefc6836f2.jpg',
    date: '2021',
    title: 'Analytics and ML - COVID-19',
    description: ''
  },
  {
    image: 'https://i.pinimg.com/736x/e9/d6/77/e9d677636ca112c696833f051bcb9a15.jpg',
    date: '2021',
    title: 'Survey Research - COVID-19',
    description: ''
  },
  {
    image: 'https://i.pinimg.com/1200x/d1/87/a5/d187a51c688056fe9bb8d56e9da113a1.jpg',
    date: '2021',
    title: 'Cyber Security Analyst - CBIMP',
    description: ''
  },
  {
    image: 'https://i.pinimg.com/1200x/9f/3f/23/9f3f231ea5c491d8e13f6c3a3971a50a.jpg',
    date: '2020',
    title: 'Backend Developer - Broadcastt.co',
    description: ''
  },
  {
    image: 'https://i.pinimg.com/736x/15/bb/b9/15bbb97130b2971626b24f77d614a385.jpg',
    date: '2019-2020',
    title: 'Web Application Developer - N-TIER',
    description: ''
  }
];

export default function StoryTimeline() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const cardsPerView = 5;
  const maxIndex = Math.max(0, stories.length - cardsPerView);

  // Check if mobile on mount and resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const nextCard = () => {
    setCurrentIndex((prev) => {
      const next = prev + 1;
      // Loop back to the beginning when reaching the end
      return next > maxIndex ? 0 : next;
    });
  };

  const prevCard = () => {
    setCurrentIndex((prev) => {
      // Loop to the end when going back from the beginning
      return prev === 0 ? maxIndex : prev - 1;
    });
  };

  // Auto-scroll carousel every 5 seconds (only on desktop)
  useEffect(() => {
    if (isMobile) {
      // Disable auto-scroll on mobile - let users scroll manually
      return;
    }
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        // Loop back to the beginning when reaching the end
        return next > maxIndex ? 0 : next;
      });
    }, 5000); // 5 seconds = 5000 milliseconds

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [maxIndex, isMobile]); // Only re-run when maxIndex or isMobile changes

  return (
    <div className="story-timeline" translate="no">
      <h2 className="story-title" translate="no">Journey</h2>
      <div className="story-cards" translate="no">
        <div 
          className="story-cards-container"
          style={!isMobile ? {
            transform: `translateX(-${currentIndex * (340 + 40)}px)`,
            transition: 'transform 0.5s ease'
          } : {
            transform: 'none',
            transition: 'none'
          }}
          translate="no"
        >
          {stories.map((story, idx) => (
            <div className="story-card" key={idx} translate="no">
              <img src={story.image} alt={story.title} className="story-img" translate="no" />
              <div className="story-date" translate="no">{story.date}</div>
              <div className="story-card-title" translate="no">{story.title}</div>
              {story.description && <div className="story-desc" translate="no">{story.description}</div>}
            </div>
          ))}
        </div>
      </div>
      <div className="journey-description" translate="no">
        <div className="journey-button-container" translate="no">
          <button
            onClick={prevCard}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              width: '200px',
              height: '36px',
              fontSize: '2.4rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              fontWeight: '200',
              opacity: '0.7'
            }}
            translate="no"
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
            }} translate="no">
              <div style={{
                position: 'absolute',
                left: '0',
                top: '-6px',
                width: '0',
                height: '0',
                borderRight: '12px solid #fff',
                borderTop: '7px solid transparent',
                borderBottom: '7px solid transparent'
              }} translate="no"></div>
            </div>
          </button>
          <button
            onClick={nextCard}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              width: '200px',
              height: '36px',
              fontSize: '2.4rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              fontWeight: '200',
              opacity: '0.7'
            }}
            translate="no"
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
            }} translate="no">
              <div style={{
                position: 'absolute',
                right: '0',
                top: '-6px',
                width: '0',
                height: '0',
                borderLeft: '12px solid #fff',
                borderTop: '7px solid transparent',
                borderBottom: '7px solid transparent'
              }} translate="no"></div>
            </div>
          </button>
        </div>
        <p translate="no">From internships to graduate studies, every step has shaped my path in technology and research. This journey embodies continuous growth, learning, and the pursuit of excellence in all endeavors.</p>
      </div>
    </div>
  );
} 