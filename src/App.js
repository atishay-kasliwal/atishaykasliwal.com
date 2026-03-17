import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import emailjs from '@emailjs/browser';
import './App.css';
import { initAnalytics, trackEvent } from './lib/analytics';

import img1 from './assets/FidelityLogo.png';
import img8 from './assets/atrium_health_wake_forest_baptist_logo.jpeg';
import img3 from './assets/T-Mobile_logo_202.png';
import img4 from './assets/bt-logo-redesign-sq-1.jpg';
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
import HeroCarousel from './HeroCarousel';
import StoryTimeline from './StoryTimeline';
import Projects from './Projects';
import HighlightDetail from './HighlightDetail';
import { initializeWebLLM, generateResponse, isWebLLMSupported } from './webllmClient';
import { loadAboutMeData, extractRelevantContext, loadQAExamples, findSimilarQAExamples } from './knowledgeRetrieval';

const img5 = '/1ed668f5-0d8d-46c3-ad9a-c585b625d869.png';

const experienceEducation = [
  '- Artificial Intelligence Engineer  <strong>Wake Forest CAIR</strong> (2025)',
  '- Software Engineer, Research <strong>Stony Brook University</strong> (2024–Present)',
  '- Senior Software Engineer <strong>Bounteous</strong> (2021–2024)',
  '- Software Developer <strong>Shriffle</strong> (2020–2021)',
  '- Artificial Intelligence Project Development <strong>Verzeo Learning</strong> (2020)',
  '- Data Analyst <strong>Crime Branch Indore</strong> (2020)',
  '- Web Application Developer <strong>N-TIER Pvt Ltd</strong> (2019–2020)',
  '',
  '- MS in Data Science from <strong>Stony Brook University</strong> ',
  '- Bachelor of Technology in CSIT <strong>Symbiosis University of Applied Sciences</strong>'
];

const suggestionChips = [
  { emoji: '💼', label: "Give me a quick overview of Atishay's experience" },
  { emoji: '🎓', label: "What is Atishay's education qualification" },
  { emoji: '🛠️', label: "How many years of experience Atishay have?" }
];

function PopupChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [aboutMeData, setAboutMeData] = useState(null);
  const [qaExamples, setQaExamples] = useState([]);
  const [error, setError] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(null);
  const messagesEndRef = useRef(null);

  // Stable session id per browser for logging (stored in localStorage)
  const [sessionId] = useState(() => {
    try {
      const existing = window.localStorage.getItem('aibot_session_id');
      if (existing) return existing;
      const id = window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : `sess_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      window.localStorage.setItem('aibot_session_id', id);
      return id;
    } catch {
      return `sess_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    }
  });

  // Load about-me data and start WebLLM download immediately when component mounts
  useEffect(() => {
    const initialize = async () => {
      try {
        // Load about-me data and Q&A examples (lightweight, fast)
        const [data, qaData] = await Promise.all([
          loadAboutMeData(),
          loadQAExamples()
        ]);
        setAboutMeData(data);
        setQaExamples(qaData.examples || []);

        // Check if WebLLM is supported
        if (!isWebLLMSupported()) {
          setError('WebLLM requires WebGPU support. Please use Chrome, Edge, or Safari (latest versions).');
          return;
        }

        // Start downloading WebLLM model in the background immediately
        // This way it's ready when user opens the chat
        setIsModelLoading(true);
        setLoadingProgress({ text: 'Preparing AI model...', progress: 0 });

        // Initialize with progress tracking
        await initializeWebLLM((progress) => {
          if (progress && (progress.progress !== undefined || progress.text)) {
            setLoadingProgress({
              text: progress.text || 'Loading model...',
              progress: progress.progress !== undefined ? progress.progress : 0
            });
          }
        });

        setModelReady(true);
        setIsModelLoading(false);
        setLoadingProgress(null);
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Failed to initialize AI model. You can still try asking questions - it will load on demand.');
        setIsModelLoading(false);
        setLoadingProgress(null);
      }
    };

    initialize();
  }, []);


  // Show welcome message after 2 seconds when page loads
  useEffect(() => {
    if (!hasShownWelcome && isOpen) {
      const timer = setTimeout(() => {
        const welcomeMessage = {
          id: Date.now(),
          text: "Hi! I can help answer questions about my work, experience, projects, and journey. Feel free to ask me anything!",
          sender: 'bot'
        };
        setMessages([welcomeMessage]);
        setHasShownWelcome(true);
        // Scroll to bottom after welcome message
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [hasShownWelcome, isOpen]);

  // Core send logic used by both manual input and suggestion chips
  const sendMessage = async (userQuery) => {
    if (!userQuery || isLoading) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      text: userQuery,
      sender: 'user'
    };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);
    setError(null);
    
    // Scroll to bottom when user sends message
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    // Wait for model if it's still loading
    if (!modelReady && isModelLoading) {
      const loadingMessageId = Date.now() + 1;
      setMessages(prev => [...prev, {
        id: loadingMessageId,
        text: '⏳ Model is still loading... Almost ready!',
        sender: 'bot'
      }]);

      // Wait for initialization to complete
      while (isModelLoading && !modelReady) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Remove loading message
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));

      if (!modelReady) {
        setError('Model failed to load. Please refresh and try again.');
        setIsLoading(false);
        return;
      }
    }

    if (!modelReady) {
      setError('AI model is not ready yet. Please wait a moment and try again.');
      setIsLoading(false);
      return;
    }

    const botMessageId = Date.now() + 1;

    try {
      // Quick path for simple greetings - keep it very short and friendly, no LLM needed
      const trimmed = userQuery.trim().toLowerCase();
      const isGreetingOnly = /^(hi|hey|hello|yo|hola|sup|heyy?|hii+)[!.?,\s]*$/.test(trimmed);
      if (isGreetingOnly) {
        const greetingResponse = "Hey — happy to help you explore Atishay’s work, skills, and projects whenever you’re ready.";

        setMessages(prev => [...prev, {
          id: botMessageId,
          text: greetingResponse,
          sender: 'bot',
          isStreaming: false
        }]);

        // Scroll to bottom after greeting
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);

        // Log greeting turn
        try {
          fetch('https://kxkcjiro44.execute-api.ap-south-1.amazonaws.com/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              userMessage: userQuery,
              botReply: greetingResponse,
              timestamp: new Date().toISOString(),
            }),
          })
            .then(async (res) => {
              const bodyText = await res.text().catch(() => '');
              if (!res.ok) {
                console.error('Conversation log failed', res.status, res.statusText, bodyText);
              } else {
                console.log('Conversation log success (greeting)', res.status, bodyText);
              }
            })
            .catch((err) => {
              console.error('Conversation log error', err);
            });
        } catch (err) {
          console.error('Conversation log exception', err);
        }

        return;
      }

      // Extract relevant context from about-me data
      const context = aboutMeData ? extractRelevantContext(aboutMeData, userQuery) : '';

      // Find similar Q&A examples for few-shot learning
      const similarExamples = findSimilarQAExamples(qaExamples, userQuery, 3);
      
      // Build few-shot examples string
      let fewShotExamples = '';
      if (similarExamples.length > 0) {
        fewShotExamples = '\n\nEXAMPLES OF FACTS AND TONE (convert to third person about Atishay when you answer):\n';
        similarExamples.forEach((ex, idx) => {
          fewShotExamples += `\nExample ${idx + 1}:\nQ: ${ex.question}\nA: ${ex.answer}\n`;
        });
        fewShotExamples += '\nUse the style and content of these examples, but ALWAYS talk about Atishay in third person (he/him/his), not as "I".';
      }

      // Create system prompt - wingman style based on user's spec
      const systemPrompt = `You are an assistant that answers questions about Atishay’s work, skills, background, and experience.

Speak in third person, as an informative guide describing Atishay. Do not greet Atishay directly or pretend to be him. When users ask personal questions, respond as "Atishay has..." or "He has...".

CRITICAL RULES:
- ALWAYS talk about Atishay in third person (use "he", "him", "his" or "Atishay"), NOT "I" or "my"
 - NEVER start responses with phrases like "I am", "I'm", or "My name is"
- Keep responses helpful, warm, and professional
- Be VERY concise – think like a message to a friend: 1–2 short sentences, max ~35–40 words
- Do NOT use bullet points, lists, headings, or long paragraphs. Just a single, tight response.
- Sound natural and authentic, not robotic or formal
- If you don't know something, say you don't have that information
- If the user asks about projects, client work, or building things based on requirements, clearly say that Atishay HAS done multiple projects based on user and business requirements. Do NOT say he hasn't worked on such projects.
- Do NOT say things like "my research data suggests" or speak like an outside analyst. Answer directly.
- If a user asks casually, you may respond casually. If they ask professionally, answer in a clear professional tone.

ABOUT ATISHAY:
${context}${fewShotExamples}

Remember: Keep responses SHORT (1–2 sentences, message-to-a-friend length). Always speak in third person about Atishay. Never mention that you are an AI, bot, or assistant. Stay natural, confident, and slightly playful when appropriate.`;

      // Generate response with streaming
      let botResponse = '';
      
      // Add placeholder bot message
      setMessages(prev => [...prev, {
        id: botMessageId,
        text: '',
        sender: 'bot',
        isStreaming: true
      }]);

      await generateResponse(systemPrompt, userQuery, (partialResponse) => {
        botResponse = partialResponse;
        // Update the message in real-time
        setMessages(prev => prev.map(msg => 
          msg.id === botMessageId 
            ? { ...msg, text: partialResponse, isStreaming: true }
            : msg
        ));
        // Auto-scroll to bottom during streaming
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      });

      // Finalize the message
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId 
          ? { ...msg, text: botResponse, isStreaming: false }
          : msg
      ));
      
      // Scroll to bottom after message is complete
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

      // Fire-and-forget: log this turn to backend (Lambda + Mongo)
      try {
        fetch('https://kxkcjiro44.execute-api.ap-south-1.amazonaws.com/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            userMessage: userQuery,
            botReply: botResponse,
            timestamp: new Date().toISOString(),
          }),
        })
          .then(async (res) => {
            const bodyText = await res.text().catch(() => '');
            if (!res.ok) {
              console.error('Conversation log failed', res.status, res.statusText, bodyText);
            } else {
              console.log('Conversation log success', res.status, bodyText);
            }
          })
          .catch((err) => {
            console.error('Conversation log error', err);
          });
      } catch (err) {
        console.error('Conversation log exception', err);
      }

    } catch (err) {
      console.error('Error generating response:', err);
      setError('Sorry, I encountered an error. Please try again.');
      
      // Remove the streaming message on error
      setMessages(prev => prev.filter(msg => msg.id !== botMessageId));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    await sendMessage(query.trim());
  };

  const handleChipClick = (label) => {
    if (isLoading || !modelReady || isModelLoading) return;
    sendMessage(label);
  };

  return (
    <>
      <div className="chat-popup-button-wrapper">
        <button
          className="chat-popup-button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open chat"
          translate="no"
        >
          {isOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : avatarLoaded ? (
            <img 
              src="/chat-bot-avatar.jpg" 
              alt="Chat with Atishay" 
              className="chat-bot-avatar"
              onError={() => setAvatarLoaded(false)}
              onLoad={() => setAvatarLoaded(true)}
            />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          )}
        </button>
      </div>

      {/* Chat Popup Window */}
      {isOpen && (
        <div className="chat-popup-window" aria-label="Ask Atishay anything">
          <div className="chat-widget">
            <div className="chat-widget-header">
              <h2 className="chat-widget-title">Ask me anything</h2>
              <p className="chat-widget-subtitle">
                about Atishay's work, experience, and journey
              </p>
            </div>

            {/* Model Loading Indicator - Only show when chat is open */}
            {isModelLoading && isOpen && (
              <div className="chat-loading-indicator">
                <div className="chat-loading-spinner"></div>
                <p>{loadingProgress?.text || 'Loading AI model...'}</p>
                {loadingProgress?.progress !== undefined && (
                  <div className="chat-progress-bar">
                    <div 
                      className="chat-progress-fill" 
                      style={{ width: `${(loadingProgress.progress || 0) * 100}%` }}
                    ></div>
                  </div>
                )}
                <p className="chat-loading-note">Preparing AI model... This only happens once!</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="chat-error-message">
                {error}
              </div>
            )}

            {/* Suggested questions - show at top, before messages */}
            {messages.filter(msg => msg.sender === 'user').length === 0 && (
              <div className="chat-suggestions">
                {suggestionChips.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => handleChipClick(chip.label)}
                    className="chat-chip"
                  >
                    <span>{chip.emoji}</span>
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Messages Area */}
            {messages.length > 0 && (
              <div className="chat-messages">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`chat-message ${message.sender === 'bot' ? 'chat-message-bot' : 'chat-message-user'} ${message.isStreaming ? 'chat-message-streaming' : ''}`}
                  >
                    <div className="chat-message-content">
                      {message.text.split('\n').map((line, idx) => (
                        <span key={idx}>
                          {line}
                          {idx < message.text.split('\n').length - 1 && <br />}
                        </span>
                      ))}
                      {message.isStreaming && (
                        <span className="chat-streaming-cursor">▊</span>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}

            <form onSubmit={handleSubmit} className="chat-widget-form">
              <div className="chat-input-wrapper">
                <span className="chat-input-icon" aria-hidden="true">🔍</span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={modelReady ? "Ask me anything..." : (isModelLoading ? "Model loading... almost ready!" : "Preparing...")}
                  className="chat-input"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="chat-submit"
                  disabled={!query.trim() || !modelReady || isLoading || isModelLoading}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </form>

            <p className="chat-footer">
              Just doing my part to help Atishay get hired 🤞
            </p>
          </div>
        </div>
      )}
    </>
  );
}



function HomePage() {
  const gridImages = [
    { src: img1,             company: 'Fidelity Investments',    role: 'Software Engineer',        impact: 'AI-powered equity research tools at scale' },
    { src: img8, light: true, company: 'Atrium Health',           role: 'AI Research Intern',        impact: 'ML models for tumor detection & clinical workflows' },
    { src: img2,             company: 'Bounteous',               role: 'Full-Stack Engineer',       impact: 'Digital platforms for Fortune 500 clients' },
    { src: img4,             company: 'BT Group',                role: 'Software Engineer',        impact: 'Backend systems across telecom infrastructure' },
    { src: img7, light: true, company: 'Accolite Digital',        role: 'Senior Software Engineer', impact: 'Led frontend delivery for enterprise clients' },
    { src: img3,             company: 'T-Mobile',                role: 'Software Engineer',        impact: 'High-traffic mobile platform features' },
    { src: img6,             company: 'Stony Brook University',  role: 'MS Data Science',          impact: 'Graduate research in AI, NLP & distributed systems' },
    { src: img9, light: true, company: 'Shriffle Technologies',   role: 'Software Developer',       impact: 'Full-stack product development 0 → 1' },
    { src: img5,             company: 'Accenture',               role: 'Software Engineer',        impact: 'Enterprise solutions across cloud & data platforms' },
  ];

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
      
      trackEvent('contact_form_submit', { page_path: window.location.pathname });
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
        <title>Atishay Kasliwal - Full Stack Engineer | Portfolio & Resume</title>
        <link rel="canonical" href="https://atishaykasliwal.com/" />
        <meta name="google" content="notranslate" />
        <meta name="google-translate-customization" content="no" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Atishay Kasliwal - Full Stack Engineer" />
        <meta property="og:description" content="Portfolio & resume of Atishay Kasliwal - React/Next.js, Node, Python, GCP, AI/ML engineer. Software engineer with 5+ years experience." />
        <meta property="og:url" content="https://atishaykasliwal.com/" />
        <meta property="og:image" content="https://atishaykasliwal.com/atishaylogo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Atishay Kasliwal - Full Stack Engineer" />
        <meta name="twitter:description" content="Portfolio & resume of Atishay Kasliwal - React/Next.js, Node, Python, GCP, AI/ML engineer. Software engineer with 5+ years experience." />
        <meta name="description" content="Atishay Kasliwal - Full Stack Engineer. Portfolio, resume, and projects. Software engineer with 5+ years experience at Fidelity Investments, currently pursuing MS in Data Science at Stony Brook University. React, Next.js, Node, Python, GCP, AI/ML." />
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
              "description": "Full Stack Engineer. React / Next.js, Node, Python, GCP, AI/ML.",
              "jobTitle": "Full Stack Engineer",
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
      <div className="page-content page-content--landing" translate="no">
        {/* Header */}
        <div className="header" translate="no">
          <div className="header-inner">
            <Link to="/" className="nav-logo" onClick={() => setIsMobileMenuOpen(false)}>
              Atishay Kasliwal
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
              <Link to="/highlights">Work</Link>
              <Link to="/art">Photography</Link>
              <a href="https://www.linkedin.com/in/atishay-kasliwal/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              <a href="/Atishay-Kasliwal-Resume.pdf?v=2" className="nav-resume-btn" target="_blank" rel="noopener noreferrer">Resume</a>
            </nav>
          </div>
        </div>

        <div className="landing-hero-wrap" translate="no">
        <div className="landing-hero-stack" translate="no">
          {/* Two-column Main Content */}
          <div className="landing-two-col" data-analytics-section="hero" translate="no">
            <div className="landing-left-text" translate="no">
              <p className="hero-eyebrow" translate="no">Software Engineer · Full-Stack · Machine Learning</p>
              <h1 className="hero-name" translate="no">Atishay Kasliwal</h1>
              <p className="hero-description" translate="no">
                Full-stack engineer with 5 years of experience shipping production software across fintech, healthcare, and enterprise. I work across the stack and have built AI-powered features into real products used at scale.
              </p>
              <div className="button-group-theme hero-ctas" translate="no">
                <Link to="/highlights" className="btn-theme btn-primary-action btn-lg" data-cta-position="hero_view_work">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.6em' }}>
                    View Work
                    <svg width="14" height="14" fill="none" viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                </Link>
                <a href="/Atishay-Kasliwal-Resume.pdf?v=2" className="btn-theme btn-secondary btn-lg" target="_blank" rel="noopener noreferrer" data-cta-position="hero_resume">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.6em' }}>
                    Resume
                  </span>
                </a>
                <a href="https://www.linkedin.com/in/atishay-kasliwal/" target="_blank" rel="noopener noreferrer" className="btn-theme btn-icon btn-lg" aria-label="LinkedIn">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm15.5 11.268h-3v-5.604c0-1.337-.025-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.967v5.7h-3v-10h2.881v1.367h.041c.401-.761 1.379-1.563 2.838-1.563 3.034 0 3.595 1.997 3.595 4.59v5.606z" fill="currentColor"/></svg>
                </a>
                <a href="https://github.com/atishay-kasliwal" target="_blank" rel="noopener noreferrer" className="btn-theme btn-icon btn-lg" aria-label="GitHub">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.084-.729.084-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.334-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.553 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.803 5.624-5.475 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576 4.765-1.588 8.199-6.084 8.199-11.386 0-6.627-5.373-12-12-12z" fill="currentColor"/></svg>
                </a>
              </div>
              <div className="hero-stats" translate="no">
                <div className="hero-stat">
                  <span className="hero-stat-num">5+</span>
                  <span className="hero-stat-label">Years Experience</span>
                </div>
                <div className="hero-stat-divider" />
                <div className="hero-stat">
                  <span className="hero-stat-num">10+</span>
                  <span className="hero-stat-label">Projects Shipped</span>
                </div>
                <div className="hero-stat-divider" />
                <div className="hero-stat">
                  <span className="hero-stat-num">8+</span>
                  <span className="hero-stat-label">Enterprise Clients</span>
                </div>
                <div className="hero-stat-divider" />
                <div className="hero-stat">
                  <span className="hero-stat-num">MS</span>
                  <span className="hero-stat-label">Data Science,<br/>Stony Brook</span>
                </div>
              </div>
            </div>
            <div className="landing-right-images" translate="no">
              <p className="grid-worked-with" translate="no">Worked with</p>
              <div className="landing-grid-3x3" translate="no">
                {gridImages.map(({ src, light, company, role, impact }, idx) => (
                  <div key={idx} className={`logo-tile${light ? ' logo-tile-light' : ''}`} translate="no">
                    <img src={src} alt={company || `Company ${idx + 1}`} translate="no" />
                    {company && (
                      <div className="logo-tile-info" translate="no">
                        <span className="logo-tile-company">{company}</span>
                        <span className="logo-tile-role">{role}</span>
                        <span className="logo-tile-impact">→ {impact}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
        </div>

        <section className="editorial-grid-section section-wrap" data-analytics-section="editorial" translate="no">
          <div className="editorial-grid-inner">
            <div className="editorial-grid-header" translate="no">
              <h2 translate="no">Featured Highlights</h2>
              <p translate="no">A curated look at recent work, research, and creative explorations.</p>
            </div>
            <div className="editorial-grid" translate="no">

              {/* 1 — FOMC Intelligence Dashboard */}
              <Link to="/highlights/d4e5f6a7-b8c9-4012-d345-6789abcdef01" className="editorial-card editorial-card--wide editorial-card--has-bg" style={{ backgroundImage: 'url(/fmocc.jpeg)' }} aria-label="Read more: FOMC Intelligence Dashboard" data-feature-name="FOMC Intelligence Dashboard" translate="no">
                <span className="editorial-tag" translate="no">Research</span>
                <div className="editorial-card-body" translate="no">
                  <span className="editorial-subtitle">NLP · Monetary Policy</span>
                  <h3>Decoding the Fed, One Meeting at a Time</h3>
                  <p className="editorial-desc">Parses FOMC transcripts and press releases to surface rate signals, hawkish/dovish sentiment shifts, and policy language trends across meeting cycles.</p>
                  <span className="editorial-cta">Read case study <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4"/></svg></span>
                </div>
              </Link>

              {/* 2 — RAG System */}
              <Link to="/highlights/c3d4e5f6-a7b8-4901-c234-56789abcdef0" className="editorial-card editorial-card--medium editorial-card--has-bg" style={{ backgroundImage: 'url(/4th.jpeg)' }} aria-label="Discover: Legal RAG" data-feature-name="Legal RAG System" translate="no">
                <span className="editorial-tag" translate="no">AI</span>
                <div className="editorial-card-body" translate="no">
                  <span className="editorial-subtitle">LLM · Document Intelligence</span>
                  <h3>Ask Your Documents Anything</h3>
                  <p className="editorial-desc">A retrieval-augmented generation pipeline that lets you query legal documents, filings, and contracts using natural language.</p>
                  <span className="editorial-cta">Try the demo <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4"/></svg></span>
                </div>
              </Link>

              {/* 3 — PolicyFabric */}
              <Link to="/highlights/f6a7b8c9-d0e1-4234-f567-89abcdef0123" className="editorial-card editorial-card--medium editorial-card--has-bg" style={{ backgroundImage: 'url(/5th%20image.jpeg)' }} aria-label="Explore: PolicyFabric" data-feature-name="PolicyFabric" translate="no">
                <span className="editorial-tag" translate="no">Systems</span>
                <div className="editorial-card-body" translate="no">
                  <span className="editorial-subtitle">Systems Design · Data Contracts</span>
                  <h3>Policy Enforcement at Every Layer</h3>
                  <p className="editorial-desc">A live architecture walkthrough of how raw data flows through aggregation, contract validation, and cryptographic signing before reaching consumers.</p>
                  <span className="editorial-cta">Explore the system <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4"/></svg></span>
                </div>
              </Link>

              {/* 4 — Job Intelligence Platform */}
              <a href="https://chromewebstore.google.com/detail/atriveo-job-assistant/ocbmncmmepfjgpnakenoibaambecidcf?authuser=0&hl=en" target="_blank" rel="noopener noreferrer" className="editorial-card editorial-card--medium editorial-card--has-bg" style={{ backgroundImage: 'url(/chrome.png)' }} aria-label="View demo: Job Intelligence Platform" data-feature-name="Atriveo Chrome Extension" translate="no">
                <span className="editorial-tag" translate="no">Product</span>
                <div className="editorial-card-body" translate="no">
                  <span className="editorial-subtitle">AI Product · Hiring</span>
                  <h3>Smarter Hiring Starts Here</h3>
                  <p className="editorial-desc">AI-native recruitment intelligence that ranks candidates, surfaces behavioral signals, and helps teams hire faster with less noise.</p>
                  <span className="editorial-cta">Visit Atriveo <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4"/></svg></span>
                </div>
              </a>

              {/* 5 — MRI Brain Tumor Viewer */}
              <Link to="/highlights/e5f6a7b8-c9d0-4123-e456-789abcdef012" className="editorial-card editorial-card--medium editorial-card--has-bg" style={{ backgroundImage: 'url(/mriimage.jpeg)' }} aria-label="View: MRI Brain Tumor Viewer" data-feature-name="MRI Brain Tumor Viewer" translate="no">
                <span className="editorial-tag" translate="no">Medical AI</span>
                <div className="editorial-card-body" translate="no">
                  <span className="editorial-subtitle">Computer Vision · Radiology</span>
                  <h3>Tumor Detection, Scan to Insight</h3>
                  <p className="editorial-desc">An interactive MRI viewer powered by a trained CNN that segments and classifies brain tumor regions directly in the browser.</p>
                  <span className="editorial-cta">View project <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4"/></svg></span>
                </div>
              </Link>

              {/* 6 — Atriveo */}
              <a href="https://www.atriveo.com/" target="_blank" rel="noopener noreferrer" className="editorial-card editorial-card--wide editorial-card--has-bg" style={{ backgroundImage: 'url(/Atriveo6th.png)' }} aria-label="Visit Atriveo" data-feature-name="Atriveo Platform" translate="no">
                <span className="editorial-tag" translate="no">Product</span>
                <div className="editorial-card-body" translate="no">
                  <span className="editorial-subtitle">AI Recruiting Platform</span>
                  <h3>The AI-Native Hiring Platform</h3>
                  <p className="editorial-desc">Built for modern recruiting teams. Atriveo combines candidate intelligence, engagement tracking, and workflow automation in one seamless platform.</p>
                  <span className="editorial-cta">Visit Atriveo <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4"/></svg></span>
                </div>
              </a>

            </div>
          </div>
        </section>

        <div id="skills-section" data-analytics-section="skills" className="section-wrap" translate="no">
          <SkillsSection />
        </div>
        <div id="journey-section" data-analytics-section="features" className="section-wrap" translate="no">
          <StoryTimeline />
        </div>

        {/* Testimonials Grid */}
        <div id="testimonials-section" data-analytics-section="testimonials" className="testimonials-section section-wrap" translate="no">
          <div className="testimonials-inner" translate="no">
            <h2 className="testimonials-title" translate="no">Testimonials</h2>

            <div className="testimonials-grid" translate="no">
              {getCurrentTestimonials().map((t, idx) => {
                const displayName = String(t.name || '').replace('⭐⭐⭐⭐⭐', '').trim();
                return (
                  <article className="testimonial-card" key={idx} translate="no">
                    <header className="testimonial-card__head" translate="no">
                      <div className="testimonial-card__person" translate="no">
                        <span className="testimonial-card__avatar-ring" aria-hidden="true" translate="no">
                          <img
                            src={t.photo}
                            alt={displayName}
                            className="testimonial-card__avatar"
                            loading="lazy"
                            decoding="async"
                            translate="no"
                          />
                        </span>
                        <div className="testimonial-card__meta" translate="no">
                          <div className="testimonial-card__name" translate="no">{displayName}</div>
                          <div className="testimonial-card__role" translate="no">{t.company} — {t.post}</div>
                        </div>
                      </div>
                      <div className="testimonial-card__rating" aria-label="5 out of 5 stars" translate="no">
                        <span aria-hidden="true">★★★★★</span>
                      </div>
                    </header>
                    <p className="testimonial-card__quote" translate="no">{t.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>

        {/* Final Product Images Section */}
        <div id="final-product-section" data-analytics-section="gallery" className="section-wrap" translate="no">
          <FinalProductGrid />
        </div>

      </div>
    </>
  );
}

function ArtPage() {
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const images = [
    'https://i.pinimg.com/736x/bd/87/b4/bd87b4569684fe1a7819c96a9ab0e843.jpg', //Stranger Things
    'https://i.pinimg.com/736x/a9/0c/64/a90c643c914751ab8143afd6fc845f07.jpg', //New York
    'https://i.pinimg.com/736x/61/a8/52/61a852ecc3adb00d35c71476fd6977a6.jpg', // Boston 2
    'https://i.pinimg.com/736x/5b/e2/1b/5be21bebd4edafca1843cc30b77b9314.jpg', //Red Light
    'https://i.pinimg.com/736x/34/08/30/3408302ead9068d3f32d0ca667b4a762.jpg', //FAll
    'https://i.pinimg.com/736x/bc/1f/05/bc1f05cda34faa0100ae7a0e8508d6b8.jpg', //Boston
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
        <title>Art | Atishay Kasliwal</title>
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
      <div className="bg-art" translate="no" />
      <div className="page-content page-content--art" translate="no">
        <div className="header" translate="no">
          <div className="header-inner">
            <Link to="/" className="nav-logo" onClick={() => setIsMobileMenuOpen(false)} translate="no">
              Atishay Kasliwal
            </Link>
            <button
              className="mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
              translate="no"
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
            <nav className={`nav ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)} translate="no">
              <Link to="/highlights" translate="no">Work</Link>
              <Link to="/art" className="active" translate="no">Photography</Link>
              <a href="https://www.linkedin.com/in/atishay-kasliwal/" target="_blank" rel="noopener noreferrer" translate="no">LinkedIn</a>
              <a href="/Atishay-Kasliwal-Resume.pdf?v=2" className="nav-resume-btn" target="_blank" rel="noopener noreferrer" translate="no">Resume</a>
            </nav>
          </div>
        </div>

        <div className="art-intro" translate="no">
          <h2 className="art-title" translate="no">Welcome! Discover moments through my lens, where each photo tells a story.</h2>
        </div>

        <div className="art-grid-fixed" style={{ minHeight: '90vh' }} translate="no">
          {images.map((src, idx) => (
            <div className="art-tile-fixed" key={idx} translate="no">
              <img src={src} alt={`artwork-${idx}`} loading="lazy" decoding="async" translate="no" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Skills Section Component
function SkillsSection() {
  const skillsData = [
    {
      category: 'Languages',
      skills: ['Python', 'JavaScript', 'TypeScript', 'Java', 'SQL', 'R', 'Bash', 'C++']
    },
    {
      category: 'Frontend',
      skills: ['React', 'Next.js', 'Tailwind CSS', 'Redux', 'HTML5', 'CSS3', 'Vite', 'Webpack']
    },
    {
      category: 'AI & Data',
      skills: ['LangChain', 'OpenAI API', 'HuggingFace', 'PyTorch', 'Pandas', 'Scikit-learn', 'NLP', 'RAG']
    },
    {
      category: 'Backend',
      skills: ['Node.js', 'Express', 'FastAPI', 'GraphQL', 'REST APIs', 'PostgreSQL', 'MongoDB', 'Redis']
    },
    {
      category: 'Cloud & Tools',
      skills: ['AWS', 'GCP', 'Docker', 'Kubernetes', 'GitHub Actions', 'Terraform', 'Firebase', 'Vercel']
    }
  ];

  return (
    <div className="skills-section" translate="no">
      <div className="skills-grid" translate="no">
        {skillsData.map(({ category, skills }) => (
          <div key={category} className="skills-category" translate="no">
            <h3 translate="no">{category}</h3>
            <div className="skills-list" translate="no">
              {skills.map((skill, idx) => (
                <span key={idx} className="skill-tag" translate="no">{skill}</span>
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

// Final Product Grid Component
function FinalProductGrid() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const images = [
    '/final-product/new_york_pplapel_pin-removebg-preview.png',
    '/final-product/Chicago_lapel_opin-removebg-preview.png',
    '/final-product/Chicago_lapepl_pion-removebg-preview.png',
    '/final-product/fomc_market_predictions_1min.png',
    '/final-product/lirr.png',
    '/final-product/mlirr.png',
    '/final-product/WS.png',
    '/final-product/SBY.png',
    '/final-product/WF.png',
    '/final-product/ny1.png'
  ];

  // Determine grid columns based on screen size
  const getGridColumns = () => {
    if (windowWidth <= 768) {
      return 5; // Mobile: 5 columns (2 rows)
    } else if (windowWidth <= 1024) {
      return 5; // Tablet: 5 columns (2 rows)
    } else {
      return 10; // Desktop: 10 columns (1 row)
    }
  };

  return (
    <div className="story-timeline" style={{
      background: 'transparent',
      borderRadius: '16px',
      padding: windowWidth <= 768 ? '2rem 1rem' : '3rem 2rem'
    }} translate="no">
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${getGridColumns()}, 1fr)`,
        gap: windowWidth <= 768 ? '1rem' : windowWidth <= 1024 ? '1.5rem' : '2rem',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center'
      }} translate="no">
        {images.map((src, idx) => (
          <div
            key={idx}
            style={{
              width: '100%',
              aspectRatio: '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              borderRadius: '12px',
              overflow: 'hidden',
              padding: windowWidth <= 768 ? '0.5rem' : '1rem'
            }}
            translate="no"
          >
            <img
              src={src}
              alt={`Project ${idx + 1}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
              }}
              translate="no"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="site-footer" translate="no">
      <div className="footer-content" translate="no">
        <span translate="no">© {new Date().getFullYear()} <strong>Atishay Kasliwal</strong> - Full Stack Engineer</span>
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
      <AnalyticsTracker />
      {/* Global chat bot, visible on all pages */}
      <PopupChatBot />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/art" element={<ArtPage />} />
        <Route path="/highlights" element={<Projects />} />
        {/* Blog-style highlight endpoint (project-name slug OR uuid) */}
        <Route path="/highlights/:id" element={<HighlightDetail />} />
        {/* Legacy UUID endpoint (kept for backward compatibility) */}
        <Route path="/Highlights/:uuid" element={<HighlightDetail />} />
      </Routes>
      <Footer />
    </Router>
  );
}

// Component to scroll to top on route changes (once; does not block user scroll)
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
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
      const html = document.documentElement;
      if (html.scrollTop !== 0) html.scrollTop = 0;
      if (html.scrollLeft !== 0) html.scrollLeft = 0;
    };

    scrollToTop();
    // One delayed run to catch late layout (fonts/images); no ongoing scroll blocking
    const t = setTimeout(scrollToTop, 100);
    return () => clearTimeout(t);
  }, [pathname]);

  return null;
}

function AnalyticsTracker() {
  useEffect(() => {
    const cleanup = initAnalytics();
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return null;
}

export default App;
