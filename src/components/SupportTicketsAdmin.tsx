"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { getToken } from "@/lib/tokenStorage";
import { 
    Clock, 
    CheckCircle2, 
    XCircle, 
    Loader2, 
    ChevronDown, 
    ChevronUp,
    Mail,
    Phone,
    User,
    MessageSquare,
    Save,
    AlertCircle,
    Activity,
    BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SupportTicketsAdmin() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>("all");
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [adminNotesText, setAdminNotesText] = useState<{ [key: string]: string }>({});

    const fetchTickets = useCallback(async () => {
        try {
            const token = getToken();
            const res = await api.get("/support/admin/all", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTickets(res.data);
            
            // Initialize notes state
            const notes: { [key: string]: string } = {};
            res.data.forEach((ticket: any) => {
                notes[ticket._id] = ticket.adminNotes || "";
            });
            setAdminNotesText(notes);
        } catch (err: any) {
            setError("Failed to fetch support tickets");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    const handleUpdateTicket = async (id: string, newStatus: string) => {
        setUpdatingId(id);
        try {
            const token = getToken();
            const notes = adminNotesText[id] || "";
            await api.patch(`/support/admin/${id}`, { 
                status: newStatus, 
                adminNotes: notes 
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setTickets(prev => prev.map(t => t._id === id ? { ...t, status: newStatus, adminNotes: notes } : t));
            alert("Ticket updated successfully!");
        } catch (err) {
            alert("Failed to update support ticket");
            console.error(err);
        } finally {
            setUpdatingId(null);
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Open': return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'In Progress': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'Resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'Closed': return 'bg-slate-100 text-slate-600 border-slate-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const handleNoteChange = (id: string, text: string) => {
        setAdminNotesText(prev => ({
            ...prev,
            [id]: text
        }));
    };

    if (loading) {
        return (
            <div className="ui-card flex flex-col items-center justify-center py-16">
                <Loader2 className="mb-3 h-7 w-7 animate-spin text-blue-600" />
                <p className="text-sm text-slate-500">Retrieving support tickets...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="ui-card px-6 py-12 text-center">
                <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50">
                    <AlertCircle className="h-6 w-6 text-rose-500" />
                </span>
                <p className="font-semibold text-rose-600">{error}</p>
                <button onClick={fetchTickets} className="ui-btn-primary mt-4">Try again</button>
            </div>
        );
    }

    const filteredTickets = tickets.filter(t => filter === "all" || t.status === filter);

    return (
        <div className="space-y-4 sm:space-y-5">
            {/* Status Tabs */}
            <div role="group" aria-label="Filter tickets by status" className="ui-segmented no-scrollbar flex w-fit max-w-full gap-1 overflow-x-auto">
                {[
                    { id: 'all', label: 'All tickets', icon: BookOpen },
                    { id: 'Open', label: 'Open', icon: AlertCircle },
                    { id: 'In Progress', label: 'In Progress', icon: Clock },
                    { id: 'Resolved', label: 'Resolved', icon: CheckCircle2 },
                    { id: 'Closed', label: 'Closed', icon: XCircle },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        aria-pressed={filter === tab.id}
                        className={`ui-segment inline-flex min-h-[40px] shrink-0 items-center gap-2 whitespace-nowrap ${
                            filter === tab.id
                            ? 'ui-segment-active'
                            : ''
                        }`}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                        {tickets.filter(t => tab.id === 'all' || t.status === tab.id).length > 0 && (
                            <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none ${
                                filter === tab.id ? 'bg-blue-50 text-blue-700' : 'bg-slate-200/70 text-slate-600'
                            }`}>
                                {tickets.filter(t => tab.id === 'all' || t.status === tab.id).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {filteredTickets.length === 0 ? (
                <div className="ui-empty bg-white py-16">
                    <MessageSquare className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    <h4 className="font-medium text-slate-700">No support tickets found</h4>
                    <p className="mt-1">Tickets matching this status filter will show up here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    <AnimatePresence mode="popLayout">
                        {filteredTickets.map((ticket) => (
                            <motion.div
                                key={ticket._id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="ui-card overflow-hidden"
                            >
                                {/* Header Bar */}
                                <div
                                    className="flex cursor-pointer flex-col gap-3 p-4 transition-colors hover:bg-slate-50/60 sm:p-5 md:flex-row md:items-center md:justify-between md:gap-4"
                                    onClick={() => toggleExpand(ticket._id)}
                                >
                                    <div className="flex min-w-0 items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                            <MessageSquare className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h4 className="text-base font-semibold leading-snug text-slate-900">{ticket.subject}</h4>
                                                <span className={`ui-badge ${getStatusColor(ticket.status)}`}>
                                                    {ticket.status}
                                                </span>
                                                <span className="ui-badge border-slate-200 bg-slate-50 text-slate-600">
                                                    {ticket.type || 'Refund Inquiry'}
                                                </span>
                                            </div>
                                            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                                                <span className="flex items-center gap-1.5">
                                                    <User className="h-3.5 w-3.5 text-slate-400" />
                                                    {ticket.guestName || ticket.userId?.name || 'Guest user'}
                                                    {ticket.guestName && <span className="ui-badge ml-1 border-slate-200 bg-slate-100 text-slate-600">Guest</span>}
                                                </span>
                                                <span aria-hidden="true" className="text-slate-300">•</span>
                                                <span className="min-w-0 max-w-full truncate">{ticket.guestEmail || ticket.userId?.email || 'No email'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 md:justify-end md:border-0 md:pt-0">
                                        <div className="text-left md:text-right">
                                            <p className="text-xs font-medium text-slate-500">Created on</p>
                                            <p className="text-sm font-medium text-slate-700">
                                                {new Date(ticket.createdAt).toLocaleDateString('en-IN', { 
                                                    day: '2-digit', 
                                                    month: 'short', 
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        <div className="mx-1 hidden h-10 w-px bg-slate-200 md:block" />
                                        <button aria-expanded={expandedId === ticket._id} aria-label="Toggle ticket details" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900">
                                            {expandedId === ticket._id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                <AnimatePresence>
                                    {expandedId === ticket._id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden border-t border-slate-100 bg-slate-50/60"
                                        >
                                            <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 lg:grid-cols-3 lg:gap-5">
                                                {/* User Info Card */}
                                                <div className="min-w-0">
                                                    <h5 className="mb-2 text-xs font-medium text-slate-500">Requester details</h5>
                                                    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                                                        <div>
                                                            <p className="text-xs font-medium text-slate-500">User name</p>
                                                            <p className="font-semibold text-slate-900">{ticket.guestName || ticket.userId?.name || 'Guest user'}</p>
                                                        </div>
                                                        <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                                                            <span className="flex min-w-0 items-center gap-2 break-all text-sm text-slate-700">
                                                                <Mail className="h-4 w-4 shrink-0 text-slate-400" /> {ticket.guestEmail || ticket.userId?.email || 'N/A'}
                                                            </span>
                                                            <span className="flex min-w-0 items-center gap-2 break-all text-sm text-slate-700">
                                                                <Phone className="h-4 w-4 shrink-0 text-slate-400" /> {ticket.guestPhone || ticket.userId?.phone || 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Message Details */}
                                                <div className="min-w-0">
                                                    <h5 className="mb-2 text-xs font-medium text-slate-500">Ticket description</h5>
                                                    <div className="min-h-[120px] rounded-xl border border-slate-200 bg-white p-4">
                                                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
                                                            {ticket.message}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Management Actions */}
                                                <div className="min-w-0">
                                                    <div>
                                                        <h5 className="mb-2 text-xs font-medium text-slate-500">Action control & notes</h5>
                                                        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
                                                            <div>
                                                                <label htmlFor={`status-select-${ticket._id}`} className="ui-label">Status</label>
                                                                <select
                                                                    defaultValue={ticket.status}
                                                                    id={`status-select-${ticket._id}`}
                                                                    className="ui-input"
                                                                >
                                                                    <option value="Open">Open</option>
                                                                    <option value="In Progress">In Progress</option>
                                                                    <option value="Resolved">Resolved</option>
                                                                    <option value="Closed">Closed</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label htmlFor={`admin-notes-${ticket._id}`} className="ui-label">Internal admin notes</label>
                                                                <textarea
                                                                    id={`admin-notes-${ticket._id}`}
                                                                    value={adminNotesText[ticket._id] || ""}
                                                                    onChange={(e) => handleNoteChange(ticket._id, e.target.value)}
                                                                    placeholder="Write internal notes about refund status or actions..."
                                                                    rows={3}
                                                                    className="ui-input min-h-[96px] resize-y"
                                                                />
                                                            </div>
                                                            <button 
                                                                disabled={updatingId === ticket._id}
                                                                onClick={() => {
                                                                    const select = document.getElementById(`status-select-${ticket._id}`) as HTMLSelectElement;
                                                                    handleUpdateTicket(ticket._id, select.value);
                                                                }}
                                                                className="ui-btn-primary w-full"
                                                            >
                                                                {updatingId === ticket._id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Save className="w-4 h-4" />
                                                                )}
                                                                Save updates
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
