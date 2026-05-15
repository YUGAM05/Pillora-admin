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
            const res = await api.get(`/metrics/view?timeframe=${timeframe}`);
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
            <div className="flex flex-col items-center justify-center py-20 md:py-32 space-y-4">
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
        <div className="space-y-6 md:space-y-10 px-0 md:px-2">
            {/* Header with Timeframe Selector */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-jakarta flex items-center gap-3 md:gap-4 tracking-tight">
                        <Activity className="w-8 h-8 md:w-10 md:h-10 text-blue-600" /> Real-time Analytics
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-slate-500 font-medium text-sm md:text-lg italic">Live traffic insights for pillora.in</p>
                        {stats?.lastRecordAt && (
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-100/50 animate-pulse">
                                <Zap className="w-3 h-3" /> Last Signal: {new Date(stats.lastRecordAt).toLocaleTimeString()}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex bg-slate-100/50 p-1 rounded-xl md:rounded-2xl border border-slate-100 self-start xl:self-center overflow-x-auto max-w-full no-scrollbar">
                    {['1h', '24h', '7d', '30d'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTimeframe(t)}
                            className={`px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-[11px] font-extrabold transition-all tracking-wider whitespace-nowrap ${
                                timeframe === t 
                                ? 'bg-white text-blue-600 shadow-lg shadow-blue-900/5' 
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {t.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                <MiniStatCard 
                    label="Active Now" 
                    value={stats?.activeUsers || 0} 
                    icon={<Globe className="w-4 h-4 md:w-5 md:h-5" />} 
                    color="blue" 
                    pulse 
                />
                <MiniStatCard 
                    label="Pageviews" 
                    value={stats?.totalPageViews || 0} 
                    icon={<Eye className="w-4 h-4 md:w-5 md:h-5" />} 
                    color="indigo" 
                />
                <MiniStatCard 
                    label="Visitors" 
                    value={stats?.uniqueVisitors || 0} 
                    icon={<Users className="w-4 h-4 md:w-5 md:h-5" />} 
                    color="emerald" 
                />
                <MiniStatCard 
                    label="Bandwidth" 
                    value={formatBandwidth(stats?.totalBandwidth || 0)} 
                    icon={<Zap className="w-4 h-4 md:w-5 md:h-5" />} 
                    color="amber" 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                {/* Traffic Chart */}
                <div className="lg:col-span-8 bg-white border border-slate-100 p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-xl shadow-blue-900/5 overflow-hidden">
                    <h4 className="text-base md:text-lg font-bold text-slate-900 mb-6 md:mb-10 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" /> Traffic Distribution
                    </h4>
                    <div className="h-[250px] md:h-[350px] w-full">
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
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '12px' }}
                                    itemStyle={{ fontSize: '11px', fontWeight: 800, color: '#2563eb' }}
                                    labelStyle={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}
                                />
                                <Area type="monotone" dataKey="views" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Device Breakdown */}
                <div className="lg:col-span-4 bg-white border border-slate-100 p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-xl shadow-blue-900/5 flex flex-col">
                    <h4 className="text-base md:text-lg font-bold text-slate-900 mb-6 md:mb-10 flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-purple-600" /> Device Types
                    </h4>
                    <div className="flex-1 flex flex-col justify-center">
                        <div className="h-[180px] md:h-[220px] w-full relative">
                             <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={deviceData}
                                        innerRadius={60}
                                        outerRadius={80}
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
                                <span className="text-xl md:text-3xl font-extrabold text-slate-900">{stats?.uniqueVisitors}</span>
                                <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Users</span>
                            </div>
                        </div>
                        <div className="mt-6 md:mt-10 space-y-3">
                            {deviceData.map((d: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-2 md:p-3 rounded-xl md:rounded-2xl bg-slate-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2.5 h-2.5 rounded-full`} style={{backgroundColor: ['#2563eb', '#8b5cf6', '#ec4899', '#f59e0b'][i % 4]}} />
                                        <span className="text-xs md:text-sm font-bold text-slate-600">{d.name}</span>
                                    </div>
                                    <span className="text-xs md:text-sm font-extrabold text-slate-900">
                                        {Math.round((d.value / (stats?.totalPageViews || 1)) * 100)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* Top Pages */}
                <div className="bg-white border border-slate-100 p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-xl shadow-blue-900/5">
                    <h4 className="text-base md:text-lg font-bold text-slate-900 mb-6 md:mb-10 flex items-center gap-2">
                        <MousePointer2 className="w-5 h-5 text-emerald-600" /> Popular Destinations
                    </h4>
                    <div className="space-y-3 md:space-y-4">
                        {stats?.topPages?.map((page: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-4 md:p-5 bg-[#FDFDFF] hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 rounded-2xl md:rounded-3xl border border-slate-50 transition-all group">
                                <div className="flex items-center gap-3 md:gap-5 overflow-hidden">
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white flex items-center justify-center text-slate-400 font-extrabold text-[10px] md:text-xs shadow-sm border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        {i + 1}
                                    </div>
                                    <span className="text-xs md:text-sm font-bold text-slate-600 truncate">{page._id}</span>
                                </div>
                                <div className="flex items-center gap-4 md:gap-8 shrink-0">
                                    <div className="text-right">
                                        <p className="text-sm md:text-base font-extrabold text-slate-900">{page.count}</p>
                                        <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Views</p>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Privacy Card */}
                <div className="bg-slate-900 p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]" />
                    <h4 className="text-base md:text-lg font-bold text-white mb-6 md:mb-10 flex items-center gap-2 relative z-10">
                        <Shield className="w-5 h-5 text-blue-400" /> Privacy & Edge Hub
                    </h4>
                    <div className="space-y-6 md:space-y-8 relative z-10">
                        <div className="p-5 md:p-8 bg-white/5 rounded-[1.5rem] md:rounded-[2rem] border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mb-3 md:mb-4">
                                <Activity className="w-4 h-4" /> Compliance Monitor
                            </div>
                            <p className="text-slate-300 text-xs md:text-sm font-medium leading-relaxed">
                                Analytics data is collected through <span className="text-white font-bold underline decoration-blue-500 underline-offset-4">first-party tracking</span>. No cookies or PII are stored, ensuring total user privacy.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 md:gap-6">
                            <div className="p-5 md:p-8 bg-white/5 rounded-[1.5rem] md:rounded-[2rem] border border-white/10 group-hover:border-blue-500/30 transition-colors">
                                <p className="text-xl md:text-3xl font-extrabold text-white mb-1 md:mb-2 tracking-tighter">99.9%</p>
                                <p className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Uptime</p>
                            </div>
                            <div className="p-5 md:p-8 bg-white/5 rounded-[1.5rem] md:rounded-[2rem] border border-white/10 group-hover:border-blue-500/30 transition-colors">
                                <p className="text-xl md:text-3xl font-extrabold text-white mb-1 md:mb-2 tracking-tighter">&lt;4kb</p>
                                <p className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Payload</p>
                            </div>
                        </div>
                        <div className="pt-2">
                             <div className="flex items-center justify-between mb-2 md:mb-3">
                                <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Processing Load</span>
                                <span className="text-[8px] md:text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-2 md:px-3 py-1 rounded-full">Optimal</span>
                             </div>
                             <div className="w-full h-1.5 md:h-2 bg-white/5 rounded-full overflow-hidden">
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
            whileHover={{ y: -3 }}
            className={`p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] bg-white border border-slate-100 hover:shadow-2xl hover:shadow-blue-900/5 transition-all group relative overflow-hidden`}
        >
            <div className="flex items-center justify-between mb-4 md:mb-8 relative z-10">
                <div className={`p-2.5 md:p-4 rounded-xl md:rounded-2xl ${colors[color]} border group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 shadow-sm`}>
                    {icon}
                </div>
                {pulse && (
                    <div className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1 md:py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100/50">
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[7px] md:text-[9px] font-extrabold uppercase tracking-widest hidden sm:inline">Live</span>
                    </div>
                )}
            </div>
            <h5 className="text-xl md:text-4xl font-extrabold text-slate-900 mb-1 md:mb-2 tracking-tighter relative z-10">{value}</h5>
            <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] md:tracking-[0.2em] relative z-10">{label}</p>
        </motion.div>
    );
}
