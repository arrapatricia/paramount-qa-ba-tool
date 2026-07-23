import { useState } from 'react';
import axios from 'axios';
import blueLogo from '../assets/PLGIC_Icon Only_blue.png';
import whiteLogo from '../assets/PLGIC_Icon Only_white.png';
import packageJson from '../../package.json'; // Imports version automatically

interface LoginProps {
  isDarkMode: boolean;
  onLoginSuccess: (userData: any) => void;
}

const API_BASE_URL = 'https://paramount-qa-ba-tool-production.up.railway.app';

export default function Login({ isDarkMode, onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsAuthenticating(true);

    try {
      // 🔒 Secure Backend Authentication (Password checked via bcrypt)
      const response = await axios.post(`${API_BASE_URL}/login`, {
        email: username.trim(),
        password: password
      });

      // Pass user payload to root App state
      onLoginSuccess(response.data);

    } catch (err: any) {
      const detail = err.response?.data?.detail || "Invalid username or password.";
      setErrorMessage(detail);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center p-4 md:p-6 bg-[#f8fafc] dark:bg-neutral-obsidian transition-colors duration-300">
      
      {/* Top Spacer for Center Alignment */}
      <div className="hidden sm:block flex-1" />

      {/* Main Login Card */}
      <div className="w-full max-w-[440px] bg-white dark:bg-neutral-cardDark rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col items-center my-auto">
        
        <div className="w-24 h-28 sm:w-28 sm:h-28 mb-4 sm:mb-6 flex items-center justify-center">
          <img src={isDarkMode ? whiteLogo : blueLogo} alt="PLGIC Logo" className="w-full h-full object-contain" />
        </div>

        <h2 className="text-xl font-bold tracking-tight text-brand-paramount dark:text-white mb-6">Hi!</h2>

        {/* ERROR BADGE */}
        {errorMessage && (
          <div className="w-full mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-bold text-center">
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-5 sm:space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-brand-paramount dark:text-slate-300">
              Username / Email
            </label>
            <input 
              type="email" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-accent text-sm text-slate-800 dark:text-white placeholder-slate-400 font-medium"
              placeholder="Enter your email" 
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-brand-paramount dark:text-slate-300">
              Password
            </label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-accent text-sm text-slate-800 dark:text-white placeholder-slate-400 font-medium"
              placeholder="Enter password" 
            />
          </div>

          <button 
            type="submit" 
            disabled={isAuthenticating}
            className="w-full mt-2 py-4 rounded-xl font-bold tracking-wider text-white bg-[#10065F] hover:bg-[#180A8C] transition-all disabled:opacity-50 cursor-pointer shadow-md"
          >
            {isAuthenticating ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>

      {/* 🟢 FOOTER: All Rights Reserved & Auto-Incrementing Build Version */}
      <footer className="w-full flex-1 flex flex-col justify-end py-4 text-center text-xs text-slate-400 dark:text-slate-500 space-y-1 mt-6">
        <p className="font-semibold text-slate-600 dark:text-slate-400 text-[11px] sm:text-xs">
          All Rights Reserved to Paramount Life & General Insurance Corp. © {new Date().getFullYear()}
        </p>
        <div className="flex items-center justify-center space-x-2 text-[10px] font-mono font-bold">
          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-[#10065F] dark:text-blue-400 border border-blue-500/20">
           v{packageJson.version}
          </span>
        </div>
      </footer>

    </div>
  );
}