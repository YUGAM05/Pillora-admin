"use client";
import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { getToken, clearAuth } from "@/lib/tokenStorage";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
    LogOut,
    Menu,
    X,
    Bell,
    TrendingUp,
    FileText,
    MessageSquare,
    DollarSign,
    CreditCard,
    PanelLeftClose,
    PanelLeftOpen,
    TriangleAlert,
    LoaderCircle,
    ArrowUpRight,
} from "lucide-react";
import BloodBankAdmin from "@/components/BloodBankAdmin";
import AddHospitalForm from "@/components/AddHospitalForm";
import HospitalListAdmin from "@/components/HospitalListAdmin";
import HospitalSubscriptionsAdmin from "@/components/HospitalSubscriptionsAdmin";
import PartnerInquiriesAdmin from "@/components/PartnerInquiriesAdmin";
import BlogAdmin from "@/components/BlogAdmin";
import AnalyticsAdmin from "@/components/AnalyticsAdmin";
import LoginAnalyticsAdmin from "@/components/LoginAnalyticsAdmin";
import SupportTicketsAdmin from "@/components/SupportTicketsAdmin";
import HealthHubAdmin from "@/components/HealthHubAdmin";
import RevenueAdmin from "@/components/RevenueAdmin";
import FinancialManagementAdmin from "@/components/FinancialManagementAdmin";

type TabId = 'overview' | 'analytics' | 'login-analytics' | 'approvals' | 'bloodbank' | 'hospitals' | 'subscriptions' | 'partners' | 'blogs' | 'tickets' | 'health-hub' | 'revenue';

type IconType = React.ComponentType<{ className?: string }>;

type NavItem = {
    id: TabId;
    label: string;
    description: string;
    icon: IconType;
    badge?: number;
};

