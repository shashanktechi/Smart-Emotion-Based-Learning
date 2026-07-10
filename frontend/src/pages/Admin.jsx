import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import ThemeToggle from '../components/ThemeToggle';
import nodeClient from '../api/nodeClient';
import flaskClient from '../api/flaskClient';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import {
    Users, Clock, Play, Search, ShieldAlert, CheckCircle,
    Server, RefreshCw, LogOut, SlidersHorizontal, BookOpen,
    Plus, Trash2, LayoutDashboard, Database, GraduationCap, X,
    Eye, EyeOff, Edit, Key, Download
} from 'lucide-react';

// Converts any YouTube URL to embed format
const toEmbedUrl = (url) => {
    if (!url) return '';
    let videoId = '';
    // Handle youtu.be/VIDEO_ID
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) videoId = shortMatch[1];
    // Handle youtube.com/watch?v=VIDEO_ID
    const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (longMatch) videoId = longMatch[1];
    // Handle youtube.com/embed/VIDEO_ID (already correct)
    const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return url.split('?')[0]; // Already embed, return as-is
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    return url; // Return as-is if can't parse
};

const COLORS = ['#3b82f6', '#f59e0b', '#f43f5e', '#10b981', '#ec4899', '#8b5cf6']; // Focus, Confusion, Boredom, Happiness, Frustration, Surprise
const EMOTIONS = ['focus', 'confusion', 'boredom', 'happiness', 'frustration', 'surprise'];

