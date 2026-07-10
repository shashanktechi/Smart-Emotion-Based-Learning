import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import nodeClient from '../api/nodeClient';
import { KeyRound, Mail, Loader2, ArrowLeft, Lock, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
    const navigate = useNavigate();
    
    // Step 1: Request OTP
    const [email, setEmail] = useState('');
    
    // Step 2: Verify OTP and Reset
    const [step, setStep] = useState(1); // 1 = Request OTP, 2 = Verify OTP
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [resetToken, setResetToken] = useState(''); // JWT from backend
    
    // UI State
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // For Dev Mode (No SMTP)
    const [devOtp, setDevOtp] = useState('');

    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setDevOtp('');
        setIsLoading(true);
        try {
            const res = await nodeClient.post('/auth/forgot-password', { email });
            setSuccess(res.data.message || 'OTP sent successfully.');
            setResetToken(res.data.token);
            
            if (res.data.devMode && res.data.otp) {
                setDevOtp(res.data.otp);
            }
            
            setStep(2); // Move to OTP entry step
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit recovery request.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);
        try {
            const res = await nodeClient.post('/auth/reset-password', {
                token: resetToken,
                otp,
                password: newPassword
            });
            setSuccess(res.data.message || 'Password reset successfully!');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid OTP or failed to reset password.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 relative transition-all duration-300">
            <div className="absolute top-6 right-6">
                <ThemeToggle />
            </div>

            <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-indigo-500/5 to-violet-500/5 blur-[95px] pointer-events-none" />

            <div className="w-full max-w-[420px] bg-white dark:bg-slate-900/65 backdrop-blur-md p-8 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-md relative z-10 animate-slide-up">
                
                <div className="text-center mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-500/30 mx-auto mb-4">🔑</div>
                    <h2 className="text-2xl font-black">Reset Password</h2>
                    <p className="text-slate-400 text-sm mt-1">
                        {step === 1 ? 'Enter your email to receive a 6-digit OTP' : 'Enter your OTP and new password'}
                    </p>
                </div>

                {error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs font-semibold mb-4">
                        ⚠️ {error}
                    </div>
                )}
                
                {success && step === 2 && !error && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs font-semibold mb-4 leading-normal flex items-center gap-2">
                        <CheckCircle2 size={16} /> {success}
                    </div>
                )}

                {devOtp && step === 2 && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6 text-center animate-pulse">
                        <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">Dev Mode / Test OTP</div>
                        <div className="text-3xl font-black text-amber-600 tracking-[0.25em]">{devOtp}</div>
                    </div>
                )}

                {step === 1 ? (
                    <form onSubmit={handleRequestOTP} className="flex flex-col gap-4 animate-fade-in">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="email"
                                    placeholder="you@college.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-2 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all cursor-pointer"
                        >
                            {isLoading ? (
                                <><Loader2 size={16} className="animate-spin" /> Sending...</>
                            ) : (
                                <><Mail size={16} /> Send OTP</>
                            )}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className="flex flex-col gap-4 animate-fade-in">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">6-Digit OTP</label>
                            <div className="relative">
                                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="e.g. 123456"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-bold tracking-widest transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5 mt-2">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="password"
                                    placeholder="Enter new password (min 6 chars)"
                                    minLength={6}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || otp.length < 6 || newPassword.length < 6}
                            className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all cursor-pointer"
                        >
                            {isLoading ? (
                                <><Loader2 size={16} className="animate-spin" /> Verifying...</>
                            ) : (
                                <><CheckCircle2 size={16} /> Verify & Reset Password</>
                            )}
                        </button>
                    </form>
                )}

                <div className="flex justify-center mt-6">
                    <Link to="/login" className="flex items-center gap-1.5 text-xs text-indigo-500 hover:underline font-bold">
                        <ArrowLeft size={14} /> Back to Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
