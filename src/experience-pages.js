// Full page content for the /experience/<slug>/ pages: work history and education,
// told the same way the project case studies are, minus the fields that don't apply
// (no live/GitHub links for most of these, so `links` is often empty and the page
// quietly drops the action buttons).
export const experiencePages = [
  {
    slug: "stony-brook-research",
    name: "Software Engineer, Research",
    kicker: "Work",
    started: "2024-11-01",
    seo: {
      title: "Software Engineer, Research — Stony Brook University · Atishay Kasliwal",
      description:
        "Atishay Kasliwal's research role at Stony Brook University: event-driven research infrastructure, production AI services, and real-time analytical interfaces.",
    },
    headline: "Research infrastructure that has to actually run.",
    headlineSoft: "Stony Brook University, November 2024 to May 2026.",
    lede:
      "An async, event-driven backend that ingests over 10,000 FOMC intervals, production AI/LLM services on top of it, and the dashboards that make the output usable for a research team, not just for a notebook.",
    spec: [
      { label: "Where", html: "<b>Stony Brook University</b> · New York" },
      { label: "Dates", html: "<b>November 2024</b> – May 2026" },
    ],
    stats: [
      { value: "10K+", label: "FOMC intervals ingested" },
      { value: "62%", label: "directional accuracy" },
      { value: "80%", label: "cut in inference timeouts" },
    ],
    links: [{ label: "Visit Stony Brook University", href: "https://www.stonybrook.edu" }],
    media: {
      items: [
        {
          label: "Main entrance",
          src: "/experience/media/stony-brook-research/entrance.webp",
          thumb: "/experience/media/stony-brook-research/entrance-thumb.webp",
          alt: "Stony Brook University main entrance sign, West Campus",
        },
        {
          label: "Student center",
          src: "/experience/media/stony-brook-research/student-center.webp",
          thumb: "/experience/media/stony-brook-research/student-center-thumb.webp",
          alt: "The Student Activities Center at dusk, with a Stony Brook Seawolves banner",
        },
        {
          label: "The quad",
          src: "/experience/media/stony-brook-research/quad.webp",
          thumb: "/experience/media/stony-brook-research/quad-thumb.webp",
          alt: "Stony Brook's campus quad in autumn, fountain and academic buildings in view",
        },
        {
          label: "Seawolves",
          src: "/experience/media/stony-brook-research/seawolves.webp",
          thumb: "/experience/media/stony-brook-research/seawolves-thumb.webp",
          alt: "A Stony Brook Seawolves banner on campus",
        },
      ],
    },
    sections: [
      {
        title: "An async backend for a research pace",
        body: "The platform ingests more than 10,000 FOMC intervals through Django REST and asynchronous processing on NoSQL storage, built to enable macro prediction models that reach 62% directional accuracy.",
      },
      {
        title: "Production AI, not a demo",
        body: "LLM service components run in production with connection pooling and circuit breakers, cutting inference timeouts by 80% and stabilizing 10,000+ daily embeddings for live NLP signal generation.",
      },
      {
        title: "Interfaces for people, not just for me",
        body: "React and D3.js front-end features give more than 20 people across 3 departments real-time data visualization with sub-2-second performance, so the research is legible to people who didn't build the pipeline.",
      },
      {
        title: "Iteration speed as an engineering problem",
        body: "DevOps changes, Docker, CI/CD, CloudWatch, took one experiment loop from 6 hours to 90 seconds, at 99% uptime. That change alone is what made the rest of the work practical to iterate on.",
      },
    ],
  },
  {
    slug: "wake-forest-cair",
    name: "Artificial Intelligence Engineer",
    kicker: "Work",
    started: "2025-05-01",
    seo: {
      title: "AI Engineer — Wake Forest CAIR · Atishay Kasliwal",
      description:
        "Atishay Kasliwal's summer at Wake Forest CAIR: cloud-native PyTorch model serving across 50,000+ medical-imaging scans and 10 TB of data.",
    },
    headline: "50,000 scans, and a pipeline that had to trust its own labels.",
    headlineSoft: "Wake Forest CAIR, May to August 2025.",
    lede:
      "A summer at the Center for Artificial Intelligence Research, serving PyTorch models on GCP against a real hospital-scale imaging dataset, where the hard part wasn't the model, it was making 50,000 scans and 10 TB of data trustworthy enough to train on.",
    spec: [
      { label: "Where", html: "<b>Wake Forest CAIR</b> · Winston-Salem, NC" },
      { label: "Dates", html: "<b>May 2025</b> – August 2025" },
    ],
    stats: [
      { value: "50,000+", label: "imaging scans processed" },
      { value: "10 TB", label: "of data" },
      { value: "95%", label: "radiologist concordance" },
    ],
    links: [{ label: "Visit Wake Forest School of Medicine", href: "https://school.wakehealth.edu" }],
    media: {
      items: [
        {
          label: "Wait Chapel",
          src: "/experience/media/wake-forest-cair/chapel.webp",
          thumb: "/experience/media/wake-forest-cair/chapel-thumb.webp",
          alt: "Wait Chapel and the quad on Wake Forest's campus",
        },
        {
          label: "Campus",
          src: "/experience/media/wake-forest-cair/campus-2.webp",
          thumb: "/experience/media/wake-forest-cair/campus-2-thumb.webp",
          alt: "Wake Forest University campus",
        },
        {
          label: "Grounds",
          src: "/experience/media/wake-forest-cair/campus-3.webp",
          thumb: "/experience/media/wake-forest-cair/campus-3-thumb.webp",
          alt: "Wake Forest University grounds",
        },
        {
          label: "The whiteboard",
          src: "/experience/media/wake-forest-cair/whiteboard.webp",
          thumb: "/experience/media/wake-forest-cair/whiteboard-thumb.webp",
          alt: "A whiteboard planning the imaging pipeline: N4ITK bias correction, FreeSurfer, DICOM to NIfTI conversion, and the radiomics processing steps",
        },
      ],
    },
    sections: [
      {
        title: "Model serving at hospital scale",
        body: "Cloud-native AI services served PyTorch models on GCP with Terraform, processing more than 50,000 medical-imaging scans and 10 TB of data, not as a one-off batch job but as infrastructure meant to keep running.",
      },
      {
        title: "The real work was the labels",
        body: "Automated data curation with MNI152 standardization, using Python, NiBabel and SimpleITK, reduced preprocessing from 4 hours to 18 minutes per case and reached 95% radiologist concordance, the number that actually mattered.",
      },
      {
        title: "Monitoring that earns trust",
        body: "Delivered monitoring tools alongside the pipeline, holding P99 latency at 1.6 seconds, so the team could see the system behave in production, not just read a paper metric.",
      },
    ],
  },
  {
    slug: "accolite",
    name: "Senior Software Engineer",
    kicker: "Work",
    started: "2021-08-01",
    seo: {
      title: "Senior Software Engineer — Accolite · Atishay Kasliwal",
      description:
        "Atishay Kasliwal's three years at Accolite: 20+ production microservices across fintech, telecom and commerce, supporting 100,000+ monthly users.",
    },
    headline: "Twenty-plus microservices, three industries, one uptime number.",
    headlineSoft: "Accolite, August 2021 to August 2024.",
    lede:
      "Three years as a Senior Software Engineer, building production microservices across fintech, telecom and commerce, at a company that, partway through, became part of Bounteous. The systems and the uptime number stayed the same either way.",
    spec: [
      { label: "Where", html: "<b>Accolite</b> · became part of Bounteous in 2021" },
      { label: "Dates", html: "<b>August 2021</b> – August 2024" },
    ],
    stats: [
      { value: "20+", label: "production microservices" },
      { value: "100,000+", label: "monthly active users" },
      { value: "99.9%", label: "uptime" },
    ],
    links: [{ label: "Visit Accolite", href: "https://www.accolite.com" }],
    media: {
      items: [
        {
          label: "Accolite",
          src: "/experience/media/accolite/logo.webp",
          thumb: "/experience/media/accolite/logo-thumb.webp",
          alt: "Accolite Digital logo",
        },
        {
          label: "Bounteous × Accolite",
          src: "/experience/media/accolite/mark.webp",
          thumb: "/experience/media/accolite/mark-thumb.webp",
          alt: "Announcement graphic: Bounteous × Accolite, end-to-end digital transformation",
        },
        {
          label: "Brand",
          src: "/experience/media/accolite/brand.webp",
          thumb: "/experience/media/accolite/brand-thumb.webp",
          alt: "Accolite brand mark",
        },
        {
          label: "Office",
          src: "/experience/media/accolite/office.webp",
          thumb: "/experience/media/accolite/office-thumb.webp",
          alt: "Accolite office space",
        },
      ],
    },
    sections: [
      {
        title: "Twenty services, three industries",
        body: "Designed and built 20+ production microservices across fintech, telecom and commerce using Java, Python and Spring Boot, supporting $1M+ in transactions and 100,000+ monthly active users at 99.9% uptime.",
      },
      {
        title: "A vault for insurance data",
        body: "Designed a secure insurance data vault on AWS Lambda and SQL across 15+ providers, with 100% authentication coverage and onboarding 3x faster than before.",
      },
      {
        title: "Reliability at the TCP layer",
        body: "Improved reliability of high-traffic Java microservices by tuning TCP connection handling, adding circuit breakers and rate limiting, cutting P99 latency 40% and eliminating a class of production incidents outright.",
      },
      {
        title: "CI/CD across 8 teams",
        body: "Standardized CI/CD and canary releases across 8 teams, preventing 12+ incidents before they reached production.",
      },
    ],
  },
  {
    slug: "shriffle",
    name: "Software Engineer Intern",
    kicker: "Work",
    started: "2020-08-01",
    seo: {
      title: "Software Engineer Intern — Shriffle · Atishay Kasliwal",
      description:
        "Atishay Kasliwal's internship at Shriffle: billing microservices processing $50,000 in daily revenue, and a real-time operations dashboard.",
    },
    headline: "Billing software for money that actually had to move.",
    headlineSoft: "Shriffle, August 2020 to May 2021.",
    lede:
      "My first engineering internship. Billing microservices in Spring Boot, a real-time operations dashboard in React, and test coverage taken seriously enough that it changed what shipped.",
    spec: [
      { label: "Where", html: "<b>Shriffle Technologies</b>" },
      { label: "Dates", html: "<b>August 2020</b> – May 2021" },
    ],
    stats: [
      { value: "$50K", label: "daily revenue processed" },
      { value: "30%", label: "fewer support tickets" },
      { value: "99%", label: "test coverage" },
    ],
    links: [],
    media: {
      items: [
        {
          label: "Shriffle",
          src: "/experience/media/shriffle/logo.webp",
          thumb: "/experience/media/shriffle/logo-thumb.webp",
          alt: "Shriffle Technologies Pvt. Ltd. logo",
        },
        {
          label: "Brand",
          src: "/experience/media/shriffle/brand-2.webp",
          thumb: "/experience/media/shriffle/brand-2-thumb.webp",
          alt: "Shriffle brand mark",
        },
        {
          label: "Mark",
          src: "/experience/media/shriffle/brand-3.webp",
          thumb: "/experience/media/shriffle/brand-3-thumb.webp",
          alt: "Shriffle brand mark",
        },
      ],
    },
    sections: [
      {
        title: "Billing, at real volume",
        body: "Shipped billing microservices in Java and Spring Boot REST APIs on GCP, processing $50,000 in daily revenue, real money moving through code I'd written.",
      },
      {
        title: "A dashboard people actually used",
        body: "Owned a React operations dashboard with real-time visualization on top of the Spring Boot APIs, cutting customer support tickets by 30%.",
      },
      {
        title: "Tests that caught real bugs",
        body: "Scaled automated test coverage to 99% using JUnit and Spring Boot, fixing 15+ critical bugs before they reached production. My first real lesson in what test coverage is actually for.",
      },
    ],
  },
  {
    slug: "stony-brook-university",
    name: "M.S. in Data Science",
    kicker: "Education",
    started: "2024-08-01",
    seo: {
      title: "M.S. in Data Science — Stony Brook University · Atishay Kasliwal",
      description:
        "Atishay Kasliwal's M.S. in Data Science at Stony Brook University, 2024 to 2026: statistical learning, big data algorithms, data management, and a semester on natural language processing.",
    },
    headline: "The degree behind the LLM work.",
    headlineSoft: "Stony Brook University, 2024 to 2026.",
    lede:
      "Four semesters at Stony Brook, an M.S. in Data Science. I started with probability and statistical learning, moved into big data algorithms and data management, and spent a semester elbow-deep in natural language processing. Three of those semesters ran alongside the research role listed elsewhere on this site. Same transcript, different tab open.",
    spec: [
      { label: "Where", html: "<b>Stony Brook University</b> · New York" },
      { label: "Dates", html: "<b>August 2024</b> – May 2026" },
    ],
    stats: [],
    links: [{ label: "Visit Stony Brook University", href: "https://www.stonybrook.edu" }],
    media: {
      items: [
        {
          label: "Campus",
          src: "/experience/media/stony-brook-university/sign.webp",
          thumb: "/experience/media/stony-brook-university/sign-thumb.webp",
          alt: "Atishay Kasliwal by the Stony Brook University sign on campus",
        },
        {
          label: "Graduation",
          src: "/experience/media/stony-brook-university/graduation.webp",
          thumb: "/experience/media/stony-brook-university/graduation-thumb.webp",
          alt: "Commencement, May 21, 2026: Atishay Kasliwal receiving his diploma on stage",
        },
        {
          label: "Commencement",
          src: "/experience/media/stony-brook-university/stadium.webp",
          thumb: "/experience/media/stony-brook-university/stadium-thumb.webp",
          alt: "Stony Brook University stadium filled for commencement",
        },
      ],
    },
    sections: [
      {
        title: "The actual coursework",
        body: "Probability, statistical learning, statistical computing. Big data algorithms, big data analysis, data management. Then AMS 691, Topics in Applied Mathematics, which that semester meant natural language processing. FedTalk and Kaggriculture both lean on this coursework directly.",
      },
      {
        title: "Three semesters, one research role",
        body: "AMS 585, Internship in Data Science, shows up on the transcript three separate times: Spring 2025, Summer 2025, Spring 2026. Same research role each semester. The coursework and the job were the same work, filed under two different names.",
      },
      {
        title: "Two years, one degree",
        body: "Graduated May 21, 2026, with the degree conferred the next day. Two years, one research role running the entire time, the same role listed under Stony Brook Research on this site. No separate track, no gap between the two.",
      },
    ],
  },
  {
    slug: "symbiosis-university",
    name: "B.Tech, Computer Science",
    kicker: "Education",
    started: "2018-05-01",
    seo: {
      title: "B.Tech, Computer Science — Symbiosis University · Atishay Kasliwal",
      description:
        "Atishay Kasliwal's B.Tech in Computer Science and Information Technology at Symbiosis University, 2018 to 2022.",
    },
    headline: "Where the fundamentals actually got built.",
    headlineSoft: "Symbiosis University, 2018 to 2022.",
    lede:
      "A B.Tech in Computer Science and Information Technology at Symbiosis, 2018 to 2022. Distributed systems, machine learning, the software development lifecycle, data structures and algorithms. Four years of it, and every production system I've touched since still leans on this coursework somewhere.",
    spec: [
      { label: "Where", html: "<b>Symbiosis University</b> · Indore, India" },
      { label: "Dates", html: "<b>May 2018</b> – May 2022" },
    ],
    stats: [{ value: "22", label: "courses & workshops, 2018–2021" }],
    links: [{ label: "Visit Symbiosis University", href: "https://www.symbiosisuniversity.ac.in" }],
    media: {
      items: [
        {
          label: "Campus",
          src: "/experience/media/symbiosis-university/campus.webp",
          thumb: "/experience/media/symbiosis-university/campus-thumb.webp",
          alt: "Symbiosis University campus building",
        },
        {
          label: "Grounds",
          src: "/experience/media/symbiosis-university/campus-2.webp",
          thumb: "/experience/media/symbiosis-university/campus-2-thumb.webp",
          alt: "Symbiosis University campus grounds",
        },
        {
          label: "Buildings",
          src: "/experience/media/symbiosis-university/campus-3.webp",
          thumb: "/experience/media/symbiosis-university/campus-3-thumb.webp",
          alt: "Symbiosis University campus buildings",
        },
        {
          label: "Grounds",
          src: "/experience/media/symbiosis-university/campus-4.webp",
          thumb: "/experience/media/symbiosis-university/campus-4-thumb.webp",
          alt: "Symbiosis University campus grounds",
        },
      ],
    },
    sections: [
      {
        title: "Four years, the fundamentals",
        body: "Distributed systems. Machine learning. The software development lifecycle, data structures, algorithms. Four years of coursework that every production system I've built since has quietly depended on, whether I noticed at the time or not.",
      },
      {
        title: "Twenty-two courses on the side",
        body: "Twenty-two of them, between August 2018 and February 2021. Python for Data Science and AI from IBM, Applied Plotting, Charting and Data Representation in Python from the University of Michigan, an intro to AI and a web development track through Coursera, and a short-term program with the Computer Society of India, plus about fifteen more in machine learning, JavaScript and data science.",
      },
      {
        title: "Finished first",
        body: "Graduated in 2022, before the first engineering internship at Shriffle even started. The degree came first. Everything on this site came after it.",
      },
    ],
  },
];
