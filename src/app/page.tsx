"use client";
import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { getToken } from "@/lib/tokenStorage";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { 
    Users, 
    Heart, 
    Package, 
    Activity, 
    Lock, 
    Droplets, 
    Shield, 
    ChevronRight, 
    BarChart3, 
    CheckCircle2, 
    XCircle, 
    Building2, 
    Plus,
    Handshake,
    LayoutDashboard,
    LogOut,
    Menu,
    X,
    Search,
    Bell,
    ArrowUpRight,
    TrendingUp,
    Settings,
    FileText
} from "lucide-react";
import BloodBankAdmin from "@/components/BloodBankAdmin";
import AddHospitalForm from "@/components/AddHospitalForm";
import HospitalListAdmin from "@/components/HospitalListAdmin";
import PartnerInquiriesAdmin from "@/components/PartnerInquiriesAdmin";
import BlogAdmin from "@/components/BlogAdmin";
import AnalyticsAdmin from "@/components/AnalyticsAdmin";

// Premium Font Configuration
const jakarta = Plus_Jakarta_Sans({ 
    subsets: ["latin"],
    weight: ['400', '500', '600', '700', '800'],
    variable: '--font-jakarta',
});

const inter = Inter({ 
    subsets: ["latin"],
    variable: '--font-inter',
});

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] } }
};

type TabId = 'overview' | 'analytics' | 'approvals' | 'bloodbank' | 'hospitals' | 'partners' | 'blogs';

