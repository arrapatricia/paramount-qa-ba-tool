import { useState, useEffect } from 'react';
import axios from 'axios';
import blueLogo from '../assets/PLGIC_Icon Only_blue.png';
import whiteLogo from '../assets/PLGIC_Icon Only_white.png';
import packageJson from '../../package.json';

interface LoginProps {
  isDarkMode: boolean;
  onLoginSuccess: (userData: any) => void;
  onToggleDarkMode?: () => void;
  setIsDarkMode?: any;
  toggleDarkMode?: () => void;
}

const API_BASE_URL = 'https://paramount-qa-ba-tool-production.up.railway.app';

export default function Login({ 
  isDarkMode: propIsDarkMode, 
  onLoginSuccess, 
  onToggleDarkMode, 
  setIsDarkMode,
  toggleDarkMode 
}: LoginProps) {
  // Local state initialized with prop, ensuring instant UI reaction
  const [isDark, setIsDark] = useState<boolean>(propIsDarkMode ?? false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Sync internal dark mode state if prop updates from parent
  useEffect(() => {
    setIsDark(propIsDarkMode);
  }, [propIsDarkMode]);

  // 💾 Check Local Storage for Remembered Email on Mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('paramount_remembered_email');
    if (savedEmail) {
      setUsername(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Bulletproof Theme Toggle Handler
  const handleToggleTheme = () => {
    const newDarkState = !isDark;
    setIsDark(newDarkState);

    // Direct DOM manipulation fallback (guarantees dark mode CSS updates immediately)
    if (newDarkState) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Call whichever parent handler App.tsx passed
    if (typeof onToggleDarkMode === 'function') {
      onToggleDarkMode();
    } else if (typeof toggleDarkMode === 'function') {
      toggleDarkMode();
    } else if (typeof setIsDarkMode === 'function') {
      setIsDarkMode(newDarkState);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsAuthenticating(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        email: username.trim(),
        password: password
      });

      const user = response.data;

      // 🔒 1. Check if the User Account is Active
      if (user.is_active === false) {
        setErrorMessage("Your account has been deactivated. Please contact the system administrator.");
        return;
      }

      // 🔒 2. Check if the User's Assigned Role is Active
      if (user.role_is_active === false || user.is_role_active === false) {
        setErrorMessage("Your account is currently deactivated. Access denied. Contact the system administrator for assistance.");
        return;
      }

      // 💾 3. Handle Remember Me Storage Logic
      if (rememberMe) {
        localStorage.setItem('paramount_remembered_email', username.trim());
      } else {
        localStorage.removeItem('paramount_remembered_email');
      }

      onLoginSuccess(user);
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Invalid username or password.";
      setErrorMessage(detail);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col justify-between items-center p-4 md:p-6 font-sans relative overflow-hidden transition-colors duration-500 ${
      isDark ? 'dark bg-[#080C14] text-white' : 'bg-[#EBF1F6] text-slate-900'
    }`}>

      {/* AMBIENT BACKGROUND LIQUID GLOW BLOBS */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] bg-gradient-to-tl from-indigo-500/20 to-sky-400/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[40%] right-[15%] w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* 📍 PINNED STRICTLY TO UPPER RIGHT CORNER ON LOGIN SCREEN */}
      <div className="fixed top-5 right-5 sm:top-6 sm:right-8 z-50 flex items-center space-x-2.5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl px-3.5 py-1.5 rounded-full border border-white/80 dark:border-slate-800 shadow-md">
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          onClick={handleToggleTheme}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
            isDark ? 'bg-blue-600' : 'bg-slate-300'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out flex items-center justify-center ${
              isDark ? 'translate-x-4' : 'translate-x-0'
            }`}
          >
            {isDark ? (
              <svg className="w-2.5 h-2.5 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            ) : (
              <svg className="w-2.5 h-2.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" clipRule="evenodd" />
              </svg>
            )}
          </span>
        </button>
      </div>

      {/* MAIN LIQUID GLASS CARD */}
      <div className="w-full max-w-[420px] my-auto z-10">
        <div className={`rounded-[36px] p-8 sm:p-10 transition-all duration-300 flex flex-col items-center backdrop-blur-2xl border shadow-2xl ${
          isDark
            ? 'bg-slate-900/60 border-slate-700/50 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]'
            : 'bg-white/70 border-white/80 shadow-[0_25px_60px_-15px_rgba(16,6,95,0.08)]'
        }`}>
          
          {/* LIQUID GLASS LOGO CONTAINER */}
          <div className="w-24 h-24 mb-6 p-3.5 rounded-3xl bg-white/60 dark:bg-slate-950/60 backdrop-blur-md border border-white/80 dark:border-slate-800/80 shadow-inner flex items-center justify-center transition-all">
            <img 
              src={isDark ? whiteLogo : blueLogo} 
              alt="PLGIC Logo" 
              className="w-full h-full object-contain" 
            />
          </div>

          <h2 className="text-2xl font-black tracking-tight text-[#10065F] dark:text-white mb-6">
            Hi!
          </h2>

          {/* ERROR BADGE */}
          {errorMessage && (
            <div className="w-full mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-bold flex items-center space-x-2.5 backdrop-blur-md">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#10065F] dark:text-slate-300 ml-1">
                Username / Email
              </label>
              <input 
                type="email" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white/60 dark:bg-slate-950/40 backdrop-blur-md focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#10065F] dark:focus:ring-blue-500 text-xs text-slate-800 dark:text-white placeholder-slate-400 font-semibold transition-all shadow-inner"
                placeholder="Enter your email" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#10065F] dark:text-slate-300 ml-1">
                Password
              </label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white/60 dark:bg-slate-950/40 backdrop-blur-md focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#10065F] dark:focus:ring-blue-500 text-xs text-slate-800 dark:text-white placeholder-slate-400 font-semibold transition-all shadow-inner"
                placeholder="Enter password" 
              />
            </div>

            {/* 🔘 REMEMBER ME CHECKBOX */}
            <div className="flex items-center justify-between px-1 pt-1">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-[#10065F] dark:text-blue-500 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Remember me
                </span>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={isAuthenticating}
              className="w-full mt-2 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider text-white bg-gradient-to-r from-[#10065F] to-[#1a0a80] dark:from-blue-600 dark:to-indigo-600 hover:shadow-lg hover:shadow-blue-500/25 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-md"
            >
              {isAuthenticating ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

        </div>
      </div>

      {/* FOOTER */}
      <footer className="w-full py-4 text-center text-xs text-slate-400 dark:text-slate-500 space-y-1.5 z-10">
        <p className="font-semibold text-slate-600 dark:text-slate-400 text-[11px]">
          All Rights Reserved to Paramount Life & General Insurance Corp. © {new Date().getFullYear()}
        </p>
        <div className="flex items-center justify-center space-x-2 text-[10px] font-mono font-bold">
          <span className="px-3 py-0.5 rounded-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-md text-[#10065F] dark:text-blue-400 border border-white/60 dark:border-slate-800">
            v{packageJson.version}
          </span>
        </div>
      </footer>

    </div>
  );
}