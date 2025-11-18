export default function SkillsSection() {
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

