import { useState } from 'react';
import axios from 'axios';
import blueLogo from '../assets/PLGIC_Icon Only_blue.png';
import whiteLogo from '../assets/PLGIC_Icon Only_white.png';

interface LoginProps {
  isDarkMode: boolean;
  onLoginSuccess: (userData: any) => void;
}

// const API_BASE_URL = 'https://web-production-8e05d.up.railway.app';
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#f8fafc] dark:bg-neutral-obsidian transition-colors duration-300">
      <div className="w-full max-w-[440px] bg-white dark:bg-neutral-cardDark rounded-3xl p-10 shadow-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col items-center">
        
        <div className="w-28 h-28 mb-6 flex items-center justify-center">
          <img src={isDarkMode ? whiteLogo : blueLogo} alt="PLGIC Logo" className="w-full h-full object-contain" />
        </div>

        <h2 className="text-xl font-bold tracking-tight text-brand-paramount dark:text-white mb-6">Hi!</h2>

        {/* ERROR BADGE */}
        {errorMessage && (
          <div className="w-full mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-bold text-center">
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-6">
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
            className="w-full mt-2 py-4 rounded-xl font-bold tracking-wider text-white bg-blue-600 hover:bg-blue-500 transition-all disabled:opacity-50 cursor-pointer shadow-md"
          >
            {isAuthenticating ? 'Verifying Account...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}