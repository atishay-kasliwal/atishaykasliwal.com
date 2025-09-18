import React, { useState } from 'react';
import './StoryTimeline.css';

import img1 from './assets/Symbiosis-Indore-Auditorium-Front-View.jpg';

const stories = [
  {
    image: 'https://picsum.photos/400/300?random=1',
    date: '2025',
    title: 'AI ML - Wake Forest',
    description: ''
  },
  {
    image: 'https://picsum.photos/400/300?random=2',
    date: '2024–2025',
    title: 'Research Assistant - SBU',
    description: ''
  },
  {
    image: 'https://picsum.photos/400/300?random=3',
    date: '2025',
    title: 'Graduate Assistant - Mailroom',
    description: ''
  },
  {
    image: 'https://picsum.photos/400/300?random=4',
    date: '2024–2025',
    title: 'Residencial Safety Program - SBU',
    description: ''
  },
  {
    image: 'https://picsum.photos/400/300?random=5',
    date: '2024-2026',
    title: 'Data Science - Graduate',
    description: ''
  },
  {
    image: 'https://picsum.photos/400/300?random=6',
    date: '2023–2024',
    title: 'Senior Software Engineer - Accolite',
    description: ''
  },
  {
    image: 'https://picsum.photos/400/300?random=7',
    date: '2021–2023',
    title: 'Software Engineer - Accolite',
    description: ''
  },
  {
    image: 'https://picsum.photos/400/300?random=8',
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
    image: 'https://picsum.photos/400/300?random=9',
    date: '2021',
    title: 'Analytics and ML - COVID-19',
    description: ''
  },
  {
    image: 'https://picsum.photos/400/300?random=10',
    date: '2021',
    title: 'Survey Research - COVID-19',
    description: ''
  },
  {
    image: 'https://picsum.photos/400/300?random=11',
    date: '2021',
    title: 'Cyber Security Analyst - CBIMP',
    description: ''
  },
  {
    image: 'https://picsum.photos/400/300?random=12',
    date: '2020',
    title: 'Backend Developer - Broadcastt.co',
    description: ''
  },
  {
    image: 'https://picsum.photos/400/300?random=13',
    date: '2019-2020',
    title: 'Web Application Developer - N-TIER',
    description: ''
  }
];

export default function StoryTimeline() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardsPerView = 5;

  const nextCard = () => {
    setCurrentIndex((prev) => {
      const maxIndex = Math.max(0, stories.length - cardsPerView);
      return Math.min(prev + 1, maxIndex);
    });
  };

  const prevCard = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="story-timeline">
      <h2 className="story-title">Journey</h2>
      <div className="story-cards">
        <div 
          className="story-cards-container"
          style={{
            transform: `translateX(-${currentIndex * (340 + 40)}px)`,
            transition: 'transform 0.5s ease'
          }}
        >
          {stories.map((story, idx) => (
            <div className="story-card" key={idx}>
              <img src={story.image} alt={story.title} className="story-img" />
              <div className="story-date">{story.date}</div>
              <div className="story-card-title">{story.title}</div>
              {story.description && <div className="story-desc">{story.description}</div>}
            </div>
          ))}
        </div>
      </div>
      <div className="journey-description">
        <div className="journey-button-container">
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
        <p>From internships to graduate studies, every step has shaped my path in technology and research. This journey embodies continuous growth, learning, and the pursuit of excellence in all endeavors.</p>
      </div>
    </div>
  );
} 