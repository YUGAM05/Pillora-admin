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
    Droplets,
    LoaderCircle
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
            <div className="ui-card flex flex-col items-center justify-center gap-3 py-20">
                <LoaderCircle className="h-7 w-7 animate-spin text-blue-600" />
                <p className="text-sm text-slate-500">Accessing authentication logs…</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                    <h3 className="ui-title flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-600" /> User login analytics
                    </h3>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        <p className="text-sm text-slate-500">Security audits and access activity logs</p>
                        <span className="ui-badge border-slate-200 bg-slate-50 text-slate-600">
                            <Globe className="h-3 w-3" /> Timezone: IST (+05:30)
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleManualRefresh}
                        className="ui-btn-secondary shrink-0 px-3"
                        title="Force refresh data"
                        aria-label="Refresh data"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
                    </button>
                    <button
                        onClick={handleExportCSV}
                        disabled={activities.length === 0}
                        className="ui-btn-primary flex-1 md:flex-none"
                    >
                        <Download className="h-4 w-4" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                <MiniStatCard
                    label="Total registered users"
                    value={stats?.totalUsers || 0}
                    icon={<Users className="h-5 w-5" />}
                    color="blue"
                />
                <MiniStatCard
                    label="Total logins today"
                    value={stats?.loginsToday || 0}
                    icon={<Activity className="h-5 w-5" />}
                    color="emerald"
                />
                <MiniStatCard
                    label="Total logins this week"
                    value={stats?.loginsThisWeek || 0}
                    icon={<Calendar className="h-5 w-5" />}
                    color="indigo"
                />
            </div>

            {/* Filters and Table Container */}
            <div className="ui-card overflow-hidden">
                {/* Search & Filters */}
                <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                        <h4 className="ui-title whitespace-nowrap">Session telemetry</h4>
                        <span className="ui-badge border-slate-200 bg-slate-50 text-slate-600">
                            {filteredActivities.length} matches
                        </span>
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
                        {/* Search Input */}
                        <div className="relative w-full sm:w-80">
                            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, blood..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                aria-label="Search logins"
                                className="ui-input pl-10"
                            />
                        </div>

                        {/* Role Dropdown */}
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            aria-label="Filter by role"
                            className="ui-input cursor-pointer sm:w-44"
                        >
                            <option value="all">All roles</option>
                            <option value="customer">Customer</option>
                            <option value="seller">Seller</option>
                            <option value="delivery">Delivery</option>
                            <option value="hospital">Hospital</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </div>

                {/* Login History Table */}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] border-collapse text-left">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/80">
                                <th className="ui-th pl-5 sm:pl-6">User profile</th>
                                <th className="ui-th">Email ID</th>
                                <th className="ui-th text-center">Blood group</th>
                                <th className="ui-th">Login timestamp (IST)</th>
                                <th className="ui-th pr-5 sm:pr-6">Auditing info</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <AnimatePresence mode="popLayout">
                                {filteredActivities.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-4 sm:p-6">
                                            <div className="ui-empty max-w-[calc(100vw-5rem)] sm:max-w-none">
                                                <ShieldAlert className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                                                <h5 className="font-medium text-slate-700">No logins found</h5>
                                                <p className="mt-1">Try adjusting search parameters or check connection.</p>
                                            </div>
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
                                            className="transition-colors hover:bg-slate-50/60"
                                        >
                                            {/* User Profile */}
                                            <td className="ui-td pl-5 align-middle sm:pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
                                                        {act.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold leading-tight text-slate-900">{act.name}</p>
                                                        <span className={`ui-badge mt-1 capitalize ${
                                                            act.role === "admin" ? "border-rose-200 bg-rose-50 text-rose-700" :
                                                            act.role === "hospital" ? "border-indigo-200 bg-indigo-50 text-indigo-700" :
                                                            act.role === "seller" ? "border-violet-200 bg-violet-50 text-violet-700" :
                                                            act.role === "delivery" ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
                                                            "border-blue-200 bg-blue-50 text-blue-700"
                                                        }`}>
                                                            {act.role}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Email ID */}
                                            <td className="ui-td align-middle">
                                                <a href={`mailto:${act.email}`} className="text-sm text-slate-600 hover:text-blue-600 hover:underline">
                                                    {act.email}
                                                </a>
                                            </td>

                                            {/* Blood Group */}
                                            <td className="ui-td text-center align-middle">
                                                {act.bloodGroup ? (
                                                    <span className="ui-badge border-rose-200 bg-rose-50 text-rose-700">
                                                        <Droplets className="h-3 w-3 fill-rose-600 text-rose-600" /> {act.bloodGroup}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-400">
                                                        N/A
                                                    </span>
                                                )}
                                            </td>

                                            {/* Timestamp in IST */}
                                            <td className="ui-td align-middle">
                                                <p className="whitespace-nowrap text-sm tabular-nums text-slate-700">
                                                    {formatIST(act.timestamp)}
                                                </p>
                                            </td>

                                            {/* Auditing Info */}
                                            <td className="ui-td pr-5 align-middle sm:pr-6">
                                                <div className="flex flex-col gap-0.5">
                                                    <p className="flex items-center gap-1.5 font-mono text-xs text-slate-600">
                                                        {act.ipAddress}
                                                    </p>
                                                    <div className="flex max-w-[220px] items-center gap-1 truncate text-xs text-slate-400" title={act.userAgent}>
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

function MiniStatCard({ label, value, icon, color }: any) {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        indigo: 'bg-indigo-50 text-indigo-600'
    };

    return (
        <div className="ui-card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-medium leading-snug text-slate-500">{label}</p>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${colors[color]}`}>
                    {icon}
                </span>
            </div>
            <h5 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{value}</h5>
        </div>
    );
}
