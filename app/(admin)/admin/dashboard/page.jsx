"use client";
import React, { useState, useEffect } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { 
  Users, LayoutDashboard, Settings, CreditCard, 
  LogOut, Bell, Search, ChevronLeft, ChevronRight, 
  User as UserIcon, Menu, X, Circle, UserCircle
} from 'lucide-react';

// --- 1. Plans Data (Lowercase to match DB query) ---
const plans = [
  { id: "starter", name: "Starter", color: "bg-blue-100 text-blue-700" },
  { id: "pro", name: "Pro", color: "bg-purple-100 text-purple-700" },
  { id: "prime", name: "Prime", color: "bg-amber-100 text-amber-700" },
];

export default function FullAdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 6;

  // --- 2. Fetch Users from Backend ---
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/admin/users");
        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error("❌ Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // --- 3. Toggle User Status (Active/Deactive) ---
  const toggleStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus !== "active"; 
    
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive: nextStatus })
      });

      if (res.ok) {
        setUsers(users.map(u => 
          u._id === userId ? { ...u, paymentStatus: nextStatus ? "active" : "deactive" } : u
        ));
      }
    } catch (err) {
      console.error("❌ Failed to update status");
    }
  };

  // --- 4. Search & Pagination Logic ---
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const currentUsers = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-20`}>
        <div className="p-6 flex items-center gap-3">
          <div className="bg-indigo-600 min-w-[32px] h-8 flex items-center justify-center rounded-lg text-white font-bold">R</div>
          {sidebarOpen && <span className="font-bold text-xl tracking-tight text-indigo-600">RadixUI</span>}
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem icon={<LayoutDashboard size={20} />} label="Overview" active={false} open={sidebarOpen} />
          <NavItem icon={<Users size={20} />} label="Users" active={true} open={sidebarOpen} />
          <NavItem icon={<CreditCard size={20} />} label="Billing" active={false} open={sidebarOpen} />
          <NavItem icon={<Settings size={20} />} label="Settings" active={false} open={sidebarOpen} />
        </nav>

        <div className="p-4 border-t border-slate-100">
           <button className="flex items-center gap-3 text-slate-500 hover:text-red-600 hover:bg-red-50 w-full p-2 rounded-lg transition-colors">
              <LogOut size={20} />
              {sidebarOpen && <span className="font-medium text-sm">Sign Out</span>}
           </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* --- TOP BAR --- */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-500 hover:bg-slate-50 p-2 rounded-md transition-all">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-indigo-600 p-2 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-3 pl-4 border-l border-slate-200 outline-none group">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-slate-800 leading-none">Admin Mode</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">SUPER ADMIN</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-indigo-600 group-data-[state=open]:ring-2 group-data-[state=open]:ring-indigo-100 transition-all">
                    <UserIcon size={20} />
                  </div>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="min-w-[200px] bg-white rounded-xl shadow-2xl border border-slate-100 p-1.5 z-50" align="end" sideOffset={10}>
                  <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 outline-none rounded-md hover:bg-slate-50 cursor-pointer"><UserCircle size={16} /> Profile</DropdownMenu.Item>
                  <DropdownMenu.Separator className="h-px bg-slate-100 my-1" />
                  <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 outline-none rounded-md hover:bg-red-50 cursor-pointer font-medium"><LogOut size={16} /> Logout</DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </header>

        {/* --- TABLE BODY --- */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
              <p className="text-slate-500 text-sm">Real-time database records for registered users.</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-50 bg-slate-50/30">
                 <div className="relative w-full max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search name or email..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                    />
                 </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                    <tr>
                      <th className="px-6 py-4">User Details</th>
                      <th className="px-6 py-4">Subscription Plan</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentUsers.map((user) => {
                      const plan = plans.find(p => p.id === user.plan?.toLowerCase()) || plans[0];
                      const isUserActive = user.paymentStatus === "active";

                      return (
                        <tr key={user._id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-indigo-600 flex items-center justify-center font-bold text-xs border border-slate-200">
                                {user.name?.charAt(0) || "U"}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                                <p className="text-xs text-slate-400">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${plan.color}`}>
                              {user.plan || "NO PLAN"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Circle size={6} fill={isUserActive ? "#10b981" : "#94a3b8"} className={isUserActive ? "text-emerald-500" : "text-slate-400"} />
                              <span className={`text-xs font-medium ${isUserActive ? 'text-emerald-700' : 'text-slate-500'}`}>
                                {isUserActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => toggleStatus(user._id, user.paymentStatus)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all ${isUserActive ? 'text-red-500 hover:bg-red-50' : 'text-indigo-600 hover:bg-indigo-50'}`}
                            >
                              {isUserActive ? 'Disable Account' : 'Enable Account'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500 font-medium">Page {currentPage} of {totalPages || 1}</p>
                <div className="flex gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="p-1.5 border border-slate-200 rounded-md bg-white disabled:opacity-40 shadow-sm"
                  ><ChevronLeft size={16} /></button>
                  <button 
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="p-1.5 border border-slate-200 rounded-md bg-white disabled:opacity-40 shadow-sm"
                  ><ChevronRight size={16} /></button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, open }) {
  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
      active ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
    }`}>
      <div className={`${active ? 'text-indigo-600' : 'text-slate-400'}`}>{icon}</div>
      {open && <span className="font-semibold text-sm tracking-tight">{label}</span>}
    </div>
  );
}