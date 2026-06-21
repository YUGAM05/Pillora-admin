"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Plus, 
    Edit2, 
    Trash2, 
    X, 
    Loader2, 
    Save, 
    Heart, 
    Image as ImageIcon, 
    Video as VideoIcon, 
    Link2, 
    Calendar, 
    Upload, 
    Play, 
    ExternalLink 
} from "lucide-react";
import api from "@/lib/api";
import { getToken } from "@/lib/tokenStorage";

interface HealthTip {
    _id: string;
    title: string;
    description: string;
    date: string;
    mediaType?: 'image' | 'video' | 'url';
    imageUrl?: string;
    videoUrl?: string;
    linkUrl?: string;
    createdAt?: string;
}

export default function HealthHubAdmin() {
    const [tips, setTips] = useState<HealthTip[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        mediaType: "image" as "image" | "video" | "url",
        imageUrl: "",
        videoUrl: "",
        linkUrl: "",
        date: ""
    });

    useEffect(() => {
        fetchTips();
    }, []);

    const fetchTips = async () => {
        try {
            const res = await api.get("/health-hub");
            setTips(res.data);
        } catch (error) {
            console.error("Failed to fetch health tips", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMediaTypeChange = (type: "image" | "video" | "url") => {
        setFormData(prev => ({ ...prev, mediaType: type }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'imageUrl' | 'videoUrl') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const uploadData = new FormData();
            uploadData.append('file', file);
            const res = await api.post('/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData(prev => ({ ...prev, [field]: res.data.url }));
        } catch (err) {
            console.error("Media upload failed", err);
            alert("Failed to upload media file. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleEdit = (tip: HealthTip) => {
        setFormData({
            title: tip.title,
            description: tip.description,
            mediaType: tip.mediaType || "image",
            imageUrl: tip.imageUrl || "",
            videoUrl: tip.videoUrl || "",
            linkUrl: tip.linkUrl || "",
            date: tip.date ? new Date(tip.date).toISOString().split('T')[0] : ""
        });
        setEditingId(tip._id);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this health tip?")) return;
        try {
            const token = getToken();
            await api.delete(`/health-hub/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchTips();
        } catch (error) {
            console.error("Failed to delete health tip", error);
            alert("Failed to delete health tip");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = getToken();
            const headers = { Authorization: `Bearer ${token}` };

            const payload = {
                ...formData,
                date: formData.date ? new Date(formData.date) : new Date()
            };

            if (editingId) {
                await api.put(`/health-hub/${editingId}`, payload, { headers });
            } else {
                await api.post("/health-hub", payload, { headers });
            }

            setFormData({
                title: "", 
                description: "", 
                mediaType: "image", 
                imageUrl: "", 
                videoUrl: "", 
                linkUrl: "", 
                date: ""
            });
            setEditingId(null);
            setIsFormOpen(false);
            fetchTips();
        } catch (error) {
            console.error("Failed to save health tip", error);
            alert("Failed to save health tip");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 font-inter">
            {/* Header section */}
            <div className="flex justify-between items-center bg-white p-8 rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center">
                        <Heart className="w-7 h-7 text-rose-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 font-jakarta">Health Hub Management</h2>
                        <p className="text-slate-500 text-sm font-medium">Create and manage daily wellness articles, videos, and external resource links</p>
                    </div>
                </div>
                {!isFormOpen && (
                    <button
                        onClick={() => {
                            setFormData({ title: "", description: "", mediaType: "image", imageUrl: "", videoUrl: "", linkUrl: "", date: "" });
                            setEditingId(null);
                            setIsFormOpen(true);
                        }}
                        className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-rose-600/30 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Create Tip
                    </button>
                )}
            </div>

            {/* Form section */}
            <AnimatePresence mode="wait">
                {isFormOpen ? (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Health Tip' : 'New Health Tip'}</h3>
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Title</label>
                                    <input required name="title" value={formData.title} onChange={handleInputChange} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500/20 font-bold text-slate-900 outline-none transition-all" placeholder="Enter health tip title" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Content / Description</label>
                                    <textarea required name="description" value={formData.description} onChange={handleInputChange} rows={6} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500/20 font-medium text-slate-900 outline-none transition-all resize-none" placeholder="Provide wellness advice, detailed guidelines, or context..." />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Choose Media Format</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { id: 'image', label: 'Image post', icon: ImageIcon, desc: 'Cover image upload', color: 'blue' },
                                            { id: 'video', label: 'Video Clip', icon: VideoIcon, desc: 'Short video upload', color: 'rose' },
                                            { id: 'url', label: 'External URL', icon: Link2, desc: 'Link to other resources', color: 'emerald' }
                                        ].map((format) => (
                                            <button
                                                type="button"
                                                key={format.id}
                                                onClick={() => handleMediaTypeChange(format.id as any)}
                                                className={`p-5 rounded-2xl border-2 text-left transition-all ${
                                                    formData.mediaType === format.id 
                                                    ? `border-${format.color}-500 bg-${format.color}-50/30` 
                                                    : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                                                }`}
                                            >
                                                <format.icon className={`w-6 h-6 mb-2 ${formData.mediaType === format.id ? `text-${format.color}-500` : 'text-slate-400'}`} />
                                                <p className="font-bold text-slate-900 text-sm">{format.label}</p>
                                                <p className="text-xs text-slate-400 mt-1 font-medium">{format.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Dynamic media upload inputs */}
                                <div className="md:col-span-2">
                                    {formData.mediaType === 'image' && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Upload Cover Image</label>
                                            {formData.imageUrl ? (
                                                <div className="relative h-64 w-full rounded-2xl overflow-hidden border border-slate-200 group">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={formData.imageUrl} alt="Uploaded Tip Cover" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, imageUrl: "" }))} className="px-5 py-2.5 bg-rose-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/30">
                                                            Remove Image
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <label className="flex flex-col items-center justify-center h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-rose-50/30 hover:border-rose-500/50 transition-all group">
                                                    <div className="p-4 bg-white rounded-2xl shadow-sm mb-3">
                                                        {uploading ? (
                                                            <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
                                                        ) : (
                                                            <Upload className="w-6 h-6 text-slate-400 group-hover:text-rose-500 transition-colors" />
                                                        )}
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-500 group-hover:text-rose-500 transition-colors">Select Image File</p>
                                                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-black">PNG, JPG, WEBP</p>
                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'imageUrl')} />
                                                </label>
                                            )}
                                        </div>
                                    )}

                                    {formData.mediaType === 'video' && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Upload Video Clip</label>
                                            {formData.videoUrl ? (
                                                <div className="relative rounded-2xl overflow-hidden border border-slate-200 group bg-slate-900">
                                                    <video src={formData.videoUrl} controls className="w-full max-h-96 object-contain" />
                                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, videoUrl: "" }))} className="px-4 py-2 bg-rose-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-colors shadow-lg">
                                                            Remove Video
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <label className="flex flex-col items-center justify-center h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-rose-50/30 hover:border-rose-500/50 transition-all group">
                                                    <div className="p-4 bg-white rounded-2xl shadow-sm mb-3">
                                                        {uploading ? (
                                                            <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
                                                        ) : (
                                                            <Upload className="w-6 h-6 text-slate-400 group-hover:text-rose-500 transition-colors" />
                                                        )}
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-500 group-hover:text-rose-500 transition-colors">Select Video File</p>
                                                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-black">MP4, WEBM, MOV</p>
                                                    <input type="file" className="hidden" accept="video/*" onChange={(e) => handleFileUpload(e, 'videoUrl')} />
                                                </label>
                                            )}
                                        </div>
                                    )}

                                    {formData.mediaType === 'url' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">External Article/Video URL</label>
                                                <div className="relative">
                                                    <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                    <input required name="linkUrl" value={formData.linkUrl} onChange={handleInputChange} className="w-full pl-12 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500/20 font-medium text-slate-900 outline-none transition-all" placeholder="https://example.com/wellness-article" />
                                                </div>
                                            </div>

                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Optional Thumbnail Cover Image</label>
                                                {formData.imageUrl ? (
                                                    <div className="relative h-40 w-full rounded-2xl overflow-hidden border border-slate-200 group">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={formData.imageUrl} alt="Thumbnail Cover" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, imageUrl: "" }))} className="px-4 py-2 bg-rose-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-rose-700 shadow-lg">
                                                                Remove Thumbnail
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <label className="flex flex-col items-center justify-center h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-rose-50/30 hover:border-rose-500/50 transition-all group">
                                                        <div className="p-2 bg-white rounded-xl shadow-sm mb-2">
                                                            {uploading ? (
                                                                <Loader2 className="w-5 h-5 text-rose-500 animate-spin" />
                                                            ) : (
                                                                <Upload className="w-5 h-5 text-slate-400 group-hover:text-rose-500 transition-colors" />
                                                            )}
                                                        </div>
                                                        <p className="text-xs font-bold text-slate-500 group-hover:text-rose-500">Upload Thumbnail</p>
                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'imageUrl')} />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Publish Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full pl-12 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500/20 font-bold text-slate-900 outline-none transition-all" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex justify-end pt-6 border-t border-slate-100">
                                <button type="submit" disabled={loading || uploading} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-slate-900/20 transition-all active:scale-95 disabled:opacity-75">
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    {editingId ? 'Update Tip' : 'Publish Tip'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                    >
                        {loading ? (
                            <div className="col-span-full py-20 flex justify-center">
                                <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
                            </div>
                        ) : tips.length === 0 ? (
                            <div className="col-span-full py-20 bg-white rounded-3xl border border-slate-100 flex flex-col items-center justify-center text-center">
                                <Heart className="w-16 h-16 text-slate-200 mb-4" />
                                <h3 className="text-xl font-bold text-slate-900 font-jakarta">No Content Found</h3>
                                <p className="text-slate-500 mt-2">Get started by creating your first health hub tip.</p>
                            </div>
                        ) : (
                            tips.map(tip => (
                                <div key={tip._id} className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-rose-900/10 transition-all duration-300 group flex flex-col">
                                    <div className="relative h-48 overflow-hidden bg-slate-100 flex items-center justify-center">
                                        {tip.mediaType === 'video' && tip.videoUrl ? (
                                            <div className="relative w-full h-full bg-black flex items-center justify-center">
                                                <video src={tip.videoUrl} className="w-full h-full object-cover opacity-75" preload="metadata" muted />
                                                <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                                                    <div className="w-12 h-12 bg-white/25 hover:bg-white/45 backdrop-blur-md rounded-full flex items-center justify-center transition-colors">
                                                        <Play className="w-6 h-6 text-white fill-current" />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : tip.imageUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={tip.imageUrl} alt={tip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-slate-300">
                                                <Heart className="w-12 h-12 text-rose-200" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Wellness Tip</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex items-center justify-between mb-4">
                                            {tip.mediaType === 'video' ? (
                                                <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-1">
                                                    <VideoIcon className="w-3 h-3" /> Video Clip
                                                </span>
                                            ) : tip.mediaType === 'url' ? (
                                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-1">
                                                    <Link2 className="w-3 h-3" /> External Link
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-1">
                                                    <ImageIcon className="w-3 h-3" /> Image Post
                                                </span>
                                            )}
                                            <span className="text-xs text-slate-400 font-medium">{new Date(tip.date || tip.createdAt || '').toLocaleDateString()}</span>
                                        </div>
                                        
                                        <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2 leading-tight group-hover:text-rose-500 transition-colors">{tip.title}</h3>
                                        <p className="text-sm text-slate-500 mb-6 line-clamp-3 flex-1">{tip.description}</p>
                                        
                                        {tip.mediaType === 'url' && tip.linkUrl && (
                                            <a href={tip.linkUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-600 font-medium mb-4 transition-colors">
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                <span className="truncate max-w-[200px]">{tip.linkUrl}</span>
                                            </a>
                                        )}

                                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between mt-auto">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleEdit(tip)} className="w-10 h-10 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-500 rounded-xl flex items-center justify-center transition-colors">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(tip._id)} className="w-10 h-10 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-500 rounded-xl flex items-center justify-center transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Health Hub</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