export default function AdminDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [stats, setStats] = useState<any>(null);
    const [pendingUsers, setPendingUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showAddHospital, setShowAddHospital] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const fetchPendingUsers = useCallback(async () => {
        const token = getToken();
        try {
            const res = await api.get("/admin/users?status=pending");

            setPendingUsers(res.data);
        } catch (err: any) {
            console.error("Failed to fetch pending users", err);
        }
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            const token = getToken();
            if (!token) {
                router.push("/login");
                return;
            }

            const res = await api.get("/admin/stats");

            setStats(res.data);
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 403 || err.response?.status === 401) {
                setError("Access Denied. Admin privileges required.");
            } else {
                setError("Failed to load dashboard data.");
            }
        }
    }, [router]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                await Promise.all([fetchStats(), fetchPendingUsers()]);
            } catch (error) {
                console.error("Error fetching admin data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [fetchStats, fetchPendingUsers]);

    const handleStatusUpdate = async (userId: string, status: 'approved' | 'rejected') => {
        const token = getToken();
        if (!confirm(`Are you sure you want to ${status} this user?`)) return;

        try {
            await api.put(`/admin/users/${userId}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingUsers(prev => prev.filter(u => u._id !== userId));
            fetchStats();
        } catch (err) {
            alert("Failed to update status");
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden ${jakarta.variable} font-sans`}>
                <div className="absolute w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-[120px] animate-pulse" />
                <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-[3px] border-blue-50 border-t-blue-600 rounded-full relative z-10"
                />
                <p className="mt-8 font-semibold text-slate-400 tracking-[0.3em] uppercase text-[9px] relative z-10">Secure Boot</p>
            </div>
        )
    }

    const navigation = [
        { id: 'overview', label: 'Overview', icon: BarChart3, color: 'text-blue-600' },
        { id: 'analytics', label: 'Web Analytics', icon: Activity, color: 'text-blue-600' },
        { id: 'approvals', label: 'User Approvals', icon: Lock, color: 'text-amber-500', badge: pendingUsers.length },
        { id: 'bloodbank', label: 'Blood Connect', icon: Droplets, color: 'text-rose-500' },
        { id: 'hospitals', label: 'Hospitals', icon: Building2, color: 'text-indigo-600' },
        { id: 'partners', label: 'Partnerships', icon: Handshake, color: 'text-emerald-600' },
        { id: 'blogs', label: 'Blog Posts', icon: FileText, color: 'text-purple-600' },
    ];

    return (
        <div className={`min-h-screen bg-[#FDFDFF] text-slate-900 ${jakarta.variable} ${inter.variable} font-sans selection:bg-blue-600/10 flex overflow-hidden`}>
            {/* Sidebar */}
            <motion.aside 
                initial={false}
                animate={{ width: isSidebarOpen ? '320px' : '96px' }}
                className="bg-white border-r border-slate-100 flex flex-col relative z-50 transition-all duration-500"
            >
                {/* Logo Section */}
                <div className="h-28 flex items-center px-8 gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl shadow-blue-600/40">
                        <Shield className="w-7 h-7 text-white" />
                    </div>
                    {isSidebarOpen && (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="font-bold text-2xl tracking-tight text-slate-900 font-jakarta">
                            Pillora <span className="text-blue-600 font-extrabold">Hub</span>
                        </motion.div>
                    )}
                </div>

                {/* Nav Items */}
                <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                    {navigation.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as TabId)}
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 relative group ${
                                activeTab === item.id 
                                ? 'bg-blue-600 text-white shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)]' 
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                            <item.icon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${activeTab === item.id ? 'text-white' : item.color} group-hover:scale-110`} />
                            {isSidebarOpen && (
                                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-semibold text-[15px] tracking-tight">
                                    {item.label}
                                </motion.span>
                            )}
                            {item.badge && item.badge > 0 && (
                                <span className={`absolute right-4 top-1/2 -translate-y-1/2 min-w-[22px] h-[22px] px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    activeTab === item.id ? 'bg-white text-blue-600' : 'bg-red-500 text-white'
                                }`}>
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* User Profile Area */}
                <div className="p-6 border-t border-slate-50">
                    <div className={`flex items-center gap-4 p-4 rounded-2xl bg-slate-50 mb-4 transition-all ${!isSidebarOpen && 'justify-center p-2'}`}>
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-sm shrink-0">SA</div>
                        {isSidebarOpen && (
                            <div className="overflow-hidden">
                                <p className="font-bold text-sm text-slate-900 truncate">Super Admin</p>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest truncate">Root Access</p>
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={() => {
                            if(confirm("Terminate administrative session?")) {
                                localStorage.clear();
                                window.location.href = '/login';
                            }
                        }}
                        className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all group font-bold text-xs uppercase tracking-[0.2em]"
                    >
                        <LogOut className="w-4 h-4 shrink-0 group-hover:rotate-12 transition-transform" />
                        {isSidebarOpen && <span>Logout</span>}
                    </button>
                </div>

                {/* Toggle Button */}
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute -right-4 top-32 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 shadow-xl hover:text-blue-600 hover:border-blue-200 transition-all z-[60]"
                >
                    {isSidebarOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
                </button>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-white">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-50/30 rounded-full blur-[140px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
                
                {/* Header */}
                <header className="h-28 px-12 flex items-center justify-between relative z-10">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em]">
                            <LayoutDashboard className="w-3 h-3" /> System
                            <ChevronRight className="w-3 h-3" /> {activeTab}
                        </div>
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight font-jakarta">
                            {navigation.find(n => n.id === activeTab)?.label}
                        </h2>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="hidden xl:flex items-center gap-3 px-6 py-3 bg-slate-50/80 rounded-2xl border border-slate-100 focus-within:bg-white focus-within:border-blue-200 focus-within:shadow-xl focus-within:shadow-blue-900/5 transition-all">
                            <Search className="w-4 h-4 text-slate-400" />
                            <input type="text" placeholder="Search system resources..." className="bg-transparent border-none outline-none text-sm font-semibold text-slate-900 placeholder:text-slate-400 w-72" />
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 transition-all relative">
                                <Bell className="w-5 h-5 text-slate-500" />
                                <span className="absolute top-4 right-4 w-2 h-2 bg-blue-600 rounded-full ring-4 ring-white" />
                            </button>
                            <button className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 transition-all">
                                <Settings className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Content Container */}
                <div className="flex-1 overflow-y-auto px-12 pb-12 relative z-10 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.35, ease: "circOut" }}
                            className="font-inter"
                        >
                            {activeTab === 'overview' && (
                                <div className="space-y-12">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <StatCard
                                            icon={<Users className="w-7 h-7" />}
                                            label="Total Network Users"
                                            value={stats?.counts?.users || 0}
                                            trend="+12.4%"
                                            color="blue"
                                        />
                                        <StatCard
                                            icon={<Heart className="w-7 h-7" />}
                                            label="Verified Donors"
                                            value={stats?.counts?.donors || 0}
                                            trend="+3.2%"
                                            color="rose"
                                        />
                                        <StatCard
                                            icon={<TrendingUp className="w-7 h-7" />}
                                            label="System Activity"
                                            value={stats?.counts?.activity || 0}
                                            trend="+28.1%"
                                            color="emerald"
                                        />
                                    </div>

                                    {/* Detailed Insights */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                        {/* Activity Log */}
                                        <div className="lg:col-span-8 bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-xl shadow-blue-900/5">
                                            <div className="flex items-center justify-between mb-10">
                                                <h3 className="text-xl font-bold text-slate-900 font-jakarta flex items-center gap-3">
                                                    <Activity className="w-5 h-5 text-blue-600" /> Platform Insights
                                                </h3>
                                                <button className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all flex items-center gap-2">
                                                    View Detailed Log <ArrowUpRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="space-y-4">
                                                {[
                                                    { title: "New Hospital Registered", desc: "Apollo Healthcare successfully added to the network.", time: "14 mins ago", tag: "Registry" },
                                                    { title: "Database Sync Complete", desc: "Global blood donor indices optimized and synced.", time: "2 hours ago", tag: "System" },
                                                    { title: "Security Patch v2.1", desc: "Aadhaar verification middleware updated for faster processing.", time: "5 hours ago", tag: "Security" }
                                                ].map((log, i) => (
                                                    <div key={i} className="flex items-center justify-between p-6 bg-[#FDFDFF] hover:bg-blue-50/30 rounded-3xl border border-slate-50 transition-all group">
                                                        <div className="flex items-center gap-6">
                                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100 group-hover:scale-110 group-hover:text-blue-600 transition-all">
                                                                <Package className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900 text-base mb-0.5">{log.title}</p>
                                                                <p className="text-sm text-slate-500 font-medium">{log.desc}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right hidden sm:block">
                                                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">{log.tag}</p>
                                                            <p className="text-[11px] font-semibold text-slate-400">{log.time}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Notifications / Alerts */}
                                        <div className="lg:col-span-4 bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl" />
                                            <h3 className="text-xl font-bold text-white font-jakarta mb-8 flex items-center gap-3 relative z-10">
                                                <Bell className="w-5 h-5 text-amber-500" /> Active Alerts
                                            </h3>
                                            <div className="space-y-6 relative z-10">
                                                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer group/alert">
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-3">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Urgent Requirement
                                                    </div>
                                                    <p className="text-sm font-semibold text-slate-200 leading-relaxed">NGO &quot;LifeSource&quot; is requesting priority access for blood donor API.</p>
                                                    <div className="flex items-center justify-between mt-4">
                                                        <span className="text-[10px] text-slate-500 font-bold uppercase">Today • 11:24 AM</span>
                                                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover/alert:translate-x-1 transition-transform" />
                                                    </div>
                                                </div>
                                                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer group/alert">
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" /> System Update
                                                    </div>
                                                    <p className="text-sm font-semibold text-slate-300 leading-relaxed">Automatic backup of PostgreSQL database completed successfully.</p>
                                                    <div className="flex items-center justify-between mt-4">
                                                        <span className="text-[10px] text-slate-500 font-bold uppercase">Today • 04:12 AM</span>
                                                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover/alert:translate-x-1 transition-transform" />
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="w-full mt-10 py-4 bg-white/10 text-white font-bold rounded-2xl text-[11px] uppercase tracking-[0.2em] hover:bg-white hover:text-slate-900 transition-all">
                                                Clear Command Center
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'analytics' && (
                                <AnalyticsAdmin />
                            )}

                            {activeTab === 'approvals' && (
                                <div className="space-y-8">
                                    <div className="bg-white border border-slate-100 p-12 rounded-[3rem] shadow-xl shadow-blue-900/5">
                                        <div className="flex items-center justify-between mb-12">
                                            <div>
                                                <h3 className="text-2xl font-bold text-slate-900 font-jakarta flex items-center gap-3">
                                                    <Lock className="w-6 h-6 text-amber-500" /> Identity Verification
                                                </h3>
                                                <p className="text-slate-500 font-medium mt-1.5">Review credentials of new platform participants</p>
                                            </div>
                                            <div className="px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                                {pendingUsers.length} Applications Pending
                                            </div>
                                        </div>

                                        {pendingUsers.length === 0 ? (
                                            <div className="text-center py-24 bg-[#FDFDFF] rounded-[2.5rem] border-2 border-dashed border-slate-100">
                                                <div className="w-20 h-20 bg-white rounded-full shadow-xl flex items-center justify-center mx-auto mb-6">
                                                    <CheckCircle2 className="w-10 h-10 text-slate-200" />
                                                </div>
                                                <h4 className="text-xl font-bold text-slate-400 uppercase tracking-widest">Verification Clear</h4>
                                                <p className="text-slate-400 mt-2 font-medium">No pending user applications to process.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                                <AnimatePresence>
                                                    {pendingUsers.map((user: any) => (
                                                        <motion.div 
                                                            key={user._id}
                                                            initial={{ opacity: 0, scale: 0.98 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.95 }}
                                                            className="flex flex-col p-8 bg-[#FDFDFF] hover:bg-white rounded-[2rem] border border-slate-50 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-500"
                                                        >
                                                            <div className="flex items-center gap-6 mb-10">
                                                                <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-bold text-2xl shadow-xl">
                                                                    {user.name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-slate-900 text-lg leading-none">{user.name}</p>
                                                                    <div className="flex items-center gap-3 mt-2.5">
                                                                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">{user.role}</span>
                                                                        <span className="text-slate-400 text-xs font-semibold">{user.email}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <button
                                                                    onClick={() => handleStatusUpdate(user._id, 'approved')}
                                                                    className="flex-1 py-4 bg-blue-600 text-white hover:bg-blue-700 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => handleStatusUpdate(user._id, 'rejected')}
                                                                    className="flex-1 py-4 bg-white text-rose-500 hover:bg-rose-50 border border-rose-100 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all active:scale-95"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'bloodbank' && (
                                <div className="space-y-8">
                                    <div className="bg-white border border-slate-100 p-12 rounded-[3rem] shadow-xl shadow-blue-900/5">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
                                            <div className="space-y-1">
                                                <h3 className="text-2xl font-bold text-slate-900 font-jakarta flex items-center gap-3">
                                                    <Droplets className="w-8 h-8 text-rose-500" /> Blood Network Live
                                                </h3>
                                                <p className="text-slate-500 font-medium italic">Emergency resource tracking and donor coordination console</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-3 px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 text-[10px] font-bold uppercase tracking-widest">
                                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Network Synchronized
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-[#FDFDFF] rounded-[2.5rem] border border-slate-100 p-8">
                                            <BloodBankAdmin />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'hospitals' && (
                                <div className="space-y-12">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
                                        <div className="space-y-1">
                                            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight font-jakarta">Medical Directory</h2>
                                            <p className="text-slate-500 font-medium text-lg italic">Manage healthcare infrastructure and system registration</p>
                                        </div>
                                        <button
                                            onClick={() => setShowAddHospital(!showAddHospital)}
                                            className={`px-10 py-5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.25em] transition-all duration-500 flex items-center gap-3 shadow-2xl ${
                                                showAddHospital 
                                                ? 'bg-slate-900 text-white hover:bg-slate-800' 
                                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/40 hover:-translate-y-2 active:scale-95'
                                            }`}
                                        >
                                            {showAddHospital ? <XCircle className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                                            {showAddHospital ? 'Exit Form' : 'Register Hospital'}
                                        </button>
                                    </div>

                                    <AnimatePresence mode="wait">
                                        {showAddHospital ? (
                                            <motion.div
                                                key="hospital-form"
                                                initial={{ opacity: 0, scale: 0.99, y: 20 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.99, y: -20 }}
                                                className="bg-white rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] border border-slate-100 overflow-hidden"
                                            >
                                                <AddHospitalForm onClose={() => {
                                                    setShowAddHospital(false);
                                                    setRefreshTrigger(prev => prev + 1);
                                                }} />
                                            </motion.div>
                                        ) : (
                                            <motion.div 
                                                key="hospital-list"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="bg-white p-12 rounded-[3.5rem] shadow-xl shadow-blue-900/5 border border-slate-50"
                                            >
                                                <HospitalListAdmin key={refreshTrigger} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {activeTab === 'partners' && (
                                <div className="space-y-10">
                                    <div className="bg-white border border-slate-100 p-12 rounded-[3rem] shadow-xl shadow-blue-900/5">
                                        <div className="flex items-center justify-between mb-12">
                                            <div className="space-y-1">
                                                <h3 className="text-3xl font-extrabold text-slate-900 font-jakarta flex items-center gap-4 tracking-tight">
                                                    <Handshake className="w-10 h-10 text-blue-600" /> Strategic Hub
                                                </h3>
                                                <p className="text-slate-500 font-medium text-lg italic">Collaboration proposals from Healthcare Entities & NGOs</p>
                                            </div>
                                        </div>
                                        <PartnerInquiriesAdmin />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'blogs' && (
                                <BlogAdmin />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}

function StatCard({ icon, label, value, trend, color }: any) {
    const colors: any = {
        blue: {
            bg: 'bg-blue-50',
            icon: 'text-blue-600',
            border: 'border-blue-100/50',
            indicator: 'bg-blue-500'
        },
        rose: {
            bg: 'bg-rose-50',
            icon: 'text-rose-600',
            border: 'border-rose-100/50',
            indicator: 'bg-rose-500'
        },
        emerald: {
            bg: 'bg-emerald-50',
            icon: 'text-emerald-600',
            border: 'border-emerald-100/50',
            indicator: 'bg-emerald-500'
        }
    };

    return (
        <motion.div
            variants={itemVariants}
            className="group p-10 rounded-[3rem] bg-white border border-slate-100 transition-all duration-700 hover:shadow-2xl hover:shadow-blue-900/10 hover:border-blue-100 relative overflow-hidden"
        >
            <div className={`absolute -right-12 -top-12 w-48 h-48 rounded-full ${colors[color].bg} blur-3xl opacity-30 group-hover:opacity-60 transition-opacity duration-700`} />
            
            <div className="flex items-start justify-between mb-10 relative z-10">
                <div className={`p-5 ${colors[color].bg} rounded-2xl group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 border border-transparent group-hover:border-white shadow-sm`}>
                    <div className={colors[color].icon}>{icon}</div>
                </div>
                <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-full">
                    <div className={`w-1.5 h-1.5 rounded-full ${colors[color].indicator} animate-pulse`} />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Realtime</span>
                </div>
            </div>
            
            <div className="relative z-10">
                <h3 className="text-6xl font-extrabold text-slate-900 mb-2 tracking-tighter font-jakarta">
                    {value}
                </h3>
                <p className="text-slate-400 font-bold tracking-[0.2em] uppercase text-[9px] italic">{label}</p>
            </div>

            <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between">
                <div className={`flex items-center gap-1.5 ${colors[color].icon} text-sm font-bold`}>
                    <TrendingUp className="w-4 h-4" /> {trend}
                </div>
                <span className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">Growth Index</span>
            </div>
        </motion.div>
    )
}
