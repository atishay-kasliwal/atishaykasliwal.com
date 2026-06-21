import React from 'react';

const skillsData = [
  {
    category: 'Languages',
    skills: ['Python', 'JavaScript', 'TypeScript', 'Java', 'SQL', 'R', 'Bash', 'C++'],
  },
  {
    category: 'Frontend',
    skills: ['React', 'Next.js', 'Tailwind CSS', 'Redux', 'HTML5', 'CSS3', 'Vite', 'Webpack'],
  },
  {
    category: 'AI & Data',
    skills: ['LangChain', 'OpenAI API', 'HuggingFace', 'PyTorch', 'Pandas', 'Scikit-learn', 'NLP', 'RAG'],
  },
  {
    category: 'Backend',
    skills: ['Node.js', 'Express', 'FastAPI', 'GraphQL', 'REST APIs', 'PostgreSQL', 'MongoDB', 'Redis'],
  },
  {
    category: 'Cloud & Tools',
    skills: ['AWS', 'GCP', 'Docker', 'Kubernetes', 'GitHub Actions', 'Terraform', 'Firebase', 'Vercel'],
  },
];

function SkillsSection() {
  return (
    <div className="skills-section" translate="no">
      <div className="skills-grid" translate="no">
        {skillsData.map(({ category, skills }) => (
          <div key={category} className="skills-category" translate="no">
            <h3 translate="no">{category}</h3>
            <div className="skills-list" translate="no">
              {skills.map((skill, idx) => (
                <span key={idx} className="skill-tag" translate="no">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SkillsSection;
