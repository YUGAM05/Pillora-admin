"use client";
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { getToken } from '@/lib/tokenStorage';
import { Download, FileSpreadsheet, FileText, Users, Droplet, Calendar, Phone, MapPin, AlertCircle, Search, ChevronRight, Trash2, Upload } from 'lucide-react';
import { saveAs } from 'file-saver';
import { motion, AnimatePresence } from 'framer-motion';

export default function BloodBankAdmin() {
    const [activeTab, setActiveTab] = useState<'donors' | 'requests'>('donors');
    const [requestFilter, setRequestFilter] = useState<'all' | 'Open' | 'Fulfilled' | 'Fake'>('all');
    const [donors, setDonors] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [totalDonors, setTotalDonors] = useState(0);
    const [availableDonors, setAvailableDonors] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [editingDonor, setEditingDonor] = useState<any>(null);
    const [editLastDonationDate, setEditLastDonationDate] = useState<string>('');
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<any>(null);
    const [showImportModal, setShowImportModal] = useState(false);

    const stats = {
        totalDonors: totalDonors,
        totalRequests: requests.length,
        urgentRequests: requests.filter((r: any) => r.isUrgent).length,
        availableDonors: availableDonors
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = getToken();
            const [donorsRes, requestsRes] = await Promise.all([
                api.get('blood-bank/admin/donors?page=1&limit=100', { headers: { Authorization: `Bearer ${token}` } }),
                api.get('blood-bank/admin/requests', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            console.log('Donors from API:', donorsRes.data);

            const donorsList = donorsRes.data.donors || [];
            const pagination = donorsRes.data.pagination || {};

            setDonors(donorsList);
            setTotalDonors(pagination.total || 0);
            setAvailableDonors(pagination.available !== undefined ? pagination.available : donorsList.filter((d: any) => d.isAvailable).length);
            setHasMore(pagination.hasMore || false);
            setPage(1);

            setRequests(requestsRes.data);
        } catch (error) {
            console.error('Failed to fetch blood bank data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = async () => {
        if (loadingMore) return;
        setLoadingMore(true);
        try {
            const token = getToken();
            const nextPage = page + 1;
            const res = await api.get(`blood-bank/admin/donors?page=${nextPage}&limit=100`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDonors(prev => [...prev, ...res.data.donors]);
            setHasMore(res.data.pagination.hasMore);
            setPage(nextPage);
        } catch (error) {
            console.error('Failed to load more donors', error);
        } finally {
            setLoadingMore(false);
        }
    };

    const handleDeleteDonor = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this donor?')) return;
        try {
            await api.delete(`blood-bank/admin/donors/${id}`);
            const deletedDonor = donors.find(d => d._id === id);
            if (deletedDonor && deletedDonor.isAvailable) {
                setAvailableDonors(prev => Math.max(0, prev - 1));
            }
            setDonors(prev => prev.filter(d => d._id !== id));
            setTotalDonors(prev => Math.max(0, prev - 1));
            alert('Donor deleted successfully');
        } catch (error: any) {
            console.error('Failed to delete donor', error);
            alert(`Delete failed: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleEditDonor = (donor: any) => {
        setEditingDonor(donor);
        setEditLastDonationDate(
            donor.lastDonationDate
                ? new Date(donor.lastDonationDate).toISOString().split('T')[0]
                : ''
        );
    };

    const handleSaveDonorDate = async () => {
        if (!editingDonor) return;
        try {
            const token = getToken();
            await api.patch(
                `blood-bank/admin/donors/${editingDonor._id}`,
                { lastDonationDate: editLastDonationDate || null },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            await fetchData();
            setEditingDonor(null);
            alert('Donor donation record updated successfully.');
        } catch (error: any) {
            console.error('Failed to update donor donation date:', error);
            alert(`Failed to save: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleDeleteRequest = async (id: string) => {
        console.log(`[DEBUG] Attempting to delete blood request with ID: ${id}`);
        if (!window.confirm('Are you sure you want to delete this request?')) return;
        try {
            const deleteUrl = `blood-bank/admin/requests/${id}`;
            console.log(`[DEBUG] DELETE URL: ${deleteUrl}`);
            await api.delete(deleteUrl);
            setRequests(prev => prev.filter(r => r._id !== id));
            alert('Request deleted successfully');
        } catch (error: any) {
            console.error('Failed to delete request', error);
            alert(`Delete failed: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            await api.patch(`blood-bank/admin/requests/${id}/status`, { status });
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
                    d.name,
                    d.email || 'N/A',
                    d.bloodGroup,
                    d.age,
                    d.gender,
                    d.phone || 'N/A',
                    d.city,
                    d.area,
                    d.isAvailable ? 'Yes' : 'No',
                    d.lastDonationDate ? new Date(d.lastDonationDate).toLocaleDateString() : 'N/A'
                ]);
            } else {
                headers = ['Patient Name', 'Blood Group', 'Units Needed', 'Location', 'Contact', 'Status', 'Date Required'];
                rows = data.map((r: any) => [
                    r.patientName,
                    r.bloodGroup,
                    r.unitsRequired,
                    `${r.hospitalName}, ${r.city}`,
                    r.contactPhone,
                    r.status,
                    new Date(r.neededByDate).toLocaleDateString()
                ]);
            }

            autoTable(doc, {
                head: [headers],
                body: rows,
                startY: 28,
                theme: 'striped',
                headStyles: { fillColor: [220, 20, 60] }
            });

            doc.save(`blood-${type}-${Date.now()}.pdf`);
        } catch (error) {
            console.error('PDF export failed:', error);
            alert('Failed to export to PDF');
        }
    };

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = getToken();
            const res = await api.post('admin/donors/bulk-import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });

            setImportResult(res.data);
            setShowImportModal(true);
            await fetchData();
        } catch (error: any) {
            console.error('Import failed:', error);
            const errMsg = error.response?.data?.message || error.message || 'Unknown error occurred';
            alert(`Import failed: ${errMsg}`);
        } finally {
            setImporting(false);
            e.target.value = ''; // Reset file input
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const token = getToken();
            const response = await api.get('admin/donors/bulk-import/template', {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, 'bulk_donor_import_template.xlsx');
        } catch (error: any) {
            console.error('Failed to download template:', error);
            alert('Failed to download template');
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
                        Donors ({totalDonors})
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'requests' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Requests ({requests.length})
                    </button>
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
                    {activeTab === 'donors' && (
                        <>
                            <input
                                type="file"
                                id="bulk-import-input"
                                accept=".xlsx"
                                onChange={handleImportExcel}
                                className="hidden"
                            />
                            <button
                                onClick={() => document.getElementById('bulk-import-input')?.click()}
                                disabled={importing}
                                className="px-4 py-2.5 bg-purple-50 text-purple-600 border border-purple-100 rounded-xl hover:bg-purple-100 transition-colors flex items-center gap-2 text-xs font-black uppercase tracking-wider disabled:opacity-50"
                                title="Import from Excel (.xlsx)"
                            >
                                {importing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        Import Excel
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleDownloadTemplate}
                                className="px-4 py-2.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-2 text-xs font-black uppercase tracking-wider"
                                title="Download Sample Excel Template"
                            >
                                <Download className="w-4 h-4" />
                                Sample Excel
                            </button>
                            <div className="w-[1px] h-6 bg-slate-200 mx-1" />
                        </>
                    )}
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
                            <div className="space-y-4">
                                <div className="px-6 pt-4">
                                    <p className="text-sm text-gray-600 font-bold">Total Donors in Database: {totalDonors}</p>
                                </div>
                                <DonorsTable donors={donors} onDelete={handleDeleteDonor} onEdit={handleEditDonor} />
                                {hasMore && (
                                    <div className="flex justify-center pb-6">
                                        <button
                                            onClick={handleLoadMore}
                                            disabled={loadingMore}
                                            className="px-6 py-3 bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:bg-gray-50 disabled:text-gray-400 font-bold rounded-2xl text-xs uppercase tracking-widest transition-all shadow-sm border border-blue-100 flex items-center gap-2"
                                        >
                                            {loadingMore ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                                                    Loading...
                                                </>
                                            ) : (
                                                'Load More Donors'
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
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

            {/* Edit Donor Modal */}
            <AnimatePresence>
                {editingDonor && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
                            onClick={() => setEditingDonor(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative z-10 border border-slate-100 flex flex-col space-y-4"
                        >
                            <h3 className="font-extrabold text-lg text-slate-900">Update Last Blood Donation Date</h3>
                            <p className="text-sm text-slate-500 font-bold">Donor: <span className="text-slate-900">{editingDonor.name}</span></p>
                            
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Last Blood Donation Date</label>
                                <input
                                    type="date"
                                    value={editLastDonationDate}
                                    onChange={(e) => setEditLastDonationDate(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-800 font-bold shadow-sm"
                                />
                                <p className="text-xs text-slate-400 mt-1">Leave empty if the donor has not donated before.</p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setEditingDonor(null)}
                                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-xl transition-all text-sm active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveDonorDate}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition-all text-sm active:scale-95"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Import Results Modal */}
            <AnimatePresence>
                {showImportModal && importResult && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
                            onClick={() => setShowImportModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative z-10 border border-slate-100 flex flex-col max-h-[90vh]"
                        >
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                <h3 className="font-extrabold text-xl text-slate-900">Bulk Donor Import Results</h3>
                                <button 
                                    onClick={() => setShowImportModal(false)}
                                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <span className="font-bold text-lg">&times;</span>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto py-6 space-y-6">
                                {/* Statistics Summary Cards */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-center">
                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-wider mb-1">Imported</p>
                                        <p className="text-3xl font-black text-emerald-950">{importResult.inserted}</p>
                                    </div>
                                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-center">
                                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-wider mb-1">Skipped (Exists)</p>
                                        <p className="text-3xl font-black text-amber-950">{importResult.skipped}</p>
                                    </div>
                                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-center">
                                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-wider mb-1">Errors</p>
                                        <p className="text-3xl font-black text-rose-950">{importResult.errors.length}</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <p className="text-xs text-slate-600 font-bold">
                                        Processed <span className="text-slate-950 font-black">{importResult.totalRows}</span> total rows from the Excel sheet.
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                                        Expected Column Headers: Name, Age, Blood Group, Last Blood Donate Date, Phone Number, Address, City, Area
                                    </p>
                                </div>

                                {/* Errors Table */}
                                {importResult.errors.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-rose-600 font-black text-xs uppercase tracking-wider font-bold">
                                            <AlertCircle className="w-4 h-4 text-rose-500" />
                                            Import Errors Breakdown
                                        </div>
                                        <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        <th className="px-4 py-3 w-20">Row</th>
                                                        <th className="px-4 py-3">Reason / Details</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                                                    {importResult.errors.map((err: any, idx: number) => (
                                                        <tr key={idx} className="hover:bg-rose-50/20">
                                                            <td className="px-4 py-3 font-bold text-rose-600">Row {err.row}</td>
                                                            <td className="px-4 py-3 text-slate-600 font-medium">{err.reason}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={() => setShowImportModal(false)}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 transition-all text-sm active:scale-95"
                                >
                                    Close Results
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function DonorsTable({ donors, onDelete, onEdit }: { donors: any[], onDelete: (id: string) => void, onEdit: (donor: any) => void }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <th className="px-6 py-4">Donor Profile</th>
                        <th className="px-6 py-4">Group</th>
                        <th className="px-6 py-4">Contact & Location</th>
                        <th className="px-6 py-4">Eligibility Status</th>
                        <th className="px-6 py-4">Availability</th>
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
                                <div className="space-y-1">
                                    <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                        donor.eligibilityStatus === 'Eligible' ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' : 'text-rose-700 bg-rose-50 border border-rose-100'
                                    }`}>
                                        {donor.eligibilityStatus || 'Eligible'}
                                    </span>
                                    {donor.lastDonationDate && (
                                        <p className="text-[10px] text-slate-500 font-medium">
                                            Last Donated: {new Date(donor.lastDonationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    )}
                                    {donor.eligibleFromDate && (
                                        <p className="text-[10px] text-slate-700 font-bold">
                                            Eligible From: {new Date(donor.eligibleFromDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    )}
                                    {donor.eligibilityStatus === 'Not Eligible' && donor.daysRemaining > 0 && (
                                        <p className="text-[10px] text-rose-600 font-black animate-pulse">
                                            ({donor.daysRemaining} days remaining)
                                        </p>
                                    )}
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
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => onEdit(donor)}
                                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Edit Donation Date"
                                    >
                                        <Calendar className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onDelete(donor._id)}
                                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                        title="Delete Donor"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
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
