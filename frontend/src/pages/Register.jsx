import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { Eye, EyeOff, UserPlus, Loader2 } from 'lucide-react';

function getPasswordStrength(password) {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score; // 0–5
}

const strengthLabels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Excellent'];
const strengthColors = ['', 'bg-red-500 text-red-500', 'bg-orange-500 text-orange-500', 'bg-amber-500 text-amber-500', 'bg-emerald-500 text-emerald-500', 'bg-teal-600 text-teal-600'];

export default function Register() {
    const { register } = useAuth();
    const [form, setForm] = useState({
        first_name: '', last_name: '', email: '',
        phone: '', institution: '', password: '', confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const strength = getPasswordStrength(form.password);

    const updateField = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.first_name.trim()) return setError('First name is required');
        if (!form.email.trim()) return setError('Email is required');
        if (form.password.length < 6) return setError('Password must be at least 6 characters');
        if (form.password !== form.confirmPassword) return setError('Passwords do not match');

        setIsLoading(true);
        try {
            await register({
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim() || undefined,
                institution: form.institution.trim() || undefined,
                password: form.password
            });
        } catch (err) {
            const msg = err.response?.data?.error || 'Registration failed. Please try again.';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 relative transition-all duration-300">
            {/* Theme Toggle */}
            <div className="absolute top-6 right-6">
                <ThemeToggle />
            </div>

            {/* Background design */}
            <div className="absolute top-0 left-0 w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-violet-500/5 to-pink-500/5 blur-[90px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[350px] h-[350px] rounded-full bg-gradient-to-tr from-blue-500/5 to-emerald-500/5 blur-[90px] pointer-events-none" />

            <div className="w-full max-w-[480px] bg-white dark:bg-slate-900/60 backdrop-blur-md p-8 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-md relative z-10">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-500/30 mx-auto mb-4">🎓</div>
                    <h2 className="text-2xl font-black">Create Account</h2>
                    <p className="text-slate-400 text-sm mt-1">Join the adaptive learning platform</p>
                </div>

                {/* Error banner */}
                {error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs font-semibold mb-4 animate-slide-up">
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                    {/* Names Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">First Name *</label>
                            <input
                                placeholder="John"
                                value={form.first_name}
                                onChange={(e) => updateField('first_name', e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last Name</label>
                            <input
                                placeholder="Doe"
                                value={form.last_name}
                                onChange={(e) => updateField('last_name', e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address *</label>
                        <input
                            type="email"
                            placeholder="you@college.edu"
                            value={form.email}
                            onChange={(e) => updateField('email', e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                            required
                            autoComplete="email"
                        />
                    </div>

                    {/* Phone */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone Number</label>
                        <input
                            type="tel"
                            placeholder="+91 98765 43210"
                            value={form.phone}
                            onChange={(e) => updateField('phone', e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                        />
                    </div>

                    {/* Institution */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Institution / College</label>
                        <input
                            placeholder="e.g., IIT Delhi"
                            value={form.institution}
                            onChange={(e) => updateField('institution', e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                        />
                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password *</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Min. 6 characters"
                                value={form.password}
                                onChange={(e) => updateField('password', e.target.value)}
                                className="w-full pl-4 pr-11 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                                required
                                minLength={6}
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {form.password && (
                            <div className="mt-1.5 flex flex-col gap-1">
                                <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className={`h-full transition-all duration-300 ${(strengthColors[strength] || '').split(' ')[0]}`} style={{ width: `${(strength / 5) * 100}%` }} />
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${(strengthColors[strength] || '').split(' ')[1]}`}>
                                    {strengthLabels[strength]} Password
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Confirm Password *</label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Re-enter password"
                            value={form.confirmPassword}
                            onChange={(e) => updateField('confirmPassword', e.target.value)}
                            className={`w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/80 border rounded-xl outline-none text-sm transition-all ${
                                form.confirmPassword && form.confirmPassword !== form.password
                                    ? 'border-rose-500 focus:ring-rose-500/20'
                                    : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500'
                            }`}
                            required
                            autoComplete="new-password"
                        />
                        {form.confirmPassword && form.confirmPassword !== form.password && (
                            <span className="text-[10px] text-rose-500 font-bold mt-1">
                                Passwords do not match
                            </span>
                        )}
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-3 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all cursor-pointer"
                    >
                        {isLoading ? (
                            <><Loader2 size={16} className="animate-spin" /> Creating Account...</>
                        ) : (
                            <><UserPlus size={16} /> Create Account</>
                        )}
                    </button>
                </form>

                <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-indigo-500 dark:text-indigo-400 font-bold hover:underline">
                        Sign in →
                    </Link>
                </p>
            </div>
        </div>
    );
}
