"use client";

import { useState } from "react";
import api from "@/lib/api";
import { getToken } from "@/lib/tokenStorage";
import { Building2, MapPin, Phone, IndianRupee, Clock, FileText, Loader2, CheckCircle2, CreditCard, User, GraduationCap, Calendar, Plus, Trash2, Image as ImageIcon, XCircle, Lock, Upload, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function AddHospitalForm({ onClose }: { onClose?: () => void }) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [uploadingPrimary, setUploadingPrimary] = useState(false);
    const [uploadingSecondary, setUploadingSecondary] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        city: "",
        address: "",
        consultationFee: "",
        ambulanceContact: "",
        description: "",
        isOpen24Hours: false,
        isOnlinePaymentAvailable: false,
        management_type: "SELF" as "SELF" | "PILLORA",
        image: "", // Main image
        images: [] as string[],
        phoneNumbers: [] as string[],
        plan: "Standard" as "Standard" | "Premium" | "Enterprise",
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
        setFormData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
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
                images: formData.images.filter(img => img.trim() !== ""),
                phoneNumbers: formData.phoneNumbers.filter(ph => ph.trim() !== ""),
            };

            const res = await api.post("/admin/hospitals/register", payload);

            
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
            setError(err.response?.data?.message || "Failed to add hospital");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center bg-emerald-50 rounded-2xl border border-emerald-100">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Hospital Registered!</h3>
                <p className="text-gray-600 mb-8">The hospital directory has been successfully updated and a welcome kit was triggered.</p>
                
                {credentials && (
                    <div className="w-full max-w-md bg-white p-6 rounded-2xl border border-emerald-200 shadow-xl shadow-emerald-900/5 mb-8">
                        <div className="flex items-center gap-2 text-emerald-600 font-bold mb-4 uppercase tracking-wider text-xs">
                            <Lock className="w-4 h-4" /> Credentials Generated
                        </div>
                        <div className="space-y-4 text-left">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase">Username / Email</label>
                                <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg font-mono text-sm break-all">{credentials.username}</div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase">Temporary Password</label>
                                <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg font-mono text-sm tracking-wider select-all">{credentials.temporaryPassword}</div>
                            </div>
                        </div>
                    </div>
                )}
                
                <button 
                    onClick={() => {
                        setSuccess(false);
                        if (onClose) onClose();
                    }}
                    className="px-10 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-xl shadow-gray-900/20"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 md:p-8 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900">Hospital Details</h2>
                    <p className="text-sm text-gray-500 font-medium">Provide comprehensive facility information</p>
                </div>
            </div>

            {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-bold flex items-center gap-2">
                    <XCircle className="w-5 h-5" /> {error}
                </motion.div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Basic Info Section */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" /> Basic Information
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-wider">Hospital Name</label>
                            <input
                                required
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. Apollo Hospital"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium text-gray-900"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-wider">Official Email (for credentials)</label>
                            <input
                                required
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="admin@hospital.com"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium text-gray-900"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-wider">City</label>
                                <input
                                    required
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    placeholder="Mumbai"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium text-gray-900"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-wider">Consultation Fee</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 text-gray-400 font-bold text-sm">₹</span>
                                    <input
                                        required
                                        type="number"
                                        name="consultationFee"
                                        value={formData.consultationFee}
                                        onChange={handleChange}
                                        placeholder="500"
                                        className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium text-gray-900"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-wider">Full Address</label>
                            <textarea
                                required
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                rows={2}
                                placeholder="Street name, landmark..."
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium resize-none text-gray-900"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div className="flex items-center gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors">
                                <input
                                    type="checkbox"
                                    id="isOpen24Hours"
                                    name="isOpen24Hours"
                                    checked={formData.isOpen24Hours}
                                    onChange={handleChange}
                                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor="isOpen24Hours" className="text-sm font-bold text-gray-700 cursor-pointer flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Open 24/7
                                </label>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors">
                                <input
                                    type="checkbox"
                                    id="isOnlinePaymentAvailable"
                                    name="isOnlinePaymentAvailable"
                                    checked={formData.isOnlinePaymentAvailable}
                                    onChange={handleChange}
                                    className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <label htmlFor="isOnlinePaymentAvailable" className="text-sm font-bold text-gray-700 cursor-pointer flex items-center gap-2">
                                    <CreditCard className="w-4 h-4" /> Online Pay
                                </label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-wider">Subscription Plan</label>
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { id: 'Standard', price: '2,000', label: 'Standard Listing', desc: 'Small Clinics, Individual Doctors', color: 'blue' },
                                    { id: 'Premium', price: '5,000', label: 'Premium Feature', desc: 'Mid-Size & Multi-specialist', color: 'purple' },
                                    { id: 'Enterprise', price: '10,000', label: 'Enterprise Feature', desc: 'Large Hospital Chains', color: 'amber' }
                                ].map((p) => (
                                    <div 
                                        key={p.id}
                                        onClick={() => setFormData(prev => ({ ...prev, plan: p.id as any }))}
                                        className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer group ${
                                            formData.plan === p.id 
                                            ? `border-${p.color}-500 bg-${p.color}-50/50 shadow-lg shadow-${p.color}-900/5` 
                                            : 'border-gray-100 hover:border-gray-200 bg-white'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-sm font-black uppercase tracking-wider ${formData.plan === p.id ? `text-${p.color}-600` : 'text-gray-900'}`}>{p.label}</span>
                                            <span className={`text-xs font-black ${formData.plan === p.id ? `text-${p.color}-700` : 'text-gray-400'}`}>₹{p.price}/mo</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-medium">{p.desc}</p>
                                        {formData.plan === p.id && (
                                            <motion.div layoutId="plan-check" className={`absolute -top-2 -right-2 w-6 h-6 bg-${p.color}-500 text-white rounded-full flex items-center justify-center shadow-lg`}>
                                                <CheckCircle2 className="w-4 h-4" />
                                            </motion.div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-wider">Management Mode</label>
                            <select
                                name="management_type"
                                value={formData.management_type}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-900 text-white border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold"
                            >
                                <option value="SELF">Self Managed (Hospital Controls Data)</option>
                                <option value="PILLORA">Pillora Managed (View-Only for Hospital)</option>
                            </select>
                            <p className="text-[10px] text-gray-400 font-medium">Self-Managed gives hospitals CRUD access to doctors/slots.</p>
                        </div>
                    </div>
                </div>

                {/* Media & Contacts Section */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-purple-500" /> Media & Contacts
                    </h3>
                    
                    <div className="space-y-4">
                        {/* Primary Image Upload */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-wider">Primary Cover Image</label>
                            <div className="relative group">
                                {formData.image ? (
                                    <div className="relative h-48 w-full rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={formData.image} alt="Primary" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                            <label className="p-3 bg-white text-gray-900 rounded-full cursor-pointer hover:scale-110 transition-transform">
                                                <Camera className="w-5 h-5" />
                                                <input type="file" className="hidden" accept="image/*" onChange={handlePrimaryImageUpload} />
                                            </label>
                                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, image: "" }))} className="p-3 bg-red-500 text-white rounded-full hover:scale-110 transition-transform">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center h-48 w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-blue-50/50 hover:border-primary/50 transition-all group">
                                        <div className="p-4 bg-white rounded-2xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                            {uploadingPrimary ? (
                                                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                            ) : (
                                                <Upload className="w-6 h-6 text-gray-400 group-hover:text-primary" />
                                            )}
                                        </div>
                                        <p className="text-xs font-bold text-gray-500 group-hover:text-primary">Upload Primary Image</p>
                                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-black">PNG, JPG up to 10MB</p>
                                        <input type="file" className="hidden" accept="image/*" onChange={handlePrimaryImageUpload} />
                                    </label>
                                )}
                            </div>
                        </div>
                        
                        {/* Secondary Gallery Upload */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-wider">Secondary Gallery Images</label>
                                <span className="text-[10px] font-bold text-slate-400">{formData.images.length} uploaded</span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3">
                                {formData.images.map((url, idx) => (
                                    <div key={idx} className="relative h-24 rounded-xl overflow-hidden group border border-gray-100">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button type="button" onClick={() => handleRemoveListItem('images', idx)} className="p-1.5 bg-red-500 text-white rounded-lg hover:scale-110 transition-transform">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                
                                <label className={`flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 cursor-pointer hover:border-primary/30 hover:bg-blue-50/30 transition-all ${uploadingSecondary ? 'pointer-events-none' : ''}`}>
                                    {uploadingSecondary ? (
                                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                    ) : (
                                        <>
                                            <Plus className="w-5 h-5 text-gray-300" />
                                            <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Add More</span>
                                        </>
                                    )}
                                    <input type="file" className="hidden" accept="image/*" multiple onChange={handleSecondaryImagesUpload} />
                                </label>
                            </div>
                        </div>

                        {/* Multiple Phone Numbers */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-wider">Contact Numbers</label>
                                <button type="button" onClick={() => handleAddListItem('phoneNumbers')} className="text-primary hover:text-primary/80 transition-colors">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                <div className="flex gap-2">
                                    <input
                                        required
                                        name="ambulanceContact"
                                        value={formData.ambulanceContact}
                                        onChange={handleChange}
                                        placeholder="Emergency Number"
                                        className="flex-1 px-3 py-2 bg-rose-50 border border-rose-100 rounded-lg text-sm font-bold text-rose-700 outline-none"
                                    />
                                    <div className="px-3 py-2 bg-rose-100 text-rose-600 rounded-lg text-[10px] font-black uppercase flex items-center">SOS</div>
                                </div>
                                {formData.phoneNumbers.map((ph, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <input
                                            value={ph}
                                            onChange={(e) => handleListItemChange('phoneNumbers', idx, e.target.value)}
                                            placeholder="Alternate Number"
                                            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:border-primary text-gray-900"
                                        />
                                        <button type="button" onClick={() => handleRemoveListItem('phoneNumbers', idx)} className="text-red-400 hover:text-red-600">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* About Hospital */}
            <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider">About Hospital (Description)</label>
                <textarea
                    required
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Write detailed information about the hospital, its history, specialties, and equipment..."
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium resize-none text-gray-900"
                />
            </div>

            {/* Available Doctors Section */}
            <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-500" /> Available Doctors
                    </h3>
                    <button
                        type="button"
                        onClick={handleAddDoctor}
                        className="flex items-center gap-1 text-sm font-bold text-primary bg-primary/5 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-all"
                    >
                        <Plus className="w-4 h-4" /> Add Doctor
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    <AnimatePresence>
                        {formData.doctors.map((doc, docIdx) => (
                            <motion.div
                                key={docIdx}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="p-5 bg-gray-50 border border-gray-200 rounded-[1.5rem] space-y-4 relative group"
                            >
                                <button
                                    type="button"
                                    onClick={() => handleRemoveDoctor(docIdx)}
                                    className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>

                                <div className="space-y-3">
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center shrink-0">
                                            <User className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <input
                                                required
                                                value={doc.name}
                                                onChange={(e) => handleDoctorChange(docIdx, 'name', e.target.value)}
                                                placeholder="Doctor's Name"
                                                className="w-full bg-transparent border-b border-gray-200 focus:border-primary outline-none font-bold text-gray-800"
                                            />
                                            <div className="flex items-center gap-1 text-xs text-primary font-bold">
                                                <GraduationCap className="w-3 h-3" />
                                                <input
                                                    required
                                                    value={doc.specialization}
                                                    onChange={(e) => handleDoctorChange(docIdx, 'specialization', e.target.value)}
                                                    placeholder="Degree / Specialization"
                                                    className="bg-transparent outline-none w-full"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                                            <Clock className="w-3 h-3" /> Timing
                                        </div>
                                        <input
                                            required
                                            value={doc.timing}
                                            onChange={(e) => handleDoctorChange(docIdx, 'timing', e.target.value)}
                                            placeholder="e.g. 10:00 AM - 04:00 PM"
                                            className="w-full px-3 py-2 bg-white border border-gray-100 rounded-lg text-sm font-medium outline-none focus:border-primary text-gray-900"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                                            <Calendar className="w-3 h-3" /> Available Days
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {DAYS.map(day => (
                                                <button
                                                    type="button"
                                                    key={day}
                                                    onClick={() => handleDayToggle(docIdx, day)}
                                                    className={`px-2 py-1 text-[10px] font-black rounded-md border transition-all ${
                                                        doc.daysAvailable.includes(day)
                                                            ? 'bg-primary border-primary text-white shadow-sm'
                                                            : 'bg-white border-gray-200 text-gray-400 hover:border-primary/30'
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

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-8 py-3 font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
                    >
                        Discard
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-10 py-3 font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Publish Hospital"}
                </button>
            </div>
        </form>
    );
}
