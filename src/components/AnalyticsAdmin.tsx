"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { 
    Activity, 
    Users,
    Globe,
    TrendingUp,
    Smartphone,
    Zap,
    MousePointer2,
    Eye,
    Shield,
    Clock,
    LoaderCircle
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
            <div className="ui-card flex flex-col items-center justify-center gap-3 py-20">
                <LoaderCircle className="h-7 w-7 animate-spin text-blue-600" />
                <p className="text-sm text-slate-500">Loading analytics…</p>
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
        <div className="space-y-6">
            {/* Header with Timeframe Selector */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h3 className="ui-title flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-600" /> Analytics
                    </h3>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        <p className="text-sm text-slate-500">Traffic insights for pillora.in</p>
                        {stats?.lastRecordAt && (
                            <span className="ui-badge border-slate-200 bg-slate-50 text-slate-600">
                                <Clock className="h-3 w-3" /> Last signal: {new Date(stats.lastRecordAt).toLocaleTimeString()}
                            </span>
                        )}
                    </div>
                </div>
                <div className="ui-segmented no-scrollbar max-w-full shrink-0 self-start overflow-x-auto sm:self-auto" role="group" aria-label="Timeframe">
                    {['1h', '24h', '7d', '30d'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTimeframe(t)}
                            aria-pressed={timeframe === t}
                            className={`ui-segment whitespace-nowrap px-4 ${
                                timeframe === t
                                ? 'ui-segment-active'
                                : ''
                            }`}
                        >
                            {t.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <MiniStatCard
                    label="Active now"
                    value={stats?.activeUsers || 0}
                    icon={<Globe className="h-5 w-5" />}
                    color="blue"
                />
                <MiniStatCard
                    label="Pageviews"
                    value={stats?.totalPageViews || 0}
                    icon={<Eye className="h-5 w-5" />}
                    color="indigo"
                />
                <MiniStatCard
                    label="Visitors"
                    value={stats?.uniqueVisitors || 0}
                    icon={<Users className="h-5 w-5" />}
                    color="emerald"
                />
                <MiniStatCard
                    label="Bandwidth"
                    value={formatBandwidth(stats?.totalBandwidth || 0)}
                    icon={<Zap className="h-5 w-5" />}
                    color="amber" 
                />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12">
                {/* Traffic Chart */}
                <div className="ui-card overflow-hidden p-4 sm:p-6 lg:col-span-8">
                    <h4 className="ui-title mb-5 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" /> Traffic distribution
                    </h4>
                    <div className="h-[250px] w-full md:h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trafficData}>
                                <defs>
                                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.12}/>
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={8} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-8} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15,23,42,0.08)', padding: '8px 12px' }}
                                    itemStyle={{ fontSize: '13px', fontWeight: 600, color: '#2563eb' }}
                                    labelStyle={{ fontSize: '12px', fontWeight: 500, color: '#64748b', marginBottom: '2px' }}
                                />
                                <Area type="monotone" dataKey="views" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Device Breakdown */}
                <div className="ui-card flex flex-col p-4 sm:p-6 lg:col-span-4">
                    <h4 className="ui-title mb-5 flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-blue-600" /> Device types
                    </h4>
                    <div className="flex flex-1 flex-col justify-center">
                        <div className="relative h-[180px] w-full md:h-[200px]">
                             <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={deviceData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={3}
                                        dataKey="value"
                                        animationDuration={1500}
                                    >
                                        {deviceData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={['#2563eb', '#10b981', '#f59e0b', '#94a3b8'][index % 4]} stroke="none" />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold tracking-tight text-slate-900">{stats?.uniqueVisitors}</span>
                                <span className="text-xs text-slate-500">Total users</span>
                            </div>
                        </div>
                        <div className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-200 empty:hidden">
                            {deviceData.map((d: any, i: number) => (
                                <div key={i} className="flex items-center justify-between px-3 py-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`h-2.5 w-2.5 rounded-full`} style={{backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#94a3b8'][i % 4]}} />
                                        <span className="text-sm text-slate-600">{d.name}</span>
                                    </div>
                                    <span className="text-sm font-semibold tabular-nums text-slate-900">
                                        {Math.round((d.value / (stats?.totalPageViews || 1)) * 100)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12">
                {/* Top Pages */}
                <div className="ui-card p-4 sm:p-6 lg:col-span-8">
                    <h4 className="ui-title mb-4 flex items-center gap-2">
                        <MousePointer2 className="h-5 w-5 text-blue-600" /> Popular destinations
                    </h4>
                    <div className="divide-y divide-slate-100">
                        {stats?.topPages?.map((page: any, i: number) => (
                            <div key={i} className="flex items-center justify-between gap-3 py-3">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500">
                                        {i + 1}
                                    </div>
                                    <span className="truncate text-sm font-medium text-slate-700">{page._id}</span>
                                </div>
                                <div className="flex shrink-0 items-center">
                                    <div className="text-right">
                                        <p className="text-sm font-semibold tabular-nums text-slate-900">{page.count}</p>
                                        <p className="text-xs text-slate-500">Views</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Privacy Card */}
                <div className="ui-card self-start p-4 sm:p-6 lg:col-span-4">
                    <h4 className="ui-title mb-3 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-emerald-600" /> Privacy
                    </h4>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm leading-relaxed text-slate-600">
                            Analytics data is collected through <span className="font-medium text-slate-900">first-party tracking</span>. No cookies or PII are stored, ensuring total user privacy.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MiniStatCard({ label, value, icon, color }: any) {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600'
    };

    return (
        <div className="ui-card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-medium leading-snug text-slate-500">{label}</p>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${colors[color]}`}>
                    {icon}
                </span>
            </div>
            <h5 className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{value}</h5>
        </div>
    );
}
