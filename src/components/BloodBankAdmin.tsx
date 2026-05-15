"use client";
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { getToken } from '@/lib/tokenStorage';
import { Download, FileSpreadsheet, FileText, Users, Droplet, Calendar, Phone, MapPin, AlertCircle, Search, ChevronRight, Trash2 } from 'lucide-react';
import { saveAs } from 'file-saver';
import { motion, AnimatePresence } from 'framer-motion';

export default function BloodBankAdmin() {
    const [activeTab, setActiveTab] = useState<'donors' | 'requests'>('donors');
    const [requestFilter, setRequestFilter] = useState<'all' | 'Open' | 'Fulfilled' | 'Fake'>('all');
    const [donors, setDonors] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalDonors: 0, totalRequests: 0, urgentRequests: 0, availableDonors: 0 });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = getToken();
            const [donorsRes, requestsRes] = await Promise.all([
                api.get('/blood-bank/admin/donors', { headers: { Authorization: `Bearer ${token}` } }),
                api.get('/blood-bank/admin/requests', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            setDonors(donorsRes.data);
            setRequests(requestsRes.data);

            setStats({
                totalDonors: donorsRes.data.length,
                totalRequests: requestsRes.data.length,
                urgentRequests: requestsRes.data.filter((r: any) => r.isUrgent).length,
                availableDonors: donorsRes.data.filter((d: any) => d.isAvailable).length
            });
        } catch (error) {
            console.error('Failed to fetch blood bank data', error);
        } finally {
            setLoading(false);
        }
    const handleDeleteDonor = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this donor?')) return;
        try {
            await api.delete(`/blood-bank/admin/donors/${id}`);
            setDonors(donors.filter(d => d._id !== id));
        } catch (error) {
            console.error('Failed to delete donor', error);
        }
    };

    const handleDeleteRequest = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this request?')) return;
        try {
            await api.delete(`/blood-bank/admin/requests/${id}`);
            setRequests(requests.filter(r => r._id !== id));
        } catch (error) {
            console.error('Failed to delete request', error);
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            await api.patch(`/blood-bank/admin/requests/${id}/status`, { status });
            setRequests(requests.map(r => r._id === id ? { ...r, status } : r));
        } catch (error) {
            console.error('Failed to update status', error);
        }
    };

    const filteredRequests = requests.filter(r => 
        requestFilter === 'all' ? true : r.status === requestFilter
    );

    const downloadExcel = async (type: 'donors' | 'requests') => {
        try {
            const token = getToken();
            const endpoint = type === 'donors'
                ? '/blood-bank/admin/export/donors/excel'
                : '/blood-bank/admin/export/requests/excel';

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}${endpoint}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            saveAs(blob, `blood-${type}-${Date.now()}.xlsx`);
        } catch (error) {
            console.error('Excel export failed:', error);
            alert('Failed to export to Excel');
        }
    };

    const downloadPDF = async (type: 'donors' | 'requests') => {
        try {
            const token = getToken();
            const endpoint = type === 'donors'
                ? '/blood-bank/admin/export/donors/pdf'
                : '/blood-bank/admin/export/requests/pdf';

            const response = await api.get(endpoint, { headers: { Authorization: `Bearer ${token}` } });
            const data = type === 'donors' ? response.data.donors : response.data.requests;

            const jspdfModule = await import('jspdf');
            const jsPDF = jspdfModule.jsPDF || jspdfModule.default;
            const autoTable = (await import('jspdf-autotable')).default;

            const doc = new jsPDF('landscape');
            doc.setFontSize(18);
            doc.setTextColor(220, 20, 60);
            doc.text(`Blood ${type === 'donors' ? 'Donors' : 'Requests'} Report`, 14, 15);
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

            let headers: string[];
            let rows: any[][];

            if (type === 'donors') {
                headers = ['Name', 'Email', 'Blood Group', 'Age', 'Gender', 'Phone', 'City', 'Area', 'Available', 'Last Donation'];
                rows = data.map((d: any) => [
                    d.name, d.email, d.bloodGroup, d.age, d.gender,
                    d.phone, d.city, d.area, d.isAvailable ? 'Yes' : 'No', d.lastDonationDate || 'N/A'
                ]);
            } else {
                headers = ['Patient', 'Requested By', 'Blood Group', 'Units', 'Hospital', 'City', 'Contact', 'Status', 'Urgent'];
                rows = data.map((r: any) => [
                    r.patientName, r.requestedBy, r.bloodGroup, r.units,
                    r.hospitalAddress, r.city, r.contactNumber, r.status, r.isUrgent ? 'Yes' : 'No'
                ]);
            }

            autoTable(doc, {
                head: [headers],
                body: rows,
                startY: 28,
                theme: 'grid',
                headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [249, 250, 251] },
                margin: { top: 28 }
            });

            doc.save(`blood-${type}-${Date.now()}.pdf`);
        } catch (error) {
            console.error('PDF export failed:', error);
            alert('Failed to export to PDF');
        }
    };

    if (loading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-xs">Synchronizing Database...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl p-6 md:p-8 space-y-8">
            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider mb-1">Total Donors</p>
                    <p className="text-2xl font-black text-blue-900">{stats.totalDonors}</p>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-wider mb-1">Available</p>
                    <p className="text-2xl font-black text-emerald-900">{stats.availableDonors}</p>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl">
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-wider mb-1">Requests</p>
                    <p className="text-2xl font-black text-purple-900">{stats.totalRequests}</p>
                </div>
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider mb-1">Urgent</p>
                    <p className="text-2xl font-black text-rose-900">{stats.urgentRequests}</p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                    <button
                        onClick={() => setActiveTab('donors')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'donors' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Donors
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'requests' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Requests
                    </button>
                </div>

                </div>

                {activeTab === 'requests' && (
                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                        {['all', 'Open', 'Fulfilled', 'Fake'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setRequestFilter(f as any)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                    requestFilter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => downloadExcel(activeTab)}
                        className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition-colors"
                        title="Export Excel"
                    >
                        <FileSpreadsheet className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => downloadPDF(activeTab)}
                        className="p-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors"
                        title="Export PDF"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content Table */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'donors' ? (
                            <DonorsTable donors={donors} onDelete={handleDeleteDonor} />
                        ) : (
                            <RequestsTable 
                                requests={filteredRequests} 
                                onUpdateStatus={handleUpdateStatus}
                                onDelete={handleDeleteRequest}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

function DonorsTable({ donors, onDelete }: { donors: any[], onDelete: (id: string) => void }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <th className="px-6 py-4">Donor Profile</th>
                        <th className="px-6 py-4">Group</th>
                        <th className="px-6 py-4">Contact & Location</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {donors.map((donor) => (
                        <tr key={donor._id} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black">
                                        {donor.name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{donor.name}</p>
                                        <p className="text-xs text-gray-500">{donor.age}y • {donor.gender}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-xs font-black ring-1 ring-rose-100">
                                    {donor.bloodGroup}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                                        <Phone className="w-3 h-3 text-gray-400" /> {donor.phone}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                        <MapPin className="w-3 h-3 text-gray-400" /> {donor.area}, {donor.city}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                    donor.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                                }`}>
                                    {donor.isAvailable ? 'Available' : 'Busy'}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <button
                                    onClick={() => onDelete(donor._id)}
                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {donors.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">No registered donors found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

function RequestsTable({ requests, onUpdateStatus, onDelete }: { 
    requests: any[], 
    onUpdateStatus: (id: string, status: string) => void,
    onDelete: (id: string) => void 
}) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <th className="px-6 py-4">Patient Info</th>
                        <th className="px-6 py-4">Blood Needed</th>
                        <th className="px-6 py-4">Facility & Contact</th>
                        <th className="px-6 py-4">Verification</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {requests.map((request) => (
                        <tr key={request._id} className={`hover:bg-blue-50/30 transition-colors ${request.isUrgent ? 'bg-rose-50/30' : ''}`}>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${request.isUrgent ? 'bg-rose-100 text-rose-600 shadow-sm shadow-rose-200' : 'bg-purple-100 text-purple-600'}`}>
                                        {request.bloodGroup}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 flex items-center gap-2">
                                            {request.patientName}
                                            {request.isUrgent && <span className="animate-pulse w-2 h-2 rounded-full bg-rose-500" />}
                                        </p>
                                        <p className="text-xs text-gray-500 text-truncate max-w-[150px]">Requested by {request.user?.name || 'User'}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <p className="font-black text-gray-900 text-lg">{request.units} <span className="text-[10px] uppercase text-gray-400">Units</span></p>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                    request.status === 'Open' ? 'text-blue-500 bg-blue-50' : 
                                    request.status === 'Fulfilled' ? 'text-emerald-500 bg-emerald-50' :
                                    request.status === 'Fake' ? 'text-rose-600 bg-rose-50' :
                                    'text-gray-400 bg-gray-50'
                                }`}>{request.status}</span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                                        <Phone className="w-3 h-3 text-gray-400" /> {request.contactNumber}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                        <Building2 className="w-3 h-3 text-gray-400" /> {request.hospitalAddress}, {request.city}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${
                                        request.aiVerificationStatus === 'Verified' ? 'bg-emerald-500' : 
                                        request.aiVerificationStatus === 'Rejected' ? 'bg-rose-500' : 'bg-amber-500'
                                    }`} />
                                    <span className="text-[10px] font-black uppercase text-gray-600 tracking-tighter">
                                        {request.aiVerificationStatus}
                                    </span>
                                </div>
                                <p className="text-[9px] text-gray-400 font-mono mt-1">{request.kycDocumentId || 'NO_ID'}</p>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-2">
                                    {request.status === 'Open' && (
                                        <>
                                            <button
                                                onClick={() => onUpdateStatus(request._id, 'Fulfilled')}
                                                className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                                                title="Mark as Fulfilled"
                                            >
                                                Fulfill
                                            </button>
                                            <button
                                                onClick={() => onUpdateStatus(request._id, 'Fake')}
                                                className="px-3 py-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                                                title="Mark as Fake"
                                            >
                                                Fake
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => onDelete(request._id)}
                                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {requests.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">No requests found in this category.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

const Loader2 = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);

const Building2 = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
);