export default function Admin() {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', 'content'
    
    // User filters
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    
    // Health States
    const [backendStatus, setBackendStatus] = useState('checking');
    const [mlStatus, setMlStatus] = useState('checking');

    // Password Visibility & Changes States
    const [visiblePasswords, setVisiblePasswords] = useState({});
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ userId: '', name: '', newPassword: '' });
    const [passwordFormError, setPasswordFormError] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Content States
    const [showAddModal, setShowAddModal] = useState(false);
    const [editContentId, setEditContentId] = useState(null);
    const [contentForm, setContentForm] = useState({
        title: '', description: '', type: 'text', difficulty: '1', emotion_trigger: 'none', youtube_url: ''
    });
    const [contentError, setContentError] = useState('');
    const [isCreatingContent, setIsCreatingContent] = useState(false);

    // Health Checks
    const checkHealth = async () => {
        setBackendStatus('checking');
        setMlStatus('checking');
        try {
            await nodeClient.get('/ping');
            setBackendStatus('online');
        } catch {
            setBackendStatus('offline');
        }
        try {
            await flaskClient.get('/health');
            setMlStatus('online');
        } catch {
            setMlStatus('offline');
        }
    };

    useEffect(() => {
        checkHealth();
    }, []);

    // Fetch All Users
    const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery({
        queryKey: ['adminUsers'],
        queryFn: async () => {
            const res = await nodeClient.get('/auth/users');
            return res.data;
        }
    });

    // Fetch Overall Summary Stats
    const { data: summaryData, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
        queryKey: ['adminSummary'],
        queryFn: async () => {
            const res = await nodeClient.get('/analytics/admin/summary');
            return res.data;
        }
    });

    // Fetch Content Modules
    const { data: contentModules = [], isLoading: contentLoading, refetch: refetchContent } = useQuery({
        queryKey: ['adminContent'],
        queryFn: async () => {
            const res = await nodeClient.get('/content');
            return res.data;
        }
    });

    const handleRefreshAll = () => {
        refetchUsers();
        refetchSummary();
        refetchContent();
        checkHealth();
    };

    // Filter Users
    const filteredUsers = users.filter(u => {
        const matchesSearch =
            (u.first_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (u.last_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
            (u.institution || '').toLowerCase().includes(search.toLowerCase());
        
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    // Add/Update Content Module Handler
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
            if (editContentId) {
                await nodeClient.put(`/content/${editContentId}`, body);
            } else {
                await nodeClient.post('/content', body);
            }
            setShowAddModal(false);
            setEditContentId(null);
            setContentForm({ title: '', description: '', type: 'text', difficulty: '1', emotion_trigger: 'none', youtube_url: '' });
            refetchContent();
        } catch (err) {
            setContentError(editContentId ? 'Failed to update content module' : 'Failed to create content module');
        } finally {
            setIsCreatingContent(false);
        }
    };

    // Open Edit Content Modal
    const handleOpenEditContent = (m) => {
        setEditContentId(m.id);
        setContentForm({
            title: m.title,
            description: m.description,
            type: m.type,
            difficulty: String(m.difficulty),
            emotion_trigger: m.emotion_trigger || 'none',
            youtube_url: m.youtube_url || ''
        });
        setShowAddModal(true);
    };

    // Delete Content Module Handler
    const handleDeleteContent = async (id) => {
        if (!confirm('Are you sure you want to delete this content module?')) return;
        try {
            await nodeClient.delete(`/content/${id}`);
            refetchContent();
        } catch (err) {
            alert('Failed to delete content module');
        }
    };

    // Admin change user password
    const handlePasswordChangeSubmit = async (e) => {
        e.preventDefault();
        setPasswordFormError('');
        if (passwordForm.newPassword.length < 6) {
            return setPasswordFormError('Password must be at least 6 characters.');
        }
        setIsChangingPassword(true);
        try {
            await nodeClient.put(`/auth/users/${passwordForm.userId}/password`, {
                password: passwordForm.newPassword
            });
            setShowPasswordModal(false);
            setPasswordForm({ userId: '', name: '', newPassword: '' });
            refetchUsers();
        } catch (err) {
            setPasswordFormError(err.response?.data?.error || 'Failed to update password.');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleTogglePasswordVisibility = (userId) => {
        setVisiblePasswords(prev => ({
            ...prev,
            [userId]: !prev[userId]
        }));
    };

    const initials = user ? `${(user.first_name || 'A')[0]}${(user.last_name || 'D')[0]}`.toUpperCase() : 'AD';

    // CSV Download
    const downloadCSV = () => {
        if (!users || users.length === 0) return;
        const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Role', 'Institution', 'Phone', 'Created At'];
        const csvRows = [
            headers.join(','),
            ...users.map(u => [
                u.id, 
                `"${(u.first_name || '').replace(/"/g, '""')}"`, 
                `"${(u.last_name || '').replace(/"/g, '""')}"`, 
                `"${(u.email || '').replace(/"/g, '""')}"`, 
                u.role, 
                `"${(u.institution || '').replace(/"/g, '""')}"`, 
                `"${(u.phone || '').replace(/"/g, '""')}"`, 
                u.createdAt || u.created_at || ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvRows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `emolearn_users_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // Prepare Pie Chart Data
    const rawDist = summaryData?.emotionDistribution || [];
    const pieData = EMOTIONS.map(emo => {
        const match = rawDist.find(d => d.dominant_emotion === emo);
        return {
            name: emo.charAt(0).toUpperCase() + emo.slice(1),
            value: match ? parseInt(match.count, 10) : 0
        };
    });

    // Prepare Area Chart Data (aggregated timeline)
    const timelineRaw = summaryData?.timeline || [];
    const timelineData = [];
    const timeGroups = {};
    timelineRaw.forEach(t => {
        const time = new Date(t.minute_bucket).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        if (!timeGroups[time]) {
            timeGroups[time] = { time, focus: 0, confusion: 0, boredom: 0, happiness: 0, frustration: 0, surprise: 0 };
        }
        if (EMOTIONS.includes(t.dominant_emotion)) {
            timeGroups[time][t.dominant_emotion] += parseInt(t.count, 10);
        }
    });
    Object.keys(timeGroups).sort().forEach(time => {
        timelineData.push(timeGroups[time]);
    });

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-all duration-300">
            
            {/* Navigation Header */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-6 py-4 flex items-center justify-between flex-wrap gap-4">
                <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity no-underline">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-indigo-500/20">🧠</div>
                    <span className="font-extrabold text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-600">Smart emotion based Learning</span>
                </Link>

                {/* Tabs */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'overview' 
                                ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-500' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                    >
                        <LayoutDashboard size={14} /> Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'users' 
                                ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-500' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                    >
                        <GraduationCap size={14} /> Users
                    </button>
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'content' 
                                ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-500' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                    >
                        <Database size={14} /> Courses
                    </button>
                </div>

                <div className="flex items-center gap-4 ml-auto sm:ml-0">
                    <ThemeToggle />
                    <button 
                        onClick={handleRefreshAll}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={17} />
                    </button>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-black shadow-md">
                            {initials}
                        </div>
                        <span className="hidden md:inline text-xs font-bold">{user?.first_name || 'Admin'}</span>
                    </div>
                    <button onClick={logout} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-500/30 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 text-xs font-semibold transition-all cursor-pointer">
                        <LogOut size={13} /> Sign Out
                    </button>
                </div>
            </header>

            {/* Content Container */}
            <main className="max-w-7xl mx-auto p-6">
                
                {/* 1. OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="flex flex-col gap-6 animate-fade-in">
                        {/* Health checks */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <Server size={16} className="text-slate-400" />
                                    <span className="text-xs font-bold">Node Backend API</span>
                                </div>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    backendStatus === 'online' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                    backendStatus === 'checking' ? 'bg-amber-500/10 text-amber-500 animate-pulse' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                }`}>
                                    {backendStatus === 'online' ? <><CheckCircle size={10} /> Active</> :
                                     backendStatus === 'checking' ? 'Checking...' : <><ShieldAlert size={10} /> Offline</>}
                                </span>
                            </div>
                            <div className="bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <Server size={16} className="text-slate-400" />
                                    <span className="text-xs font-bold">Flask ML Service</span>
                                </div>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    mlStatus === 'online' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                    mlStatus === 'checking' ? 'bg-amber-500/10 text-amber-500 animate-pulse' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                }`}>
                                    {mlStatus === 'online' ? <><CheckCircle size={10} /> Active</> :
                                     mlStatus === 'checking' ? 'Checking...' : <><ShieldAlert size={10} /> Offline</>}
                                </span>
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Students</span>
                                    <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl"><Users size={18} /></div>
                                </div>
                                {summaryLoading ? <div className="h-8 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg w-16" /> : <h3 className="text-3xl font-black">{summaryData?.summary?.totalUsers || 0}</h3>}
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Sessions</span>
                                    <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl"><Play size={18} /></div>
                                </div>
                                {summaryLoading ? <div className="h-8 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg w-16" /> : <h3 className="text-3xl font-black">{summaryData?.summary?.totalSessions || 0}</h3>}
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Minutes Logged</span>
                                    <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl"><Clock size={18} /></div>
                                </div>
                                {summaryLoading ? <div className="h-8 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg w-16" /> : <h3 className="text-3xl font-black">{summaryData?.summary?.totalMinutes || 0}</h3>}
                            </div>
                        </div>

                        {/* Visual Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Dominant Emotions (Pie) */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                                <h4 className="text-sm font-extrabold mb-4 flex items-center gap-2">📊 dominant Emotion share</h4>
                                <div className="flex-1 min-h-[220px]">
                                    {summaryLoading ? <div className="h-full flex items-center justify-center text-sm text-slate-400">Loading analysis...</div> : (
                                        <ResponsiveContainer width="100%" height={220}>
                                            <PieChart>
                                                <Pie
                                                    data={pieData.filter(d => d.value > 0)}
                                                    innerRadius={55}
                                                    outerRadius={75}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                >
                                                    {pieData.filter(d => d.value > 0).map((entry, index) => {
                                                        const idx = EMOTIONS.indexOf(entry.name.toLowerCase());
                                                        return <Cell key={`cell-${index}`} fill={COLORS[idx !== -1 ? idx : 0]} />;
                                                    })}
                                                </Pie>
                                                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', fontSize: '0.8rem' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                                    {pieData.map((d, i) => (
                                        <div key={i} className="flex items-center gap-1.5 text-xs font-semibold">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                                            <span className="text-slate-400">{d.name}:</span>
                                            <span>{d.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Engagement trend (Area) */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2 flex flex-col">
                                <h4 className="text-sm font-extrabold mb-4 flex items-center gap-2">📈 Aggregated Engagement Trend</h4>
                                <div className="flex-1 min-h-[220px]">
                                    {summaryLoading ? <div className="h-full flex items-center justify-center text-sm text-slate-400">Loading trends...</div> : 
                                     timelineData.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-slate-400">
                                            <span className="text-2xl mb-1">💤</span>
                                            <span className="text-xs font-bold">No active timeline data</span>
                                        </div>
                                     ) : (
                                        <ResponsiveContainer width="100%" height={220}>
                                            <AreaChart data={timelineData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                                <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                                                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                                                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', fontSize: '0.8rem' }} />
                                                <Area type="monotone" dataKey="focus" stackId="1" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.12} />
                                                <Area type="monotone" dataKey="confusion" stackId="1" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.12} />
                                                <Area type="monotone" dataKey="boredom" stackId="1" stroke={COLORS[2]} fill={COLORS[2]} fillOpacity={0.12} />
                                                <Area type="monotone" dataKey="happiness" stackId="1" stroke={COLORS[3]} fill={COLORS[3]} fillOpacity={0.12} />
                                                <Area type="monotone" dataKey="frustration" stackId="1" stroke={COLORS[4]} fill={COLORS[4]} fillOpacity={0.12} />
                                                <Area type="monotone" dataKey="surprise" stackId="1" stroke={COLORS[5]} fill={COLORS[5]} fillOpacity={0.12} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                     )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. USERS TAB */}
                {activeTab === 'users' && (
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-fade-in">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                            <div>
                                <h4 className="text-sm font-extrabold flex items-center gap-2">👥 User & Password Audit</h4>
                                <p className="text-xs text-slate-400 font-medium mt-1">Manage credentials and audit secure student profile database hashes</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative w-full sm:w-56">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                                    <input
                                        type="text"
                                        placeholder="Search name, email..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-9 pr-4 py-2 w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500"
                                >
                                    <option value="all">All Roles</option>
                                    <option value="student">Students</option>
                                    <option value="admin">Admins</option>
                                </select>
                                <button
                                    onClick={downloadCSV}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-500/20 transition-all cursor-pointer"
                                >
                                    <Download size={14} /> Export CSV
                                </button>
                            </div>
                        </div>

                        {/* Desktop Table view / Mobile Card list */}
                        {usersLoading ? (
                            <div className="py-12 text-center text-slate-400 animate-pulse text-sm">Loading users...</div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 text-sm">No users match search conditions.</div>
                        ) : (
                            <>
                                {/* Table view for larger screens */}
                                <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-slate-100 dark:bg-slate-800/60 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                                                <th className="px-6 py-3.5">Name</th>
                                                <th className="px-6 py-3.5">Email</th>
                                                <th className="px-6 py-3.5">Institution</th>
                                                <th className="px-6 py-3.5">Phone</th>
                                                <th className="px-6 py-3.5">Role</th>
                                                <th className="px-6 py-3.5">Secure Password Hash</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                                            {filteredUsers.map(u => (
                                                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-6 py-4 font-bold">{u.first_name} {u.last_name}</td>
                                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-semibold">{u.email}</td>
                                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">{u.institution || '—'}</td>
                                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">{u.phone || '—'}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                                            u.role === 'admin' 
                                                                ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' 
                                                                : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                                                        }`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-slate-400 text-[10px] max-w-[120px] truncate select-all">
                                                                {visiblePasswords[u.id] ? u.password : '••••••••••••'}
                                                            </span>
                                                            <button
                                                                onClick={() => handleTogglePasswordVisibility(u.id)}
                                                                className="p-1 text-slate-400 hover:text-indigo-500 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                                                title={visiblePasswords[u.id] ? "Hide Hash" : "Show Hash"}
                                                            >
                                                                {visiblePasswords[u.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setPasswordForm({ userId: u.id, name: `${u.first_name} ${u.last_name}`, newPassword: '' });
                                                                    setPasswordFormError('');
                                                                    setShowPasswordModal(true);
                                                                }}
                                                                className="p-1 text-slate-400 hover:text-indigo-500 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                                                title="Override Password"
                                                            >
                                                                <Key size={13} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Responsive Card view for Mobile screens */}
                                <div className="grid grid-cols-1 gap-4 md:hidden">
                                    {filteredUsers.map(u => (
                                        <div key={u.id} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                                            <div className="flex justify-between items-start">
                                                <span className="font-bold text-sm">{u.first_name} {u.last_name}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                                    u.role === 'admin' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                                                }`}>{u.role}</span>
                                            </div>
                                            <div className="text-xs text-slate-400 font-semibold">{u.email}</div>
                                            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 mt-2 border-t border-slate-200 dark:border-slate-800/80 pt-2 font-medium">
                                                <div><strong>Inst:</strong> {u.institution || '—'}</div>
                                                <div><strong>Phone:</strong> {u.phone || '—'}</div>
                                            </div>
                                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono text-[9px] text-slate-400 max-w-[90px] truncate">
                                                        {visiblePasswords[u.id] ? u.password : '••••••••••••'}
                                                    </span>
                                                    <button onClick={() => handleTogglePasswordVisibility(u.id)} className="p-1 text-slate-400 hover:text-indigo-500 rounded">
                                                        {visiblePasswords[u.id] ? <EyeOff size={11} /> : <Eye size={11} />}
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setPasswordForm({ userId: u.id, name: `${u.first_name} ${u.last_name}`, newPassword: '' });
                                                        setPasswordFormError('');
                                                        setShowPasswordModal(true);
                                                    }}
                                                    className="flex items-center gap-1 px-2.5 py-1 bg-indigo-500/10 text-indigo-500 rounded-lg text-[9px] font-bold transition-colors cursor-pointer"
                                                >
                                                    <Key size={9} /> Reset Password
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* 3. CONTENT TAB */}
                {activeTab === 'content' && (
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-fade-in">
                        <div className="flex items-center justify-between gap-4 mb-6">
                            <div>
                                <h4 className="text-sm font-extrabold flex items-center gap-2">📂 Course Catalog & Adaptations</h4>
                                <p className="text-xs text-slate-400 font-medium mt-1">Manage course materials, target trigger states, and difficulty mappings</p>
                            </div>
                            <button 
                                onClick={() => {
                                    setEditContentId(null);
                                    setContentForm({ title: '', description: '', type: 'text', difficulty: '1', emotion_trigger: 'none', youtube_url: '' });
                                    setShowAddModal(true);
                                }}
                                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                            >
                                <Plus size={14} /> Add Course
                            </button>
                        </div>

                        {/* Modules Grid */}
                        {contentLoading ? (
                            <div className="py-12 text-center text-slate-400 animate-pulse text-sm">Loading course modules...</div>
                        ) : contentModules.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 text-sm border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">No course modules found. Add one to get started.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {contentModules.map((m) => {
                                    const triggerVal = m.emotion_trigger;
                                    const triggerName = triggerVal ? triggerVal.charAt(0).toUpperCase() + triggerVal.slice(1) : 'Default Track';
                                    
                                    return (
                                        <div key={m.id} className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between hover:shadow-sm transition-all group">
                                            <div>
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase border ${
                                                        triggerVal ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 border-transparent'
                                                    }`}>
                                                        {triggerName}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400">
                                                        {m.type.toUpperCase()} • Diff {m.difficulty}/4
                                                    </span>
                                                </div>
                                                <h5 className="font-bold text-sm mb-2 text-slate-800 dark:text-slate-100">{m.title}</h5>
                                                <p className="text-xs text-slate-400 leading-normal line-clamp-3 mb-2">{m.description}</p>
                                                {m.youtube_url && (
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-500 mt-1 mb-2">
                                                        <span>▶</span> YouTube Linked
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800/80 pt-3">
                                                <span className="text-[10px] text-slate-400">Created: {new Date(m.createdAt).toLocaleDateString()}</span>
                                                <div className="flex items-center gap-1.5">
                                                    <button 
                                                        onClick={() => handleOpenEditContent(m)}
                                                        className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg opacity-80 group-hover:opacity-100 transition-all cursor-pointer"
                                                        title="Edit Course Module"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteContent(m.id)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg opacity-80 group-hover:opacity-100 transition-all cursor-pointer"
                                                        title="Delete Course Module"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* ADD / EDIT COURSE MODAL */}
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
                            {editContentId ? <Edit size={16} /> : <Plus size={16} />}
                            {editContentId ? 'Edit Course Module' : 'Add Course Module'}
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
                                    placeholder="Paste any YouTube link — e.g. https://youtube.com/watch?v=... or https://youtu.be/..."
                                    value={contentForm.youtube_url}
                                    onChange={(e) => setContentForm(prev => ({ ...prev, youtube_url: e.target.value }))}
                                    className="px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500"
                                />
                                <span className="text-[9px] text-slate-400 mt-0.5">Accepts any YouTube URL format — it will be auto-converted to embed format.</span>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isCreatingContent}
                                className="mt-2 w-full flex items-center justify-center gap-1.5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                            >
                                {isCreatingContent ? 'Processing...' : editContentId ? 'Update Course Module' : 'Create Course Module'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* PASSWORD CHANGE MODAL */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm p-6 rounded-2xl shadow-xl animate-slide-up relative">
                        <button 
                            onClick={() => setShowPasswordModal(false)}
                            className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                        
                        <h4 className="text-sm font-extrabold flex items-center gap-2 mb-2">
                            <Key size={16} className="text-indigo-500" /> Override Password
                        </h4>
                        <p className="text-slate-400 text-xs font-medium mb-4">Set a new password for: <strong>{passwordForm.name}</strong></p>

                        {passwordFormError && (
                            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold rounded-lg mb-4">
                                {passwordFormError}
                            </div>
                        )}

                        <form onSubmit={handlePasswordChangeSubmit} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Password</label>
                                <input
                                    type="text"
                                    placeholder="Min 6 characters"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                    className="px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500"
                                    required
                                    minLength={6}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isChangingPassword}
                                className="mt-2 w-full flex items-center justify-center gap-1.5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors"
                            >
                                {isChangingPassword ? 'Saving...' : 'Update Password'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
