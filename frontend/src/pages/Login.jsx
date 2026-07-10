import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';

export default function Login() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login(email, password);
        } catch (err) {
            const msg = err.response?.data?.error || 'Login failed. Check your credentials.';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 relative transition-all duration-300">
            {/* Theme toggle */}
            <div className="absolute top-6 right-6">
                <ThemeToggle />
            </div>

            {/* Background design */}
            <div className="absolute top-0 right-0 w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-indigo-500/5 to-violet-500/5 blur-[90px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-emerald-500/5 to-blue-500/5 blur-[90px] pointer-events-none" />

            <div className="w-full max-w-[420px] bg-white dark:bg-slate-900/60 backdrop-blur-md p-8 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-md relative z-10">
                {/* Logo / Heading */}
                <div className="text-center mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-500/30 mx-auto mb-4">🧠</div>
                    <h2 className="text-2xl font-black">Welcome Back</h2>
                    <p className="text-slate-400 text-sm mt-1">Sign in to continue learning</p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs font-semibold mb-4 animate-slide-up">
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* Email */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</label>
                        <input
                            type="email"
                            placeholder="you@college.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                            required
                            autoComplete="email"
                        />
                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
                            <Link to="/forgot-password" className="text-xs text-indigo-500 hover:underline font-bold">
                                Forgot Password?
                            </Link>
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-4 pr-11 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                                required
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-2 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all cursor-pointer"
                    >
                        {isLoading ? (
                            <><Loader2 size={16} className="animate-spin" /> Signing in...</>
                        ) : (
                            <><LogIn size={16} /> Sign In</>
                        )}
                    </button>
                </form>

                {/* Footer link */}
                <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-indigo-500 dark:text-indigo-400 font-bold hover:underline">
                        Create one →
                    </Link>
                </p>
            </div>
        </div>
    );
}
