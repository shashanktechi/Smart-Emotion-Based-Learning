import { useState, useRef, useCallback, useEffect } from 'react';
import { useWebcam } from '../hooks/useWebcam';
import { useEmotion } from '../hooks/useEmotion';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import nodeClient from '../api/nodeClient';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { 
    LogOut, Activity, BookOpen, Clock, Wifi, WifiOff,
    Volume2, VolumeX, MessageSquare, Send, X, Bot, Sparkles, HelpCircle,
    Library, Plus
} from 'lucide-react';

// Converts any YouTube URL to embed format
const toEmbedUrl = (url) => {
    if (!url) return '';
    let videoId = '';
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) videoId = shortMatch[1];
    const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (longMatch) videoId = longMatch[1];
    const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return url.split('?')[0];
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    return url;
};

const EMOTION_CONFIG = {
    focus: { emoji: '🎯', color: '#3b82f6', label: 'Focused', bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    confusion: { emoji: '🤔', color: '#f59e0b', label: 'Confused', bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    boredom: { emoji: '😴', color: '#f43f5e', label: 'Bored', bg: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
    happiness: { emoji: '😊', color: '#10b981', label: 'Happy', bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    frustration: { emoji: '😤', color: '#ec4899', label: 'Frustrated', bg: 'bg-pink-500/10 text-pink-500 border-pink-500/20' },
    surprise: { emoji: '😮', color: '#8b5cf6', label: 'Surprised', bg: 'bg-violet-500/10 text-violet-500 border-violet-500/20' }
};

const emotionToScore = { focus: 6, happiness: 5, surprise: 4, confusion: 3, frustration: 2, boredom: 1 };

export default function Learning() {
    const { user, logout } = useAuth();
    const { isDark } = useTheme();
    const { currentEmotion, isPredicting, predictEmotion } = useEmotion();
    const { videoRef, isStreaming, error: webcamError } = useWebcam(5000, predictEmotion);
    const [emotionHistory, setEmotionHistory] = useState([]);

    // Custom Student learning preferences
    const [topicPreference, setTopicPreference] = useState('all'); // 'all', 'ai', 'tools', 'real_world'

    // Text to Speech
    const [isSpeaking, setIsSpeaking] = useState(false);

    // AI Chatbot
    const [showChat, setShowChat] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState([
        { sender: 'bot', text: 'Hi! I am your EmoLearn AI Tutor 🤖. Ask me anything about your courses, study tips, or career guidance!' }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef(null);

    // Course Library
    const [showLibrary, setShowLibrary] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState(null);

    // Add Course Modal for Students
    const [showAddModal, setShowAddModal] = useState(false);
    const [contentForm, setContentForm] = useState({ title: '', description: '', type: 'text', difficulty: '1', emotion_trigger: 'none', youtube_url: '' });
    const [isCreatingContent, setIsCreatingContent] = useState(false);
    const [contentError, setContentError] = useState('');

    // Auto-scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages, isTyping]);

    // Track emotion history for chart
    useEffect(() => {
        if (currentEmotion) {
            setEmotionHistory(prev => {
                const newEntry = {
                    time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    score: emotionToScore[currentEmotion] || 2,
                    emotion: currentEmotion
                };
                const updated = [...prev, newEntry];
                return updated.slice(-20); // Keep last 20 entries
            });
        }
    }, [currentEmotion]);

    // Fetch adaptive content
    const { data: adaptiveContent, isLoading: contentLoading } = useQuery({
        queryKey: ['adaptiveContent', currentEmotion],
        queryFn: async () => {
            const res = await nodeClient.get(`/content/adaptive?emotion=${currentEmotion}`);
            return res.data;
        },
        enabled: !!currentEmotion,
        retry: 1,
        staleTime: 10000
    });

    // Fetch all content for Library
    const { data: allContent, refetch: refetchAllContent } = useQuery({
        queryKey: ['allContent'],
        queryFn: async () => {
            const res = await nodeClient.get('/content');
            return res.data;
        }
    });

    // Handle Student adding a course
    const handleAddContentSubmit = async (e) => {
        e.preventDefault();
        setContentError('');
        if (!contentForm.title.trim() || !contentForm.description.trim()) {
            return setContentError('Title and description are required');
        }
        setIsCreatingContent(true);
        try {
            const body = {
                title: contentForm.title.trim(),
                description: contentForm.description.trim(),
                type: contentForm.type,
                difficulty: parseInt(contentForm.difficulty, 10),
                emotion_trigger: contentForm.emotion_trigger === 'none' ? null : contentForm.emotion_trigger,
                youtube_url: toEmbedUrl(contentForm.youtube_url) || ''
            };
            await nodeClient.post('/content', body);
            setShowAddModal(false);
            setContentForm({ title: '', description: '', type: 'text', difficulty: '1', emotion_trigger: 'none', youtube_url: '' });
            refetchAllContent();
        } catch (err) {
            setContentError('Failed to create course');
        } finally {
            setIsCreatingContent(false);
        }
    };

    // Determine which content to show: manually selected or adaptive
    const content = selectedCourseId && allContent 
        ? allContent.find(c => c.id === selectedCourseId)
        : adaptiveContent;

    // Handle Text to Speech
    const speakContent = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }
        if (content) {
            window.speechSynthesis.cancel();
            const textToSpeak = `${content.title}. ${content.description}`;
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);
            setIsSpeaking(true);
            window.speechSynthesis.speak(utterance);
        }
    };

    // Cancel speaking on content change
    useEffect(() => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }, [content]);

    useEffect(() => {
        return () => window.speechSynthesis.cancel();
    }, []);

    // Filter content on frontend based on student learning preferences
    const matchesPreference = (title = '', desc = '') => {
        if (topicPreference === 'all') return true;
        const text = `${title} ${desc}`.toLowerCase();
        
        const keywords = {
            ai: ['neural', 'network', 'ai', 'cnn', 'deep', 'intelligence', 'model', 'concept', 'convolution', 'machine learning', 'transformer', 'ml'],
            programming: ['python', 'java', 'c programming', 'code', 'coding', 'syntax', 'variable', 'function', 'oop', 'class', 'loop', 'programming', 'language'],
            dsa: ['data structure', 'algorithm', 'array', 'linked list', 'stack', 'queue', 'tree', 'graph', 'sorting', 'dsa', 'dynamic programming', 'binary', 'hash'],
            webdev: ['html', 'css', 'javascript', 'web', 'frontend', 'backend', 'react', 'dom', 'website', 'responsive', 'api', 'rest'],
            database: ['sql', 'database', 'mysql', 'query', 'join', 'table', 'schema', 'normalization', 'index', 'relational'],
            real_world: ['example', 'practice', 'case', 'industry', 'experience', 'quantum', 'breathing', 'meditation', 'exercise', 'project', 'interview', 'career', 'netflix', 'spotify']
        };

        return (keywords[topicPreference] || []).some(kw => text.includes(kw));
    };

    const hasMatch = content && matchesPreference(content.title, content.description);

    // AI Chatbot — Smart Context-Aware Responses
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const userMsg = chatInput.trim();
        setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setChatInput('');
        setIsTyping(true);

        setTimeout(() => {
            const query = userMsg.toLowerCase();
            const emotionContext = currentEmotion ? ` (I can see you're feeling ${EMOTION_CONFIG[currentEmotion]?.label || currentEmotion} right now.)` : '';
            const contentContext = content ? ` You're currently studying: "${content.title}".` : '';
            let reply = '';

            // Python
            if (query.includes('python') || query.includes('pip') || query.includes('django') || query.includes('flask')) {
                reply = `Python is one of the most beginner-friendly and versatile languages! 🐍 It's used in AI/ML, web dev (Django/Flask), automation, and data science. Start with variables, lists, loops, and functions.${emotionContext}`;
            }
            // Java
            else if (query.includes('java') && !query.includes('javascript')) {
                reply = `Java is the enterprise powerhouse! ☕ It's strongly typed, platform-independent ("Write Once, Run Anywhere"), and dominates Android development, banking systems, and large-scale backend services. Master OOP concepts first.${emotionContext}`;
            }
            // C Programming
            else if (query.includes(' c ') || query.includes('c programming') || query.includes('pointer') || query.includes('memory management')) {
                reply = `C is the foundation of modern computing! 💡 It gives you direct hardware access through pointers and memory management. Linux, Windows kernels, and embedded systems are all written in C. Master pointers and you'll understand how computers really work.${emotionContext}`;
            }
            // DSA
            else if (query.includes('dsa') || query.includes('data structure') || query.includes('algorithm') || query.includes('linked list') || query.includes('binary tree') || query.includes('sorting')) {
                reply = `DSA is the KEY to cracking coding interviews at FAANG companies! 🎯 Focus on: Arrays → Linked Lists → Stacks/Queues → Trees → Graphs → Dynamic Programming. Practice on LeetCode daily. Start with the easy problems and build up!${emotionContext}`;
            }
            // Web Development
            else if (query.includes('web') || query.includes('html') || query.includes('css') || query.includes('javascript') || query.includes('react') || query.includes('frontend')) {
                reply = `Web development is the most visual and rewarding field! 🌐 Start with HTML (structure) → CSS (styling) → JavaScript (logic). Then pick a framework: React, Vue, or Angular. Build projects — a portfolio, a todo app, a weather app.${emotionContext}`;
            }
            // Database / SQL
            else if (query.includes('sql') || query.includes('database') || query.includes('mysql') || query.includes('query') || query.includes('join')) {
                reply = `Databases are the backbone of every application! 🗄️ Learn SQL fundamentals: SELECT, WHERE, JOIN, GROUP BY, subqueries. Then understand normalization, indexing, and when to use NoSQL vs SQL. Every developer needs database skills!${emotionContext}`;
            }
            // Machine Learning / AI
            else if (query.includes('ml') || query.includes('machine learning') || query.includes('neural') || query.includes('deep learning') || query.includes('ai ') || query.includes('artificial intelligence')) {
                reply = `Machine Learning is the future! 🧠 Start with: Linear Regression → Classification → Decision Trees → Neural Networks → CNNs → Transformers. Use Python with scikit-learn for basics, then move to TensorFlow/PyTorch for deep learning.${emotionContext}`;
            }
            // Study Tips
            else if (query.includes('study') || query.includes('learn') || query.includes('tips') || query.includes('how to') || query.includes('improve')) {
                reply = `Here are proven study techniques! 📚 1) Pomodoro: 25 min focus + 5 min break. 2) Active recall: close the book and try to explain. 3) Spaced repetition: review after 1 day, 3 days, 7 days. 4) Teach others — it's the best way to solidify knowledge.${emotionContext}`;
            }
            // Motivation
            else if (query.includes('motivat') || query.includes('give up') || query.includes('hard') || query.includes('difficult') || query.includes('can\'t')) {
                reply = `Every expert was once a beginner! 💪 Remember: coding is like learning a language — it takes consistent practice, not talent. Take breaks, celebrate small wins, and remember WHY you started. You're already ahead of 90% of people just by learning!${emotionContext}`;
            }
            // Interview / Career
            else if (query.includes('interview') || query.includes('career') || query.includes('job') || query.includes('resume') || query.includes('placement')) {
                reply = `For tech interviews, focus on: 🎯 1) DSA (LeetCode 150 questions). 2) System Design basics. 3) One language deeply (Python/Java). 4) Build 2-3 portfolio projects. 5) Practice mock interviews. Companies care more about problem-solving than memorization!${emotionContext}`;
            }
            // Project Ideas
            else if (query.includes('project') || query.includes('build') || query.includes('idea') || query.includes('portfolio')) {
                reply = `Great project ideas: 🚀 Beginner: Todo App, Calculator, Weather App. Intermediate: Blog Platform, E-commerce site, Chat App. Advanced: ML-powered recommendation system, Real-time collaborative editor, Social media clone. Pick something you're passionate about!${emotionContext}`;
            }
            // Confusion / Help
            else if (query.includes('confus') || query.includes('understand') || query.includes('explain') || query.includes('what is')) {
                reply = `No worries, confusion is a sign your brain is growing! 🤔 Try breaking the concept into smaller pieces. Watch a different video explanation — sometimes a new perspective helps. Would you like me to suggest simpler resources for your current topic?${contentContext}${emotionContext}`;
            }
            // Boredom
            else if (query.includes('bore') || query.includes('slow') || query.includes('harder') || query.includes('easy')) {
                reply = `Feeling unchallenged? 🚀 Try these: 1) Solve a harder LeetCode problem. 2) Build a mini-project in 1 hour. 3) Learn a new language (Rust, Go, Kotlin). 4) Try competitive programming on Codeforces. The key is pushing your boundaries!${emotionContext}`;
            }
            // Who are you
            else if (query.includes('who') || query.includes('bot') || query.includes('tutor') || query.includes('assistant') || query.includes('name')) {
                reply = `I'm your EmoLearn AI Tutor! 🤖 I monitor your emotional state through your webcam and help adapt your learning experience. I can answer questions about programming, DSA, career advice, study tips, and more. Ask me anything!${emotionContext}`;
            }
            // Password / Account
            else if (query.includes('reset') || query.includes('password') || query.includes('forgot') || query.includes('login') || query.includes('account')) {
                reply = `To reset your password: Go to the login screen → Click "Forgot Password?" → Enter your email → You'll get a reset link (shown directly on screen in dev mode, or via email if Gmail is configured). You can also ask your Admin to reset it from their panel! 🔐`;
            }
            // Exam
            else if (query.includes('exam') || query.includes('test') || query.includes('prepar') || query.includes('revision')) {
                reply = `Exam preparation strategy: 📝 1) Start 2 weeks early. 2) Make a topic checklist. 3) Practice past papers. 4) Use active recall (not just reading). 5) Sleep well before the exam — your brain consolidates memory during sleep. 6) Focus on weak areas first!${emotionContext}`;
            }
            // Thanks
            else if (query.includes('thank') || query.includes('awesome') || query.includes('great') || query.includes('helpful')) {
                reply = `You're welcome! 😊 Keep up the amazing work. Remember, consistency is the key to mastering any skill. I'm always here to help whenever you need guidance. Happy learning! 🌟`;
            }
            // Default — context-aware fallback
            else {
                reply = `Great question! 💡 While I'm thinking about that, here's some advice: break complex problems into smaller steps, practice daily, and don't be afraid to Google things — even senior developers do it constantly!${contentContext}${emotionContext} Feel free to ask about Python, Java, DSA, Web Dev, career tips, or study strategies!`;
            }

            setChatMessages(prev => [...prev, { sender: 'bot', text: reply }]);
            setIsTyping(false);
        }, 700 + Math.random() * 500); // Variable delay for realism
    };

    const cfg = EMOTION_CONFIG[currentEmotion] || EMOTION_CONFIG.focus;
    const initials = user ? `${(user.first_name || 'S')[0]}${(user.last_name || 'U')[0]}`.toUpperCase() : 'SU';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-all duration-300">
            
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity no-underline text-inherit">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-indigo-500/20">🧠</div>
                        <span className="font-extrabold text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-600">Smart emotion based Learning</span>
                    </Link>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${cfg.bg}`}>
                        {isStreaming ? 'LIVE' : 'OFFLINE'}
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                        >
                            <Plus size={13} /> Add Course
                        </button>
                        <button 
                            onClick={() => setShowLibrary(true)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-xs font-semibold transition-all cursor-pointer"
                        >
                            <Library size={13} /> Course Library
                        </button>
                    </div>
                    <ThemeToggle />
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-black shadow-md shadow-indigo-500/10">
                            {initials}
                        </div>
                        <span className="hidden sm:inline text-sm font-semibold text-slate-600 dark:text-slate-300">
                            {user?.first_name || 'Student'}
                        </span>
                    </div>
                    <button onClick={logout} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-500/30 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 text-xs font-semibold transition-all cursor-pointer">
                        <LogOut size={13} /> Logout
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start pb-20">
                {/* Left Column: Content + Chart */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    
                    {/* Topic Preference Selection Row */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Learning Track</span>
                            <span className="text-xs font-semibold">Choose your preferred study topic below:</span>
                        </div>
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex-wrap">
                            {[
                                { key: 'all', label: 'All Topics' },
                                { key: 'ai', label: '🧠 AI / ML' },
                                { key: 'programming', label: '💻 Programming' },
                                { key: 'dsa', label: '🎯 DSA' },
                                { key: 'webdev', label: '🌐 Web Dev' },
                                { key: 'database', label: '🗄️ Database' },
                                { key: 'real_world', label: '🌟 Examples' }
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setTopicPreference(tab.key)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        topicPreference === tab.key ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-500' : 'text-slate-500 dark:text-slate-400'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Emotion Status Bar */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{cfg.emoji}</span>
                            <div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Detected State</div>
                                <div className="text-lg font-black" style={{ color: cfg.color }}>{cfg.label}</div>
                            </div>
                            {isPredicting && (
                                <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium ml-4 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                                    <Activity size={13} className="animate-pulse" />
                                    Analyzing...
                                </span>
                            )}
                        </div>
                        <div className="flex gap-6">
                            <div className="text-center">
                                <div className="text-[9px] text-slate-400 font-bold tracking-wider uppercase">Session Readings</div>
                                <div className="text-base font-black mt-0.5">{emotionHistory.length}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-[9px] text-slate-400 font-bold tracking-wider uppercase">Camera</div>
                                <div className={`text-xs font-bold mt-1 flex items-center gap-1 ${isStreaming ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {isStreaming ? <><Wifi size={13} /> Active</> : <><WifiOff size={13} /> Off</>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Adaptive Content Card */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[220px]">
                        {contentLoading ? (
                            <div className="flex flex-col gap-4 animate-pulse">
                                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3" />
                                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-full" />
                                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-4/5" />
                            </div>
                        ) : content ? (
                            <div className="animate-fade-in relative">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <BookOpen size={16} className="text-indigo-500" />
                                        <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">
                                            {content.type || 'Module'} • Difficulty {content.difficulty || 1}/4
                                        </span>
                                    </div>
                                    
                                    {/* Text to Speech Voice Assistant Toggle Button */}
                                    <button 
                                        onClick={speakContent}
                                        className={`flex items-center gap-1 px-3 py-1.5 border rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer ${
                                            isSpeaking 
                                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20' 
                                                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500 hover:bg-indigo-500/20'
                                        }`}
                                    >
                                        {isSpeaking ? <><VolumeX size={13} /> Stop Voice</> : <><Volume2 size={13} /> Voice Assistant</>}
                                    </button>
                                </div>

                                {hasMatch ? (
                                    <>
                                        {selectedCourseId && (
                                            <div className="mb-3">
                                                <span className="inline-flex items-center px-2 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold rounded-md">
                                                    Manual Selection Mode
                                                </span>
                                                <button onClick={() => setSelectedCourseId(null)} className="ml-2 text-[10px] text-indigo-500 hover:underline">
                                                    Return to Adaptive Mode
                                                </button>
                                            </div>
                                        )}
                                        <h2 className="text-2xl font-black mb-3 leading-snug">
                                            {content.title}
                                        </h2>
                                        <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-4">
                                            {content.description}
                                        </p>
                                        
                                        {content.youtube_url && (
                                            <div className="w-full aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 mt-4 bg-black">
                                                <iframe 
                                                    width="100%" 
                                                    height="100%" 
                                                    src={toEmbedUrl(content.youtube_url)} 
                                                    title="YouTube video player" 
                                                    frameBorder="0" 
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                                    allowFullScreen
                                                ></iframe>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                        <div className="flex items-center gap-2 text-xs font-extrabold text-amber-500 mb-2">
                                            <Sparkles size={14} /> Topic Match Notice
                                        </div>
                                        <p className="text-xs text-slate-400 leading-normal mb-4">
                                            No modules match your chosen preference (<strong>{topicPreference}</strong>) for your current emotion ({cfg.label}). Showing default track module:
                                        </p>
                                        <h3 className="font-bold text-sm mb-1 text-slate-700 dark:text-slate-200">{content.title}</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{content.description}</p>
                                        {content.youtube_url && (
                                            <div className="w-full aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 mt-4 bg-black">
                                                <iframe 
                                                    width="100%" 
                                                    height="100%" 
                                                    src={toEmbedUrl(content.youtube_url)} 
                                                    title="YouTube video player" 
                                                    frameBorder="0" 
                                                    allowFullScreen
                                                ></iframe>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <div className="text-4xl mb-3">🎯</div>
                                <h3 className="text-base font-bold mb-1">Welcome to EmoLearn!</h3>
                                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-normal">
                                    Your webcam is initializing. The system will detect your emotion and adapt content automatically.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Emotion Timeline Chart */}
                    {emotionHistory.length > 2 && (
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-slide-up">
                            <div className="flex items-center gap-2 mb-4">
                                <Activity size={16} className="text-indigo-500" />
                                <span className="font-bold text-sm">Emotion Timeline</span>
                                <span className="text-xs text-slate-400 ml-auto">Last {emotionHistory.length} readings</span>
                            </div>
                            <ResponsiveContainer width="100%" height={180}>
                                <LineChart data={emotionHistory}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                                    <YAxis domain={[0, 7]} ticks={[1, 2, 3, 4, 5, 6]}
                                        tickFormatter={(v) => ['', 'Bored', 'Frustrated', 'Confused', 'Surprised', 'Happy', 'Focused'][v] || ''}
                                        tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                                        axisLine={false} tickLine={false} width={65}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                                            borderRadius: '0.75rem', fontSize: '0.8rem'
                                        }}
                                        formatter={(value) => {
                                            const labels = { 1: 'Bored', 2: 'Frustrated', 3: 'Confused', 4: 'Surprised', 5: 'Happy', 6: 'Focused' };
                                            return [labels[value] || value, 'State'];
                                        }}
                                    />
                                    <Line type="monotone" dataKey="score" stroke="url(#gradient)"
                                        strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: 'var(--accent-purple)' }} />
                                    <defs>
                                        <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="var(--gradient-start)" />
                                            <stop offset="100%" stopColor="var(--gradient-end)" />
                                        </linearGradient>
                                    </defs>
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Right Column: Webcam + Stats */}
                <div className="flex flex-col gap-6 lg:sticky lg:top-24">
                    {/* Webcam */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800 relative mb-4">
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transition-opacity duration-500" style={{ opacity: isStreaming ? 1 : 0 }} />
                            
                            {!isStreaming && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 text-center p-6 gap-2 animate-fade-in">
                                    <span className="text-3xl animate-bounce">📷</span>
                                    <span className="text-sm font-bold text-white">
                                        {webcamError === 'NotAllowedError' || webcamError === 'PermissionDeniedError'
                                            ? 'Camera Access Blocked'
                                            : webcamError === 'NotFoundError' || webcamError === 'DevicesNotFoundError'
                                            ? 'No Camera Detected'
                                            : 'Camera Inactive'}
                                    </span>
                                    <span className="text-xs text-slate-400 leading-normal max-w-[220px]">
                                        {webcamError === 'NotAllowedError' || webcamError === 'PermissionDeniedError'
                                            ? 'Please allow camera permission in your browser address bar and reload.'
                                            : webcamError === 'NotFoundError' || webcamError === 'DevicesNotFoundError'
                                            ? 'Please plug in a webcam device and reload the page.'
                                            : 'Waiting for permission or camera activation...'}
                                    </span>
                                </div>
                            )}

                            {/* Indicators */}
                            {isStreaming && (
                                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-0.5 border border-white/10">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-[10px] text-white font-bold uppercase tracking-wider">Live</span>
                                </div>
                            )}
                            {isStreaming && isPredicting && (
                                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-indigo-500/80 rounded-full px-2.5 py-0.5 border border-white/10">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
                                    <span className="text-[10px] text-white font-bold uppercase tracking-wider">ML</span>
                                </div>
                            )}
                        </div>

                        {/* State Details */}
                        <div className="flex items-center gap-3.5 px-2">
                            <span className="text-3xl">{cfg.emoji}</span>
                            <div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Detection</div>
                                <div className="text-base font-black" style={{ color: cfg.color }}>{cfg.label}</div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Session Distribution</h4>
                        <div className="flex flex-col gap-3.5">
                            {Object.entries(EMOTION_CONFIG).map(([key, val]) => {
                                const count = emotionHistory.filter(e => e.emotion === key).length;
                                const pct = emotionHistory.length ? Math.round((count / emotionHistory.length) * 100) : 0;
                                return (
                                    <div key={key} className="flex items-center gap-3">
                                        <span className="text-lg">{val.emoji}</span>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center text-xs font-semibold mb-1">
                                                <span>{val.label}</span>
                                                <span className="text-slate-400">{pct}%</span>
                                            </div>
                                            <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: val.color }} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>

            {/* AI CHATBOT tutor Collapsible Trigger Button */}
            <button 
                onClick={() => setShowChat(!showChat)}
                className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-xl shadow-indigo-500/25 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
                {showChat ? <X size={20} /> : <MessageSquare size={20} />}
            </button>

            {/* AI CHATBOT tutor PANEL */}
            {showChat && (
                <div className="fixed bottom-24 right-6 z-40 w-full max-w-[340px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl flex flex-col overflow-hidden animate-slide-up">
                    {/* Header */}
                    <div className="bg-gradient-to-tr from-indigo-500 to-violet-600 p-4 text-white flex items-center gap-2">
                        <Bot size={18} />
                        <div>
                            <h4 className="text-xs font-extrabold">EmoLearn AI Tutor</h4>
                            <span className="text-[9px] text-white/80 font-bold">Emotion-Adaptive Study Buddy</span>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 h-[260px] overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin">
                        {chatMessages.map((m, idx) => (
                            <div key={idx} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                <span className="text-[8px] text-slate-400 font-bold mb-0.5 uppercase tracking-wider">{m.sender === 'user' ? 'You' : 'AI Tutor'}</span>
                                <div className={`p-3 rounded-2xl text-[11px] font-medium leading-normal max-w-[85%] ${
                                    m.sender === 'user' 
                                        ? 'bg-indigo-500 text-white rounded-tr-none' 
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none'
                                }`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex flex-col items-start">
                                <span className="text-[8px] text-slate-400 font-bold mb-0.5 uppercase tracking-wider">AI Tutor</span>
                                <div className="bg-slate-100 dark:bg-slate-800 text-slate-400 p-3 rounded-2xl rounded-tl-none text-[10px] font-bold animate-pulse">
                                    Tutor is typing...
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                        <input
                            type="text"
                            placeholder="Ask the AI Tutor a question..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500"
                        />
                        <button 
                            type="submit" 
                            className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl cursor-pointer shadow-sm transition-colors"
                        >
                            <Send size={13} />
                        </button>
                    </form>
                </div>
            )}

            {/* Course Library Modal */}
            {showLibrary && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[80vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-slide-up">
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                    <Library size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black">Course Library</h2>
                                    <p className="text-xs text-slate-400">Browse and select any course module manually.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowLibrary(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        {/* Body */}
                        <div className="p-6 overflow-y-auto bg-slate-50 dark:bg-slate-950 flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {allContent?.map(c => (
                                <div 
                                    key={c.id} 
                                    onClick={() => {
                                        setSelectedCourseId(c.id);
                                        setShowLibrary(false);
                                    }}
                                    className={`bg-white dark:bg-slate-900 p-4 rounded-xl border transition-all cursor-pointer hover:-translate-y-1 hover:shadow-md ${
                                        selectedCourseId === c.id ? 'border-indigo-500 shadow-indigo-500/20' : 'border-slate-200 dark:border-slate-800'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 uppercase tracking-wider">
                                            {c.type}
                                        </span>
                                        <span className="text-xs font-bold text-indigo-500">
                                            Level {c.difficulty}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-sm mb-1">{c.title}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                        {c.description}
                                    </p>
                                    {c.emotion_trigger && (
                                        <div className="mt-3 text-[9px] font-bold text-amber-500 uppercase flex items-center gap-1">
                                            <Sparkles size={10} /> Target: {c.emotion_trigger}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {/* ADD COURSE MODAL */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 rounded-2xl shadow-xl animate-slide-up relative">
                        <button 
                            onClick={() => setShowAddModal(false)}
                            className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                        
                        <h4 className="text-sm font-extrabold flex items-center gap-2 mb-4">
                            <Plus size={16} />
                            Add Course Module
                        </h4>

                        {contentError && (
                            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold rounded-lg mb-4">
                                {contentError}
                            </div>
                        )}

                        <form onSubmit={handleAddContentSubmit} className="flex flex-col gap-4">
                            {/* Course Name */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">📚 Course Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Java, Python, C Programming, DSA, Web Dev, SQL..."
                                    value={contentForm.title}
                                    onChange={(e) => setContentForm(prev => ({ ...prev, title: e.target.value }))}
                                    className="px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500"
                                    required
                                />
                            </div>

                            {/* Mood / Emotion Trigger */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">🎭 Mood (When to show this course)</label>
                                <select
                                    value={contentForm.emotion_trigger}
                                    onChange={(e) => setContentForm(prev => ({ ...prev, emotion_trigger: e.target.value }))}
                                    className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                                >
                                    <option value="none">🎯 Default / Focus — shown normally</option>
                                    <option value="confusion">🤔 Confused — simplify for the student</option>
                                    <option value="boredom">😴 Bored — challenge the student</option>
                                    <option value="happiness">😊 Happy — advance to harder content</option>
                                    <option value="frustration">😤 Frustrated — support and give hints</option>
                                    <option value="surprise">😮 Surprised — expand horizons</option>
                                </select>
                            </div>

                            {/* Row Type & Difficulty */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type</label>
                                    <select
                                        value={contentForm.type}
                                        onChange={(e) => setContentForm(prev => ({ ...prev, type: e.target.value }))}
                                        className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                                    >
                                        <option value="text">Text</option>
                                        <option value="video">Video</option>
                                        <option value="quiz">Quiz</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Difficulty</label>
                                    <select
                                        value={contentForm.difficulty}
                                        onChange={(e) => setContentForm(prev => ({ ...prev, difficulty: e.target.value }))}
                                        className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                                    >
                                        <option value="1">Level 1</option>
                                        <option value="2">Level 2</option>
                                        <option value="3">Level 3</option>
                                        <option value="4">Level 4</option>
                                    </select>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description / Body</label>
                                <textarea
                                    placeholder="Enter content details or hint description..."
                                    value={contentForm.description}
                                    onChange={(e) => setContentForm(prev => ({ ...prev, description: e.target.value }))}
                                    rows={4}
                                    className="px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 resize-none"
                                    required
                                />
                            </div>

                            {/* Course Link (YouTube) */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">🔗 Course Link (YouTube URL)</label>
                                <input
                                    type="text"
                                    placeholder="Paste any YouTube link"
                                    value={contentForm.youtube_url}
                                    onChange={(e) => setContentForm(prev => ({ ...prev, youtube_url: e.target.value }))}
                                    className="px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500"
                                />
                                <span className="text-[9px] text-slate-400 mt-0.5">Accepts any YouTube URL format — auto-converted to embed.</span>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isCreatingContent}
                                className="mt-2 w-full flex items-center justify-center gap-1.5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                            >
                                {isCreatingContent ? 'Processing...' : 'Add Course Module'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
