import { useState } from 'react';
import blueLogo from '../assets/PLGIC_Icon Only_blue.png';
import whiteLogo from '../assets/PLGIC_Icon Only_white.png';

interface LoginProps {
  isDarkMode: boolean;
  onLoginSuccess: () => void;
}

export default function Login({ isDarkMode, onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate successful login
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#f8fafc] dark:bg-neutral-obsidian transition-colors duration-300">
      
      {/* Centered Login Card */}
      <div className="w-full max-w-[440px] bg-white dark:bg-neutral-cardDark rounded-3xl p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800/50 flex flex-col items-center">
        
        {/* Brand Logo Container */}
        <div className="w-28 h-28 mb-6 flex items-center justify-center">
          <img 
            src={isDarkMode ? whiteLogo : blueLogo} 
            alt="PLGIC Logo" 
            className="w-full h-full object-contain"
          />
        </div>

        {/* Dynamic Greeting */}
        <h2 className="text-xl font-bold tracking-tight text-brand-paramount dark:text-white mb-8">
          Hi!
        </h2>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-6">
          {/* Username Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-brand-paramount dark:text-slate-300">
              Username
            </label>
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-accent dark:focus:ring-brand-accent/50 text-sm text-slate-800 dark:text-white placeholder-slate-400 transition-all"
              placeholder="Enter username" 
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-brand-paramount dark:text-slate-300">
              Password
            </label>
            <div className="relative">
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-accent dark:focus:ring-brand-accent/50 text-sm text-slate-800 dark:text-white placeholder-slate-400 transition-all"
                placeholder="Enter password" 
              />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="w-full mt-2 py-4 rounded-xl font-bold tracking-wider text-white bg-brand-paramount hover:bg-opacity-95 dark:bg-brand-paramount dark:hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/10 active:scale-[0.99]"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}