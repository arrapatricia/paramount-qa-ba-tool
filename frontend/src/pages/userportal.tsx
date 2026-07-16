import { useState } from 'react';

interface Role {
  id: string;
  name: string;
  canCreateProject: boolean;
  canEditAllProjects: boolean;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
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
}

export default function UserPortal({ isDarkMode }: UserPortalProps) {
  // --- Audit Logs State ---
  const [logs, setLogs] = useState<AdminLog[]>([
    {
      id: 'log-1',
      timestamp: 'July 16, 2026 at 09:12 AM',
      category: 'User',
      action: 'INITIALIZED',
      details: 'System Admin account generated.'
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

  // --- Roles State ---
  const [roles, setRoles] = useState<Role[]>([
    { id: 'role-1', name: 'Admin', canCreateProject: true, canEditAllProjects: true },
    { id: 'role-2', name: 'Business Analyst', canCreateProject: true, canEditAllProjects: false },
    { id: 'role-3', name: 'QA Engineer', canCreateProject: false, canEditAllProjects: false },
  ]);

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  
  const [roleName, setRoleName] = useState('');
  const [roleCanCreate, setRoleCanCreate] = useState(false);
  const [roleCanEditAll, setRoleCanEditAll] = useState(false);

  // --- Users State ---
  const [users, setUsers] = useState<User[]>([
    {
      id: 'usr-1',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@company.com',
      role: 'Admin',
      isActive: true,
    },
  ]);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [usrFirstName, setUsrFirstName] = useState('');
  const [usrLastName, setUsrLastName] = useState('');
  const [usrEmail, setUsrEmail] = useState('');
  const [usrRole, setUsrRole] = useState('Admin');

  const [adminSection, setAdminSection] = useState<'users' | 'roles' | 'logs'>('users');

  // --- User Operations (Create & Edit & Delete) ---
  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setUsrFirstName('');
    setUsrLastName('');
    setUsrEmail('');
    setUsrRole('Admin');
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: User) => {
    setEditingUser(user);
    setUsrFirstName(user.firstName);
    setUsrLastName(user.lastName);
    setUsrEmail(user.email);
    setUsrRole(user.role);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      // Edit
      setUsers(users.map(u => u.id === editingUser.id ? {
        ...u,
        firstName: usrFirstName,
        lastName: usrLastName,
        email: usrEmail,
        role: usrRole
      } : u));
      
      addLog('User', 'UPDATED', `User profile updated: ${usrFirstName} ${usrLastName} (${usrEmail}) assigned as ${usrRole}.`);
    } else {
      // Create
      const newUser: User = {
        id: `usr-${Date.now()}`,
        firstName: usrFirstName,
        lastName: usrLastName,
        email: usrEmail,
        role: usrRole,
        isActive: true,
      };
      setUsers([...users, newUser]);
      
      addLog('User', 'CREATED', `New account generated: ${usrFirstName} ${usrLastName} assigned role ${usrRole}.`);
    }
    setIsUserModalOpen(false);
  };

  const toggleUserStatus = (id: string) => {
    const targetUser = users.find(u => u.id === id);
    if (targetUser) {
      const nextState = !targetUser.isActive;
      setUsers(users.map(u => u.id === id ? { ...u, isActive: nextState } : u));
      addLog('User', 'STATUS CHANGE', `Toggled ${targetUser.firstName} ${targetUser.lastName} account status to ${nextState ? 'ACTIVE' : 'INACTIVE'}.`);
    }
  };

  const handleDeleteUser = (id: string) => {
    const targetUser = users.find(u => u.id === id);
    if (targetUser) {
      if (confirm(`Are you sure you want to delete user ${targetUser.firstName}?`)) {
        setUsers(users.filter(u => u.id !== id));
        addLog('User', 'DELETED', `Permanently deleted system user: ${targetUser.firstName} ${targetUser.lastName} (${targetUser.email}).`);
      }
    }
  };

  // --- Role Operations (Create & Edit & Delete) ---
  const handleOpenCreateRole = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleCanCreate(false);
    setRoleCanEditAll(false);
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleCanCreate(role.canCreateProject);
    setRoleCanEditAll(role.canEditAllProjects);
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRole) {
      // Edit
      setRoles(roles.map(r => r.id === editingRole.id ? {
        ...r,
        name: roleName,
        canCreateProject: roleCanCreate,
        canEditAllProjects: roleCanEditAll,
      } : r));
      
      addLog('Role', 'UPDATED', `Permissions updated on custom role: "${roleName}".`);
    } else {
      // Create
      const newRole: Role = {
        id: `role-${Date.now()}`,
        name: roleName,
        canCreateProject: roleCanCreate,
        canEditAllProjects: roleCanEditAll,
      };
      setRoles([...roles, newRole]);
      
      addLog('Role', 'CREATED', `Custom system security role configured: "${roleName}".`);
    }
    setIsRoleModalOpen(false);
  };

  const handleDeleteRole = (id: string) => {
    const roleToDelete = roles.find(r => r.id === id);
    if (roleToDelete) {
      if (roleToDelete.name === 'Admin' || roleToDelete.name === 'Business Analyst' || roleToDelete.name === 'QA Engineer') {
        alert("System default permissions cannot be customized or deleted!");
        return;
      }
      if (confirm(`Delete the custom role "${roleToDelete.name}"?`)) {
        setRoles(roles.filter(r => r.id !== id));
        addLog('Role', 'DELETED', `Custom system role removed: "${roleToDelete.name}".`);
      }
    }
  };

  return (
    <div className={`p-8 min-h-screen font-sans ${isDarkMode ? 'dark bg-neutral-obsidian text-white' : 'bg-brand-lightBg text-brand-paramount'} transition-colors duration-300`}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Title Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">User Administration</h1>
            <p className="text-sm text-neutral-darkGray mt-1">Manage platform access, track security records, and assign user permissions.</p>
          </div>
          
          <div className="flex gap-2 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800">
            <button
              onClick={() => setAdminSection('users')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                adminSection === 'users' ? 'bg-brand-paramount text-white shadow-md' : 'text-slate-400 hover:text-slate-500'
              }`}
            >
              Users Directory
            </button>
            <button
              onClick={() => setAdminSection('roles')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                adminSection === 'roles' ? 'bg-brand-paramount text-white shadow-md' : 'text-slate-400 hover:text-slate-500'
              }`}
            >
              Role Settings
            </button>
            <button
              onClick={() => setAdminSection('logs')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                adminSection === 'logs' ? 'bg-brand-paramount text-white shadow-md' : 'text-slate-400 hover:text-slate-500'
              }`}
            >
              Logs Ledger
            </button>
          </div>
        </div>

        {/* Counter Summary Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-100 dark:border-neutral-800/80 bg-white dark:bg-neutral-cardDark p-6 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-2">Total Users</span>
            <span className="text-4xl font-black text-brand-paramount dark:text-white">{users.length}</span>
          </div>
          <div className="rounded-2xl border border-slate-100 dark:border-neutral-800/80 bg-white dark:bg-neutral-cardDark p-6 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-2">Custom Roles</span>
            <span className="text-4xl font-black text-brand-accent">{roles.length}</span>
          </div>
          <div className="rounded-2xl border border-slate-100 dark:border-neutral-800/80 bg-white dark:bg-neutral-cardDark p-6 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-2">Logs Captured</span>
            <span className="text-4xl font-black text-brand-accent">{logs.length}</span>
          </div>
        </div>

        {/* --- Tab 1: Users Directory --- */}
        {adminSection === 'users' && (
          <div className="bg-white dark:bg-neutral-cardDark rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-brand-paramount dark:text-white">Active Users</h2>
              <button
                onClick={handleOpenCreateUser}
                className="px-4 py-2 bg-brand-accent hover:opacity-95 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow transition-all"
              >
                + Add New User
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/50 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                    <th className="p-6">User</th>
                    <th className="p-6">Role</th>
                    <th className="p-6">Status</th>
                    <th className="p-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30 text-sm">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                      <td className="p-6">
                        <div className="font-bold text-brand-paramount dark:text-white">{u.firstName} {u.lastName}</div>
                        <div className="text-xs text-slate-400 font-medium">{u.email}</div>
                      </td>
                      <td className="p-6">
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase bg-purple-500/10 text-purple-600 dark:text-purple-300">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end space-x-6">
                          
                          {/* Circle Toggle Switch */}
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                            <button
                              onClick={() => toggleUserStatus(u.id)}
                              className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
                                u.isActive ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-800'
                              }`}
                            >
                              <div
                                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                                  u.isActive ? 'translate-x-6' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>

                          <div className="flex items-center space-x-3 border-l border-slate-100 dark:border-slate-800 pl-4">
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="text-xs font-bold text-brand-accent uppercase tracking-widest hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-xs font-bold text-red-500 uppercase tracking-widest hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- Tab 2: Role Directory --- */}
        {adminSection === 'roles' && (
          <div className="bg-white dark:bg-neutral-cardDark rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-brand-paramount dark:text-white">System Permission Levels</h2>
              <button
                onClick={handleOpenCreateRole}
                className="px-4 py-2 bg-brand-accent hover:opacity-95 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow transition-all"
              >
                + Create Custom Role
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/50 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                    <th className="p-6">Role Name</th>
                    <th className="p-6">Create Projects</th>
                    <th className="p-6">Edit Scope Permission</th>
                    <th className="p-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30 text-sm">
                  {roles.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                      <td className="p-6">
                        <span className="font-bold text-brand-paramount dark:text-white text-base">{r.name}</span>
                      </td>
                      <td className="p-6">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                          r.canCreateProject ? 'bg-green-100 dark:bg-green-950/30 text-green-700' : 'bg-red-100 dark:bg-red-950/30 text-red-600'
                        }`}>
                          {r.canCreateProject ? 'Allowed' : 'Disabled'}
                        </span>
                      </td>
                      <td className="p-6">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                          r.canEditAllProjects ? 'bg-green-100 dark:bg-green-950/30 text-green-700' : 'bg-orange-100 dark:bg-orange-950/30 text-orange-600'
                        }`}>
                          {r.canEditAllProjects ? 'All Projects' : 'Own Created Only (Others View-Only)'}
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end space-x-4">
                          <button
                            onClick={() => handleOpenEditRole(r)}
                            className="text-xs font-bold text-brand-accent uppercase tracking-widest hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRole(r.id)}
                            className="text-xs font-bold text-red-500 uppercase tracking-widest hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- Tab 3: Security & Activity Logs Ledger --- */}
        {adminSection === 'logs' && (
          <div className="bg-white dark:bg-neutral-cardDark rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/50">
              <h2 className="text-lg font-bold text-brand-paramount dark:text-white">Admin Activity Ledger</h2>
              <p className="text-xs text-neutral-darkGray mt-1">Audit log of accounts registered, custom role scopes altered, and status toggles.</p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/30 max-h-[500px] overflow-y-auto">
              {logs.map(log => (
                <div key={log.id} className="p-5 flex items-start justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-all text-xs">
                  <div className="space-y-1 pr-6">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase ${
                        log.category === 'User' ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-500' : 'bg-purple-100 dark:bg-purple-950/30 text-purple-500'
                      }`}>
                        {log.category}
                      </span>
                      <span className="font-bold uppercase text-brand-paramount dark:text-slate-300">{log.action}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{log.details}</p>
                  </div>
                  <span className="text-slate-400 font-medium shrink-0">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* --- MODAL 1: REGISTER/EDIT USER --- */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-cardDark rounded-2xl p-8 shadow-2xl border border-slate-100 dark:border-neutral-800">
            <h3 className="text-xl font-bold text-brand-paramount dark:text-white mb-6">
              {editingUser ? 'Update User Details' : 'Register New User'}
            </h3>
            <form onSubmit={handleSaveUser} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">First Name</label>
                  <input
                    type="text" required value={usrFirstName} onChange={(e) => setUsrFirstName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-accent text-slate-800 dark:text-white"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Last Name</label>
                  <input
                    type="text" required value={usrLastName} onChange={(e) => setUsrLastName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-accent text-slate-800 dark:text-white"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email Address (Login)</label>
                <input
                  type="email" required value={usrEmail} onChange={(e) => setUsrEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-accent text-slate-800 dark:text-white"
                  placeholder="name@company.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Assign Security Role</label>
                <select
                  value={usrRole} onChange={(e) => setUsrRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-accent text-slate-800 dark:text-white cursor-pointer"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button" onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-brand-accent text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow hover:opacity-90 transition-all"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: CREATE/EDIT ROLE (CRUD) --- */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-cardDark rounded-2xl p-8 shadow-2xl border border-slate-100 dark:border-neutral-800">
            <h3 className="text-xl font-bold text-brand-paramount dark:text-white mb-6">
              {editingRole ? `Modify Role: ${editingRole.name}` : 'Create Custom Security Role'}
            </h3>
            
            <form onSubmit={handleSaveRole} className="space-y-6 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Role Name</label>
                <input
                  type="text" required value={roleName} onChange={(e) => setRoleName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-accent text-slate-800 dark:text-white"
                  placeholder="e.g., Senior BA"
                />
              </div>

              <div className="space-y-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Access Permissions</p>
                
                {/* Switch Permission A */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-brand-paramount dark:text-slate-200 block">Create Page & Projects</span>
                    <span className="text-xs text-slate-400">Allows creation of new projects & new sub-pages inside projects.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRoleCanCreate(!roleCanCreate)}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
                      roleCanCreate ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-800'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                        roleCanCreate ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Switch Permission B */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-brand-paramount dark:text-slate-200 block">Edit All Projects</span>
                    <span className="text-xs text-slate-400">Unrestricted edit. If OFF, user edits only their created projects.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRoleCanEditAll(!roleCanEditAll)}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
                      roleCanEditAll ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-800'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                        roleCanEditAll ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                <button
                  type="button" onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-brand-accent text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow hover:opacity-90 transition-all"
                >
                  Save Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}