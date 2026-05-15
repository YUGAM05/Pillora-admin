"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { 
    Activity, 
    Users, 
    Globe, 
    ArrowUpRight, 
    TrendingUp, 
    Smartphone, 
    Zap,
    MousePointer2,
    Eye,
    Shield
} from "lucide-react";
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";
import { motion } from "framer-motion";

export default function AnalyticsAdmin() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState("24h");

    const fetchAnalytics = useCallback(async () => {
        try {
            const res = await api.get(`/analytics/stats?timeframe=${timeframe}`);
            if (res.data.success) {
                setStats(res.data.stats);
            }
        } catch (err) {
            console.error("Failed to fetch analytics", err);
        } finally {
            setLoading(false);
        }
    }, [timeframe]);

    useEffect(() => {
        fetchAnalytics();
        const interval = setInterval(fetchAnalytics, 15000); // Refresh every 15s for "Real-time" feel
        return () => clearInterval(interval);
    }, [fetchAnalytics]);

    if (loading && !stats) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Syncing Edge Data</p>
            </div>
        );
    }

    const formatBandwidth = (bytes: number) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const deviceData = stats?.deviceBreakdown?.map((d: any) => ({
        name: d._id === 'unknown' ? 'Desktop' : d._id.charAt(0).toUpperCase() + d._id.slice(1),
        value: d.count
    })) || [];

    const trafficData = stats?.trafficOverTime?.map((t: any) => ({
        time: `${t._id.hour}:00`,
        views: t.count
    })) || [];

    return (
        <div className="space-y-10">
            {/* Header with Timeframe Selector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h3 className="text-3xl font-extrabold text-slate-900 font-jakarta flex items-center gap-4 tracking-tight">
                        <Activity className="w-10 h-10 text-blue-600" /> Real-time Analytics
                    </h3>
                    <p className="text-slate-500 font-medium text-lg italic mt-1">Live traffic and bandwidth insights for pillora.in</p>
                </div>
                <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 self-start md:self-center">
                    {['1h', '24h', '7d', '30d'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTimeframe(t)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-extrabold transition-all tracking-wider ${
                                timeframe === t 
                                ? 'bg-white text-blue-600 shadow-xl shadow-blue-900/5' 
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {t.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <MiniStatCard 
                    label="Active Now" 
                    value={stats?.activeUsers || 0} 
                    icon={<Globe className="w-5 h-5" />} 
                    color="blue" 
                    pulse 
                />
                <MiniStatCard 
                    label="Total Pageviews" 
                    value={stats?.totalPageViews || 0} 
                    icon={<Eye className="w-5 h-5" />} 
                    color="indigo" 
                />
                <MiniStatCard 
                    label="Unique Visitors" 
                    value={stats?.uniqueVisitors || 0} 
                    icon={<Users className="w-5 h-5" />} 
                    color="emerald" 
                />
                <MiniStatCard 
                    label="Bandwidth Used" 
                    value={formatBandwidth(stats?.totalBandwidth || 0)} 
                    icon={<Zap className="w-5 h-5" />} 
                    color="amber" 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Traffic Chart */}
                <div className="lg:col-span-8 bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-xl shadow-blue-900/5">
                    <h4 className="text-lg font-bold text-slate-900 mb-10 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" /> Traffic Distribution
                    </h4>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trafficData}>
                                <defs>
                                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dx={-10} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '16px' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 800, color: '#2563eb' }}
                                    labelStyle={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}
                                />
                                <Area type="monotone" dataKey="views" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorViews)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Device Breakdown */}
                <div className="lg:col-span-4 bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-xl shadow-blue-900/5 flex flex-col">
                    <h4 className="text-lg font-bold text-slate-900 mb-10 flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-purple-600" /> Device Distribution
                    </h4>
                    <div className="flex-1 flex flex-col justify-center">
                        <div className="h-[220px] w-full relative">
                             <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={deviceData}
                                        innerRadius={70}
                                        outerRadius={90}
                                        paddingAngle={8}
                                        dataKey="value"
                                        animationDuration={1500}
                                    >
                                        {deviceData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={['#2563eb', '#8b5cf6', '#ec4899', '#f59e0b'][index % 4]} stroke="none" />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-extrabold text-slate-900">{stats?.uniqueVisitors}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Users</span>
                            </div>
                        </div>
                        <div className="mt-10 space-y-4">
                            {deviceData.map((d: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full`} style={{backgroundColor: ['#2563eb', '#8b5cf6', '#ec4899', '#f59e0b'][i % 4]}} />
                                        <span className="text-sm font-bold text-slate-600">{d.name}</span>
                                    </div>
                                    <span className="text-sm font-extrabold text-slate-900">
                                        {Math.round((d.value / (stats?.totalPageViews || 1)) * 100)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Pages */}
                <div className="bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-xl shadow-blue-900/5">
                    <h4 className="text-lg font-bold text-slate-900 mb-10 flex items-center gap-2">
                        <MousePointer2 className="w-5 h-5 text-emerald-600" /> Popular Destinations
                    </h4>
                    <div className="space-y-4">
                        {stats?.topPages?.map((page: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-5 bg-[#FDFDFF] hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 rounded-3xl border border-slate-50 transition-all group">
                                <div className="flex items-center gap-5 overflow-hidden">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 font-extrabold text-xs shadow-sm border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        {i + 1}
                                    </div>
                                    <span className="text-sm font-bold text-slate-600 truncate">{page._id}</span>
                                </div>
                                <div className="flex items-center gap-8 shrink-0">
                                    <div className="text-right">
                                        <p className="text-base font-extrabold text-slate-900">{page.count}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Views</p>
                                    </div>
                                    <ArrowUpRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* System Infrastructure Card */}
                <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]" />
                    <h4 className="text-lg font-bold text-white mb-10 flex items-center gap-2 relative z-10">
                        <Shield className="w-5 h-5 text-blue-400" /> Privacy & Performance Hub
                    </h4>
                    <div className="space-y-8 relative z-10">
                        <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mb-4">
                                <Activity className="w-4 h-4" /> Compliance Monitor
                            </div>
                            <p className="text-slate-300 text-sm font-medium leading-relaxed">
                                Analytics data is collected through <span className="text-white font-bold underline decoration-blue-500 underline-offset-4">first-party tracking</span> on your own domain. No cookies or personal Identifiable Information (PII) is stored, ensuring total user privacy.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 group-hover:border-blue-500/30 transition-colors">
                                <p className="text-3xl font-extrabold text-white mb-2 tracking-tighter">99.99%</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Edge Availability</p>
                            </div>
                            <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 group-hover:border-blue-500/30 transition-colors">
                                <p className="text-3xl font-extrabold text-white mb-2 tracking-tighter">&lt;4.2kb</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Payload Weight</p>
                            </div>
                        </div>
                        <div className="pt-4">
                             <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Data Processing Load</span>
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-3 py-1 rounded-full">Optimal</span>
                             </div>
                             <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }} 
                                    animate={{ width: '18%' }} 
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500" 
                                />
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MiniStatCard({ label, value, icon, color, pulse }: any) {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100/50',
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100/50',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100/50',
        amber: 'bg-amber-50 text-amber-600 border-amber-100/50'
    };

    return (
        <motion.div 
            whileHover={{ y: -5 }}
            className={`p-8 rounded-[2.5rem] bg-white border border-slate-100 hover:shadow-2xl hover:shadow-blue-900/5 transition-all group relative overflow-hidden`}
        >
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className={`p-4 rounded-2xl ${colors[color]} border group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 shadow-sm`}>
                    {icon}
                </div>
                {pulse && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100/50">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <span className="text-[9px] font-extrabold uppercase tracking-widest">Live Flow</span>
                    </div>
                )}
            </div>
            <h5 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tighter relative z-10">{value}</h5>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] relative z-10">{label}</p>
        </motion.div>
    );
}
