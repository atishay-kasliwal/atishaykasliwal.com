import React from 'react';
import './StoryTimeline.css';

import img1 from './assets/Symbiosis-Indore-Auditorium-Front-View.jpg';

const stories = [
  {
    image: 'https://sbmatters.stonybrook.edu/wp-content/uploads/2023/08/Umbilic-Torus.jpeg',
    date: 'Nov 2024 – Present',
    role: 'Software Engineer – Research',
    title: 'Stony Brook University',
    tag: 'Research'
  },
  {
    image: 'https://myfox8.com/wp-content/uploads/sites/17/2016/07/promo293230600.jpg?w=640',
    date: 'May – Aug 2025',
    role: 'SWE Intern · ML / Clinical AI',
    title: 'Wake Forest – CAIR',
    tag: 'Research'
  },
  {
    image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
    date: 'Aug 2021 – Aug 2024',
    role: 'Senior Software Engineer',
    title: 'Accolite Digital',
    tag: 'Industry'
  },
  {
    image: 'https://i.pinimg.com/1200x/9f/3f/23/9f3f231ea5c491d8e13f6c3a3971a50a.jpg',
    date: 'Aug 2020 – Jul 2021',
    role: 'Software Engineer – Intern',
    title: 'Shriffle',
    tag: 'Industry'
  },
  {
    image: 'https://www.stonybrook.edu/commcms/studentaffairs/for/images/dvtn.jpg',
    date: 'Aug 2024 – May 2026',
    role: 'MS in Data Science',
    title: 'Stony Brook University',
    tag: 'Education'
  },
  {
    image: img1,
    date: 'Aug 2018 – May 2022',
    role: 'B.Tech in Computer Science',
    title: 'Symbiosis University of Applied Sciences',
    tag: 'Education'
  },
];

export default function StoryTimeline() {
  return (
    <div className="story-timeline" translate="no">
      <h2 className="story-title" translate="no">Journey</h2>
      <div className="story-cards" translate="no">
        <div className="story-cards-container" translate="no">
          {stories.map((story, idx) => (
            <div className="story-card" key={idx} translate="no">
              <img src={story.image} alt={story.title} className="story-img" translate="no" />
              <div className="story-card-gradient" />
              <div className="story-card-content" translate="no">
                <div className="story-card-body" translate="no">
                  <div className="story-card-role" translate="no">{story.role}</div>
                  <div className="story-card-title" translate="no">{story.title}</div>
                  <div className="story-date" translate="no">{story.date}</div>
                </div>
                <div className="story-card-hover-line" translate="no">
                  {story.role} · {story.title} · {story.date}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
