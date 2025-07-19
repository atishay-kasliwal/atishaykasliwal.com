import React from 'react';
import './StoryTimeline.css';

import img1 from './assets/Symbiosis-Indore-Auditorium-Front-View.jpg';

const stories = [
  {
    image: 'https://myfox8.com/wp-content/uploads/sites/17/2016/07/promo293230600.jpg?w=640',
    date: '2025',
    title: 'AI ML - Wake Forest',
    description: 'I got my first opportunity out of grad school at Wake Forest, where I gained hands-on experience working with medical clinical data and MRI images for AI research projects'
  },
  {
    image: 'https://sbmatters.stonybrook.edu/wp-content/uploads/2023/08/Umbilic-Torus.jpeg',
    date: '2024–2025',
    title: 'Research Assistant - SBU',
    description: 'Working with Professor Wencui Han at Stony Brook University has been a wonderful experience. I learned a lot about finance, and developed predictive models.'
  },

  {
    image: 'https://www.jkokolakis.com/wp-content/uploads/2017/09/600-Bed-Residence-Hall-9-752x500.jpg',
    date: '2024–2025',
    title: 'Residencial Safety Program - SBU',
    description: 'Got my first on-campus job with the Residential Safety Program, where I met many new people, learned a lot, and gained great experience.'
  },
    {image: 'https://www.stonybrook.edu/commcms/studentaffairs/for/images/dvtn.jpg',
    date: '2024-2025',
    title: 'Data Science - Graduate',
    description: 'My time at Accolite ended as I moved to the USA to pursue my master’s in DS at Stony Brook University. Excited to join this new, multidisciplinary program.'
 },

  {
    image: 'https://i.ytimg.com/vi/MiZf2qRBQ7k/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLCsno81_sYAASs6LZHeei9o5v18iw',
    date: '2023–2024',
    title: 'Senior Software Engineer - Accolite',
    description: 'After completing two years, I was promoted to Senior Software Engineer, leading multiple projects and gaining hands-on experience with blockchain technology.'
  },


  {
    image: 'https://i.pinimg.com/736x/08/2c/54/082c54bd155c8d7de77d51ffd8678156.jpg',
    date: '2021–2023',
    title: 'Software Engineer - Accolite',
    description: 'Before completing my internship, I was converted to a full-time employee my responsibilities and confidence both increased significantly, driving my professional growth.'
  },
  {
    image: 'https://i.pinimg.com/1200x/61/35/08/613508200fbe2933660602aebdd5ba38.jpg',
    date: '2021',
    title: 'Software Intern - Accolite Digital',
    description: 'My first experience at a company with over 20,000 employees marked my career start. During my internship, I worked for clients in telecommunications, gaining exposure.'
  },
  {
    image: img1,
    date: '2018-2022',
    title: 'Computer Science - Undergrad',
    description: 'Completed my undergraduate degree in CSIT from Symbiosis University of Applied Sciences, gaining extensive knowledge and thoroughly enjoying my four years there.'
  },


  {
    image: 'https://media.licdn.com/dms/image/v2/C4E22AQHDukjXwqYXYQ/feedshare-shrink_2048_1536/feedshare-shrink_2048_1536/0/1592505948609?e=1755129600&v=beta&t=6Wz8AzhDVBvcMGdCic4KNOAnzQgEuW41i0Fe8C4a2-Q',
    date: '2021',
    title: 'Analytics and ML - COVID-19',
    description: 'Using survey data, we created a machine learning model to develop a predictive tool and published my second paper.'
  },
  {
    image: 'https://i.pinimg.com/736x/1d/f8/fe/1df8fee4e347fdcb9ef02a9cd184063a.jpg',
    date: '2021',
    title: 'Survey Research - COVID-19',
    description: 'During the peak of the pandemic, I conducted a survey-based research project and published my first paper on the effects of COVID-19 after lockdowns were lifted'
  },
  {
    image: 'https://i.pinimg.com/1200x/d1/87/a5/d187a51c688056fe9bb8d56e9da113a1.jpg',
    date: '2021',
    title: 'Cyber Security Analyst - CBIMP',
    description: 'Over the summer of 2021, I worked with my city’s cyber department, executed press conferences, and gained hands-on experience in cybersecurity and analysis.'
  },

  {
    image: 'https://media.licdn.com/dms/image/v2/C4D22AQGkwulh0Npu9Q/feedshare-shrink_1280/feedshare-shrink_1280/0/1657647605151?e=1755129600&v=beta&t=KqktReysnED5RzRX_Xu9xWum2WfOnoKk38cPvs9tUoY',
    date: '2020',
    title: 'Backend Developer - Broadcastt.co',
    description: 'Showcasing my skills and leveraging connections, I landed my first freelancing job, handling multiple projects and gaining valuable professional experience.'
  },
  {
    image: 'https://i.pinimg.com/736x/15/bb/b9/15bbb97130b2971626b24f77d614a385.jpg',
    date: '2019-2020',
    title: 'Web Application Developer - N-TIER',
    description: 'Started my career at N-TIER, designing and developing multiple frontend web applications with creativity and efficiency. I never imagined I would reach this far.'
  }
];

export default function StoryTimeline() {
  return (
    <div className="story-timeline">
      <h2 className="story-title">Journey</h2>
      <div className="story-cards">
        {stories.map((story, idx) => (
          <div className="story-card" key={idx}>
            <img src={story.image} alt={story.title} className="story-img" />
            <div className="story-date">{story.date}</div>
            <div className="story-card-title">{story.title}</div>
            <div className="story-desc">{story.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
} 