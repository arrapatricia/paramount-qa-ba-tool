import { useState, useEffect, useRef } from 'react';
import Login from './pages/login';
import UserPortal from './pages/userportal';
import Projects from './pages/projects';
import Documentation from './pages/documentation';
import TestSuites from './pages/testsuites';
import SystemsDirectory from './pages/systems';
import { userAPI } from './services/api';

// Logo Assets
import blueLogo from './assets/PLGIC_Icon Only_blue.png';
import whiteLogo from './assets/PLGIC_Icon Only_white.png';

// Session user object mapping
interface SessionUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  roleName: string;
  role_name?: string;
  isActive: boolean;
  permissions: {
    projectCreate: boolean;
    projectRead: boolean;
    projectUpdate: boolean;
    projectDelete: boolean;
    qaSuiteCreate: boolean;
    qaSuiteRead: boolean;
    qaSuiteUpdate: boolean;
    qaSuiteDelete: boolean;
  };
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Navigation State
  const [currentView, setCurrentView] = useState<'login' | 'systems' | 'projects' | 'test-suites' | 'users' | 'documentation'>('login');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Selected Project in Workspace
  const [currentProjectData, setCurrentProjectData] = useState<any>(null);

  // Inner Project Sidebar Collapsed State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Real-time Date and Time
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);

  // 👤 User Avatar Dropdown Menu State
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // 🔑 Change Password Modal States
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // CENTRAL THEME SYNC WITH TAILWIND HTML ROOT
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [isLoggedIn]);

  // Click Outside Listener to close User Dropdown Menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formattedTime = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  // Strict helper check for Admin Role
  const isAdmin = currentUser?.roleName === 'Admin' || currentUser?.role_name === 'Admin';

  // Extract User Initial
  const userInitial = currentUser?.firstName ? currentUser.firstName.charAt(0).toUpperCase() : 'U';

  // Handle Login and Default Page Route
  const handleLoginSuccess = (userData: any) => {
    if (!userData) return;

    setIsLoggedIn(true);
    
    const userPayload: SessionUser = {
      id: userData.id,
      firstName: userData.first_name,
      lastName: userData.last_name,
      email: userData.email,
      roleName: userData.role_name,
      role_name: userData.role_name,
      isActive: true,
      permissions: {
        projectCreate: userData.permissions?.project_create ?? false,
        projectRead: userData.permissions?.project_read ?? true,
        projectUpdate: userData.permissions?.project_update ?? false,
        projectDelete: userData.permissions?.project_delete ?? false,
        qaSuiteCreate: userData.permissions?.qa_suite_create ?? false,
        qaSuiteRead: userData.permissions?.qa_suite_read ?? true,
        qaSuiteUpdate: userData.permissions?.qa_suite_update ?? false,
        qaSuiteDelete: userData.permissions?.qa_suite_delete ?? false,
      }
    };

    setCurrentUser(userPayload);
    setCurrentView('systems');
  };

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    if (confirm("Are you sure you want to log out?")) {
      setIsLoggedIn(false);
      setActiveProjectId(null);
      setCurrentProjectData(null);
      setCurrentUser(null);
      setCurrentView('login');
    }
  };

  const handleOpenProject = (projectId: string) => {
    setActiveProjectId(projectId);
    const storedProj = localStorage.getItem('qa_ba_current_project');
    if (storedProj) {
      setCurrentProjectData(JSON.parse(storedProj));
    }
    setCurrentView('documentation');
  };

  // Handle Self Password Update Submit
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!newPasswordInput) {
      setPasswordError("Please enter a new password.");
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (!currentUser) return;

    try {
      setIsUpdatingPassword(true);
      await userAPI.resetPassword(currentUser.id, { new_password: newPasswordInput });
      alert("Your password has been changed successfully!");
      setIsChangePasswordOpen(false);
      setNewPasswordInput('');
      setConfirmPasswordInput('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.detail || "Failed to update password. Please try again.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <Login 
        isDarkMode={isDarkMode} 
        onLoginSuccess={handleLoginSuccess}
        onToggleDarkMode={toggleTheme}
        setIsDarkMode={setIsDarkMode}
      />
    );
  }

  return (
    <main className={`${isDarkMode ? 'dark bg-[#080C14] text-white' : 'bg-[#EBF1F6] text-slate-900'} min-h-screen font-sans transition-colors duration-500`}>
      
      {/* 🟢 TOP NAVIGATION HEADER */}
      <header className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border-b border-white/80 dark:border-slate-800/80 px-4 md:px-8 py-3.5 flex justify-between items-center transition-all shadow-xs gap-4 z-30 relative">
        
        {/* 👈 LEFT: BRAND LOGO */}
        <div 
          className="flex items-center space-x-2.5 cursor-pointer hover:scale-[1.01] active:scale-[0.98] transition-all shrink-0" 
          onClick={() => setCurrentView('systems')}
        >
          <img 
            src={isDarkMode ? whiteLogo : blueLogo} 
            alt="PLGIC Logo" 
            className="w-6 h-6 md:w-7 md:h-7 object-contain drop-shadow-sm" 
          />
          <span className="text-base md:text-lg font-black tracking-tight text-[#10065F] dark:text-blue-400">
            Paramount Workspace
          </span>
        </div>

        {/* 🎯 CENTER: NAVIGATION TABS */}
        {currentUser && (
          <nav className="hidden md:flex items-center space-x-1.5 bg-white/40 dark:bg-slate-950/40 p-1.5 rounded-2xl border border-white/60 dark:border-slate-800 backdrop-blur-md">
            <button 
              onClick={() => { setCurrentView('systems'); setActiveProjectId(null); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                currentView === 'systems'
                  ? 'bg-gradient-to-r from-[#10065F] to-[#1a0a80] dark:from-blue-600 dark:to-indigo-600 text-white shadow-md' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50'
              }`}
            >
              Systems Directory
            </button>

            {currentUser.permissions.projectRead && (
              <button 
                onClick={() => { setCurrentView('projects'); setActiveProjectId(null); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  currentView === 'projects' || currentView === 'documentation'
                    ? 'bg-gradient-to-r from-[#10065F] to-[#1a0a80] dark:from-blue-600 dark:to-indigo-600 text-white shadow-md' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                Projects Gallery
              </button>
            )}

            {currentUser.permissions.qaSuiteRead && (
              <button 
                onClick={() => { setCurrentView('test-suites'); setActiveProjectId(null); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  currentView === 'test-suites'
                    ? 'bg-gradient-to-r from-[#10065F] to-[#1a0a80] dark:from-blue-600 dark:to-indigo-600 text-white shadow-md' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                Test Suites
              </button>
            )}
            
            {isAdmin && (
              <button 
                onClick={() => { setCurrentView('users'); setActiveProjectId(null); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  currentView === 'users' 
                    ? 'bg-gradient-to-r from-[#10065F] to-[#1a0a80] dark:from-blue-600 dark:to-indigo-600 text-white shadow-md' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                Manage Users
              </button>
            )}
          </nav>
        )}

        {/* 👉 RIGHTMOST: USER PROFILE DROPDOWN & UPPER-RIGHT THEME TOGGLE */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          
          {currentUser && (
            <div className="relative pr-2 border-r border-slate-200/80 dark:border-slate-800" ref={userMenuRef}>
              
              {/* 👤 CIRCULAR AVATAR BUTTON */}
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2.5 p-1 rounded-full hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer outline-none group"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#10065F] via-[#1a0a80] to-indigo-600 dark:from-blue-600 dark:to-indigo-500 text-white font-black text-sm flex items-center justify-center shadow-md border-2 border-white/80 dark:border-slate-700 group-hover:scale-105 transition-transform shrink-0">
                  {userInitial}
                </div>
                
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-black tracking-tight text-[#10065F] dark:text-white leading-tight">
                    Hi, {currentUser.firstName}!
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                    {currentUser.roleName || 'User'}
                  </span>
                </div>

                <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* 💧 LIQUID GLASS DROPDOWN MENU */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2.5 w-64 bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl p-3 border border-white/80 dark:border-slate-800 shadow-2xl shadow-black/10 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2">
                  
                  {/* Menu User Header */}
                  <div className="p-3 rounded-2xl bg-white/50 dark:bg-slate-950/40 border border-white/60 dark:border-slate-800">
                    <p className="text-xs font-black text-[#10065F] dark:text-white truncate">
                      {currentUser.firstName} {currentUser.lastName}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 truncate">{currentUser.email}</p>
                    <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 dark:border-slate-800/60 flex justify-between items-center text-[9px] font-bold text-slate-400">
                      <span>ROLE: {currentUser.roleName}</span>
                      <span>{formattedTime}</span>
                    </div>
                  </div>

                  {/* Dropdown Options */}
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setPasswordError('');
                        setNewPasswordInput('');
                        setConfirmPasswordInput('');
                        setIsChangePasswordOpen(true);
                      }}
                      className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer text-left"
                    >
                      <svg className="w-4 h-4 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      <span>Change Password</span>
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-extrabold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer text-left"
                    >
                      <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Log Out</span>
                    </button>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* 🌙 UPPER RIGHT CORNER LIGHT/DARK TOGGLE */}
          <div className="flex items-center space-x-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/80 dark:border-slate-700/60 shadow-xs shrink-0">
            {/* <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 select-none">
              {isDarkMode ? 'Dark' : 'Light'}
            </span> */}

            <button
              type="button"
              role="switch"
              aria-checked={isDarkMode}
              onClick={toggleTheme}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                isDarkMode ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out flex items-center justify-center ${
                  isDarkMode ? 'translate-x-4' : 'translate-x-0'
                }`}
              >
                {isDarkMode ? (
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

        </div>
      </header>

      {/* 🟢 MAIN ROUTING CONTAINER */}
      <div className="w-full">
        {currentView === 'systems' && (
          <SystemsDirectory 
            isDarkMode={isDarkMode}
            onNavigateToSuites={() => setCurrentView('test-suites')}
            onNavigateToProjects={() => setCurrentView('projects')}
          />
        )}

        {currentView === 'projects' && (
          <Projects isDarkMode={isDarkMode} onOpenProject={handleOpenProject} />
        )}

        {currentView === 'test-suites' && (
          <TestSuites isDarkMode={isDarkMode} currentUser={currentUser} />
        )}

        {currentView === 'users' && (
          isAdmin ? (
            <UserPortal isDarkMode={isDarkMode} currentUser={currentUser} />
          ) : (
            <Projects isDarkMode={isDarkMode} onOpenProject={handleOpenProject} />
          )
        )}

        {/* 🟢 OPENED PROJECT WORKSPACE WITH LIQUID GLASS SIDEBAR */}
        {currentView === 'documentation' && (
          <div className="flex min-h-[calc(100vh-73px)]">
            
            {/* 👈 CLEAN LIQUID GLASS SIDEBAR */}
            <aside 
              className={`hidden lg:flex flex-col justify-between shrink-0 transition-all duration-300 border-r backdrop-blur-2xl ${
                isSidebarCollapsed ? 'w-16 p-2.5' : 'w-64 p-4'
              } ${
                isDarkMode 
                  ? 'bg-slate-900/60 text-slate-300 border-slate-800/80 shadow-xl' 
                  : 'bg-white/60 text-slate-700 border-white/80 shadow-lg shadow-black/5'
              }`}
            >
              <div className="space-y-5">
                
                {/* Collapse Toggle & Active Project Header */}
                <div className="flex items-center justify-between">
                  {!isSidebarCollapsed && (
                    <span className="text-[9px] font-black uppercase tracking-wider block text-slate-400">
                      PROJECT WORKSPACE
                    </span>
                  )}
                  <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="p-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer bg-white/60 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60"
                    title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                  >
                    <svg className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isSidebarCollapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7M19 19l-7-7 7-7"} />
                    </svg>
                  </button>
                </div>

                {/* Active Project Glass Card */}
                {!isSidebarCollapsed ? (
                  <div className="p-3.5 rounded-2xl border bg-white/70 dark:bg-slate-800/60 border-white/80 dark:border-slate-700/60 backdrop-blur-md shadow-xs">
                    <div className="font-black text-xs truncate text-[#10065F] dark:text-white">
                      {currentProjectData?.name || 'Project Workspace'}
                    </div>
                    <span className="inline-block px-2 py-0.5 rounded-full text-[8px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase mt-1.5">
                      {currentProjectData?.status || 'Active'}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-center p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20" title={currentProjectData?.name}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                )}

                {/* Inner Project Links */}
                <div className="space-y-1">
                  <button 
                    onClick={() => setCurrentView('projects')}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-2.5 px-3'} py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60`}
                    title="All Projects Gallery"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    {!isSidebarCollapsed && <span>All Projects</span>}
                  </button>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1">
                    <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-2.5 px-3'} py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#10065F] to-[#1a0a80] dark:from-blue-600 dark:to-indigo-600 text-white shadow-md`}>
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {!isSidebarCollapsed && <span>Requirements & Specs</span>}
                    </div>

                    <button 
                      onClick={() => setCurrentView('test-suites')}
                      className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-2.5 px-3'} py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60`}
                      title="Project Test Suites"
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L5.6 15.12a2 2 0 00-1.168.14L3 16l1.328 3.985a2 2 0 001.205 1.258l2.916 1.166a6 6 0 003.86-.517l.318-.158a6 6 0 013.86-.517l2.387.477a2 2 0 001.693-.574l1.861-[1.861a2 2 0 00.32-2.324l-1.32-2.64z" />
                      </svg>
                      {!isSidebarCollapsed && <span>Project Test Suites</span>}
                    </button>
                  </div>
                </div>

              </div>

              {/* Bottom Widget: Project Execution Progress */}
              {!isSidebarCollapsed ? (
                <div className="p-3.5 rounded-2xl border bg-white/50 dark:bg-slate-800/40 border-white/80 dark:border-slate-700/50 backdrop-blur-md space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-600 dark:text-slate-300">
                    <span className="uppercase tracking-wider">PROGRESS</span>
                    <span className="text-blue-600 dark:text-blue-400 font-mono">67%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                    <div className="bg-[#10065F] dark:bg-blue-500 h-full w-[67%] rounded-full"></div>
                  </div>
                  <span className="text-[9px] font-medium block text-slate-500 dark:text-slate-400">80 of 120 test cases executed</span>
                </div>
              ) : (
                <div className="text-center text-[10px] font-mono font-black text-blue-500" title="67% Executed">
                  67%
                </div>
              )}
            </aside>

            {/* 👉 RIGHT MAIN DOCUMENTATION WORKSPACE */}
            <div className="flex-1 bg-[#EBF1F6] dark:bg-[#080C14] min-w-0">
              <div className="px-4 md:px-6 py-2.5 border-b border-white/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl text-xs font-semibold text-slate-400 flex items-center space-x-2">
                <span>Projects</span>
                <span>›</span>
                <span className="text-[#10065F] dark:text-blue-400 font-bold">{currentProjectData?.name || 'Workspace'}</span>
                <span>›</span>
                <span className="text-slate-700 dark:text-slate-200 font-bold">Documentation & Specs</span>
              </div>

              <Documentation isDarkMode={isDarkMode} onBackToProjects={() => setCurrentView('projects')} />
            </div>

          </div>
        )}
      </div>

      {/* 🔑 LIQUID GLASS MODAL: CHANGE ACCOUNT PASSWORD */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[32px] p-6 sm:p-8 border border-white/80 dark:border-slate-700/80 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-[#10065F] dark:text-white uppercase tracking-wider">Change Password</h3>
                <p className="text-[10px] font-medium text-slate-400">Update login password for {currentUser?.email}</p>
              </div>
              <button onClick={() => setIsChangePasswordOpen(false)} className="text-slate-400 font-bold cursor-pointer hover:text-slate-600 dark:hover:text-white">✕</button>
            </div>

            {passwordError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-bold backdrop-blur-md">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1 tracking-wider">New Password</label>
                <input
                  type="password"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-950/40 text-slate-800 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1 tracking-wider">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-950/40 text-slate-800 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200/60 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-4 py-2.5 border rounded-2xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="px-5 py-2.5 bg-[#10065F] hover:bg-[#180A8C] dark:bg-blue-600 text-white font-black uppercase tracking-wider rounded-2xl shadow-md cursor-pointer disabled:opacity-50 transition-all"
                >
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}