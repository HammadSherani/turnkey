"use client";
import React, { useState, useEffect } from 'react';
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { 
  Users, LayoutDashboard, Settings, CreditCard, 
  LogOut, Bell, Search, ChevronLeft, ChevronRight, 
  User as UserIcon, Menu, X, Circle, UserCircle, Mail, Clock
} from 'lucide-react';
import { format } from "date-fns";

export default function FullAdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    if (status === "unauthenticated" || (status === "authenticated" && session?.user?.role !== "admin")) {
      return; 
    }

    if (status === "authenticated" && session?.user?.role === "admin") {
      const fetchData = async () => {
        setLoading(true);
        try {
          const userRes = await fetch("/api/admin/users");
          const userData = await userRes.json();
          setUsers(userData);

          const msgRes = await fetch("/api/contact");
          if (msgRes.ok) {
            const msgData = await msgRes.json();
            setMessages(msgData);
          }
        } catch (err) {
          console.error("❌ Error fetching data:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [session, status]);

  const toggleStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus !== "active"; 
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive: nextStatus })
      });
      if (res.ok) {
        setUsers(users.map(u => u._id === userId ? { ...u, status: nextStatus ? "active" : "deactive" } : u));
      }
    } catch (err) { console.error("❌ Failed to update status"); }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth?mode=login" });
  };

  const filteredData = activeTab === "users" 
    ? users.filter(u => u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages.filter(m => m.email?.toLowerCase().includes(searchQuery.toLowerCase()) || m.message?.toLowerCase().includes(searchQuery.toLowerCase()));

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (status === "loading" || (loading && status === "authenticated")) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 text-center p-6">
        <X className="text-red-600 w-12 h-12 mb-4" />
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Access Denied</h1>
        <button onClick={() => router.push("/")} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold">Retour à l'accueil</button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden">
      
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-20`}>
        <div className="p-6 flex items-center gap-3">
          <div className="bg-indigo-600 min-w-[32px] h-8 flex items-center justify-center rounded-lg text-white font-bold">R</div>
          {sidebarOpen && <span className="font-bold text-xl tracking-tight text-indigo-600">Admin Dashboard</span>}
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button onClick={() => {setActiveTab("users"); setCurrentPage(1);}} className="w-full">
            <NavItem icon={<Users size={20} />} label="Users" active={activeTab === "users"} open={sidebarOpen} />
          </button>
          <button onClick={() => {setActiveTab("contacts"); setCurrentPage(1);}} className="w-full">
            <NavItem icon={<Mail size={20} />} label="Contacts" active={activeTab === "contacts"} open={sidebarOpen} />
          </button>
        </nav>

        {/* Sidebar Logout Button */}
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-3 text-slate-500 hover:text-red-600 hover:bg-red-50 w-full p-2.5 rounded-lg transition-all"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="font-medium text-sm">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-500 p-2"><Menu size={20} /></button>
          
          <div className="flex items-center gap-4">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-3 outline-none group cursor-pointer">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-slate-800 leading-none">{session?.user?.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase">SUPER ADMIN</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 border border-slate-200 group-hover:border-indigo-300 transition-all">
                    <UserIcon size={20} />
                  </div>
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content className="min-w-[160px] bg-white rounded-xl shadow-xl border border-slate-100 p-1.5 z-50 animate-in fade-in zoom-in duration-200" align="end" sideOffset={8}>
                  <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 outline-none rounded-md hover:bg-slate-50 cursor-pointer">
                    <UserCircle size={16} /> Profile
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="h-px bg-slate-100 my-1" />
                  <DropdownMenu.Item 
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 outline-none rounded-md hover:bg-red-50 cursor-pointer font-medium"
                  >
                    <LogOut size={16} /> Logout
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {/* ... Content baki waisa hi rahy ga jo apny tab logic banai thi ... */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-800">
                {activeTab === "users" ? "User Management" : "Contact Messages"}
              </h1>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
               {/* Search & Table Logic ... */}
               <div className="p-4 border-b border-slate-50 bg-slate-50/30">
                 <div className="relative w-full max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder={activeTab === "users" ? "Search users..." : "Search messages..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none" 
                    />
                 </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-slate-50/50 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                    {activeTab === "users" ? (
                      <tr>
                        <th className="px-6 py-4">User Details</th>
                        <th className="px-6 py-4">Subscription</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    ) : (
                      <tr>
                        <th className="px-6 py-4">Sender</th>
                        <th className="px-6 py-4 w-[40%]">Message</th>
                        <th className="px-6 py-4">Date</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeTab === "users" ? (
                      currentItems.map((user) => (
                        <tr key={user._id} className="hover:bg-slate-50/40">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">{user.name?.charAt(0)}</div>
                              <div>
                                <p className="text-sm font-semibold">{user.name}</p>
                                <p className="text-xs text-slate-400">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">{user.plan || "Free"}</span></td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-xs font-medium">
                              <Circle size={6} fill={user.status === "active" ? "#10b981" : "#94a3b8"} className={user.status === "active" ? "text-emerald-500" : "text-slate-400"} />
                              {user.status}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => toggleStatus(user._id, user.status)} className="text-xs font-bold text-indigo-600 hover:underline">{user.status === "active" ? 'Disable' : 'Enable'}</button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      currentItems.map((msg) => (
                        <tr key={msg._id} className="hover:bg-slate-50/40">
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold">{msg.firstName} {msg.lastName}</p>
                            <p className="text-xs text-slate-400">{msg.email}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 italic">"{msg.message}"</td>
                          <td className="px-6 py-4 text-xs text-slate-400">{format(new Date(msg.createdAt), "dd MMM yyyy")}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
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