export default function AdminDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [stats, setStats] = useState<any>(null);
    const [pendingUsers, setPendingUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showAddHospital, setShowAddHospital] = useState(false);
    const [editingHospital, setEditingHospital] = useState<any | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [activities, setActivities] = useState<any[]>([]);

    const fetchActivities = useCallback(async () => {
        try {
            const res = await api.get("/admin/activities");
            setActivities(res.data);
        } catch (err) {
            console.error("Failed to fetch activities", err);
        }
    }, []);
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
        let socketInstance: any = null;

        const initSocket = async () => {
            const { socket } = await import("@/lib/socket");
            socketInstance = socket;
            socket.connect();

            socket.on("platform_activity", (newActivity: any) => {
                setActivities(prev => [newActivity, ...prev].slice(0, 20));
                setStats((prev: any) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        counts: {
                            ...prev.counts,
                            activity: (prev.counts?.activity || 0) + 1
                        }
                    };
                });
            });
        };

        const fetchData = async () => {
            try {
                fetchStats();
                fetchPendingUsers();
                fetchActivities();
                await initSocket();
            } catch (error) {
                console.error("Error fetching admin data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        return () => {
            if (socketInstance) {
                socketInstance.off("platform_activity");
                socketInstance.disconnect();
            }
        };
    }, [fetchStats, fetchPendingUsers, fetchActivities]);

    const formatTimeAgo = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return "Just now";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return new Date(date).toLocaleDateString();
    };

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

    const selectTab = (id: TabId) => {
        setActiveTab(id);
        setIsMobileMenuOpen(false);
        window.scrollTo({ top: 0 });
    };

    const handleLogout = () => {
        if (confirm("Log out of the admin panel?")) {
            clearAuth();
            window.location.href = '/login';
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 font-sans">
                <LoaderCircle className="h-7 w-7 animate-spin text-blue-600" />
                <p className="text-sm text-slate-500">Loading admin panel…</p>
            </div>
        );
    }

    const pendingCount = pendingUsers.length;

    const navGroups: { label: string; items: NavItem[] }[] = [
        {
            label: "Insights",
            items: [
                { id: 'overview', label: 'Overview', icon: BarChart3, description: "Key numbers and the latest activity on Pillora" },
                { id: 'analytics', label: 'Web analytics', icon: Activity, description: "Website traffic and visitors" },
                { id: 'login-analytics', label: 'Login analytics', icon: Users, description: "Recent sign-ins across Pillora" },
            ],
        },
        {
            label: "People",
            items: [
                { id: 'approvals', label: 'User approvals', icon: Lock, badge: pendingCount, description: "New accounts waiting for your review" },
                { id: 'bloodbank', label: 'Blood Connect', icon: Droplets, description: "Blood requests, donors and donations" },
            ],
        },
        {
            label: "Hospitals",
            items: [
                { id: 'hospitals', label: 'Hospitals', icon: Building2, description: "Hospitals and clinics registered on Pillora" },
                { id: 'subscriptions', label: 'Subscriptions & payments', icon: CreditCard, description: "Hospital plans, renewals and payments" },
                { id: 'partners', label: 'Partnerships', icon: Handshake, description: "Partnership requests from hospitals and NGOs" },
            ],
        },
        {
            label: "Content & support",
            items: [
                { id: 'blogs', label: 'Blog posts', icon: FileText, description: "Articles on the Pillora blog" },
                { id: 'health-hub', label: 'Health Hub', icon: Heart, description: "Health Hub content for patients" },
                { id: 'tickets', label: 'Support tickets', icon: MessageSquare, description: "Support requests from hospitals and users" },
            ],
        },
        {
            label: "Finance",
            items: [
                { id: 'revenue', label: 'Revenue & settlements', icon: DollarSign, description: "Payouts, settlements, refunds and the transaction ledger" },
            ],
        },
    ];
    const navItems = navGroups.flatMap((group) => group.items);
    const current = navItems.find((item) => item.id === activeTab) ?? navItems[0];

    const shortcuts: { id: TabId; label: string; icon: IconType }[] = [
        { id: 'hospitals', label: 'Hospitals', icon: Building2 },
        { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
        { id: 'tickets', label: 'Support tickets', icon: MessageSquare },
        { id: 'revenue', label: 'Revenue', icon: DollarSign },
    ];

    const brandMark = (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Shield className="h-[18px] w-[18px]" />
        </span>
    );

    const brandText = (
        <div className="min-w-0 leading-tight">
            <p className="text-[15px] font-semibold tracking-tight text-slate-900">Pillora Hub</p>
            <p className="text-xs text-slate-500">Admin panel</p>
        </div>
    );

    /** Menu used by the desktop sidebar (collapsible) and the phone drawer (roomier rows). */
    const renderNav = (collapsed: boolean, roomy = false) => {
        const row = `group relative flex w-full items-center gap-3 rounded-xl text-sm font-medium transition ${roomy ? "min-h-[44px] py-2.5" : "py-2"} ${collapsed ? "justify-center px-0" : "px-3"}`;
        return (
            <nav aria-label="Admin sections" className="space-y-5">
                {navGroups.map((group) => (
                    <div key={group.label}>
                        {collapsed ? (
                            <div className="mx-2 mb-2 border-t border-slate-100" aria-hidden="true" />
                        ) : (
                            <p className="px-3 pb-1.5 text-xs font-medium text-slate-400">{group.label}</p>
                        )}
                        <div className="space-y-0.5">
                            {group.items.map((item) => {
                                const active = activeTab === item.id;
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => selectTab(item.id)}
                                        aria-current={active ? "page" : undefined}
                                        title={collapsed ? item.label : undefined}
                                        className={`${row} ${active ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                                    >
                                        <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-white" : "text-slate-400 group-hover:text-slate-600"}`} />
                                        {!collapsed && <span className="flex-1 truncate text-left">{item.label}</span>}
                                        {!!item.badge && (collapsed ? (
                                            <span className="absolute right-3 top-1.5 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-white">
                                                <span className="sr-only">{item.badge} waiting</span>
                                            </span>
                                        ) : (
                                            <span className="min-w-[20px] rounded-full bg-amber-400 px-1.5 py-0.5 text-center text-[11px] font-bold leading-4 text-slate-950">
                                                {item.badge}
                                                <span className="sr-only"> waiting</span>
                                            </span>
                                        ))}
                                    </button>
                                );
                            })}
                            {group.label === "Insights" && (
                                <Link
                                    href="/analytics"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    title={collapsed ? "BI reporting" : undefined}
                                    className={`${row} text-slate-600 hover:bg-slate-100 hover:text-slate-900`}
                                >
                                    <TrendingUp className="h-[18px] w-[18px] shrink-0 text-slate-400 group-hover:text-slate-600" />
                                    {!collapsed && (
                                        <>
                                            <span className="flex-1 truncate text-left">BI reporting</span>
                                            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                        </>
                                    )}
                                </Link>
                            )}
                        </div>
                    </div>
                ))}
            </nav>
        );
    };

    const renderProfile = (collapsed: boolean) => (
        <div className={`flex items-center gap-3 rounded-xl ${collapsed ? "flex-col gap-2" : "bg-slate-50 p-2.5"}`}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-semibold text-white" aria-hidden="true">
                SA
            </span>
            {!collapsed && (
                <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-sm font-semibold text-slate-900">Super Admin</p>
                    <p className="truncate text-xs text-slate-500">Root access</p>
                </div>
            )}
            <button
                type="button"
                onClick={handleLogout}
                title="Log out"
                aria-label="Log out"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
            >
                <LogOut className="h-4 w-4" />
            </button>
        </div>
    );

    const activityStyle = (type?: string) => {
        switch (type) {
            case 'blood_request':
                return { icon: Droplets, tile: "bg-rose-50 text-rose-600", badge: "border-rose-200 bg-rose-50 text-rose-700", label: "Blood request" };
            case 'blood_donor':
                return { icon: Heart, tile: "bg-emerald-50 text-emerald-600", badge: "border-emerald-200 bg-emerald-50 text-emerald-700", label: "Blood donor" };
            case 'hospital':
                return { icon: Building2, tile: "bg-blue-50 text-blue-600", badge: "border-blue-200 bg-blue-50 text-blue-700", label: "Hospital" };
            case 'partner':
                return { icon: Handshake, tile: "bg-violet-50 text-violet-600", badge: "border-violet-200 bg-violet-50 text-violet-700", label: "Partner" };
            default: {
                const text = (type || 'system').replace(/_/g, ' ');
                return { icon: Package, tile: "bg-slate-100 text-slate-500", badge: "border-slate-200 bg-slate-50 text-slate-600", label: text.charAt(0).toUpperCase() + text.slice(1) };
            }
        }
    };

    const isHospitalFormOpen = showAddHospital || !!editingHospital;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-600/10">
            {/* Sidebar (computers) */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-slate-200/80 bg-white transition-[width] duration-300 lg:flex ${
                    isSidebarOpen ? "w-64" : "w-[76px]"
                }`}
            >
                <div className={`flex h-16 shrink-0 items-center gap-3 border-b border-slate-100 ${isSidebarOpen ? "px-5" : "justify-center"}`}>
                    {brandMark}
                    {isSidebarOpen && brandText}
                </div>

                <div className="no-scrollbar flex-1 overflow-y-auto px-3 py-5">
                    {renderNav(!isSidebarOpen)}
                </div>

                <div className="space-y-1 border-t border-slate-100 p-3">
                    {renderProfile(!isSidebarOpen)}
                    <button
                        type="button"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        aria-label={isSidebarOpen ? "Collapse menu" : "Expand menu"}
                        title={isSidebarOpen ? "Collapse menu" : "Expand menu"}
                        className={`flex w-full items-center gap-3 rounded-xl py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 ${
                            isSidebarOpen ? "px-3" : "justify-center px-0"
                        }`}
                    >
                        {isSidebarOpen ? <PanelLeftClose className="h-[18px] w-[18px] shrink-0" /> : <PanelLeftOpen className="h-[18px] w-[18px] shrink-0" />}
                        {isSidebarOpen && <span>Collapse menu</span>}
                    </button>
                </div>
            </aside>

            {/* Menu drawer (phones and tablets) */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 z-[90] bg-slate-900/50 backdrop-blur-[2px] lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 32, stiffness: 320 }}
                            aria-label="Admin menu"
                            className="fixed inset-y-0 left-0 z-[95] flex w-[288px] max-w-[85vw] flex-col bg-white shadow-2xl lg:hidden"
                        >
                            <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-100 pl-4 pr-2">
                                <div className="flex min-w-0 items-center gap-3">
                                    {brandMark}
                                    {brandText}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                    aria-label="Close menu"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto px-3 py-4">
                                {renderNav(false, true)}
                            </div>
                            <div className="border-t border-slate-100 p-3">
                                {renderProfile(false)}
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            <div className={`transition-[padding] duration-300 ${isSidebarOpen ? "lg:pl-64" : "lg:pl-[76px]"}`}>
                {/* Top bar */}
                <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
                    <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
                        <button
                            type="button"
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="-ml-1.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 lg:hidden"
                            aria-label="Open menu"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <div className="min-w-0 flex-1">
                            <h1 className="truncate text-base font-semibold tracking-tight text-slate-900 sm:text-lg">{current.label}</h1>
                            <p className="hidden truncate text-xs text-slate-500 sm:block">{current.description}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => selectTab('approvals')}
                            title={pendingCount > 0 ? `${pendingCount} waiting for approval` : "User approvals"}
                            aria-label={pendingCount > 0 ? `${pendingCount} accounts waiting for approval` : "User approvals"}
                            className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-800"
                        >
                            <Bell className="h-[18px] w-[18px]" />
                            {pendingCount > 0 && (
                                <span className="absolute -right-1.5 -top-1.5 min-w-[20px] rounded-full bg-amber-400 px-1 text-center text-[11px] font-bold leading-5 text-slate-950 ring-2 ring-white">
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                    </div>
                </header>

                <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    {error && (
                        <div role="alert" className="mb-6 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                                <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                                <div>
                                    <p className="font-semibold text-rose-900">{error}</p>
                                    <p className="mt-0.5 text-sm text-rose-800">Some numbers on this page could not be loaded.</p>
                                </div>
                            </div>
                            {error.startsWith("Access") && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        clearAuth();
                                        window.location.href = '/login';
                                    }}
                                    className="ui-btn-secondary shrink-0"
                                >
                                    Sign in again
                                </button>
                            )}
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                                        <StatCard
                                            label="Registered users"
                                            value={stats?.counts?.users}
                                            icon={<Users className="h-5 w-5" />}
                                            tone="blue"
                                            sub="Customer accounts on Pillora"
                                        />
                                        <StatCard
                                            label="Blood donors"
                                            value={stats?.counts?.donors}
                                            icon={<Heart className="h-5 w-5" />}
                                            tone="rose"
                                            sub="Registered with Blood Connect"
                                        />
                                        <StatCard
                                            label="Pending approvals"
                                            value={pendingCount}
                                            icon={<Lock className="h-5 w-5" />}
                                            tone="amber"
                                            sub={pendingCount > 0 ? "Waiting for your review" : "All caught up"}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                                        {/* Recent activity */}
                                        <section className="ui-card lg:col-span-8" aria-labelledby="activity-heading">
                                            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                                                <div className="min-w-0">
                                                    <h2 id="activity-heading" className="ui-title">Recent activity</h2>
                                                    <p className="ui-subtitle">The latest events across Pillora</p>
                                                </div>
                                                <span className="ui-badge shrink-0 border-slate-200 bg-slate-50 text-slate-600">
                                                    {activities.length} {activities.length === 1 ? "event" : "events"}
                                                </span>
                                            </div>
                                            {activities.length === 0 ? (
                                                <div className="p-5 sm:p-6">
                                                    <div className="ui-empty">
                                                        <Activity className="mx-auto mb-2 h-7 w-7 text-slate-300" />
                                                        No recent activity yet.
                                                    </div>
                                                </div>
                                            ) : (
                                                <ul className="divide-y divide-slate-100 lg:max-h-[560px] lg:overflow-y-auto">
                                                    {activities.map((log, i) => {
                                                        const style = activityStyle(log.type);
                                                        const Icon = style.icon;
                                                        return (
                                                            <li key={log._id || i} className="flex items-center gap-3 px-5 py-3.5 sm:gap-4 sm:px-6">
                                                                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.tile}`}>
                                                                    <Icon className="h-[18px] w-[18px]" />
                                                                </span>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="truncate text-sm font-medium text-slate-900">{log.title}</p>
                                                                    <p className="truncate text-sm text-slate-500">{log.description}</p>
                                                                </div>
                                                                <div className="shrink-0 text-right">
                                                                    <span className={`ui-badge hidden sm:inline-flex ${style.badge}`}>{style.label}</span>
                                                                    <p className="mt-1 text-xs text-slate-400">{formatTimeAgo(log.timestamp)}</p>
                                                                </div>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}
                                        </section>

                                        {/* Needs attention + shortcuts */}
                                        <section className="ui-card self-start p-5 sm:p-6 lg:col-span-4" aria-labelledby="attention-heading">
                                            <h2 id="attention-heading" className="ui-title">Needs your attention</h2>
                                            <p className="ui-subtitle">Things waiting on you right now</p>

                                            {pendingCount > 0 ? (
                                                <button
                                                    type="button"
                                                    onClick={() => selectTab('approvals')}
                                                    className="mt-4 flex w-full items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-left transition hover:bg-amber-100/70"
                                                >
                                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
                                                        <Lock className="h-[18px] w-[18px]" />
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block text-sm font-semibold text-slate-900">
                                                            {pendingCount} {pendingCount === 1 ? "account is" : "accounts are"} waiting for approval
                                                        </span>
                                                        <span className="block text-xs text-amber-800">Review them in User approvals</span>
                                                    </span>
                                                    <ChevronRight className="h-4 w-4 shrink-0 text-amber-700" />
                                                </button>
                                            ) : (
                                                <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
                                                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                                                    <p className="text-sm font-medium text-emerald-800">All caught up. No accounts are waiting for approval.</p>
                                                </div>
                                            )}

                                            <p className="mt-6 text-xs font-medium text-slate-500">Shortcuts</p>
                                            <div className="mt-2 grid grid-cols-2 gap-2">
                                                {shortcuts.map((shortcut) => {
                                                    const Icon = shortcut.icon;
                                                    return (
                                                        <button
                                                            key={shortcut.id}
                                                            type="button"
                                                            onClick={() => selectTab(shortcut.id)}
                                                            className="flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                                        >
                                                            <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                                                            <span className="truncate">{shortcut.label}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </section>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'analytics' && (
                                <AnalyticsAdmin />
                            )}

                            {activeTab === 'login-analytics' && (
                                <LoginAnalyticsAdmin />
                            )}

                            {activeTab === 'approvals' && (
                                <section className="ui-card" aria-labelledby="approvals-heading">
                                    <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                        <div className="min-w-0">
                                            <h2 id="approvals-heading" className="ui-title">Identity verification</h2>
                                            <p className="ui-subtitle">Review new accounts before they can use Pillora.</p>
                                        </div>
                                        <span className={`ui-badge self-start sm:self-auto ${pendingCount > 0 ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                                            {pendingCount} pending
                                        </span>
                                    </div>

                                    <div className="p-5 sm:p-6">
                                        {pendingCount === 0 ? (
                                            <div className="ui-empty">
                                                <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
                                                <p className="font-medium text-slate-700">All caught up</p>
                                                <p className="mt-1">No accounts are waiting for approval.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                                                <AnimatePresence>
                                                    {pendingUsers.map((user: any) => (
                                                        <motion.div
                                                            key={user._id}
                                                            initial={{ opacity: 0, scale: 0.98 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.96 }}
                                                            className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"
                                                        >
                                                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-base font-semibold text-white">
                                                                    {(user.name || "?").charAt(0)}
                                                                </span>
                                                                <div className="min-w-0">
                                                                    <p className="truncate font-semibold text-slate-900">{user.name}</p>
                                                                    <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
                                                                        <span className="ui-badge border-blue-200 bg-blue-50 capitalize text-blue-700">{user.role}</span>
                                                                        <span className="truncate text-sm text-slate-500">{user.email}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2 sm:shrink-0">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStatusUpdate(user._id, 'rejected')}
                                                                    className="ui-btn-secondary flex-1 text-rose-600 hover:text-rose-700 sm:flex-none"
                                                                >
                                                                    <XCircle className="h-4 w-4" /> Reject
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStatusUpdate(user._id, 'approved')}
                                                                    className="ui-btn-primary flex-1 sm:flex-none"
                                                                >
                                                                    <CheckCircle2 className="h-4 w-4" /> Approve
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}

                            {activeTab === 'bloodbank' && (
                                <section className="ui-card p-3 sm:p-6">
                                    <BloodBankAdmin />
                                </section>
                            )}

                            {activeTab === 'hospitals' && (
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0">
                                            <h2 className="ui-title">
                                                {editingHospital ? "Edit hospital" : showAddHospital ? "Register a hospital" : "Medical directory"}
                                            </h2>
                                            <p className="ui-subtitle">
                                                {isHospitalFormOpen
                                                    ? "Fill in the details and save. Close the form to go back to the list."
                                                    : "Manage hospitals and clinics registered on Pillora."}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (showAddHospital || editingHospital) {
                                                    setShowAddHospital(false);
                                                    setEditingHospital(null);
                                                } else {
                                                    setShowAddHospital(true);
                                                }
                                            }}
                                            className={`${isHospitalFormOpen ? "ui-btn-secondary" : "ui-btn-primary"} w-full shrink-0 sm:w-auto`}
                                        >
                                            {isHospitalFormOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                            {isHospitalFormOpen ? "Close form" : "Register hospital"}
                                        </button>
                                    </div>

                                    <AnimatePresence mode="wait">
                                        {isHospitalFormOpen ? (
                                            <motion.div
                                                key="hospital-form"
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -12 }}
                                                className="ui-card overflow-hidden"
                                            >
                                                <AddHospitalForm
                                                    hospitalToEdit={editingHospital}
                                                    onClose={() => {
                                                        setShowAddHospital(false);
                                                        setEditingHospital(null);
                                                        setRefreshTrigger(prev => prev + 1);
                                                    }}
                                                />
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="hospital-list"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="ui-card p-4 sm:p-6"
                                            >
                                                <HospitalListAdmin
                                                    key={refreshTrigger}
                                                    onEdit={(hospital) => setEditingHospital(hospital)}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {activeTab === 'subscriptions' && (
                                <div className="space-y-6 sm:space-y-8">
                                    <HospitalSubscriptionsAdmin />
                                </div>
                            )}

                            {activeTab === 'partners' && (
                                <section className="ui-card p-4 sm:p-6">
                                    <PartnerInquiriesAdmin />
                                </section>
                            )}

                            {activeTab === 'blogs' && (
                                <BlogAdmin />
                            )}

                            {activeTab === 'health-hub' && (
                                <HealthHubAdmin />
                            )}

                            {activeTab === 'tickets' && (
                                <SupportTicketsAdmin />
                            )}

                            {activeTab === 'revenue' && (
                                <FinancialManagementAdmin />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}

const STAT_TONES = {
    blue: "bg-blue-50 text-blue-600",
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
} as const;

function StatCard({ label, value, icon, tone = "blue", sub }: { label: string; value?: number; icon: React.ReactNode; tone?: keyof typeof STAT_TONES; sub?: string }) {
    return (
        <div className="ui-card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-medium leading-snug text-slate-500">{label}</p>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${STAT_TONES[tone]}`}>{icon}</span>
            </div>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{(Number(value) || 0).toLocaleString("en-IN")}</p>
            {sub && <p className="mt-1 text-xs leading-snug text-slate-500">{sub}</p>}
        </div>
    );
}
