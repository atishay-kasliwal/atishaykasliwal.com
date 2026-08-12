import React from 'react';
import './StoryTimeline.css';
import { getLandingJourneyEntries } from './lib/content/publicContent.js';

export default function StoryTimeline() {
  const stories = getLandingJourneyEntries();

  return (
    <div className="story-timeline" translate="no">
      <h2 className="story-title" translate="no">Journey</h2>
      <div className="story-cards" translate="no">
        <div className="story-cards-container" translate="no">
          {stories.map((story) => (
            <div className="story-card" key={story.id} translate="no">
              <img
                src={story.image}
                alt={story.title}
                className="story-img"
                loading="lazy"
                decoding="async"
                translate="no"
              />
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
