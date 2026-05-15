"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, X, Loader2, Save, FileText, Image as ImageIcon } from "lucide-react";
import api from "@/lib/api";
import { getToken } from "@/lib/tokenStorage";

export default function BlogAdmin() {
    const [blogs, setBlogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        content: "",
        category: "",
        imageUrl: "",
        author: "",
        authorRole: "",
        readTime: ""
    });

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        try {
            const res = await api.get("/blogs");
            setBlogs(res.data);
        } catch (error) {
            console.error("Failed to fetch blogs", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEdit = (blog: any) => {
        setFormData({
            title: blog.title,
            description: blog.description,
            content: blog.content,
            category: blog.category,
            imageUrl: blog.imageUrl || "",
            author: blog.author,
            authorRole: blog.authorRole || "",
            readTime: blog.readTime
        });
        setEditingId(blog._id);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this blog post?")) return;
        try {
            const token = getToken();
            await api.delete(`/blogs/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchBlogs();
        } catch (error) {
            console.error("Failed to delete blog", error);
            alert("Failed to delete blog");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = getToken();
            const headers = { Authorization: `Bearer ${token}` };

            if (editingId) {
                await api.put(`/blogs/${editingId}`, formData, { headers });
            } else {
                await api.post("/blogs", formData, { headers });
            }

            setFormData({
                title: "", description: "", content: "", category: "", imageUrl: "", author: "", authorRole: "", readTime: ""
            });
            setEditingId(null);
            setIsFormOpen(false);
            fetchBlogs();
        } catch (error) {
            console.error("Failed to save blog", error);
            alert("Failed to save blog");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 font-inter">
            <div className="flex justify-between items-center bg-white p-8 rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                        <FileText className="w-7 h-7 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 font-jakarta">Content Management</h2>
                        <p className="text-slate-500 text-sm font-medium">Manage articles, updates, and medical blogs</p>
                    </div>
                </div>
                {!isFormOpen && (
                    <button
                        onClick={() => {
                            setFormData({ title: "", description: "", content: "", category: "", imageUrl: "", author: "", authorRole: "", readTime: "" });
                            setEditingId(null);
                            setIsFormOpen(true);
                        }}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-blue-600/30 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Create Post
                    </button>
                )}
            </div>

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
                            <h3 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Blog Post' : 'New Blog Post'}</h3>
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
                                    <input required name="title" value={formData.title} onChange={handleInputChange} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-900 outline-none transition-all" placeholder="Enter article title" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Description Summary</label>
                                    <textarea required name="description" value={formData.description} onChange={handleInputChange} rows={2} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-900 outline-none transition-all resize-none" placeholder="Brief summary of the article" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Content</label>
                                    <textarea required name="content" value={formData.content} onChange={handleInputChange} rows={10} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-900 outline-none transition-all resize-none" placeholder="Write the main content here..." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Category</label>
                                    <input required name="category" value={formData.category} onChange={handleInputChange} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-900 outline-none transition-all" placeholder="e.g. Health, Nutrition, Medical News" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Image URL</label>
                                    <div className="relative">
                                        <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} className="w-full pl-12 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-900 outline-none transition-all" placeholder="https://..." />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Author Name</label>
                                    <input required name="author" value={formData.author} onChange={handleInputChange} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-900 outline-none transition-all" placeholder="Dr. John Doe" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Author Role</label>
                                    <input name="authorRole" value={formData.authorRole} onChange={handleInputChange} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-900 outline-none transition-all" placeholder="Chief Medical Officer" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Read Time</label>
                                    <input required name="readTime" value={formData.readTime} onChange={handleInputChange} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-900 outline-none transition-all" placeholder="e.g. 5 min read" />
                                </div>
                            </div>
                            <div className="flex justify-end pt-6 border-t border-slate-100">
                                <button type="submit" disabled={loading} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-slate-900/20 transition-all active:scale-95 disabled:opacity-70">
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    {editingId ? 'Update Post' : 'Publish Post'}
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
                                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                            </div>
                        ) : blogs.length === 0 ? (
                            <div className="col-span-full py-20 bg-white rounded-3xl border border-slate-100 flex flex-col items-center justify-center text-center">
                                <FileText className="w-16 h-16 text-slate-200 mb-4" />
                                <h3 className="text-xl font-bold text-slate-900 font-jakarta">No Content Found</h3>
                                <p className="text-slate-500 mt-2">Get started by creating your first blog post.</p>
                            </div>
                        ) : (
                            blogs.map(blog => (
                                <div key={blog._id} className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-300 group flex flex-col">
                                    {blog.imageUrl && (
                                        <div className="h-48 overflow-hidden bg-slate-100">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={blog.imageUrl} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        </div>
                                    )}
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest rounded-lg">
                                                {blog.category}
                                            </span>
                                            <span className="text-xs text-slate-400 font-medium">{new Date(blog.date || blog.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2 leading-tight">{blog.title}</h3>
                                        <p className="text-sm text-slate-500 mb-6 line-clamp-3 flex-1">{blog.description}</p>
                                        
                                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between mt-auto">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleEdit(blog)} className="w-10 h-10 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-xl flex items-center justify-center transition-colors">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(blog._id)} className="w-10 h-10 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl flex items-center justify-center transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-slate-900">{blog.author}</p>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{blog.readTime}</p>
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
