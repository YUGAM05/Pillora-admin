"use client";

import { useState } from "react";
import api from "@/lib/api";
import { getToken } from "@/lib/tokenStorage";
import { Building2, MapPin, Phone, IndianRupee, Clock, FileText, Loader2, CheckCircle2, CreditCard, User, GraduationCap, Calendar, Plus, Trash2, Image as ImageIcon, XCircle, Lock, Upload, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function AddHospitalForm({ onClose, hospitalToEdit }: { onClose?: () => void; hospitalToEdit?: any }) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [uploadingPrimary, setUploadingPrimary] = useState(false);
    const [uploadingSecondary, setUploadingSecondary] = useState(false);

    const todayStr = new Date().toISOString().split('T')[0];

    const [formData, setFormData] = useState({
        name: hospitalToEdit?.name || "",
        email: hospitalToEdit?.user?.email || hospitalToEdit?.email || "",
        city: hospitalToEdit?.city || "",
        address: hospitalToEdit?.address || "",
        consultationFee: hospitalToEdit?.consultationFee?.toString() || "",
        bedCapacity: hospitalToEdit?.bedCapacity?.toString() || "50",
        ambulanceContact: hospitalToEdit?.ambulanceContact || "",
        contactNumber: hospitalToEdit?.contactNumber || "",
        description: hospitalToEdit?.description || "",
        isOpen24Hours: hospitalToEdit?.isOpen24Hours || false,
        isOnlinePaymentAvailable: hospitalToEdit?.isOnlinePaymentAvailable || false,
        management_type: hospitalToEdit?.management_type || "SELF" as "SELF" | "PILLORA",
        image: hospitalToEdit?.image || "", // Main image
        images: hospitalToEdit?.images || [] as string[],
        phoneNumbers: hospitalToEdit?.phoneNumbers || [] as string[],
        plan: hospitalToEdit?.plan || "Standard" as "Standard" | "Premium" | "Enterprise",
        joiningDate: hospitalToEdit?.joiningDate ? new Date(hospitalToEdit.joiningDate).toISOString().split('T')[0] : todayStr,
        paymentStatus: hospitalToEdit?.paymentStatus || "Pending" as "Pending" | "Paid",
        paymentReceivedDate: todayStr,
        paymentAmount: "5000",
        paymentMethod: "UPI",
        transactionReference: "",
        adminNotes: "",
        doctors: [] as { name: string; specialization: string; timing: string; daysAvailable: string[] }[],
    });

    const [credentials, setCredentials] = useState<{username: string, temporaryPassword: string} | null>(null);

    const handleChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handlers for dynamic lists
    const handleAddListItem = (field: 'images' | 'phoneNumbers') => {
        setFormData(prev => ({ ...prev, [field]: [...prev[field], ""] }));
    };

    const handleRemoveListItem = (field: 'images' | 'phoneNumbers', index: number) => {
        setFormData(prev => ({ ...prev, [field]: prev[field].filter((_: any, i: number) => i !== index) }));
    };

    const handleListItemChange = (field: 'images' | 'phoneNumbers', index: number, value: string) => {
        setFormData(prev => {
            const newList = [...prev[field]];
            newList[index] = value;
            return { ...prev, [field]: newList };
        });
    };

    const handlePrimaryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingPrimary(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData(prev => ({ ...prev, image: res.data.url }));
        } catch (err) {
            console.error("Upload failed", err);
            setError("Failed to upload primary image");
        } finally {
            setUploadingPrimary(false);
        }
    };

    const handleSecondaryImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setUploadingSecondary(true);
        try {
            const uploadPromises = files.map(async (file) => {
                const formData = new FormData();
                formData.append('file', file);
                const res = await api.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                return res.data.url;
            });

            const urls = await Promise.all(uploadPromises);
            setFormData(prev => ({ 
                ...prev, 
                images: [...prev.images, ...urls] 
            }));
        } catch (err) {
            console.error("Gallery upload failed", err);
            setError("Failed to upload some gallery images");
        } finally {
            setUploadingSecondary(false);
        }
    };

    const handleAddDoctor = () => {
        setFormData(prev => ({
            ...prev,
            doctors: [...prev.doctors, { name: "", specialization: "", timing: "", daysAvailable: [] }]
        }));
    };

    const handleRemoveDoctor = (index: number) => {
        setFormData(prev => ({ ...prev, doctors: prev.doctors.filter((_, i) => i !== index) }));
    };

    const handleDoctorChange = (index: number, field: string, value: any) => {
        setFormData(prev => {
            const newDoctors = [...prev.doctors];
            newDoctors[index] = { ...newDoctors[index], [field]: value };
            return { ...prev, doctors: newDoctors };
        });
    };

    const handleDayToggle = (docIndex: number, day: string) => {
        setFormData(prev => {
            const newDoctors = [...prev.doctors];
            const currentDays = newDoctors[docIndex].daysAvailable;
            if (currentDays.includes(day)) {
                newDoctors[docIndex].daysAvailable = currentDays.filter(d => d !== day);
            } else {
                newDoctors[docIndex].daysAvailable = [...currentDays, day];
            }
            return { ...prev, doctors: newDoctors };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        try {
            const token = getToken();
            const payload = {
                ...formData,
                slug: formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                consultationFee: Number(formData.consultationFee),
                bedCapacity: Number(formData.bedCapacity),
                paymentAmount: Number(formData.paymentAmount) || 0,
                subscriptionDurationDays: 30,
                images: formData.images.filter((img: string) => img.trim() !== ""),
                phoneNumbers: formData.phoneNumbers.filter((ph: string) => ph.trim() !== ""),
            };

            let res;
            if (hospitalToEdit) {
                res = await api.put(`/hospitals/${hospitalToEdit._id}`, payload);
            } else {
                res = await api.post("/admin/hospitals/register", payload);
            }

            if (res.data.credentials) {
                setCredentials(res.data.credentials);
            }
            
            setSuccess(true);
            // Don't auto-close if we have credentials to show
            if (!res.data.credentials) {
                setTimeout(() => {
                    setSuccess(false);
                    if (onClose) onClose();
                }, 2000);
            }
            
        } catch (err: any) {
            setError(err.response?.data?.message || (hospitalToEdit ? "Failed to update hospital" : "Failed to register hospital"));
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center px-5 py-10 text-center sm:p-12">
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-7 w-7" />
                </span>
                <h3 className="mb-1 text-lg font-semibold text-slate-900">{hospitalToEdit ? "Hospital updated!" : "Hospital registered!"}</h3>
                <p className="mb-6 max-w-md text-sm leading-relaxed text-slate-500">
                    {hospitalToEdit
                        ? "The medical facility details have been successfully saved and synchronized."
                        : "The hospital directory has been successfully updated and a welcome kit was triggered."}
                </p>

                {credentials && (
                    <div className="mb-6 w-full max-w-md rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 sm:p-5">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-800">
                            <Lock className="h-4 w-4" /> Credentials generated
                        </div>
                        <div className="space-y-3 text-left">
                            <div>
                                <label className="text-xs font-medium text-slate-500">Username / email</label>
                                <div className="mt-1 break-all rounded-lg border border-slate-200 bg-white p-3 font-mono text-sm text-slate-900">{credentials.username}</div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500">Temporary password</label>
                                <div className="mt-1 select-all rounded-lg border border-slate-200 bg-white p-3 font-mono text-sm tracking-wider text-slate-900">{credentials.temporaryPassword}</div>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    onClick={() => {
                        setSuccess(false);
                        if (onClose) onClose();
                    }}
                    className="ui-btn-dark w-full sm:w-auto"
                >
                    Return to dashboard
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-6">
            {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm font-medium text-rose-700">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                </motion.div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
                {/* Basic Info Section */}
                <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <Building2 className="h-4 w-4 text-slate-400" /> Basic information
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="hospital-name" className="ui-label">Hospital name</label>
                            <input
                                id="hospital-name"
                                required
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. Apollo Hospital"
                                className="ui-input"
                            />
                        </div>

                        <div>
                            <label htmlFor="hospital-email" className="ui-label">Official email (credentials login)</label>
                            <input
                                id="hospital-email"
                                required
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={!!hospitalToEdit}
                                placeholder="admin@hospital.com"
                                className="ui-input"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
                            <div className="col-span-2 md:col-span-1">
                                <label htmlFor="hospital-city" className="ui-label">City</label>
                                <input
                                    id="hospital-city"
                                    required
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    placeholder="Mumbai"
                                    className="ui-input"
                                />
                            </div>
                            <div>
                                <label htmlFor="hospital-fee" className="ui-label">Consultation fee</label>
                                <div className="relative">
                                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
                                    <input
                                        id="hospital-fee"
                                        required
                                        type="number"
                                        name="consultationFee"
                                        value={formData.consultationFee}
                                        onChange={handleChange}
                                        placeholder="500"
                                        className="ui-input pl-8"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="hospital-beds" className="ui-label">Total beds</label>
                                <input
                                    id="hospital-beds"
                                    required
                                    type="number"
                                    name="bedCapacity"
                                    value={formData.bedCapacity}
                                    onChange={handleChange}
                                    placeholder="50"
                                    className="ui-input"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="hospital-address" className="ui-label">Full address</label>
                            <textarea
                                id="hospital-address"
                                required
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                rows={2}
                                placeholder="Street name, landmark..."
                                className="ui-input min-h-[72px] resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                             <div className="flex min-h-[44px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 transition-colors hover:bg-slate-50">
                                <input
                                    type="checkbox"
                                    id="isOpen24Hours"
                                    name="isOpen24Hours"
                                    checked={formData.isOpen24Hours}
                                    onChange={handleChange}
                                    className="h-4 w-4 shrink-0 rounded border-slate-300 accent-blue-600"
                                />
                                <label htmlFor="isOpen24Hours" className="flex flex-1 cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                                    <Clock className="h-4 w-4 text-slate-400" /> Open 24/7
                                </label>
                            </div>
                            <div className="flex min-h-[44px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 transition-colors hover:bg-slate-50">
                                <input
                                    type="checkbox"
                                    id="isOnlinePaymentAvailable"
                                    name="isOnlinePaymentAvailable"
                                    checked={formData.isOnlinePaymentAvailable}
                                    onChange={handleChange}
                                    className="h-4 w-4 shrink-0 rounded border-slate-300 accent-blue-600"
                                />
                                <label htmlFor="isOnlinePaymentAvailable" className="flex flex-1 cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                                    <CreditCard className="h-4 w-4 text-slate-400" /> Online pay
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="ui-label">Subscription plan</label>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { id: 'Standard', price: '2,999', label: 'Clinic', desc: 'Up to 5 doctors · 3,000 WhatsApp messages a month', color: 'blue' },
                                    { id: 'Premium', price: '7,999', label: 'Hospital', desc: 'Up to 25 doctors · 10,000 WhatsApp messages · 500 AI call minutes a month', color: 'purple' },
                                    { id: 'Enterprise', price: '14,999', label: 'Enterprise', desc: 'Unlimited doctors · 25,000 WhatsApp messages · 1,500 AI call minutes a month', color: 'amber' }
                                ].map((p) => (
                                    <div 
                                        key={p.id}
                                        onClick={() => setFormData(prev => ({ ...prev, plan: p.id as any }))}
                                        className={`relative cursor-pointer rounded-xl border p-3.5 transition ${
                                            formData.plan === p.id
                                            ? 'border-blue-500 bg-blue-50/60 ring-4 ring-blue-500/10'
                                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="mb-0.5 flex items-center justify-between gap-3 pr-6">
                                            <span className={`text-sm font-semibold ${formData.plan === p.id ? 'text-blue-700' : 'text-slate-900'}`}>{p.label}</span>
                                            <span className={`text-xs font-semibold ${formData.plan === p.id ? 'text-blue-700' : 'text-slate-500'}`}>₹{p.price}/mo + GST</span>
                                        </div>
                                        <p className="text-xs leading-relaxed text-slate-500">{p.desc}</p>
                                        {formData.plan === p.id && (
                                            <motion.div layoutId="plan-check" className="absolute right-3 top-3.5 text-blue-600">
                                                <CheckCircle2 className="h-4 w-4" />
                                            </motion.div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="hospital-management" className="ui-label">Management mode</label>
                            <select
                                id="hospital-management"
                                name="management_type"
                                value={formData.management_type}
                                onChange={handleChange}
                                className="ui-input"
                            >
                                <option value="SELF">Self managed (hospital controls data)</option>
                                <option value="PILLORA">Pillora managed (view-only for hospital)</option>
                            </select>
                            <p className="ui-hint">Self-managed gives hospitals CRUD access to doctors/slots.</p>
                        </div>
                    </div>
                </div>

                {/* Media & Contacts Section */}
                <div className="space-y-4 border-t border-slate-100 pt-6 lg:border-t-0 lg:pt-0">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <ImageIcon className="h-4 w-4 text-slate-400" /> Media & contacts
                    </h3>

                    <div className="space-y-5">
                        {/* Primary Image Upload */}
                        <div>
                            <label className="ui-label">Primary cover image</label>
                            <div className="group relative">
                                {formData.image ? (
                                    <div className="relative h-48 w-full overflow-hidden rounded-xl border border-slate-200">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={formData.image} alt="Primary" className="h-full w-full object-cover" />
                                        <div className="absolute right-2 top-2 flex items-center gap-2">
                                            <label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-100" aria-label="Replace image">
                                                <Camera className="h-4 w-4" />
                                                <input type="file" className="hidden" accept="image/*" onChange={handlePrimaryImageUpload} />
                                            </label>
                                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, image: "" }))} className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-600 text-white shadow-sm transition-colors hover:bg-rose-700" aria-label="Remove image">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 transition-colors hover:border-blue-300 hover:bg-blue-50/40">
                                        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white">
                                            {uploadingPrimary ? (
                                                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                            ) : (
                                                <Upload className="h-5 w-5 text-slate-400" />
                                            )}
                                        </div>
                                        <p className="text-sm font-medium text-slate-700">Upload primary image</p>
                                        <p className="mt-0.5 text-xs text-slate-500">PNG, JPG up to 10MB</p>
                                        <input type="file" className="hidden" accept="image/*" onChange={handlePrimaryImageUpload} />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Secondary Gallery Upload */}
                        <div>
                            <div className="flex items-center justify-between">
                                <label className="ui-label">Secondary gallery images</label>
                                <span className="mb-1.5 text-xs text-slate-500">{formData.images.length} uploaded</span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                {formData.images.map((url: string, idx: number) => (
                                    <div key={idx} className="relative h-24 overflow-hidden rounded-xl border border-slate-200">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={url} alt={`Gallery ${idx}`} className="h-full w-full object-cover" />
                                        <div className="absolute right-1.5 top-1.5">
                                            <button type="button" onClick={() => handleRemoveListItem('images', idx)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-rose-600 shadow-sm transition-colors hover:bg-white" aria-label="Remove image">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <label className={`flex h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 transition-colors hover:border-blue-300 hover:bg-blue-50/40 ${uploadingSecondary ? 'pointer-events-none' : ''}`}>
                                    {uploadingSecondary ? (
                                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                    ) : (
                                        <>
                                            <Plus className="h-5 w-5 text-slate-400" />
                                            <span className="mt-1 text-xs font-medium text-slate-500">Add more</span>
                                        </>
                                    )}
                                    <input type="file" className="hidden" accept="image/*" multiple onChange={handleSecondaryImagesUpload} />
                                </label>
                            </div>
                        </div>

                        {/* Multiple Phone Numbers */}
                        <div>
                            <div className="flex items-center justify-between">
                                <label className="ui-label">Contact numbers</label>
                                <button type="button" onClick={() => handleAddListItem('phoneNumbers')} className="ui-btn-soft ui-btn-sm mb-1.5" aria-label="Add phone number">
                                    <Plus className="h-3.5 w-3.5" />
                                </button>
                            </div>
                            <div className="space-y-2">
                                <div className="relative">
                                    <input
                                        required
                                        name="contactNumber"
                                        value={formData.contactNumber}
                                        onChange={handleChange}
                                        placeholder="Hospital Phone Number"
                                        aria-label="Hospital phone number"
                                        className="ui-input pr-20"
                                    />
                                    <div className="ui-badge pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 border-blue-200 bg-blue-50 text-blue-700">Phone</div>
                                </div>
                                <div className="relative">
                                    <input
                                        required
                                        name="ambulanceContact"
                                        value={formData.ambulanceContact}
                                        onChange={handleChange}
                                        placeholder="Emergency Number"
                                        aria-label="Emergency number"
                                        className="ui-input pr-20"
                                    />
                                    <div className="ui-badge pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 border-rose-200 bg-rose-50 text-rose-700">SOS</div>
                                </div>
                                {formData.phoneNumbers.map((ph: string, idx: number) => (
                                    <div key={idx} className="flex gap-2">
                                        <input
                                            value={ph}
                                            onChange={(e) => handleListItemChange('phoneNumbers', idx, e.target.value)}
                                            placeholder="Alternate Number"
                                            aria-label="Alternate number"
                                            className="ui-input flex-1"
                                        />
                                        <button type="button" onClick={() => handleRemoveListItem('phoneNumbers', idx)} className="ui-btn-secondary w-11 shrink-0 px-0 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600" aria-label="Remove number">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subscription & Payment Management Section */}
            <div className="space-y-5 border-t border-slate-100 pt-6">
                <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                    <div>
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <CreditCard className="h-4 w-4 text-slate-400" />
                            Hospital subscription & 30-day payment setup
                        </h3>
                        <p className="mt-0.5 text-sm text-slate-500">
                            Each hospital operates on a strict 30-day payment cycle. Slot generation requires an active subscription.
                        </p>
                    </div>
                    <div className="ui-badge self-start border-indigo-200 bg-indigo-50 text-indigo-700 md:self-auto">
                        <Clock className="h-3.5 w-3.5" />
                        30-day cycle
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {/* Joining Date */}
                    <div>
                        <label htmlFor="hospital-joining-date" className="ui-label flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            Hospital joining date <span className="text-rose-500">*</span>
                        </label>
                        <input
                            id="hospital-joining-date"
                            type="date"
                            required
                            name="joiningDate"
                            value={formData.joiningDate}
                            onChange={handleChange}
                            className="ui-input"
                        />
                        <p className="ui-hint">Official onboarding date with Pillora network</p>
                    </div>

                    {/* Subscription Duration */}
                    <div>
                        <label className="ui-label">
                            Subscription duration
                        </label>
                        <div className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700">
                            <span>30 calendar days</span>
                            <span className="ui-badge border-slate-200 bg-slate-100 text-slate-600">Standard</span>
                        </div>
                        <p className="ui-hint">Automatically calculated upon payment confirmation</p>
                    </div>

                    {/* Payment Status Selector */}
                    <div>
                        <label htmlFor="hospital-payment-status" className="ui-label">
                            Initial payment status <span className="text-rose-500">*</span>
                        </label>
                        <select
                            id="hospital-payment-status"
                            name="paymentStatus"
                            value={formData.paymentStatus}
                            onChange={handleChange}
                            className={`ui-input font-medium ${
                                formData.paymentStatus === 'Paid'
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                    : 'border-amber-300 bg-amber-50 text-amber-800'
                            }`}
                        >
                            <option value="Pending">Pending payment (default)</option>
                            <option value="Paid">Payment received (activate 30 days)</option>
                        </select>
                        <p className="ui-hint">
                            {formData.paymentStatus === 'Pending' ? 'Slot generation blocked until confirmed' : 'Activates immediate 30-day cycle'}
                        </p>
                    </div>
                </div>

                {/* Conditional Payment Details if Paid */}
                {formData.paymentStatus === 'Paid' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5"
                    >
                        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                            Confirmed payment details (separate from joining date)
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <label htmlFor="hospital-payment-date" className="ui-label">Payment received date *</label>
                                <input
                                    id="hospital-payment-date"
                                    type="date"
                                    required={formData.paymentStatus === 'Paid'}
                                    name="paymentReceivedDate"
                                    value={formData.paymentReceivedDate}
                                    onChange={handleChange}
                                    className="ui-input"
                                />
                            </div>

                            <div>
                                <label htmlFor="hospital-payment-amount" className="ui-label">Amount (₹) *</label>
                                <input
                                    id="hospital-payment-amount"
                                    type="number"
                                    required={formData.paymentStatus === 'Paid'}
                                    name="paymentAmount"
                                    value={formData.paymentAmount}
                                    onChange={handleChange}
                                    placeholder="5000"
                                    className="ui-input"
                                />
                            </div>

                            <div>
                                <label htmlFor="hospital-payment-method" className="ui-label">Payment method *</label>
                                <select
                                    id="hospital-payment-method"
                                    name="paymentMethod"
                                    value={formData.paymentMethod}
                                    onChange={handleChange}
                                    className="ui-input"
                                >
                                    <option value="UPI">UPI / QR</option>
                                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Card">Credit / Debit Card</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="hospital-payment-ref" className="ui-label">Transaction ref / UTR</label>
                                <input
                                    id="hospital-payment-ref"
                                    type="text"
                                    name="transactionReference"
                                    value={formData.transactionReference}
                                    onChange={handleChange}
                                    placeholder="e.g. UTR12345678"
                                    className="ui-input"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="hospital-admin-notes" className="ui-label">Admin notes / receipt remarks</label>
                            <input
                                id="hospital-admin-notes"
                                type="text"
                                name="adminNotes"
                                value={formData.adminNotes}
                                onChange={handleChange}
                                placeholder="e.g. Initial 30-day subscription payment confirmed via HDFC UPI"
                                className="ui-input"
                            />
                        </div>
                    </motion.div>
                )}

                {/* Status Indicator Summary */}
                <div className={`flex flex-col gap-2 rounded-xl border p-3.5 text-sm sm:flex-row sm:items-center sm:justify-between ${
                    formData.paymentStatus === 'Paid'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-amber-200 bg-amber-50 text-amber-800'
                }`}>
                    <div className="flex items-start gap-2">
                        {formData.paymentStatus === 'Paid' ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        ) : (
                            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        )}
                        <span className="leading-relaxed">
                            {formData.paymentStatus === 'Paid'
                                ? 'Subscription Status will be Active: Hospital can immediately generate & publish appointment slots.'
                                : 'Subscription Status will be Pending Payment: Hospital slot generation will be locked until payment is recorded.'}
                        </span>
                    </div>
                    <span className={`ui-badge self-start bg-white sm:self-auto ${formData.paymentStatus === 'Paid' ? 'border-emerald-200 text-emerald-700' : 'border-amber-200 text-amber-700'}`}>
                        {formData.paymentStatus === 'Paid' ? 'Active (30 days)' : 'Pending payment'}
                    </span>
                </div>
            </div>

            {/* About Hospital */}
            <div className="space-y-4 border-t border-slate-100 pt-6">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <FileText className="h-4 w-4 text-slate-400" /> About
                </h3>
                <div>
                <label htmlFor="hospital-description" className="ui-label">About hospital (description)</label>
                <textarea
                    id="hospital-description"
                    required
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Write detailed information about the hospital, its history, specialties, and equipment..."
                    rows={4}
                    className="ui-input min-h-[120px] resize-y"
                />
                </div>
            </div>

            {/* Available Doctors Section */}
            {!hospitalToEdit && (
                <div className="space-y-4 border-t border-slate-100 pt-6">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <User className="h-4 w-4 text-slate-400" /> Available doctors
                        </h3>
                        <button
                            type="button"
                            onClick={handleAddDoctor}
                            className="ui-btn-secondary"
                        >
                            <Plus className="h-4 w-4" /> Add doctor
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                        <AnimatePresence>
                            {formData.doctors.map((doc, docIdx) => (
                                <motion.div
                                    key={docIdx}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="relative space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                                >
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveDoctor(docIdx)}
                                        className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                        aria-label="Remove doctor"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>

                                    <div className="space-y-3">
                                        <div className="flex gap-3 pr-10">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white">
                                                <User className="h-5 w-5 text-slate-400" />
                                            </div>
                                            <div className="min-w-0 flex-1 space-y-2">
                                                <input
                                                    required
                                                    value={doc.name}
                                                    onChange={(e) => handleDoctorChange(docIdx, 'name', e.target.value)}
                                                    placeholder="Doctor's Name"
                                                    aria-label="Doctor's name"
                                                    className="ui-input"
                                                />
                                                <div className="relative">
                                                    <GraduationCap className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        required
                                                        value={doc.specialization}
                                                        onChange={(e) => handleDoctorChange(docIdx, 'specialization', e.target.value)}
                                                        placeholder="Degree / Specialization"
                                                        aria-label="Degree or specialization"
                                                        className="ui-input pl-10"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="ui-label flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5 text-slate-400" /> Timing
                                            </div>
                                            <input
                                                required
                                                value={doc.timing}
                                                onChange={(e) => handleDoctorChange(docIdx, 'timing', e.target.value)}
                                                placeholder="e.g. 10:00 AM - 04:00 PM"
                                                aria-label="Timing"
                                                className="ui-input"
                                            />
                                        </div>

                                        <div>
                                            <div className="ui-label flex items-center gap-1.5">
                                                <Calendar className="h-3.5 w-3.5 text-slate-400" /> Available days
                                            </div>
                                            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7" role="group" aria-label="Available days">
                                                {DAYS.map(day => (
                                                    <button
                                                        type="button"
                                                        key={day}
                                                        onClick={() => handleDayToggle(docIdx, day)}
                                                        aria-pressed={doc.daysAvailable.includes(day)}
                                                        aria-label={day}
                                                        className={`min-h-[40px] rounded-lg border text-xs font-semibold transition-colors ${
                                                            doc.daysAvailable.includes(day)
                                                                ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                                                                : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700'
                                                        }`}
                                                    >
                                                        {day.slice(0, 3)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end sm:gap-3">
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="ui-btn-secondary w-full sm:w-auto"
                    >
                        Discard
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="ui-btn-primary w-full min-w-[160px] sm:w-auto"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (hospitalToEdit ? "Update hospital" : "Publish hospital")}
                </button>
            </div>
        </form>
    );
}
