import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Learning from './pages/Learning';
import Admin from './pages/Admin';
import ForgotPassword from './pages/ForgotPassword';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}>
        <div className="animate-pulse-glow" style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))'
        }} />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={!user ? <Landing /> : <Navigate to={user.role === 'admin' ? "/admin" : "/learn"} />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'admin' ? "/admin" : "/learn"} />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to={user.role === 'admin' ? "/admin" : "/learn"} />} />
        <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to={user.role === 'admin' ? "/admin" : "/learn"} />} />
        <Route path="/learn" element={user ? (user.role === 'admin' ? <Navigate to="/admin" /> : <Learning />) : <Navigate to="/login" />} />
        <Route path="/admin" element={user && user.role === 'admin' ? <Admin /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={user ? (user.role === 'admin' ? "/admin" : "/learn") : "/"} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
