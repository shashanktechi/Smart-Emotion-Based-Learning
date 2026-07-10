import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { Brain, Sparkles, BarChart3, Shield } from 'lucide-react';

const features = [
    {
        icon: Brain,
        title: 'Emotion Detection',
        description: 'Real-time facial emotion recognition using advanced ML models to understand your cognitive state.',
        color: 'text-violet-500 bg-violet-500/10'
    },
    {
        icon: Sparkles,
        title: 'Adaptive Content',
        description: 'Content automatically adjusts based on your detected emotions — simpler when confused, challenging when bored.',
        color: 'text-amber-500 bg-amber-500/10'
    },
    {
        icon: BarChart3,
        title: 'Learning Analytics',
        description: 'Track your emotional patterns over time with detailed analytics to optimize your study sessions.',
        color: 'text-emerald-500 bg-emerald-500/10'
    },
    {
        icon: Shield,
        title: 'Privacy First',
        description: 'No raw frames stored. All emotion data is aggregated per minute. Your webcam feed stays on your device.',
        color: 'text-blue-500 bg-blue-500/10'
    }
];

export default function Landing() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-all duration-300">
            {/* Navigation */}
            <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white text-base shadow-md shadow-indigo-500/20">🧠</div>
                    <span className="font-extrabold text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-600">Smart emotion based Learning</span>
                </div>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <Link to="/login" className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                        Sign In
                    </Link>
                    <Link to="/register" className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 rounded-xl shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all">
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="max-w-7xl mx-auto px-6 py-20 md:py-32 text-center relative overflow-hidden">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-indigo-500/10 to-violet-500/5 blur-[80px] pointer-events-none" />
                <div className="relative z-10 max-w-4xl mx-auto">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 mb-6">
                        ✨ AI-Powered Adaptive Learning
                    </span>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.05] mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-emerald-500 dark:from-indigo-400 dark:via-violet-400 dark:to-emerald-400 bg-[length:200%_auto] animate-gradient">
                        Learn Smarter with Real-Time Emotion Intelligence
                    </h1>
                    <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl mx-auto mb-10">
                        Our system detects your cognitive state in real-time through your webcam. Confused? We simplify. Bored? We challenge. Focused? We advance. Get a completely customized experience tailored to your mind.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link to="/register" className="px-8 py-3.5 text-base font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 rounded-2xl shadow-lg shadow-indigo-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all">
                            🚀 Start Learning Free
                        </Link>
                        <Link to="/login" className="px-8 py-3.5 text-base font-bold rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                            Sign In →
                        </Link>
                    </div>
                </div>
            </header>

            {/* Features Section */}
            <section className="max-w-6xl mx-auto px-6 pb-24">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((f, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${f.color}`}>
                                <f.icon size={22} />
                            </div>
                            <h3 className="text-base font-bold mb-2">{f.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="text-center py-8 text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-900">
                © 2026 EmoLearn — Emotion-Adaptive Learning System | Built for Major Project
            </footer>
        </div>
    );
}
