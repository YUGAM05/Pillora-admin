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
        <div className="space-y-4">
            {/* Header section */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                        <Heart className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="ui-title">Health Hub management</h2>
                        <p className="ui-subtitle">Create and manage daily wellness articles, videos, and external resource links</p>
                    </div>
                </div>
                {!isFormOpen && (
                    <button
                        onClick={() => {
                            setFormData({ title: "", description: "", mediaType: "image", imageUrl: "", videoUrl: "", linkUrl: "", date: "" });
                            setEditingId(null);
                            setIsFormOpen(true);
                        }}
                        className="ui-btn-primary w-full sm:w-auto sm:shrink-0"
                    >
                        <Plus className="h-4 w-4" />
                        Create tip
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
                        className="ui-card overflow-hidden"
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
                            <h3 className="ui-title">{editingId ? 'Edit health tip' : 'New health tip'}</h3>
                            <button
                                onClick={() => setIsFormOpen(false)}
                                aria-label="Close editor"
                                className="-mr-2 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 gap-5 p-5 sm:p-6 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <label htmlFor="tip-title" className="ui-label">Title</label>
                                    <input id="tip-title" required name="title" value={formData.title} onChange={handleInputChange} className="ui-input" placeholder="Enter health tip title" />
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="tip-description" className="ui-label">Content / description</label>
                                    <textarea id="tip-description" required name="description" value={formData.description} onChange={handleInputChange} rows={6} className="ui-input min-h-[144px] resize-y" placeholder="Provide wellness advice, detailed guidelines, or context..." />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="ui-label">Choose media format</label>
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                                        {[
                                            { id: 'image', label: 'Image post', icon: ImageIcon, desc: 'Cover image upload', color: 'blue' },
                                            { id: 'video', label: 'Video clip', icon: VideoIcon, desc: 'Short video upload', color: 'rose' },
                                            { id: 'url', label: 'External URL', icon: Link2, desc: 'Link to other resources', color: 'emerald' }
                                        ].map((format) => (
                                            <button
                                                type="button"
                                                key={format.id}
                                                onClick={() => handleMediaTypeChange(format.id as any)}
                                                aria-pressed={formData.mediaType === format.id}
                                                className={`rounded-xl border p-3.5 text-left transition sm:p-4 ${
                                                    formData.mediaType === format.id
                                                    ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-500/10'
                                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                                }`}
                                            >
                                                <format.icon className={`mb-2 h-5 w-5 ${formData.mediaType === format.id ? 'text-blue-600' : 'text-slate-400'}`} />
                                                <p className="text-sm font-semibold text-slate-900">{format.label}</p>
                                                <p className="mt-0.5 text-xs text-slate-500">{format.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Dynamic media upload inputs */}
                                <div className="md:col-span-2">
                                    {formData.mediaType === 'image' && (
                                        <div>
                                            <label className="ui-label">Upload cover image</label>
                                            {formData.imageUrl ? (
                                                <div className="relative h-56 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:h-64">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={formData.imageUrl} alt="Uploaded Tip Cover" className="h-full w-full object-cover" />
                                                    <div className="absolute right-3 top-3">
                                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, imageUrl: "" }))} className="ui-btn-secondary text-rose-600 hover:text-rose-700">
                                                            Remove image
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <label className="group relative flex h-44 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center transition hover:border-blue-400 hover:bg-blue-50/40 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
                                                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                                                        {uploading ? (
                                                            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                                        ) : (
                                                            <Upload className="h-5 w-5 text-slate-400 transition-colors group-hover:text-blue-600" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-700 transition-colors group-hover:text-blue-700">Select image file</p>
                                                    <p className="mt-1 text-xs text-slate-500">PNG, JPG, WEBP</p>
                                                    <input type="file" className="sr-only" accept="image/*" onChange={(e) => handleFileUpload(e, 'imageUrl')} />
                                                </label>
                                            )}
                                        </div>
                                    )}

                                    {formData.mediaType === 'video' && (
                                        <div>
                                            <label className="ui-label">Upload video clip</label>
                                            {formData.videoUrl ? (
                                                <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
                                                    <video src={formData.videoUrl} controls className="max-h-96 w-full object-contain" />
                                                    <div className="absolute right-3 top-3">
                                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, videoUrl: "" }))} className="ui-btn-secondary text-rose-600 hover:text-rose-700">
                                                            Remove video
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <label className="group relative flex h-44 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center transition hover:border-blue-400 hover:bg-blue-50/40 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
                                                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                                                        {uploading ? (
                                                            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                                        ) : (
                                                            <Upload className="h-5 w-5 text-slate-400 transition-colors group-hover:text-blue-600" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-700 transition-colors group-hover:text-blue-700">Select video file</p>
                                                    <p className="mt-1 text-xs text-slate-500">MP4, WEBM, MOV</p>
                                                    <input type="file" className="sr-only" accept="video/*" onChange={(e) => handleFileUpload(e, 'videoUrl')} />
                                                </label>
                                            )}
                                        </div>
                                    )}

                                    {formData.mediaType === 'url' && (
                                        <div className="grid grid-cols-1 gap-5">
                                            <div className="min-w-0">
                                                <label htmlFor="tip-link-url" className="ui-label">External article/video URL</label>
                                                <div className="relative">
                                                    <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                    <input id="tip-link-url" required name="linkUrl" value={formData.linkUrl} onChange={handleInputChange} className="ui-input pl-10" placeholder="https://example.com/wellness-article" />
                                                </div>
                                            </div>

                                            <div className="min-w-0">
                                                <label className="ui-label">Optional thumbnail cover image</label>
                                                {formData.imageUrl ? (
                                                    <div className="relative h-40 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={formData.imageUrl} alt="Thumbnail Cover" className="h-full w-full object-cover" />
                                                        <div className="absolute right-3 top-3">
                                                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, imageUrl: "" }))} className="ui-btn-secondary text-rose-600 hover:text-rose-700">
                                                                Remove thumbnail
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <label className="group relative flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center transition hover:border-blue-400 hover:bg-blue-50/40 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
                                                        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                                                            {uploading ? (
                                                                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                                            ) : (
                                                                <Upload className="h-4 w-4 text-slate-400 transition-colors group-hover:text-blue-600" />
                                                            )}
                                                        </div>
                                                        <p className="text-sm font-medium text-slate-700 group-hover:text-blue-700">Upload thumbnail</p>
                                                        <input type="file" className="sr-only" accept="image/*" onChange={(e) => handleFileUpload(e, 'imageUrl')} />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="tip-date" className="ui-label">Publish date</label>
                                    <div className="relative">
                                        <Calendar className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input id="tip-date" type="date" name="date" value={formData.date} onChange={handleInputChange} className="ui-input pl-10" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
                                <button type="submit" disabled={loading || uploading} className="ui-btn-primary w-full sm:w-auto">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    {editingId ? 'Update tip' : 'Publish tip'}
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
                        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
                    >
                        {loading ? (
                            <div role="status" aria-label="Loading health tips" className="ui-card col-span-full flex justify-center py-16">
                                <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
                            </div>
                        ) : tips.length === 0 ? (
                            <div className="ui-empty col-span-full bg-white py-16">
                                <Heart className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                                <h3 className="font-medium text-slate-700">No content found</h3>
                                <p className="mt-1">Get started by creating your first health hub tip.</p>
                            </div>
                        ) : (
                            tips.map(tip => (
                                <div key={tip._id} className="ui-card flex flex-col overflow-hidden">
                                    <div className="relative flex h-44 items-center justify-center overflow-hidden border-b border-slate-100 bg-slate-100">
                                        {tip.mediaType === 'video' && tip.videoUrl ? (
                                            <div className="relative flex h-full w-full items-center justify-center bg-slate-900">
                                                <video src={tip.videoUrl} className="h-full w-full object-cover opacity-75" preload="metadata" muted />
                                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30">
                                                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-sm">
                                                        <Play className="ml-0.5 h-5 w-5 fill-current text-slate-900" />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : tip.imageUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={tip.imageUrl} alt={tip.title} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <Heart className="h-9 w-9 text-slate-300" />
                                                <span className="text-xs font-medium text-slate-500">Wellness tip</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-1 flex-col p-4 sm:p-5">
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            {tip.mediaType === 'video' ? (
                                                <span className="ui-badge border-violet-200 bg-violet-50 text-violet-700">
                                                    <VideoIcon className="h-3 w-3" /> Video clip
                                                </span>
                                            ) : tip.mediaType === 'url' ? (
                                                <span className="ui-badge border-emerald-200 bg-emerald-50 text-emerald-700">
                                                    <Link2 className="h-3 w-3" /> External link
                                                </span>
                                            ) : (
                                                <span className="ui-badge border-blue-200 bg-blue-50 text-blue-700">
                                                    <ImageIcon className="h-3 w-3" /> Image post
                                                </span>
                                            )}
                                            <span className="shrink-0 text-xs text-slate-500">{new Date(tip.date || tip.createdAt || '').toLocaleDateString()}</span>
                                        </div>

                                        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-slate-900">{tip.title}</h3>
                                        <p className="mt-1.5 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">{tip.description}</p>

                                        {tip.mediaType === 'url' && tip.linkUrl && (
                                            <a href={tip.linkUrl} target="_blank" rel="noopener noreferrer" className="mt-3 flex max-w-full items-center gap-1.5 self-start text-xs font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline">
                                                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                                <span className="truncate">{tip.linkUrl}</span>
                                            </a>
                                        )}

                                        <div className="mt-4 flex flex-row-reverse items-center justify-between gap-3 border-t border-slate-100 pt-4">
                                            <div className="flex shrink-0 items-center gap-2">
                                                <button onClick={() => handleEdit(tip)} aria-label="Edit health tip" className="ui-btn-secondary h-10 w-10 px-0 text-slate-500 hover:text-slate-900">
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDelete(tip._id)} aria-label="Delete health tip" className="ui-btn-secondary h-10 w-10 px-0 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-slate-500">Health Hub</p>
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
