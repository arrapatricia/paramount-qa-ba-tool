import { useState, useEffect } from 'react';
import { userAPI, roleAPI } from '../services/api';

interface Role {
  id: number;
  name: string;
  is_active: boolean;
  // Project Permissions
  project_create: boolean;
  project_read: boolean;
  project_update: boolean;
  project_delete: boolean;
  // QA Test Suite Permissions
  qa_suite_create: boolean;
  qa_suite_read: boolean;
  qa_suite_update: boolean;
  qa_suite_delete: boolean;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role_name: string;
  is_active: boolean;
}

interface AdminLog {
  id: string;
  timestamp: string;
  category: 'User' | 'Role';
  action: string;
  details: string;
}

interface UserPortalProps {
  isDarkMode: boolean;
  currentUser?: any;
}

export default function UserPortal({ isDarkMode, currentUser }: UserPortalProps) {
  // 🔒 Resolve logged-in user & check Admin authorization
  const activeUser = currentUser || JSON.parse(localStorage.getItem('qa_ba_user') || '{}');
  const isAdmin = activeUser?.roleName === 'Admin' || activeUser?.role_name === 'Admin' || activeUser?.role === 'Admin';

  // --- Core State synced with backend database ---
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Search & Filter States ---
  const [searchQuery, setSearchQuery] = useState('');

  // --- User Form Input States ---
  const [usrFirstName, setUsrFirstName] = useState('');
  const [usrLastName, setUsrLastName] = useState('');
  const [usrEmail, setUsrEmail] = useState('');
  const [usrRole, setUsrRole] = useState('Admin');
  const [usrPassword, setUsrPassword] = useState('');

  // --- Password Reset States ---
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // --- Navigation Section State ---
  const [adminSection, setAdminSection] = useState<'users' | 'roles' | 'logs'>('users');

  // --- Audit Logs ---
  const [logs, setLogs] = useState<AdminLog[]>([
    {
      id: 'log-1',
      timestamp: 'July 16, 2026 at 09:12 AM',
      category: 'User',
      action: 'INITIALIZED',
      details: 'System database session established.'
    }
  ]);

  const addLog = (category: 'User' | 'Role', action: string, details: string) => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }) + ' at ' + now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const newLog: AdminLog = {
      id: `log-${Date.now()}`,
      timestamp: formattedDate,
      category,
      action,
      details
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // --- Initialize & Load Data ---
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const fetchedRoles = await roleAPI.getAll();
        const fetchedUsers = await userAPI.getAll();
        setRoles(fetchedRoles);
        setUsers(fetchedUsers);
        if (fetchedRoles.length > 0) {
          setUsrRole(fetchedRoles[0].name);
        }
      } catch (err) {
        console.error("Failed to load backend tables:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // --- Role Modal states ---
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  
  const [roleName, setRoleName] = useState('');
  const [roleIsActive, setRoleIsActive] = useState(true);
  
  // Project CRUD States
  const [pCreate, setPCreate] = useState(false);
  const [pRead, setPRead] = useState(false);
  const [pUpdate, setPUpdate] = useState(false);
  const [pDelete, setPDelete] = useState(false);

  // QA CRUD States
  const [qCreate, setQCreate] = useState(false);
  const [qRead, setQRead] = useState(false);
  const [qUpdate, setQUpdate] = useState(false);
  const [qDelete, setQDelete] = useState(false);

  // --- Select / Deselect Helper Actions ---
  const handleToggleAllProjects = (val: boolean) => {
    setPCreate(val);
    setPRead(val);
    setPUpdate(val);
    setPDelete(val);
  };

  const handleToggleAllQA = (val: boolean) => {
    setQCreate(val);
    setQRead(val);
    setQUpdate(val);
    setQDelete(val);
  };

  // --- User Modal states ---
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // --- User Operations ---
  const handleOpenCreateUser = () => {
    if (!isAdmin) {
      alert("Access Denied: Only Admin users can create accounts.");
      return;
    }
    setEditingUser(null);
    setUsrFirstName('');
    setUsrLastName('');
    setUsrEmail('');
    setUsrPassword('');
    if (roles.length > 0) setUsrRole(roles[0].name);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: User) => {
    if (!isAdmin) {
      alert("Access Denied: Only Admin users can modify accounts.");
      return;
    }
    setEditingUser(user);
    setUsrFirstName(user.first_name);
    setUsrLastName(user.last_name);
    setUsrEmail(user.email);
    setUsrRole(user.role_name);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert("Access Denied: Admin authorization required.");
      return;
    }

    try {
      if (editingUser) {
        await userAPI.update(editingUser.id, {
          first_name: usrFirstName,
          last_name: usrLastName,
          email: usrEmail,
          is_active: editingUser.is_active,
          role_name: usrRole,
        });

        const freshUsers = await userAPI.getAll();
        setUsers(freshUsers);

        addLog('User', 'UPDATED', `User profile altered: ${usrFirstName} ${usrLastName} assigned as ${usrRole}.`);
      } else {
        await userAPI.create({
          first_name: usrFirstName,
          last_name: usrLastName,
          email: usrEmail,
          password: usrPassword,
          is_active: true,
          role_name: usrRole,
        });

        const freshUsers = await userAPI.getAll();
        setUsers(freshUsers);

        addLog('User', 'CREATED', `New account generated: ${usrFirstName} ${usrLastName} assigned role ${usrRole}.`);
      }
      setIsUserModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || "An error occurred while saving user details.");
    }
  };

  const toggleUserStatus = async (id: number) => {
    if (!isAdmin) return;
    try {
      const updated = await userAPI.toggleStatus(id);
      setUsers(users.map(u => (u.id === id ? updated : u)));
      addLog('User', 'STATUS CHANGE', `Toggled ${updated.first_name} ${updated.last_name} account status to ${updated.is_active ? 'ACTIVE' : 'INACTIVE'}.`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!isAdmin) return;
    const targetUser = users.find(u => u.id === id);
    if (targetUser) {
      if (confirm(`Are you sure you want to delete user ${targetUser.first_name}?`)) {
        try {
          await userAPI.delete(id);
          setUsers(users.filter(u => u.id !== id));
          addLog('User', 'DELETED', `Permanently deleted user: ${targetUser.first_name} ${targetUser.last_name}.`);
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || resetUserId === null) return;
    try {
      await userAPI.resetPassword(resetUserId, { new_password: newPassword });
      const targetUser = users.find(u => u.id === resetUserId);
      addLog('User', 'PASSWORD RESET', `Password securely updated for user: ${targetUser?.first_name} ${targetUser?.last_name}.`);
      setIsResetModalOpen(false);
      setNewPassword('');
      alert("Password updated successfully!");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to reset password.");
    }
  };

  // --- Role Operations ---
  const handleOpenCreateRole = () => {
    if (!isAdmin) return;
    setEditingRole(null);
    setRoleName('');
    setRoleIsActive(true);
    setPCreate(false); setPRead(false); setPUpdate(false); setPDelete(false);
    setQCreate(false); setQRead(false); setQUpdate(false); setQDelete(false);
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (role: Role) => {
    if (!isAdmin) return;
    setEditingRole(role);
    setRoleName(role.name);
    setRoleIsActive(role.is_active);
    
    setPCreate(role.project_create);
    setPRead(role.project_read);
    setPUpdate(role.project_update);
    setPDelete(role.project_delete);
    
    setQCreate(role.qa_suite_create);
    setQRead(role.qa_suite_read);
    setQUpdate(role.qa_suite_update);
    setQDelete(role.qa_suite_delete);
    
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    const roleData = {
      name: roleName,
      is_active: roleIsActive,
      project_create: pCreate,
      project_read: pRead,
      project_update: pUpdate,
      project_delete: pDelete,
      qa_suite_create: qCreate,
      qa_suite_read: qRead,
      qa_suite_update: qUpdate,
      qa_suite_delete: qDelete
    };

    try {
      if (editingRole) {
        const updated = await roleAPI.update(editingRole.id, roleData);
        setRoles(roles.map(r => (r.id === editingRole.id ? updated : r)));
        addLog('Role', 'UPDATED', `Permissions updated on custom role: "${roleName}".`);
      } else {
        const created = await roleAPI.create(roleData);
        setRoles([...roles, created]);
        addLog('Role', 'CREATED', `Custom system security role configured: "${roleName}".`);
      }
      setIsRoleModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || "An error occurred while saving the role.");
    }
  };

  const handleDeleteRole = async (id: number) => {
    if (!isAdmin) return;
    const roleToDelete = roles.find(r => r.id === id);
    if (roleToDelete) {
      if (['Admin', 'Business Analyst', 'QA Engineer'].includes(roleToDelete.name)) {
        alert("System default permissions cannot be customized or deleted!");
        return;
      }
      if (confirm(`Delete the custom role "${roleToDelete.name}"?`)) {
        try {
          await roleAPI.delete(id);
          setRoles(roles.filter(r => r.id !== id));
          addLog('Role', 'DELETED', `Custom system role removed: "${roleToDelete.name}".`);
        } catch (err: any) {
          alert(err.response?.data?.detail || "Failed to delete role.");
        }
      }
    }
  };

  // --- Filter Helper ---
  const filteredUsers = users.filter(u => 
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-73px)] items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#10065F] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Reloading User Portal Page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-8 min-h-[calc(100vh-73px)] font-sans ${isDarkMode ? 'dark bg-neutral-obsidian text-white' : 'bg-slate-50 text-brand-paramount'}`}>
      <div className="w-full max-w-7xl mx-auto space-y-6 md:space-y-8">
        
        {/* Title Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800 dark:text-white">User Administration</h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">Manage platform access, track security records, and assign user permissions directly from the database.</p>
          </div>
          
          <div className="flex flex-wrap gap-1.5 md:gap-2 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800 w-full md:w-auto">
            <button
              onClick={() => setAdminSection('users')}
              className={`flex-1 md:flex-none px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                adminSection === 'users' ? 'bg-[#10065F] text-white shadow-md' : 'text-slate-400 hover:text-slate-500'
              }`}
            >
              Users Directory ({users.length})
            </button>
            <button
              onClick={() => setAdminSection('roles')}
              className={`flex-1 md:flex-none px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                adminSection === 'roles' ? 'bg-[#10065F] text-white shadow-md' : 'text-slate-400 hover:text-slate-500'
              }`}
            >
              Role Settings ({roles.length})
            </button>
            <button
              onClick={() => setAdminSection('logs')}
              className={`flex-1 md:flex-none px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                adminSection === 'logs' ? 'bg-[#10065F] text-white shadow-md' : 'text-slate-400 hover:text-slate-500'
              }`}
            >
              Logs Ledger
            </button>
          </div>
        </div>

        {/* Counter Summary Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <div className="rounded-2xl border border-slate-200/60 dark:border-neutral-800/80 bg-white dark:bg-neutral-cardDark p-4 md:p-6 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-2">Total System Users</span>
            <span className="text-3xl md:text-4xl font-black text-[#10065F] dark:text-blue-400">{users.length}</span>
          </div>
          <div className="rounded-2xl border border-slate-200/60 dark:border-neutral-800/80 bg-white dark:bg-neutral-cardDark p-4 md:p-6 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-2">Configured Roles</span>
            <span className="text-3xl md:text-4xl font-black text-purple-600 dark:text-purple-400">{roles.length}</span>
          </div>
          <div className="rounded-2xl border border-slate-200/60 dark:border-neutral-800/80 bg-white dark:bg-neutral-cardDark p-4 md:p-6 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-2">Security Audit Logs</span>
            <span className="text-3xl md:text-4xl font-black text-blue-600 dark:text-blue-400">{logs.length}</span>
          </div>
        </div>

        {/* --- Tab 1: Users Directory --- */}
        {adminSection === 'users' && (
          <div className="bg-white dark:bg-neutral-cardDark rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm overflow-hidden space-y-0">
            <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-base md:text-lg font-black text-slate-800 dark:text-white">Active Users Directory</h2>
                <p className="text-xs text-slate-400 font-medium">Manage user credentials and toggle active status.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-3 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search user name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white outline-none"
                />

                {isAdmin ? (
                  <button
                    onClick={handleOpenCreateUser}
                    className="w-full sm:w-auto px-4 py-2 bg-[#10065F] hover:bg-[#180A8C] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow transition-all cursor-pointer text-center whitespace-nowrap"
                  >
                    + Add New User
                  </button>
                ) : (
                  <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                    🔒 Read-Only Access
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[10px] uppercase tracking-widest text-slate-400 font-black">
                    <th className="p-4 md:p-6">User</th>
                    <th className="p-4 md:p-6">Assigned Role</th>
                    <th className="p-4 md:p-6">Status</th>
                    {isAdmin && <th className="p-4 md:p-6 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs md:text-sm">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                      <td className="p-4 md:p-6">
                        <div className="font-bold text-slate-800 dark:text-white">{u.first_name} {u.last_name}</div>
                        <div className="text-xs text-slate-400 font-mono text-[11px]">{u.email}</div>
                      </td>
                      <td className="p-4 md:p-6">
                        <span className="px-2.5 py-1 rounded-md text-[10px] md:text-xs font-bold uppercase bg-purple-500/10 text-purple-600 dark:text-purple-300">
                          {u.role_name}
                        </span>
                      </td>
                      <td className="p-4 md:p-6">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${u.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-400">
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>

                      {isAdmin && (
                        <td className="p-4 md:p-6 text-right">
                          <div className="flex items-center justify-end space-x-3 sm:space-x-6">
                            
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase hidden sm:inline">Status</span>
                              <button
                                onClick={() => toggleUserStatus(u.id)}
                                className={`relative w-10 sm:w-12 h-5 sm:h-6 rounded-full transition-colors duration-300 focus:outline-none cursor-pointer ${
                                  u.is_active ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-800'
                                }`}
                              >
                                <div
                                  className={`absolute top-0.5 sm:top-1 left-0.5 sm:left-1 w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                                    u.is_active ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>

                            <div className="flex items-center space-x-2 sm:space-x-3 border-l border-slate-100 dark:border-slate-800 pl-3 sm:pl-4">
                              <button
                                onClick={() => {
                                  setResetUserId(u.id);
                                  setIsResetModalOpen(true);
                                }}
                                className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-blue-600 uppercase tracking-wider hover:underline cursor-pointer"
                              >
                                Reset PW
                              </button>
                              <button
                                onClick={() => handleOpenEditUser(u)}
                                className="text-[10px] md:text-xs font-bold text-blue-600 uppercase tracking-wider hover:underline cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="text-[10px] md:text-xs font-bold text-red-500 uppercase tracking-wider hover:underline cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 4 : 3} className="p-8 text-center text-slate-400 text-xs italic">
                        No users match the search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- Tab 2: Role Directory --- */}
        {adminSection === 'roles' && (
          <div className="bg-white dark:bg-neutral-cardDark rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm overflow-hidden">
            <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-base md:text-lg font-black text-slate-800 dark:text-white">System Permission Levels</h2>
                <p className="text-xs text-slate-400 font-medium">Define feature access matrices across system modules.</p>
              </div>
              
              {isAdmin ? (
                <button
                  onClick={handleOpenCreateRole}
                  className="w-full sm:w-auto px-4 py-2 bg-[#10065F] hover:bg-[#180A8C] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow transition-all cursor-pointer text-center"
                >
                  + Create Custom Role
                </button>
              ) : (
                <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                  🔒 Read-Only Access
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[10px] uppercase tracking-widest text-slate-400 font-black">
                    <th className="p-4 md:p-6">Role Name</th>
                    <th className="p-4 md:p-6">Status</th>
                    <th className="p-4 md:p-6">Project Matrix (CRUD)</th>
                    <th className="p-4 md:p-6">QA Suite Matrix (CRUD)</th>
                    {isAdmin && <th className="p-4 md:p-6 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30 text-xs md:text-sm">
                  {roles.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                      <td className="p-4 md:p-6">
                        <span className="font-bold text-[#10065F] dark:text-blue-400 text-sm md:text-base">{r.name}</span>
                      </td>
                      <td className="p-4 md:p-6">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          r.is_active ? 'bg-green-500/10 text-green-500' : 'bg-slate-500/10 text-slate-400'
                        }`}>
                          {r.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4 md:p-6">
                        <div className="flex gap-1.5 text-[11px] font-mono">
                          <span className={r.project_create ? "text-green-500 font-bold" : "text-slate-300 dark:text-slate-700"}>C</span>
                          <span className={r.project_read ? "text-blue-500 font-bold" : "text-slate-300 dark:text-slate-700"}>R</span>
                          <span className={r.project_update ? "text-orange-500 font-bold" : "text-slate-300 dark:text-slate-700"}>U</span>
                          <span className={r.project_delete ? "text-red-500 font-bold" : "text-slate-300 dark:text-slate-700"}>D</span>
                        </div>
                      </td>
                      <td className="p-4 md:p-6">
                        <div className="flex gap-1.5 text-[11px] font-mono">
                          <span className={r.qa_suite_create ? "text-green-500 font-bold" : "text-slate-300 dark:text-slate-700"}>C</span>
                          <span className={r.qa_suite_read ? "text-blue-500 font-bold" : "text-slate-300 dark:text-slate-700"}>R</span>
                          <span className={r.qa_suite_update ? "text-orange-500 font-bold" : "text-slate-300 dark:text-slate-700"}>U</span>
                          <span className={r.qa_suite_delete ? "text-red-500 font-bold" : "text-slate-300 dark:text-slate-700"}>D</span>
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="p-4 md:p-6 text-right">
                          <div className="flex items-center justify-end space-x-3 md:space-x-4">
                            <button
                              onClick={() => handleOpenEditRole(r)}
                              className="text-xs font-bold text-blue-600 uppercase tracking-wider hover:underline cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteRole(r.id)}
                              className="text-xs font-bold text-red-500 uppercase tracking-wider hover:underline cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- Tab 3: Security Logs --- */}
        {adminSection === 'logs' && (
          <div className="bg-white dark:bg-neutral-cardDark rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm overflow-hidden">
            <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800/50">
              <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-white">Admin Activity Ledger</h2>
              <p className="text-xs text-slate-400 mt-1">Audit log of accounts registered, custom role scopes altered, and status toggles.</p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/30 max-h-[500px] overflow-y-auto">
              {logs.map(log => (
                <div key={log.id} className="p-4 md:p-5 flex flex-col sm:flex-row items-start justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-all text-xs gap-2">
                  <div className="space-y-1 sm:pr-6">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase ${
                        log.category === 'User' ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-500' : 'bg-purple-100 dark:bg-purple-950/30 text-purple-500'
                      }`}>
                        {log.category}
                      </span>
                      <span className="font-bold uppercase text-[#10065F] dark:text-blue-400">{log.action}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm leading-relaxed">{log.details}</p>
                  </div>
                  <span className="text-slate-400 font-mono text-[10px] md:text-xs shrink-0">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* --- MODAL 1: REGISTER/EDIT USER --- */}
      {isUserModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-cardDark rounded-2xl p-5 md:p-8 shadow-2xl border border-slate-100 dark:border-neutral-800 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">
                {editingUser ? 'Update User Details' : 'Register New User'}
              </h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs md:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">First Name</label>
                  <input
                    type="text" required value={usrFirstName} onChange={(e) => setUsrFirstName(e.target.value)}
                    className="w-full px-3.5 py-2 md:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#10065F] text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Last Name</label>
                  <input
                    type="text" required value={usrLastName} onChange={(e) => setUsrLastName(e.target.value)}
                    className="w-full px-3.5 py-2 md:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#10065F] text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email Address (Login)</label>
                <input
                  type="email" required value={usrEmail} onChange={(e) => setUsrEmail(e.target.value)}
                  className="w-full px-3.5 py-2 md:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#10065F] text-slate-800 dark:text-white"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Login Password</label>
                  <input
                    type="password" required value={usrPassword} onChange={(e) => setUsrPassword(e.target.value)}
                    placeholder="Choose a secure password"
                    className="w-full px-3.5 py-2 md:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#10065F] text-slate-800 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Assign Security Role</label>
                <select
                  value={usrRole} onChange={(e) => setUsrRole(e.target.value)}
                  className="w-full px-3.5 py-2 md:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#10065F] text-slate-800 dark:text-white cursor-pointer font-semibold"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button" onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 md:py-2.5 border border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 md:py-2.5 bg-[#10065F] hover:bg-[#180A8C] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow cursor-pointer transition-all"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: CREATE/EDIT ROLE --- */}
      {isRoleModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white dark:bg-neutral-cardDark rounded-2xl p-5 md:p-8 shadow-2xl border border-slate-100 dark:border-neutral-800 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            
            <div className="flex justify-between items-center mb-4 md:mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/50 gap-2">
              <h3 className="text-base md:text-xl font-bold text-slate-800 dark:text-white">
                {editingRole ? `Modify Role: ${editingRole.name}` : 'Create Custom Security Role'}
              </h3>
              
              <div className="flex items-center space-x-2 shrink-0">
                <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">Status</span>
                <button
                  type="button"
                  onClick={() => setRoleIsActive(!roleIsActive)}
                  className={`relative w-10 sm:w-12 h-5 sm:h-6 rounded-full transition-colors duration-300 focus:outline-none cursor-pointer ${
                    roleIsActive ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-800'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 sm:top-1 left-0.5 sm:left-1 w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                      roleIsActive ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSaveRole} className="space-y-4 md:space-y-6 text-xs md:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Role Name</label>
                <input
                  type="text" required value={roleName} onChange={(e) => setRoleName(e.target.value)}
                  className="w-full px-3.5 py-2 md:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#10065F] text-slate-800 dark:text-white"
                />
              </div>

              {/* Matrix Layout Container */}
              <div className="space-y-4 md:space-y-6 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Feature Access Matrix Permissions</p>
                
                {/* 1. Project Access Group */}
                <div className="p-3 md:p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                    <div className="font-extrabold text-[#10065F] dark:text-blue-400 text-xs md:text-sm flex items-center gap-1.5">
                      📂 Projects Management Feature
                    </div>
                    <div className="flex space-x-2 text-[10px] md:text-[11px] font-bold">
                      <button type="button" onClick={() => handleToggleAllProjects(true)} className="text-blue-600 hover:underline cursor-pointer">Select All</button>
                      <span className="text-slate-300">|</span>
                      <button type="button" onClick={() => handleToggleAllProjects(false)} className="text-slate-400 hover:text-slate-500 hover:underline cursor-pointer">Deselect All</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input type="checkbox" checked={pCreate} onChange={(e) => setPCreate(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-[#10065F] focus:ring-[#10065F] cursor-pointer" />
                      <span className="font-medium text-slate-700 dark:text-slate-300 text-xs">Create</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input type="checkbox" checked={pRead} onChange={(e) => setPRead(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-[#10065F] focus:ring-[#10065F] cursor-pointer" />
                      <span className="font-medium text-slate-700 dark:text-slate-300 text-xs">Read</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input type="checkbox" checked={pUpdate} onChange={(e) => setPUpdate(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-[#10065F] focus:ring-[#10065F] cursor-pointer" />
                      <span className="font-medium text-slate-700 dark:text-slate-300 text-xs">Update</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input type="checkbox" checked={pDelete} onChange={(e) => setPDelete(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-[#10065F] focus:ring-[#10065F] cursor-pointer" />
                      <span className="font-medium text-slate-700 dark:text-slate-300 text-xs">Delete</span>
                    </label>
                  </div>
                </div>

                {/* 2. QA Test Suite Access Group */}
                <div className="p-3 md:p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                    <div className="font-extrabold text-[#10065F] dark:text-blue-400 text-xs md:text-sm flex items-center gap-1.5">
                      🧪 QA Test Suites Feature
                    </div>
                    <div className="flex space-x-2 text-[10px] md:text-[11px] font-bold">
                      <button type="button" onClick={() => handleToggleAllQA(true)} className="text-blue-600 hover:underline cursor-pointer">Select All</button>
                      <span className="text-slate-300">|</span>
                      <button type="button" onClick={() => handleToggleAllQA(false)} className="text-slate-400 hover:text-slate-500 hover:underline cursor-pointer">Deselect All</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input type="checkbox" checked={qCreate} onChange={(e) => setQCreate(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-[#10065F] focus:ring-[#10065F] cursor-pointer" />
                      <span className="font-medium text-slate-700 dark:text-slate-300 text-xs">Create</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input type="checkbox" checked={qRead} onChange={(e) => setQRead(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-[#10065F] focus:ring-[#10065F] cursor-pointer" />
                      <span className="font-medium text-slate-700 dark:text-slate-300 text-xs">Read</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input type="checkbox" checked={qUpdate} onChange={(e) => setQUpdate(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-[#10065F] focus:ring-[#10065F] cursor-pointer" />
                      <span className="font-medium text-slate-700 dark:text-slate-300 text-xs">Update</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input type="checkbox" checked={qDelete} onChange={(e) => setQDelete(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-[#10065F] focus:ring-[#10065F] cursor-pointer" />
                      <span className="font-medium text-slate-700 dark:text-slate-300 text-xs">Delete</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                <button
                  type="button" onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2 md:py-2.5 border border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 md:py-2.5 bg-[#10065F] hover:bg-[#180A8C] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow cursor-pointer transition-all"
                >
                  Save Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: SECURE PASSWORD RESET --- */}
      {isResetModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-cardDark rounded-2xl p-5 md:p-8 shadow-2xl border border-slate-100 dark:border-neutral-800 animate-in zoom-in-95 duration-150">
            <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white mb-1">Reset Password</h3>
            <p className="text-xs text-slate-400 mb-6">Assign a secure new password for this user's account.</p>
            
            <form onSubmit={handleResetPassword} className="space-y-4 text-xs md:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">New Password</label>
                <input
                  type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter secure password"
                  className="w-full px-3.5 py-2 md:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#10065F] text-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button" onClick={() => { setIsResetModalOpen(false); setNewPassword(''); }}
                  className="px-4 py-2 md:py-2.5 border border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 md:py-2.5 bg-[#10065F] hover:bg-[#180A8C] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow transition-all cursor-pointer"
                >
                  Confirm Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}