import { useState } from 'react';
import blueLogo from '../assets/PLGIC_Icon Only_blue.png';
import whiteLogo from '../assets/PLGIC_Icon Only_white.png';
import { userAPI, roleAPI } from '@/services/api';

interface LoginProps {
  isDarkMode: boolean;
  onLoginSuccess: (userData: any) => void;
}

export default function Login({ isDarkMode, onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsAuthenticating(true);
      
      // 1. Fetch live user records from your Railway PostgreSQL database
      const allUsers = await userAPI.getAll();
      const matchedUser = allUsers.find(
        (u: any) => u.email.toLowerCase() === username.trim().toLowerCase() && u.is_active
      );

      if (!matchedUser) {
        alert("Invalid account credentials or your account has been deactivated.");
        return;
      }

      // 2. Fetch the system matrix settings using the role name assigned to this user
      const allRoles = await roleAPI.getAll();
      const linkedRole = allRoles.find((r: any) => r.name === matchedUser.role_name);

      if (!linkedRole || !linkedRole.is_active) {
        alert("Your assigned security role is either inactive or missing from the database.");
        return;
      }

      // 3. Package the full database properties cleanly for App.tsx session tracking
      const unifiedSessionPayload = {
        id: matchedUser.id,
        first_name: matchedUser.first_name,
        last_name: matchedUser.last_name,
        email: matchedUser.email,
        role_name: matchedUser.role_name,
        permissions: {
          project_create: linkedRole.project_create,
          project_read: linkedRole.project_read,
          project_update: linkedRole.project_update,
          project_delete: linkedRole.project_delete,
          qa_suite_create: linkedRole.qa_suite_create,
          qa_suite_read: linkedRole.qa_suite_read,
          qa_suite_update: linkedRole.qa_suite_update,
          qa_suite_delete: linkedRole.qa_suite_delete,
        }
      };

      // 4. Pass the real database user profile object up to App.tsx
      onLoginSuccess(unifiedSessionPayload);

    } catch (err) {
      console.error("Login verification failed: ", err);
      alert("Authentication failed. Please check network connectivity or database configurations.");
    } finally {
      setIsAuthenticating(false);
    }
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
              placeholder="Enter username (Email)" 
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
            disabled={isAuthenticating}
            className="w-full mt-2 py-4 rounded-xl font-bold tracking-wider text-white bg-brand-paramount hover:bg-opacity-95 dark:bg-brand-paramount dark:hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/10 active:scale-[0.99] disabled:opacity-50"
          >
            {isAuthenticating ? 'Verifying Account...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}