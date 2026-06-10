"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { 
    Users, 
    Activity, 
    Calendar, 
    Search, 
    Download, 
    RefreshCw, 
    ShieldAlert, 
    Smartphone, 
    Laptop, 
    Globe, 
    Droplets 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginAnalyticsAdmin() {
    const [stats, setStats] = useState<any>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRole, setSelectedRole] = useState("all");
    const [refreshing, setRefreshing] = useState(false);

    const fetchLoginAnalytics = useCallback(async () => {
        try {
            const res = await api.get("/admin/login-analytics");
            if (res.data) {
                setStats(res.data.stats);
                setActivities(res.data.activities);
            }
        } catch (err) {
            console.error("Failed to fetch login analytics", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchLoginAnalytics();
        const interval = setInterval(fetchLoginAnalytics, 20000); // refresh every 20s
        return () => clearInterval(interval);
    }, [fetchLoginAnalytics]);

    const handleManualRefresh = () => {
        setRefreshing(true);
        fetchLoginAnalytics();
    };

    // Export to CSV Function
    const handleExportCSV = () => {
        if (activities.length === 0) return;

        const headers = ["User Name", "Email", "Role", "Blood Group", "IP Address", "User Agent", "Timestamp (IST)"];
        const rows = activities.map(act => {
            const formattedTime = new Date(act.timestamp).toLocaleString("en-US", {
                timeZone: "Asia/Kolkata"
            });
            return [
                act.name,
                act.email,
                act.role,
                act.bloodGroup || "N/A",
                act.ipAddress,
                `"${act.userAgent.replace(/"/g, '""')}"`,
                formattedTime
            ];
        });

        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `User_Login_Analytics_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Helper: format timestamp in IST (+05:30)
    const formatIST = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString("en-US", {
            timeZone: "Asia/Kolkata",
            dateStyle: "medium",
            timeStyle: "medium"
        });
    };

    // Helper: display browser/device icon
    const getDeviceIcon = (ua: string) => {
        const uaLower = ua.toLowerCase();
        if (uaLower.includes("mobi") || uaLower.includes("android") || uaLower.includes("iphone")) {
            return (
                <span title="Mobile Device">
                    <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                </span>
            );
        }
        return (
            <span title="Desktop Device">
                <Laptop className="w-3.5 h-3.5 text-slate-400" />
            </span>
        );
    };

    // Filter Activities
    const filteredActivities = activities.filter(act => {
        const matchesSearch = 
            act.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            act.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (act.bloodGroup && act.bloodGroup.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesRole = selectedRole === "all" || act.role === selectedRole;

        return matchesSearch && matchesRole;
    });

    if (loading && !stats) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Accessing Authentication Logs</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 px-1 md:px-2">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h3 className="text-3xl font-extrabold text-slate-900 font-jakarta flex items-center gap-4 tracking-tight">
                        <Activity className="w-8 h-8 text-blue-600" /> User Login Analytics
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        <p className="text-slate-500 font-medium text-base italic">Security audits, live telemetry, and access activity logs</p>
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200/50">
                            <Globe className="w-3 h-3" /> Timezone Enforced: IST (+05:30)
                        </span>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleManualRefresh}
                        className={`p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 transition-all text-slate-500 hover:text-blue-600 ${refreshing ? 'animate-spin text-blue-600 bg-white shadow-xl' : ''}`}
                        title="Force Refresh Data"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={handleExportCSV}
                        disabled={activities.length === 0}
                        className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <MiniStatCard 
                    label="Total Registered Users" 
                    value={stats?.totalUsers || 0} 
                    icon={<Users className="w-6 h-6" />} 
                    color="blue" 
                />
                <MiniStatCard 
                    label="Total Logins Today" 
                    value={stats?.loginsToday || 0} 
                    icon={<Activity className="w-6 h-6" />} 
                    color="emerald" 
                    pulse
                />
                <MiniStatCard 
                    label="Total Logins This Week" 
                    value={stats?.loginsThisWeek || 0} 
                    icon={<Calendar className="w-6 h-6" />} 
                    color="indigo" 
                />
            </div>

            {/* Filters and Table Container */}
            <div className="bg-white border border-slate-100 p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-blue-900/5">
                {/* Search & Filters */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        <h4 className="text-xl font-bold text-slate-900 font-jakarta whitespace-nowrap">Session Telemetry</h4>
                        <span className="px-3.5 py-1 bg-slate-50 border border-slate-100 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-wider">
                            {filteredActivities.length} Matches
                        </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                        {/* Search Input */}
                        <div className="flex items-center gap-3 px-5 py-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 focus-within:bg-white focus-within:border-blue-200 focus-within:shadow-xl focus-within:shadow-blue-900/5 transition-all w-full sm:w-80">
                            <Search className="w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search by name, email, blood group..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none outline-none text-sm font-semibold text-slate-900 placeholder:text-slate-400 w-full"
                            />
                        </div>

                        {/* Role Dropdown */}
                        <select 
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-600 uppercase tracking-wider outline-none cursor-pointer focus:bg-white focus:border-blue-200 transition-all w-full sm:w-auto"
                        >
                            <option value="all">All Roles</option>
                            <option value="customer">Customer</option>
                            <option value="seller">Seller</option>
                            <option value="delivery">Delivery</option>
                            <option value="hospital">Hospital</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </div>

                {/* Login History Table */}
                <div className="overflow-x-auto rounded-[2rem] border border-slate-50">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">User Profile</th>
                                <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email ID</th>
                                <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Blood Group</th>
                                <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Login Timestamp (IST)</th>
                                <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Auditing Info</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            <AnimatePresence mode="popLayout">
                                {filteredActivities.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-24 text-center">
                                            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <ShieldAlert className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <h5 className="font-bold text-slate-400 uppercase tracking-wider">No Logins Found</h5>
                                            <p className="text-slate-400 text-sm mt-1">Try adjusting search parameters or check connection.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredActivities.map((act, idx) => (
                                        <motion.tr 
                                            key={act._id || idx}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.3) }}
                                            className="hover:bg-blue-50/10 transition-colors"
                                        >
                                            {/* User Profile */}
                                            <td className="py-5 px-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
                                                        {act.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 text-sm leading-tight">{act.name}</p>
                                                        <span className={`inline-block px-2 py-0.5 mt-1 rounded text-[8px] font-black uppercase tracking-wider ${
                                                            act.role === "admin" ? "bg-rose-50 text-rose-600 border border-rose-100" :
                                                            act.role === "hospital" ? "bg-indigo-50 text-indigo-600 border border-indigo-100" :
                                                            act.role === "seller" ? "bg-purple-50 text-purple-600 border border-purple-100" :
                                                            act.role === "delivery" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                                            "bg-blue-50 text-blue-600 border border-blue-100"
                                                        }`}>
                                                            {act.role}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Email ID */}
                                            <td className="py-5 px-6">
                                                <a href={`mailto:${act.email}`} className="text-xs font-bold text-slate-600 hover:text-blue-600 hover:underline">
                                                    {act.email}
                                                </a>
                                            </td>

                                            {/* Blood Group */}
                                            <td className="py-5 px-6 text-center">
                                                {act.bloodGroup ? (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">
                                                        <Droplets className="w-3.5 h-3.5 fill-rose-600 text-rose-600" /> {act.bloodGroup}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                        N/A
                                                    </span>
                                                )}
                                            </td>

                                            {/* Timestamp in IST */}
                                            <td className="py-5 px-6">
                                                <p className="text-xs font-bold text-slate-800 font-mono">
                                                    {formatIST(act.timestamp)}
                                                </p>
                                            </td>

                                            {/* Auditing Info */}
                                            <td className="py-5 px-6">
                                                <div className="flex flex-col gap-0.5">
                                                    <p className="text-[10px] font-bold text-slate-500 font-mono flex items-center gap-1.5">
                                                        {act.ipAddress}
                                                    </p>
                                                    <div className="flex items-center gap-1 text-[9px] text-slate-400 max-w-[200px] truncate" title={act.userAgent}>
                                                        {getDeviceIcon(act.userAgent)}
                                                        <span className="truncate">{act.userAgent}</span>
                                                    </div>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function MiniStatCard({ label, value, icon, color, pulse }: any) {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100/50 shadow-blue-600/5',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100/50 shadow-emerald-600/5',
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100/50 shadow-indigo-600/5'
    };

    return (
        <motion.div 
            whileHover={{ y: -4 }}
            transition={{ duration: 0.3 }}
            className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl hover:shadow-2xl hover:shadow-blue-900/10 transition-all group relative overflow-hidden flex flex-col justify-between min-h-[160px]"
        >
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className={`p-4 rounded-2xl ${colors[color]} border group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 shadow-sm`}>
                    {icon}
                </div>
                {pulse && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-extrabold uppercase tracking-widest">Live</span>
                    </div>
                )}
            </div>
            
            <div className="relative z-10">
                <h5 className="text-4xl font-extrabold text-slate-900 mb-1 tracking-tight font-jakarta">{value}</h5>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            </div>
        </motion.div>
    );
}
