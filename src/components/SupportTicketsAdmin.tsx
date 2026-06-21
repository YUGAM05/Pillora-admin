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
            case 'Open': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'In Progress': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'Resolved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Closed': return 'bg-gray-50 text-gray-600 border-gray-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
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
            <div className="py-12 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Retrieving Support Tickets...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-12 text-center">
                <p className="text-rose-500 font-bold">{error}</p>
                <button onClick={fetchTickets} className="mt-4 text-blue-600 font-bold underline">Try Again</button>
            </div>
        );
    }

    const filteredTickets = tickets.filter(t => filter === "all" || t.status === filter);

    return (
        <div className="space-y-8 font-sans">
            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                {[
                    { id: 'all', label: 'All Tickets', icon: BookOpen },
                    { id: 'Open', label: 'Open', icon: AlertCircle },
                    { id: 'In Progress', label: 'In Progress', icon: Clock },
                    { id: 'Resolved', label: 'Resolved', icon: CheckCircle2 },
                    { id: 'Closed', label: 'Closed', icon: XCircle },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                            filter === tab.id 
                            ? 'bg-white text-blue-600 shadow-lg shadow-blue-900/5' 
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
                        }`}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                        {tickets.filter(t => tab.id === 'all' || t.status === tab.id).length > 0 && (
                            <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[9px] ${
                                filter === tab.id ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'
                            }`}>
                                {tickets.filter(t => tab.id === 'all' || t.status === tab.id).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {filteredTickets.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-xl font-bold text-gray-800">No support tickets found</h4>
                    <p className="text-gray-500 font-medium">Tickets matching this status filter will show up here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredTickets.map((ticket) => (
                            <motion.div
                                key={ticket._id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 overflow-hidden"
                            >
                                {/* Header Bar */}
                                <div 
                                    className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                                    onClick={() => toggleExpand(ticket._id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner bg-blue-50 text-blue-600`}>
                                            <MessageSquare className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h4 className="font-black text-gray-900 text-lg leading-tight">{ticket.subject}</h4>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(ticket.status)}`}>
                                                    {ticket.status}
                                                </span>
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-semibold">
                                                    {ticket.type || 'Refund Inquiry'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 font-medium">
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3.5 h-3.5" /> 
                                                    {ticket.guestName || ticket.userId?.name || 'Guest User'}
                                                    {ticket.guestName && <span className="ml-1.5 px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase tracking-wider">Guest</span>}
                                                </span>
                                                <span className="text-gray-300">•</span>
                                                <span className="text-xs">{ticket.guestEmail || ticket.userId?.email || 'No Email'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="text-right hidden md:block">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Created On</p>
                                            <p className="text-xs font-bold text-gray-700">
                                                {new Date(ticket.createdAt).toLocaleDateString('en-IN', { 
                                                    day: '2-digit', 
                                                    month: 'short', 
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        <div className="h-10 w-[1px] bg-gray-100 mx-2 hidden md:block" />
                                        <button className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-blue-600 transition-colors">
                                            {expandedId === ticket._id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
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
                                            className="border-t border-gray-50 bg-slate-50/30"
                                        >
                                            <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
                                                {/* User Info Card */}
                                                <div>
                                                    <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Requester Details</h5>
                                                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-400 uppercase">User Name</p>
                                                            <p className="font-black text-gray-900">{ticket.guestName || ticket.userId?.name || 'Guest User'}</p>
                                                        </div>
                                                        <div className="pt-3 border-t border-gray-50 flex flex-col gap-2">
                                                            <span className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                                                <Mail className="w-4 h-4 text-blue-500" /> {ticket.guestEmail || ticket.userId?.email || 'N/A'}
                                                            </span>
                                                            <span className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                                                <Phone className="w-4 h-4 text-emerald-500" /> {ticket.guestPhone || ticket.userId?.phone || 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Message Details */}
                                                <div>
                                                    <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Ticket Description</h5>
                                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[140px]">
                                                        <p className="text-sm text-gray-700 leading-relaxed font-medium">
                                                            {ticket.message}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Management Actions */}
                                                <div className="space-y-6">
                                                    <div>
                                                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Action Control & Notes</h5>
                                                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                                            <div>
                                                                <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Status</label>
                                                                <select
                                                                    defaultValue={ticket.status}
                                                                    id={`status-select-${ticket._id}`}
                                                                    className="w-full bg-slate-50 border border-gray-100 rounded-xl py-3 px-4 text-sm font-bold text-slate-800 focus:outline-none"
                                                                >
                                                                    <option value="Open">Open</option>
                                                                    <option value="In Progress">In Progress</option>
                                                                    <option value="Resolved">Resolved</option>
                                                                    <option value="Closed">Closed</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Internal Admin Notes</label>
                                                                <textarea
                                                                    value={adminNotesText[ticket._id] || ""}
                                                                    onChange={(e) => handleNoteChange(ticket._id, e.target.value)}
                                                                    placeholder="Write internal notes about refund status or actions..."
                                                                    rows={3}
                                                                    className="w-full bg-slate-50 border border-gray-100 rounded-xl p-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 resize-none"
                                                                />
                                                            </div>
                                                            <button 
                                                                disabled={updatingId === ticket._id}
                                                                onClick={() => {
                                                                    const select = document.getElementById(`status-select-${ticket._id}`) as HTMLSelectElement;
                                                                    handleUpdateTicket(ticket._id, select.value);
                                                                }}
                                                                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-blue-600/10 flex items-center justify-center gap-2"
                                                            >
                                                                {updatingId === ticket._id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Save className="w-4 h-4" />
                                                                )}
                                                                Save Updates
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
