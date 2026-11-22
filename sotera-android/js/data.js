/* =========================================================
   SOTERA local demo catalog
   All entries are DEMONSTRATION DATA for the prototype.
   Official URLs point to the real provider websites.
   Pricing/ratings/review counts are illustrative only.
   ========================================================= */
window.SOTERA_DATA = (function () {
  const categories = [
    { id: 'ai', name: 'AI & ChatGPT Tools', short: 'AI Tools', icon: 'sparkles', tint: '#ede9fe', grad: 'linear-gradient(135deg,#4f46e5,#8b5cf6)' },
    { id: 'design', name: 'Design & Creative', short: 'Design', icon: 'palette', tint: '#fce7f3', grad: 'linear-gradient(135deg,#ec4899,#f97316)' },
    { id: 'programming', name: 'Programming', short: 'Programming', icon: 'code', tint: '#e0e7ff', grad: 'linear-gradient(135deg,#2563eb,#4f46e5)' },
    { id: 'writing', name: 'Writing & Research', short: 'Writing & Research', icon: 'feather', tint: '#fef3c7', grad: 'linear-gradient(135deg,#f59e0b,#f97316)' },
    { id: 'productivity', name: 'Productivity', short: 'Productivity', icon: 'zap', tint: '#d1fae5', grad: 'linear-gradient(135deg,#10b981,#0ea5e9)' },
    { id: 'education', name: 'Education', short: 'Education', icon: 'graduation-cap', tint: '#cffafe', grad: 'linear-gradient(135deg,#0891b2,#6366f1)' },
    { id: 'science', name: 'Science & Statistics', short: 'Science', icon: 'chart', tint: '#e0f2fe', grad: 'linear-gradient(135deg,#0284c7,#14b8a6)' },
    { id: 'time', name: 'Time Management', short: 'Time', icon: 'clock', tint: '#fee2e2', grad: 'linear-gradient(135deg,#ef4444,#f59e0b)' }
  ];

  const tiles = [
    'linear-gradient(135deg,#4f46e5,#8b5cf6)',
    'linear-gradient(135deg,#0ea5e9,#6366f1)',
    'linear-gradient(135deg,#f97316,#ec4899)',
    'linear-gradient(135deg,#10b981,#0d9488)',
    'linear-gradient(135deg,#8b5cf6,#ec4899)',
    'linear-gradient(135deg,#f59e0b,#f97316)',
    'linear-gradient(135deg,#2563eb,#0ea5e9)',
    'linear-gradient(135deg,#dc2626,#f97316)',
    'linear-gradient(135deg,#7c3aed,#4f46e5)',
    'linear-gradient(135deg,#0891b2,#10b981)'
  ];

  const brandIconCatalog = {
    'claude.ai': 'https://cdn.simpleicons.org/anthropic/000000/ffffff',
    'perplexity.ai': 'https://cdn.simpleicons.org/perplexity/000000/ffffff',
    'figma.com': 'https://cdn.simpleicons.org/figma/000000/ffffff',
    'notion.so': 'https://cdn.simpleicons.org/notion/000000/ffffff',
    'github.com': 'https://cdn.simpleicons.org/github/181717/ffffff',
    'zotero.org': 'https://cdn.simpleicons.org/zotero/CC0000/ffffff',
    'overleaf.com': 'https://cdn.simpleicons.org/overleaf/47a1a8/ffffff',
    'todoist.com': 'https://cdn.simpleicons.org/todoist/FF6B6B/ffffff',
    'miro.com': 'https://cdn.simpleicons.org/miro/f76604/ffffff',
    'google.com': 'https://cdn.simpleicons.org/google/4285F4/ffffff',
    'scholar.google.com': 'https://cdn.simpleicons.org/googlescholar/4285F4/ffffff',
    'quizlet.com': 'https://cdn.simpleicons.org/quizlet/4A90E2/ffffff',
    'wolframalpha.com': 'https://cdn.simpleicons.org/wolfram/CC3A00/ffffff'
  };

  function normalizeSourceUrl(value) {
    if (!value || typeof value !== 'string') return '';
    var trimmed = value.trim();
    if (!trimmed) return '';
    if (!/^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(trimmed)) trimmed = 'https://' + trimmed;
    try {
      var url = new URL(trimmed);
      if (!['http:', 'https:'].includes(url.protocol)) return '';
      return url.href;
    } catch (error) {
      return '';
    }
  }

  function extractDomain(value) {
    var url = normalizeSourceUrl(value);
    if (!url) return '';
    try {
      var host = new URL(url).hostname.toLowerCase();
      return host.replace(/^www\./, '');
    } catch (error) {
      return '';
    }
  }

  function brandIconForDomain(domain) {
    if (!domain) return '';
    var hostParts = domain.split('.');
    for (var i = 0; i < hostParts.length; i++) {
      var candidate = hostParts.slice(i).join('.');
      if (brandIconCatalog[candidate]) return brandIconCatalog[candidate];
    }
    return '';
  }

  function resolveToolLogo(tool) {
    var sourceUrl = normalizeSourceUrl(tool && (tool.sourceUrl || tool.url || tool.domain));
    var domain = extractDomain(sourceUrl || (tool && tool.domain) || '');
    if (!domain && (!tool || !tool.name)) return '';
    var manual = tool && typeof tool.logoUrl === 'string' && tool.logoUrl.trim() ? tool.logoUrl.trim() : '';
    if (manual && !/^https?:\/\//i.test(manual) && (/^[a-z][a-z0-9+.-]*:/i.test(manual) || /^\/\//.test(manual))) manual = '';
    if (manual) return manual;
    var brand = brandIconForDomain(domain);
    if (brand) return brand;
    if (sourceUrl) return 'https://www.google.com/s2/favicons?sz=128&domain_url=' + encodeURIComponent(sourceUrl);
    return '';
  }

  const raw = [
    { id: 'chatgpt', name: 'ChatGPT', cat: 'ai', pricing: 'Freemium', url: 'https://chatgpt.com', domain: 'chatgpt.com', tagline: 'Conversational AI assistant', desc: 'AI assistant for drafting, explaining concepts, brainstorming, and studying with step-by-step help.', features: ['Explain difficult concepts in simple language', 'Draft outlines, essays, and summaries', 'Practice questions and feedback'], rating: 4.8, reviews: 12400, badge: 'Popular', added: '2025-11-20', popularity: 100, platforms: ['Web', 'Mobile', 'Desktop'], student: false, offline: false, ai: true, edu: false, tag: 'Assistant' },
    { id: 'claude', name: 'Claude', cat: 'ai', pricing: 'Freemium', url: 'https://claude.ai', domain: 'claude.ai', tagline: 'AI for deep reasoning & writing', desc: 'Deep reasoning, long-form essay drafting, and clean code analysis in a focused workspace.', features: ['Long-context document analysis', 'Careful essay and report drafting', 'Readable code explanations'], rating: 4.9, reviews: 6800, badge: 'Trending', added: '2025-11-18', popularity: 96, platforms: ['Web', 'Desktop', 'Mobile'], student: false, offline: false, ai: true, edu: false, tag: 'AI Tools' },
    { id: 'perplexity', name: 'Perplexity', cat: 'writing', pricing: 'Freemium', url: 'https://www.perplexity.ai', domain: 'perplexity.ai', tagline: 'AI search with real citations', desc: 'AI-powered academic search that summarizes sources and cites the web so you can verify every claim.', features: ['Multi-source web citations', 'Follow-up research questions', 'Focus modes for academic topics'], rating: 4.7, reviews: 5200, badge: 'Updated 1h ago', added: '2025-11-22', popularity: 94, platforms: ['Web', 'Mobile'], student: false, offline: false, ai: true, edu: false, tag: 'Academic AI' },
    { id: 'napkin', name: 'Napkin AI', cat: 'ai', pricing: 'Free', url: 'https://www.napkin.ai', domain: 'napkin.ai', tagline: 'Turn notes into visuals', desc: 'Turn raw student lecture notes into explainer visuals, diagrams, and presentation-ready graphics.', features: ['Text-to-visual generation', 'Editable diagram styles', 'Export to slides and docs'], rating: 4.5, reviews: 1400, badge: 'New', added: '2025-11-25', popularity: 78, platforms: ['Web'], student: true, offline: false, ai: true, edu: true, tag: 'Visual AI' },
    { id: 'bolt', name: 'Bolt.new', cat: 'programming', pricing: 'Freemium', url: 'https://bolt.new', domain: 'bolt.new', tagline: 'Build full-stack apps in the browser', desc: 'In-browser full-stack AI web development environment. Prompt, build, and deploy production web apps without local setups.', features: ['Prompt-to-app scaffolding', 'Live in-browser dev environment', 'One-click deployment'], rating: 4.6, reviews: 3200, badge: 'Quick Launch', added: '2025-11-15', popularity: 89, platforms: ['Web'], student: false, offline: false, ai: true, edu: false, tag: 'Dev + AI' },
    { id: 'cursor', name: 'Cursor', cat: 'programming', pricing: 'Freemium', url: 'https://cursor.com', domain: 'cursor.com', tagline: 'AI-first code editor', desc: 'AI-first code editor for computer science students with intelligent repository indexing and inline edits.', features: ['Repo-wide AI indexing', 'Inline code generation and refactor', 'Terminal and multi-file edits'], rating: 4.8, reviews: 9100, badge: 'HOT', added: '2025-10-02', popularity: 93, platforms: ['Desktop'], student: true, offline: true, ai: true, edu: false, tag: 'AI Code' },
    { id: 'github-student', name: 'GitHub Student Pack', cat: 'programming', pricing: 'Free', url: 'https://education.github.com/pack', domain: 'education.github.com', tagline: 'Free developer tools for students', desc: 'Student developer bundle with free credits, domains, learning resources, and partner tools for campus projects.', features: ['Free developer credits and partners', 'Verified student eligibility', 'Cloud and deployment perks'], rating: 4.8, reviews: 8800, badge: 'NEW', added: '2025-11-21', popularity: 92, platforms: ['Web'], student: true, offline: false, ai: false, edu: true, tag: 'Student Perk' },
    { id: 'codepen', name: 'CodePen', cat: 'programming', pricing: 'Free', url: 'https://codepen.io', domain: 'codepen.io', tagline: 'Front-end playground', desc: 'Share front-end experiments, prototype UI ideas, and demo HTML, CSS, and JavaScript in the browser.', features: ['Live HTML/CSS/JS preview', 'Community examples', 'Embeddable pens for reports'], rating: 4.4, reviews: 2600, badge: '', added: '2025-09-18', popularity: 71, platforms: ['Web'], student: false, offline: false, ai: false, edu: false, tag: 'Playground' },
    { id: 'figma', name: 'Figma', cat: 'design', pricing: 'Freemium', url: 'https://www.figma.com', domain: 'figma.com', tagline: 'Collaborative interface design', desc: 'Collaborative interface design, prototyping, and design systems with a generous free education plan.', features: ['Real-time multi-user design', 'Interactive prototyping', 'Design systems and components'], rating: 4.9, reviews: 15200, badge: 'Popular', added: '2025-09-10', popularity: 95, platforms: ['Web', 'Desktop'], student: true, offline: false, ai: true, edu: true, tag: 'Interface Design' },
    { id: 'canva', name: 'Canva for Campus', cat: 'design', pricing: 'Free for Students', url: 'https://www.canva.com/education', domain: 'canva.com/education', tagline: 'Design slides, posters & social media', desc: 'Visual presentations, posters, and infographics with a large premium asset library unlocked through education verification.', features: ['100M+ design assets', 'Presentation and poster templates', 'Brand kit for student organizations'], rating: 4.7, reviews: 11000, badge: 'Edu', added: '2025-10-12', popularity: 88, platforms: ['Web', 'Mobile', 'Desktop'], student: true, offline: true, ai: true, edu: true, tag: 'Visual Design' },
    { id: 'miro', name: 'Miro', cat: 'design', pricing: 'Freemium', url: 'https://miro.com', domain: 'miro.com', tagline: 'Visual mind-mapping workspace', desc: 'Visual mind-mapping workspace designed for engineering teams, sprint planning, thesis mapping, and capstone project architecture.', features: ['Infinite collaborative canvas', 'Mind-map and flowchart templates', 'Workshop facilitation tools'], rating: 4.6, reviews: 4600, badge: 'Popular with Thesis Students', added: '2025-10-08', popularity: 84, platforms: ['Web', 'Desktop', 'Mobile'], student: true, offline: true, ai: true, edu: true, tag: 'Mind Map' },
    { id: 'photopea', name: 'Photopea', cat: 'design', pricing: 'Free', url: 'https://www.photopea.com', domain: 'photopea.com', tagline: 'Free browser photo editor', desc: 'Photoshop-style image editor that runs in the browser and opens PSD, XD, and Sketch files without installing apps.', features: ['PSD and XD compatibility', 'Advanced layer editing', 'No installation needed'], rating: 4.6, reviews: 3900, badge: '', added: '2025-08-20', popularity: 69, platforms: ['Web'], student: true, offline: false, ai: false, edu: false, tag: 'Photo Editing' },
    { id: 'excalidraw', name: 'Excalidraw', cat: 'design', pricing: 'Free', url: 'https://excalidraw.com', domain: 'excalidraw.com', tagline: 'Hand-drawn whiteboard diagrams', desc: 'Quick hand-drawn style diagrams for system design, user flows, and classroom explanations.', features: ['Hand-drawn diagram style', 'Real-time collaboration', 'Export PNG and SVG'], rating: 4.7, reviews: 2100, badge: '', added: '2025-09-30', popularity: 74, platforms: ['Web'], student: false, offline: true, ai: false, edu: false, tag: 'Whiteboard' },
    { id: 'tldraw', name: 'tldraw', cat: 'design', pricing: 'Free', url: 'https://www.tldraw.com', domain: 'tldraw.com', tagline: 'Fast collaborative whiteboard', desc: 'Fast, minimal collaborative whiteboard for sketching ideas and explaining concepts during group work.', features: ['Instant whiteboard canvas', 'Shareable room links', 'Simple export options'], rating: 4.5, reviews: 900, badge: '', added: '2025-11-05', popularity: 61, platforms: ['Web'], student: false, offline: false, ai: false, edu: false, tag: 'Whiteboard' },
    { id: 'notion', name: 'Notion', cat: 'productivity', pricing: 'Free for Students', url: 'https://www.notion.so/product/notion-for-education', domain: 'notion.so', tagline: 'All-in-one student workspace', desc: 'All-in-one student workspace for structured note-taking, course planning, assignment tracking, and shared study spaces.', features: ['Structured notes and databases', 'Course and deadline planning', 'Shared group workspaces'], rating: 4.8, reviews: 14600, badge: 'Free for Students', added: '2025-10-01', popularity: 98, platforms: ['Web', 'Desktop', 'Mobile'], student: true, offline: true, ai: true, edu: true, tag: 'Second Brain' },
    { id: 'obsidian', name: 'Obsidian', cat: 'productivity', pricing: 'Free', url: 'https://obsidian.md', domain: 'obsidian.md', tagline: 'Markdown knowledge graph', desc: 'Markdown knowledge graph for connected study notes, daily journaling, and non-linear thinking across courses.', features: ['Local-first markdown notes', 'Graph view and backlinks', 'Plugin ecosystem'], rating: 4.9, reviews: 7300, badge: 'Offline', added: '2025-09-22', popularity: 87, platforms: ['Desktop', 'Mobile'], student: false, offline: true, ai: false, edu: false, tag: 'Knowledge Base' },
    { id: 'raycast', name: 'Raycast', cat: 'productivity', pricing: 'Free', url: 'https://www.raycast.com', domain: 'raycast.com', tagline: 'Blazing-fast productivity launcher', desc: 'Blazing-fast productivity launcher with study shortcuts, clipboard history, quick math, and AI commands.', features: ['Clipboard history and snippets', 'Quick calculations and conversions', 'Extension marketplace'], rating: 4.8, reviews: 4100, badge: 'Free', added: '2025-10-25', popularity: 82, platforms: ['Desktop'], student: false, offline: true, ai: true, edu: false, tag: 'Launcher' },
    { id: 'todoist', name: 'Todoist', cat: 'time', pricing: 'Freemium', url: 'https://todoist.com', domain: 'todoist.com', tagline: 'Task and deadline manager', desc: 'Task manager for assignment deadlines, recurring study habits, and lightweight project planning.', features: ['Natural-language task entry', 'Recurring deadlines', 'Shared class projects'], rating: 4.5, reviews: 5400, badge: '', added: '2025-08-14', popularity: 72, platforms: ['Web', 'Desktop', 'Mobile'], student: false, offline: true, ai: false, edu: false, tag: 'Tasks' },
    { id: 'linear', name: 'Linear for Students', cat: 'time', pricing: 'Freemium', url: 'https://linear.app', domain: 'linear.app', tagline: 'Project tracking for group work', desc: 'Project tracking for group assignments and engineering teams with clean issue tracking and cycles.', features: ['Fast issue tracking', 'Project cycles and roadmaps', 'Team collaboration'], rating: 4.7, reviews: 2800, badge: '', added: '2025-11-02', popularity: 76, platforms: ['Web', 'Desktop', 'Mobile'], student: true, offline: false, ai: true, edu: false, tag: 'Projects' },
    { id: 'zotero', name: 'Zotero', cat: 'writing', pricing: 'Free', url: 'https://www.zotero.org', domain: 'zotero.org', tagline: 'Academic citation manager', desc: 'Free open-source research paper reference and citation bibliography manager with browser capture and Word integration.', features: ['One-click source capture', 'Automatic citations and bibliographies', 'Group libraries for research teams'], rating: 4.9, reviews: 9800, badge: 'Free & Open Source', added: '2025-09-05', popularity: 91, platforms: ['Web', 'Desktop', 'Browser Extension'], student: true, offline: true, ai: false, edu: false, tag: 'Citation' },
    { id: 'connected-papers', name: 'Connected Papers', cat: 'writing', pricing: 'Freemium', url: 'https://www.connectedpapers.com', domain: 'connectedpapers.com', tagline: 'Visual literature maps', desc: 'Visualize relationships between academic papers as a graph in seconds, so you can find related work faster.', features: ['Paper similarity graph', 'Prior and derivative works', 'Export to reference managers'], rating: 4.7, reviews: 2300, badge: 'Literature Map', added: '2025-10-06', popularity: 80, platforms: ['Web'], student: true, offline: false, ai: false, edu: false, tag: 'Research' },
    { id: 'mendeley', name: 'Mendeley Reference', cat: 'writing', pricing: 'Free', url: 'https://www.mendeley.com', domain: 'mendeley.com', tagline: 'PDF library & citation maker', desc: 'PDF library and automatic citation builder integrated with Microsoft Word for long research projects.', features: ['PDF annotation and organization', 'Word citation plugin', 'Cloud sync across devices'], rating: 4.3, reviews: 4800, badge: '', added: '2025-07-30', popularity: 70, platforms: ['Web', 'Desktop'], student: true, offline: true, ai: false, edu: true, tag: 'Citation' },
    { id: 'scispace', name: 'SciSpace', cat: 'writing', pricing: 'Freemium', url: 'https://typeset.io', domain: 'typeset.io', tagline: 'Explain complex papers', desc: 'Explain complicated scientific terms and summarize paper methodology in simpler language.', features: ['Paper explanations in plain language', 'Highlight-to-explain reader', 'Literature review assistance'], rating: 4.5, reviews: 1900, badge: 'Paper Explainer', added: '2025-10-19', popularity: 73, platforms: ['Web', 'Browser Extension'], student: true, offline: false, ai: true, edu: false, tag: 'Research AI' },
    { id: 'semantic-scholar', name: 'Semantic Scholar', cat: 'writing', pricing: 'Free', url: 'https://www.semanticscholar.org', domain: 'semanticscholar.org', tagline: 'AI academic search engine', desc: 'Free AI-powered academic search engine for finding relevant papers with citation context and TLDR summaries.', features: ['Citation context and TLDR', 'Author and venue pages', 'No account required'], rating: 4.6, reviews: 3600, badge: 'Free', added: '2025-08-28', popularity: 79, platforms: ['Web'], student: true, offline: false, ai: true, edu: false, tag: 'Academic Search' },
    { id: 'researchrabbit', name: 'ResearchRabbit', cat: 'writing', pricing: 'Free', url: 'https://www.researchrabbitapp.com', domain: 'researchrabbitapp.com', tagline: 'Discover related research', desc: 'Follow citations and discover related research through visual collections and author networks.', features: ['Visual citation network', 'Smart paper recommendations', 'Shared research collections'], rating: 4.4, reviews: 1200, badge: '', added: '2025-09-14', popularity: 65, platforms: ['Web'], student: true, offline: false, ai: false, edu: false, tag: 'Discovery' },
    { id: 'overleaf', name: 'Overleaf', cat: 'writing', pricing: 'Freemium', url: 'https://www.overleaf.com', domain: 'overleaf.com', tagline: 'Online LaTeX editor', desc: 'Online LaTeX editor with templates for theses, journals, and collaborative academic writing.', features: ['Real-time LaTeX collaboration', 'Publisher and thesis templates', 'Version history'], rating: 4.7, reviews: 4200, badge: 'LaTeX', added: '2025-09-08', popularity: 83, platforms: ['Web'], student: true, offline: false, ai: false, edu: true, tag: 'Academic Writing' },
    { id: 'jenni', name: 'Jenni AI', cat: 'writing', pricing: 'Freemium', url: 'https://jenni.ai', domain: 'jenni.ai', tagline: 'Essay writing assistant', desc: 'Supercharged academic literature review and essay writing assistant with automatic in-text citations.', features: ['Automatic in-text citations', 'Paraphrase and expand tools', 'Research library integration'], rating: 4.4, reviews: 1700, badge: '', added: '2025-10-11', popularity: 68, platforms: ['Web', 'Desktop'], student: true, offline: false, ai: true, edu: false, tag: 'Essay AI' },
    { id: 'grammarly', name: 'Grammarly', cat: 'writing', pricing: 'Freemium', url: 'https://www.grammarly.com', domain: 'grammarly.com', tagline: 'Writing clarity assistant', desc: 'Grammar, clarity, and tone suggestions across essays, emails, and applications.', features: ['Grammar and spelling checks', 'Tone and clarity suggestions', 'Browser and desktop integration'], rating: 4.6, reviews: 13500, badge: '', added: '2025-07-12', popularity: 77, platforms: ['Web', 'Desktop', 'Browser Extension'], student: true, offline: false, ai: true, edu: true, tag: 'Writing' },
    { id: 'googlescholar', name: 'Google Scholar', cat: 'writing', pricing: 'Free', url: 'https://scholar.google.com', domain: 'scholar.google.com', tagline: 'Broad academic index', desc: 'Broad academic search index for papers, citations, theses, and court opinions across disciplines.', features: ['Citation tracking', 'Alerts for new research', 'Library access links'], rating: 4.5, reviews: 8900, badge: '', added: '2025-06-30', popularity: 81, platforms: ['Web'], student: true, offline: false, ai: false, edu: false, tag: 'Academic Search' },
    { id: 'deepl', name: 'DeepL', cat: 'writing', pricing: 'Freemium', url: 'https://www.deepl.com', domain: 'deepl.com', tagline: 'High-quality translation', desc: 'High-quality translation for international papers, exchange programs, and multilingual assignments.', features: ['Natural translations', 'Document translation', 'Glossary support'], rating: 4.7, reviews: 6100, badge: '', added: '2025-08-08', popularity: 75, platforms: ['Web', 'Desktop', 'Mobile'], student: false, offline: false, ai: true, edu: false, tag: 'Translation' },
    { id: 'hackmd', name: 'HackMD', cat: 'writing', pricing: 'Freemium', url: 'https://hackmd.io', domain: 'hackmd.io', tagline: 'Collaborative markdown notes', desc: 'Collaborative markdown notes for group reports, lab documentation, and shared lecture summaries.', features: ['Real-time markdown collaboration', 'Slide mode', 'Version history'], rating: 4.5, reviews: 1100, badge: '', added: '2025-10-16', popularity: 63, platforms: ['Web'], student: false, offline: false, ai: false, edu: false, tag: 'Markdown' },
    { id: 'wolfram', name: 'Wolfram Alpha', cat: 'science', pricing: 'Freemium', url: 'https://www.wolframalpha.com', domain: 'wolframalpha.com', tagline: 'Computational knowledge engine', desc: 'Computational knowledge engine for math, physics, chemistry, and engineering problem solving.', features: ['Step-by-step math solutions', 'Data and unit conversions', 'Plotting and analysis'], rating: 4.6, reviews: 7600, badge: '', added: '2025-07-22', popularity: 74, platforms: ['Web', 'Mobile'], student: true, offline: false, ai: true, edu: false, tag: 'Math' },
    { id: 'desmos', name: 'Desmos', cat: 'science', pricing: 'Free', url: 'https://www.desmos.com', domain: 'desmos.com', tagline: 'Graphing calculator', desc: 'Free online graphing calculator for functions, statistics, geometry, and classroom demonstrations.', features: ['Interactive graphing', 'Geometry and 3D tools', 'Shareable class activities'], rating: 4.8, reviews: 9300, badge: 'Free', added: '2025-06-18', popularity: 78, platforms: ['Web', 'Mobile'], student: true, offline: true, ai: false, edu: true, tag: 'Graphing' },
    { id: 'otter', name: 'Otter.ai', cat: 'education', pricing: 'Freemium', url: 'https://otter.ai', domain: 'otter.ai', tagline: 'Lecture transcription', desc: 'Automatic lecture transcription and meeting notes with speaker labels and searchable summaries.', features: ['Live transcription', 'Speaker identification', 'Searchable notes and highlights'], rating: 4.4, reviews: 6800, badge: '', added: '2025-08-02', popularity: 72, platforms: ['Web', 'Mobile', 'Browser Extension'], student: true, offline: false, ai: true, edu: false, tag: 'Transcription' },
    { id: 'whisper-memos', name: 'Whisper Memos', cat: 'education', pricing: 'Freemium', url: 'https://whispermemos.com', domain: 'whispermemos.com', tagline: 'Lecture audio to markdown', desc: 'Transcribe university lecture audio into structured markdown notes and searchable summaries.', features: ['Audio-to-markdown notes', 'Automatic formatting', 'Summary generation'], rating: 4.3, reviews: 600, badge: 'Trending', added: '2025-11-24', popularity: 70, platforms: ['Web', 'Mobile'], student: true, offline: false, ai: true, edu: false, tag: 'Transcription' },
    { id: 'quizlet', name: 'Quizlet', cat: 'education', pricing: 'Freemium', url: 'https://quizlet.com', domain: 'quizlet.com', tagline: 'Flashcards & study sets', desc: 'Flashcards, practice tests, and study sets for memorizing terminology across courses.', features: ['Flashcard study modes', 'Practice tests', 'Shared class study sets'], rating: 4.4, reviews: 11800, badge: '', added: '2025-07-05', popularity: 71, platforms: ['Web', 'Mobile'], student: true, offline: true, ai: true, edu: false, tag: 'Flashcards' },
    { id: 'anki', name: 'Anki', cat: 'education', pricing: 'Free', url: 'https://apps.ankiweb.net', domain: 'apps.ankiweb.net', tagline: 'Spaced repetition flashcards', desc: 'Powerful spaced-repetition flashcards for long-term retention of facts, vocabulary, and formulas.', features: ['Spaced repetition algorithm', 'Powerful card customization', 'Free desktop and Android app'], rating: 4.7, reviews: 5600, badge: 'Open Source', added: '2025-06-25', popularity: 73, platforms: ['Desktop', 'Mobile'], student: true, offline: true, ai: false, edu: false, tag: 'Memory' },
    { id: 'gamma', name: 'Gamma App', cat: 'education', pricing: 'Freemium', url: 'https://gamma.app', domain: 'gamma.app', tagline: 'Presentation generator', desc: 'Turn lecture outlines and notes into polished, interactive slide decks in a few prompts.', features: ['Outline-to-slides generation', 'Interactive presentation format', 'Export to PDF and PowerPoint'], rating: 4.5, reviews: 2900, badge: 'Presentation', added: '2025-10-03', popularity: 76, platforms: ['Web'], student: true, offline: false, ai: true, edu: false, tag: 'Slides' },
    { id: 'huggingface', name: 'Hugging Face', cat: 'ai', pricing: 'Freemium', url: 'https://huggingface.co', domain: 'huggingface.co', tagline: 'Open AI models & datasets', desc: 'Explore open AI models, datasets, and demos to learn how modern machine learning is built.', features: ['Model and dataset hub', 'Interactive hosted demos', 'Learning courses and docs'], rating: 4.8, reviews: 4300, badge: 'Open Source', added: '2025-09-26', popularity: 85, platforms: ['Web'], student: true, offline: true, ai: true, edu: true, tag: 'AI Platform' }
  ];

  const tools = raw.map((t, i) => {
    const cat = categories.find(c => c.id === t.cat) || categories[0];
    const sourceUrl = normalizeSourceUrl(t.sourceUrl || t.url || '');
    const domain = extractDomain(sourceUrl || t.domain || '');
    const logoUrl = resolveToolLogo({ ...t, sourceUrl, domain });
    const logoSource = t.logoUrl ? 'manual' : (brandIconForDomain(domain) ? 'brand' : (sourceUrl ? 'favicon' : 'fallback'));
    return Object.assign({}, t, {
      sourceUrl: sourceUrl || t.url || '',
      domain: domain || t.domain || '',
      logoUrl: logoUrl || t.logoUrl || '',
      logoSource: logoSource,
      isLogoVerified: Boolean(t.isLogoVerified || logoSource === 'manual' || logoSource === 'brand'),
      catName: cat.name,
      catShort: cat.short,
      initial: t.name.replace(/[^A-Za-z0-9 ]/g, '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      tile: tiles[i % tiles.length],
      verified: true
    });
  });

  const collections = [
    { id: 'ai', name: 'My AI Assistants', icon: 'sparkles', cats: ['ai'], desc: 'Prompt craft, paper summarizers, synthesis tools.', bg: 'linear-gradient(145deg,#f5f3ff,#ede9fe)', fg: '#4f46e5' },
    { id: 'thesis', name: 'Thesis & Academic', icon: 'book-open', cats: ['writing', 'science'], desc: 'Citation graphs, semantic scholar engines, reference tools.', bg: 'linear-gradient(145deg,#fffbeb,#fef3c7)', fg: '#d97706' },
    { id: 'design', name: 'Design & UI Assets', icon: 'palette', cats: ['design'], desc: 'Interaction libraries, palettes, visual labs and canvases.', bg: 'linear-gradient(145deg,#fdf2f8,#fce7f3)', fg: '#db2777' },
    { id: 'daily', name: 'Daily Productivity', icon: 'clock', cats: ['productivity', 'time'], desc: 'Task blocks, habit loops, focus timers and planners.', bg: 'linear-gradient(145deg,#ecfdf5,#d1fae5)', fg: '#059669' }
  ];

  const updates = [
    { id: 'u1', toolId: 'notion', title: 'Notion AI 2.0 Released: Now integrates directly with your course databases', kind: 'Academic Release', read: '3 min read', date: 'Oct 12, 2025', tone: 'academic', cta: 'Read' },
    { id: 'u2', toolId: 'github-student', title: 'GitHub Student Developer Pack adds 5 new generative AI partner credits', kind: 'Developer Grant', read: 'Free Tier', date: 'Oct 15, 2025', tone: 'new', cta: 'Claim' },
    { id: 'u3', toolId: 'perplexity', title: 'Perplexity launches deep research mode with multi-source citations', kind: 'Product Update', read: '2 min read', date: 'Oct 09, 2025', tone: 'update', cta: 'Read' },
    { id: 'u4', toolId: 'whisper-memos', title: 'Whisper Memos improves lecture transcription accuracy for noisy classrooms', kind: 'Product Update', read: '2 min read', date: 'Oct 04, 2025', tone: 'update', cta: 'Read' }
  ];

  const topics = ['#ThesisHacks', '#NoCodeDesign', '#OpenSourceEdu', '#MathSolvers', '#ResearchWorkflows', '#CampusAI', '#StudyWithMe'];

  const prompts = [
    { id: 'p1', title: 'Buat Slide Presentasi Otomatis', desc: 'Bikin slide tugas kelompok cepat dari bahan bacaan.', tag: 'Presentasi', icon: 'file-text', tile: 'linear-gradient(135deg,#4f46e5,#8b5cf6)', keys: ['slides', 'presentasi', 'presentation'] },
    { id: 'p2', title: 'AI Coding & Debugging Praktis', desc: 'Asistensi sintaks, debug error, dan review kode tugas.', tag: 'CS & IT', icon: 'code', tile: 'linear-gradient(135deg,#2563eb,#0ea5e9)', keys: ['coding', 'code', 'programming', 'debug'] },
    { id: 'p3', title: 'Ringkas Jurnal & Sitasi Ilmiah', desc: 'Analisis paper akademik cepat dan generator sitasi.', tag: 'Riset', icon: 'book-open', tile: 'linear-gradient(135deg,#f59e0b,#f97316)', keys: ['jurnal', 'paper', 'sitasi', 'research', 'citation'] },
    { id: 'p4', title: 'Desain Poster & Template BEM', desc: 'Template modern siap pakai untuk publikasi organisasi.', tag: 'Kreatif', icon: 'palette', tile: 'linear-gradient(135deg,#ec4899,#f97316)', keys: ['desain', 'poster', 'design', 'template'] },
    { id: 'p5', title: 'Manajemen Jadwal & Produktivitas', desc: 'Tracking deadline tugas, kalender kuliah, dan fokus.', tag: 'Produktivitas', icon: 'calendar', tile: 'linear-gradient(135deg,#10b981,#0ea5e9)', keys: ['jadwal', 'produktivitas', 'schedule', 'deadline', 'task'] }
  ];

  const guideCards = [
    { id: 'getting-started', title: 'Getting Started', desc: 'Create an account, explore the directory, and save your first tools.', icon: 'compass' },
    { id: 'saving', title: 'Saving & Collections', desc: 'How saved tools and curated folders work in SOTERA.', icon: 'bookmark' },
    { id: 'assistant', title: 'Bantu Cari Aku', desc: 'Use the local recommendation assistant to find the right tool.', icon: 'sparkles' },
    { id: 'verification', title: 'Campus Verification', desc: 'Understand .edu email verification and student-only perks.', icon: 'badge-check' },
    { id: 'account', title: 'Account & Security', desc: 'Password, email change, and account deletion safety.', icon: 'shield' },
    { id: 'privacy', title: 'Privacy & Data', desc: 'How this prototype stores demo data on your device.', icon: 'lock' }
  ];

  const faqs = [
    { q: 'Does SOTERA create or host the tools listed here?', a: 'No. SOTERA is a directory. Each tool opens on the provider\'s official website. We do not host, run, or modify third-party tools.' },
    { q: 'Is the account system real?', a: 'This is a front-end prototype. Sign up, login, verification, and account changes are simulated locally in your browser using localStorage. No server authentication exists.' },
    { q: 'Are the ratings and review counts real?', a: 'No. Ratings, review counts, and update dates in this build are demonstration data used to reproduce the design. Tool names and official URLs are real.' },
    { q: 'How do I save a tool to Collections?', a: 'Tap the bookmark icon on any tool card or open a tool detail and press Save. Favorites persist in your browser across reloads.' },
    { q: 'What does Bantu Cari Aku use?', a: 'It uses a local keyword-matching ruleset over the demo catalog. It is not connected to an AI API or cloud service.' },
    { q: 'Why do some features ask me to sign in?', a: 'Collections, verified-student perks, and the assistant workspace are presented as member features. You can test them by creating a simulated account or signing in with any valid-looking email.' },
    { q: 'How do I change the app language?', a: 'Open Settings → Language, choose English or Bahasa Indonesia, then press Apply Language. Core interface labels update immediately.' }
  ];

  return {
    categories,
    tools,
    collections,
    updates,
    topics,
    prompts,
    guideCards,
    faqs,
    tiles,
    normalizeSourceUrl,
    extractDomain,
    resolveToolLogo,
    brandIconCatalog
  };
})();
