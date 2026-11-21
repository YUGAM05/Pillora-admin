"use client";
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { getToken } from '@/lib/tokenStorage';
import { Download, FileSpreadsheet, FileText, Users, Droplet, Calendar, Phone, MapPin, AlertCircle, Search, ChevronRight, Trash2, Upload, X, CheckCircle2 } from 'lucide-react';
import { saveAs } from 'file-saver';
import { motion, AnimatePresence } from 'framer-motion';

// ID images are uploaded by the public; only show real image data or https links.
const isSafeImageSrc = (src: unknown): src is string =>
    typeof src === 'string' && (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(src) || /^https:\/\//i.test(src));

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
    const [selectedDonors, setSelectedDonors] = useState<string[]>([]);
    const [kycUpdatingId, setKycUpdatingId] = useState<string | null>(null);
    const [idPreview, setIdPreview] = useState<any>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        setSelectedDonors([]);
    }, [activeTab]);

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
            setSelectedDonors(prev => prev.filter(sid => sid !== id));
            alert('Donor deleted successfully');
        } catch (error: any) {
            console.error('Failed to delete donor', error);
            alert(`Delete failed: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleDeleteSelectedDonors = async () => {
        if (selectedDonors.length === 0) return;
        if (!window.confirm(`Are you sure you want to delete the ${selectedDonors.length} selected donor(s)?`)) return;
        try {
            const token = getToken();
            await api.post(
                'blood-bank/admin/donors/delete-many',
                { ids: selectedDonors },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const deletedList = donors.filter(d => selectedDonors.includes(d._id));
            const availableCount = deletedList.filter(d => d.isAvailable).length;

            if (availableCount > 0) {
                setAvailableDonors(prev => Math.max(0, prev - availableCount));
            }
            setDonors(prev => prev.filter(d => !selectedDonors.includes(d._id)));
            setTotalDonors(prev => Math.max(0, prev - selectedDonors.length));
            setSelectedDonors([]);
            alert('Selected donors deleted successfully');
        } catch (error: any) {
            console.error('Failed to delete selected donors:', error);
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

    // Blood Connect: donor contacts (max 5) are shared with the requester only after an admin approves the ID.
    const handleKycDecision = async (request: any, status: 'Verified' | 'Rejected') => {
        const message = status === 'Verified'
            ? `Approve the request for ${request.patientName}? Up to 5 matching donors' contact details will be shared with the requester.`
            : `Reject the request for ${request.patientName}? The requester will be told their ID could not be verified.`;
        if (!window.confirm(message)) return;
        setKycUpdatingId(request._id);
        try {
            const res = await api.patch(`blood-bank/admin/requests/${request._id}/kyc`, { status });
            setRequests(prev => prev.map(r => r._id === request._id ? { ...r, ...(res.data || {}), aiVerificationStatus: status } : r));
            showToast(status === 'Verified' ? 'Request approved. Donor details are being shared.' : 'Request rejected.', 'success');
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Could not update the request. Please try again.', 'error');
        } finally {
            setKycUpdatingId(null);
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
            <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="mb-3 h-7 w-7 animate-spin text-blue-600" />
                <p className="text-sm text-slate-500">Loading donors and requests...</p>
            </div>
        );
    }

    return (
        <div className="space-y-5 sm:space-y-6">
            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                        <p className="text-[13px] font-medium leading-snug text-slate-500">Total donors</p>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Users className="h-5 w-5" /></span>
                    </div>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{stats.totalDonors}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                        <p className="text-[13px] font-medium leading-snug text-slate-500">Available</p>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Droplet className="h-5 w-5" /></span>
                    </div>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{stats.availableDonors}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                        <p className="text-[13px] font-medium leading-snug text-slate-500">Requests</p>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><FileText className="h-5 w-5" /></span>
                    </div>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{stats.totalRequests}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                        <p className="text-[13px] font-medium leading-snug text-slate-500">Urgent</p>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><AlertCircle className="h-5 w-5" /></span>
                    </div>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{stats.urgentRequests}</p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
                <div className="ui-segmented w-full sm:w-auto">
                    <button
                        onClick={() => setActiveTab('donors')}
                        aria-pressed={activeTab === 'donors'}
                        className={`ui-segment flex-1 whitespace-nowrap sm:flex-none ${activeTab === 'donors' ? 'ui-segment-active' : ''}`}
                    >
                        Donors ({totalDonors})
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        aria-pressed={activeTab === 'requests'}
                        className={`ui-segment flex-1 whitespace-nowrap sm:flex-none ${activeTab === 'requests' ? 'ui-segment-active' : ''}`}
                    >
                        Requests ({requests.length})
                    </button>
                </div>


                {activeTab === 'requests' && (
                    <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
                        {['all', 'Open', 'Fulfilled', 'Fake'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setRequestFilter(f as any)}
                                aria-pressed={requestFilter === f}
                                className={`flex min-h-[40px] shrink-0 items-center rounded-full border px-3.5 text-sm font-medium capitalize transition ${
                                    requestFilter === f ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-2 md:ml-auto">
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
                                className="ui-btn-primary flex-1 sm:flex-none"
                                title="Import from Excel (.xlsx)"
                            >
                                {importing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4" />
                                        Import Excel
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleDownloadTemplate}
                                className="ui-btn-secondary flex-1 sm:flex-none"
                                title="Download sample Excel template"
                            >
                                <Download className="h-4 w-4" />
                                Sample Excel
                            </button>
                            <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />
                        </>
                    )}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => downloadExcel(activeTab)}
                            className="ui-btn-secondary h-10 w-10 shrink-0 px-0 text-emerald-600"
                            title="Export Excel"
                            aria-label="Export Excel"
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => downloadPDF(activeTab)}
                            className="ui-btn-secondary h-10 w-10 shrink-0 px-0 text-blue-600"
                            title="Export PDF"
                            aria-label="Export PDF"
                        >
                            <Download className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'donors' ? (
                            <div className="divide-y divide-slate-100">
                                <div className="flex min-h-[64px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
                                    <p className="text-sm text-slate-600">Total donors in database: <span className="font-semibold text-slate-900">{totalDonors}</span></p>
                                    {selectedDonors.length > 0 && (
                                        <button
                                            onClick={handleDeleteSelectedDonors}
                                            className="ui-btn-danger"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete selected ({selectedDonors.length})
                                        </button>
                                    )}
                                </div>
                                <DonorsTable 
                                    donors={donors} 
                                    onDelete={handleDeleteDonor} 
                                    onEdit={handleEditDonor} 
                                    selectedDonors={selectedDonors}
                                    onSelect={(id) => {
                                        setSelectedDonors(prev => 
                                            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
                                        );
                                    }}
                                    onSelectAll={(ids) => {
                                        setSelectedDonors(ids);
                                    }}
                                />
                                {hasMore && (
                                    <div className="flex justify-center px-4 py-4">
                                        <button
                                            onClick={handleLoadMore}
                                            disabled={loadingMore}
                                            className="ui-btn-secondary w-full sm:w-auto"
                                        >
                                            {loadingMore ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                                                    Loading...
                                                </>
                                            ) : (
                                                'Load more donors'
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
                                onKycDecision={handleKycDecision}
                                onViewId={setIdPreview}
                                kycUpdatingId={kycUpdatingId}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Edit Donor Modal */}
            <AnimatePresence>
                {editingDonor && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px]"
                            onClick={() => setEditingDonor(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="edit-donor-title"
                            className="ui-dialog relative z-10 sm:max-w-md"
                        >
                            <div className="shrink-0 border-b border-slate-100 px-5 py-4 sm:px-6">
                                <h3 id="edit-donor-title" className="text-lg font-semibold leading-tight text-slate-900">Update last blood donation date</h3>
                                <p className="mt-0.5 text-sm text-slate-500">Donor: <span className="font-medium text-slate-900">{editingDonor.name}</span></p>
                            </div>

                            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                                <label htmlFor="edit-last-donation-date" className="ui-label">Last blood donation date</label>
                                <input
                                    id="edit-last-donation-date"
                                    type="date"
                                    value={editLastDonationDate}
                                    onChange={(e) => setEditLastDonationDate(e.target.value)}
                                    className="ui-input"
                                />
                                <p className="ui-hint">Leave empty if the donor has not donated before.</p>
                            </div>

                            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                                <button
                                    onClick={() => setEditingDonor(null)}
                                    className="ui-btn-secondary w-full sm:w-auto"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveDonorDate}
                                    className="ui-btn-primary w-full sm:w-auto"
                                >
                                    Save changes
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Import Results Modal */}
            <AnimatePresence>
                {showImportModal && importResult && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px]"
                            onClick={() => setShowImportModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="import-results-title"
                            className="ui-dialog relative z-10 sm:max-w-2xl"
                        >
                            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
                                <h3 id="import-results-title" className="text-lg font-semibold leading-tight text-slate-900">Bulk donor import results</h3>
                                <button
                                    onClick={() => setShowImportModal(false)}
                                    aria-label="Close"
                                    className="-mr-2 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                                {/* Statistics Summary Cards */}
                                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-center sm:p-4">
                                        <p className="text-xs font-medium text-emerald-700">Imported</p>
                                        <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-900 sm:text-3xl">{importResult.inserted}</p>
                                    </div>
                                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-center sm:p-4">
                                        <p className="text-xs font-medium text-amber-700">Skipped (exists)</p>
                                        <p className="mt-1 text-2xl font-bold tracking-tight text-amber-900 sm:text-3xl">{importResult.skipped}</p>
                                    </div>
                                    <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-center sm:p-4">
                                        <p className="text-xs font-medium text-rose-700">Errors</p>
                                        <p className="mt-1 text-2xl font-bold tracking-tight text-rose-900 sm:text-3xl">{importResult.errors.length}</p>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-sm text-slate-600">
                                        Processed <span className="font-semibold text-slate-900">{importResult.totalRows}</span> total rows from the Excel sheet.
                                    </p>
                                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                                        Expected column headers: Name, Age, Blood Group, Last Blood Donate Date, Phone Number, Address, City, Area
                                    </p>
                                </div>

                                {/* Errors Table */}
                                {importResult.errors.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-rose-700">
                                            <AlertCircle className="h-4 w-4 text-rose-500" />
                                            Import errors breakdown
                                        </div>
                                        <div className="max-h-[300px] overflow-auto rounded-xl border border-slate-200">
                                            <table className="w-full border-collapse text-left">
                                                <thead>
                                                    <tr className="border-b border-slate-100 bg-slate-50/80">
                                                        <th className="ui-th sticky top-0 w-20 bg-slate-50">Row</th>
                                                        <th className="ui-th sticky top-0 bg-slate-50">Reason / details</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {importResult.errors.map((err: any, idx: number) => (
                                                        <tr key={idx} className="hover:bg-slate-50/60">
                                                            <td className="ui-td whitespace-nowrap font-medium text-rose-600">Row {err.row}</td>
                                                            <td className="ui-td text-slate-600">{err.reason}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex shrink-0 justify-end border-t border-slate-100 px-5 py-4 sm:px-6">
                                <button
                                    onClick={() => setShowImportModal(false)}
                                    className="ui-btn-primary w-full sm:w-auto"
                                >
                                    Close results
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ID document preview (Blood Connect request review) */}
            {idPreview && isSafeImageSrc(idPreview.kycDocumentImage) && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="id-preview-title">
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={() => setIdPreview(null)} />
                    <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                            <h3 id="id-preview-title" className="text-base font-semibold text-slate-900">
                                ID document · {idPreview.patientName}
                            </h3>
                            <button onClick={() => setIdPreview(null)} className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Close">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="overflow-auto p-5">
                            <p className="mb-3 text-sm text-slate-600">{idPreview.kycDocumentType || 'ID'} · {idPreview.kycDocumentId || 'No number'}</p>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={idPreview.kycDocumentImage} alt="Uploaded ID document" className="mx-auto max-h-[60vh] w-auto rounded-lg border border-slate-200" />
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div role="status" className={`fixed bottom-4 left-4 right-4 z-[9999] flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg sm:bottom-6 sm:left-auto sm:right-6 ${
                    toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                }`}>
                    {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                    <span>{toast.message}</span>
                </div>
            )}
        </div>
    );
}

function DonorsTable({ 
    donors, 
    onDelete, 
    onEdit, 
    selectedDonors, 
    onSelect, 
    onSelectAll 
}: { 
    donors: any[], 
    onDelete: (id: string) => void, 
    onEdit: (donor: any) => void, 
    selectedDonors: string[], 
    onSelect: (id: string) => void, 
    onSelectAll: (ids: string[]) => void 
}) {
    const allSelected = donors.length > 0 && selectedDonors.length === donors.length;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[720px]">
                <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                        <th className="ui-th w-12">
                            <input
                                type="checkbox"
                                aria-label="Select all donors"
                                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-blue-500"
                                checked={allSelected}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        onSelectAll(donors.map(d => d._id));
                                    } else {
                                        onSelectAll([]);
                                    }
                                }}
                            />
                        </th>
                        <th className="ui-th">Donor profile</th>
                        <th className="ui-th">Group</th>
                        <th className="ui-th">Contact & location</th>
                        <th className="ui-th">Eligibility status</th>
                        <th className="ui-th">Availability</th>
                        <th className="ui-th">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {donors.map((donor) => (
                        <tr key={donor._id} className="transition-colors hover:bg-slate-50/60">
                            <td className="ui-td w-12 align-middle">
                                <input
                                    type="checkbox"
                                    aria-label={`Select ${donor.name}`}
                                    className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-blue-500"
                                    checked={selectedDonors.includes(donor._id)}
                                    onChange={() => onSelect(donor._id)}
                                />
                            </td>
                            <td className="ui-td align-middle">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-semibold text-blue-600">
                                        {donor.name?.charAt(0) || '?'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-900">{donor.name}</p>
                                        <p className="text-xs text-slate-500">{donor.age}y • {donor.gender}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="ui-td align-middle">
                                <span className="ui-badge border-rose-200 bg-rose-50 text-rose-700">
                                    {donor.bloodGroup}
                                </span>
                            </td>
                            <td className="ui-td align-middle">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 font-medium text-slate-800">
                                        <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" /> {donor.phone}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" /> {donor.area}, {donor.city}
                                    </div>
                                </div>
                            </td>
                            <td className="ui-td align-middle">
                                <div className="space-y-1">
                                    <span className={`ui-badge ${
                                        donor.eligibilityStatus === 'Eligible' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'
                                    }`}>
                                        {donor.eligibilityStatus || 'Eligible'}
                                    </span>
                                    {donor.lastDonationDate && (
                                        <p className="text-xs text-slate-500">
                                            Last donated: {new Date(donor.lastDonationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    )}
                                    {donor.eligibleFromDate && (
                                        <p className="text-xs font-medium text-slate-700">
                                            Eligible from: {new Date(donor.eligibleFromDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    )}
                                    {donor.eligibilityStatus === 'Not Eligible' && donor.daysRemaining > 0 && (
                                        <p className="text-xs font-medium text-rose-600">
                                            ({donor.daysRemaining} days remaining)
                                        </p>
                                    )}
                                </div>
                            </td>
                            <td className="ui-td align-middle">
                                <span className={`ui-badge ${
                                    donor.isAvailable ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600'
                                }`}>
                                    {donor.isAvailable ? 'Available' : 'Busy'}
                                </span>
                            </td>
                            <td className="ui-td align-middle">
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => onEdit(donor)}
                                        className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600 md:h-8 md:w-8"
                                        title="Edit donation date"
                                        aria-label="Edit donation date"
                                    >
                                        <Calendar className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => onDelete(donor._id)}
                                        className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 md:h-8 md:w-8"
                                        title="Delete donor"
                                        aria-label="Delete donor"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {donors.length === 0 && (
                        <tr>
                            <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500"><Users className="mx-auto mb-2 h-8 w-8 text-slate-300" />No registered donors found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

function RequestsTable({ requests, onUpdateStatus, onDelete, onKycDecision, onViewId, kycUpdatingId }: { 
    requests: any[], 
    onUpdateStatus: (id: string, status: string) => void,
    onDelete: (id: string) => void,
    onKycDecision: (request: any, status: 'Verified' | 'Rejected') => void,
    onViewId: (request: any) => void,
    kycUpdatingId: string | null
}) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[720px]">
                <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                        <th className="ui-th">Patient info</th>
                        <th className="ui-th">Blood needed</th>
                        <th className="ui-th">Facility & contact</th>
                        <th className="ui-th">Verification</th>
                        <th className="ui-th text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {requests.map((request) => (
                        <tr key={request._id} className={`transition-colors hover:bg-slate-50/60 ${request.isUrgent ? 'bg-rose-50/40' : ''}`}>
                            <td className="ui-td align-middle">
                                <div className="flex items-center gap-3">
                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${request.isUrgent ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-600'}`}>
                                        {request.bloodGroup}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="flex items-center gap-2 font-semibold text-slate-900">
                                            {request.patientName}
                                            {request.isUrgent && <span role="img" aria-label="Urgent" className="h-2 w-2 shrink-0 rounded-full bg-rose-500" />}
                                        </p>
                                        <p className="max-w-[180px] truncate text-xs text-slate-500">Requested by {request.user?.name || 'User'}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="ui-td align-middle">
                                <p className="text-base font-semibold text-slate-900">{request.units} <span className="text-xs font-medium text-slate-500">units</span></p>
                                <span className={`ui-badge mt-1 ${
                                    request.status === 'Open' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                                    request.status === 'Fulfilled' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
                                    request.status === 'Fake' ? 'border-rose-200 bg-rose-50 text-rose-700' :
                                    'border-slate-200 bg-slate-100 text-slate-600'
                                }`}>{request.status}</span>
                            </td>
                            <td className="ui-td align-middle">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 font-medium text-slate-800">
                                        <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" /> {request.contactNumber}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" /> {request.hospitalAddress}, {request.city}
                                    </div>
                                </div>
                            </td>
                            <td className="ui-td align-middle">
                                <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 shrink-0 rounded-full ${
                                        request.aiVerificationStatus === 'Verified' ? 'bg-emerald-500' :
                                        request.aiVerificationStatus === 'Rejected' ? 'bg-rose-500' : 'bg-amber-500'
                                    }`} />
                                    <span className="text-xs font-medium text-slate-700">
                                        {request.aiVerificationStatus}
                                    </span>
                                </div>
                                <p className="mt-1 font-mono text-[11px] text-slate-400">{request.kycDocumentType ? `${request.kycDocumentType} · ` : ''}{request.kycDocumentId || 'NO_ID'}</p>
                                {isSafeImageSrc(request.kycDocumentImage) && (
                                    <button
                                        type="button"
                                        onClick={() => onViewId(request)}
                                        className="mt-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                                    >
                                        View ID document
                                    </button>
                                )}
                                {request.aiVerificationStatus !== 'Verified' && request.aiVerificationStatus !== 'Rejected' && (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        <button
                                            type="button"
                                            disabled={kycUpdatingId === request._id}
                                            onClick={() => onKycDecision(request, 'Verified')}
                                            className="ui-btn ui-btn-sm min-h-[40px] border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 md:min-h-[32px]"
                                            title="Approve ID and share up to 5 donor contacts"
                                        >
                                            {kycUpdatingId === request._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Approve
                                        </button>
                                        <button
                                            type="button"
                                            disabled={kycUpdatingId === request._id}
                                            onClick={() => onKycDecision(request, 'Rejected')}
                                            className="ui-btn ui-btn-sm min-h-[40px] border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-50 md:min-h-[32px]"
                                            title="Reject ID"
                                        >
                                            <X className="h-3.5 w-3.5" /> Reject
                                        </button>
                                    </div>
                                )}
                            </td>
                            <td className="ui-td align-middle">
                                <div className="flex items-center justify-end gap-2">
                                    {request.status === 'Open' && (
                                        <>
                                            <button
                                                onClick={() => onUpdateStatus(request._id, 'Fulfilled')}
                                                className="ui-btn ui-btn-sm min-h-[40px] border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 md:min-h-[32px]"
                                                title="Mark as fulfilled"
                                            >
                                                Fulfill
                                            </button>
                                            <button
                                                onClick={() => onUpdateStatus(request._id, 'Fake')}
                                                className="ui-btn ui-btn-sm min-h-[40px] border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 md:min-h-[32px]"
                                                title="Mark as fake"
                                            >
                                                Fake
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => onDelete(request._id)}
                                        className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 md:h-8 md:w-8"
                                        title="Delete"
                                        aria-label="Delete request"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {requests.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500"><Droplet className="mx-auto mb-2 h-8 w-8 text-slate-300" />No requests found in this category.</td>
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
