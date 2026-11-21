"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, X, Loader2, Save, FileText, Image as ImageIcon } from "lucide-react";
import api from "@/lib/api";
import { isSafeMediaUrl } from "@/lib/safeUrl";
import { getToken } from "@/lib/tokenStorage";

export default function BlogAdmin() {
    const [blogs, setBlogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [migrating, setMigrating] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        content: "",
        category: "",
        imageUrl: "",
        author: "",
        authorRole: "",
        readTime: "",
        slug: ""
    });

    const generateSlug = (title: string): string => {
        return title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')   // remove special chars
            .replace(/\s+/g, '-')       // spaces to hyphens
            .replace(/-+/g, '-')        // collapse multiple hyphens
            .trim()
            .slice(0, 80);              // max 80 characters
    };

    const handleTitleBlur = () => {
        if (!formData.slug && formData.title) {
            setFormData(prev => ({ ...prev, slug: generateSlug(formData.title) }));
        }
    };

    const handleMigrateSlugs = async () => {
        setMigrating(true);
        try {
            const token = getToken();
            const headers = { Authorization: `Bearer ${token}` };

            const res = await api.get("/blogs");
            const allBlogs = res.data;
            const postsToMigrate = allBlogs.filter((b: any) => !b.slug);

            if (postsToMigrate.length === 0) {
                alert("All existing blog posts already have slugs set!");
                setMigrating(false);
                return;
            }

            let successCount = 0;
            let failureCount = 0;

            for (const blog of postsToMigrate) {
                const MAPPED_SLUGS: Record<string, string> = {
                    "6a21c6b1fa1460edddd50e97": "pillora-platform-india-health-emergencies",
                    "6a27ad5093de437bdc02a83c": "how-to-find-blood-donors-emergency-india",
                    "6a2e514b7232fc73de4196c5": "ayushman-bharat-pm-jay-eligibility-guide-2026",
                    "6a3684159f9c77ef71f660a4": "hospital-hidden-charges-patient-rights-india",
                    "6a3c1f805a466b1ae5cdf1f7": "top-5-government-health-schemes-india-2026",
                    "6a41e6f1450f74e133c7ce80": "indias-digital-health-revolution-2026-abha-telemedicine"
                };
                const generated = MAPPED_SLUGS[blog._id] || generateSlug(blog.title);
                try {
                    await api.patch(`/blogs/${blog._id}/slug`, { slug: generated }, { headers });
                    successCount++;
                } catch (error) {
                    console.error(`Failed to migrate slug for blog ${blog._id}:`, error);
                    failureCount++;
                }
            }

            alert(`Migration completed!\nSuccess: ${successCount}\nFailure: ${failureCount}`);
            fetchBlogs();
        } catch (error) {
            console.error("Migration failed:", error);
            alert("Failed to complete migration");
        } finally {
            setMigrating(false);
        }
    };

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
            readTime: blog.readTime,
            slug: blog.slug || ""
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
        if (!isSafeMediaUrl(formData.imageUrl)) {
            alert("Image URL must start with https:// (or http://).");
            return;
        }
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
                title: "", description: "", content: "", category: "", imageUrl: "", author: "", authorRole: "", readTime: "", slug: ""
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
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                        <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="ui-title">Content management</h2>
                        <p className="ui-subtitle">Manage articles, updates, and medical blogs</p>
                    </div>
                </div>
                {!isFormOpen && (
                    <div className="flex w-full gap-2 sm:w-auto sm:shrink-0">
                        <button
                            onClick={handleMigrateSlugs}
                            disabled={loading || migrating}
                            className="ui-btn-secondary flex-1 sm:flex-none"
                        >
                            {migrating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Generate slugs
                        </button>
                        <button
                            onClick={() => {
                                setFormData({ title: "", description: "", content: "", category: "", imageUrl: "", author: "", authorRole: "", readTime: "", slug: "" });
                                setEditingId(null);
                                setIsFormOpen(true);
                            }}
                            className="ui-btn-primary flex-1 sm:flex-none"
                        >
                            <Plus className="h-4 w-4" />
                            Create post
                        </button>
                    </div>
                )}
            </div>

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
                            <h3 className="ui-title">{editingId ? 'Edit blog post' : 'New blog post'}</h3>
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
                                    <label htmlFor="blog-title" className="ui-label">Title</label>
                                    <input id="blog-title" required name="title" value={formData.title} onChange={handleInputChange} onBlur={handleTitleBlur} className="ui-input" placeholder="Enter article title" />
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="blog-slug" className="ui-label">URL slug</label>
                                    <input id="blog-slug" name="slug" value={formData.slug} onChange={handleInputChange} className="ui-input" placeholder="e.g. how-to-find-blood-donors-india" />
                                    <p className="ui-hint break-all">
                                        Preview: <span className="font-medium text-blue-600">pillora.in/blog/{formData.slug || '[slug]'}</span>
                                    </p>
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="blog-description" className="ui-label">Description summary</label>
                                    <textarea id="blog-description" required name="description" value={formData.description} onChange={handleInputChange} rows={2} className="ui-input min-h-[96px] resize-none" placeholder="Brief summary of the article" />
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="blog-content" className="ui-label">Full content</label>
                                    <textarea id="blog-content" required name="content" value={formData.content} onChange={handleInputChange} rows={10} className="ui-input min-h-[240px] resize-y" placeholder="Write the main content here..." />
                                </div>
                                <div>
                                    <label htmlFor="blog-category" className="ui-label">Category</label>
                                    <input id="blog-category" required name="category" value={formData.category} onChange={handleInputChange} className="ui-input" placeholder="e.g. Health, Nutrition, Medical News" />
                                </div>
                                <div>
                                    <label htmlFor="blog-image-url" className="ui-label">Image URL</label>
                                    <div className="relative">
                                        <ImageIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input id="blog-image-url" name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} className="ui-input pl-10" placeholder="https://..." />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="blog-author" className="ui-label">Author name</label>
                                    <input id="blog-author" required name="author" value={formData.author} onChange={handleInputChange} className="ui-input" placeholder="Dr. John Doe" />
                                </div>
                                <div>
                                    <label htmlFor="blog-author-role" className="ui-label">Author role</label>
                                    <input id="blog-author-role" name="authorRole" value={formData.authorRole} onChange={handleInputChange} className="ui-input" placeholder="Chief Medical Officer" />
                                </div>
                                <div>
                                    <label htmlFor="blog-read-time" className="ui-label">Read time</label>
                                    <input id="blog-read-time" required name="readTime" value={formData.readTime} onChange={handleInputChange} className="ui-input" placeholder="e.g. 5 min read" />
                                </div>
                            </div>
                            <div className="flex justify-end border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
                                <button type="submit" disabled={loading} className="ui-btn-primary w-full sm:w-auto">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    {editingId ? 'Update post' : 'Publish post'}
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
                            <div role="status" aria-label="Loading blog posts" className="ui-card col-span-full flex justify-center py-16">
                                <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
                            </div>
                        ) : blogs.length === 0 ? (
                            <div className="ui-empty col-span-full bg-white py-16">
                                <FileText className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                                <h3 className="font-medium text-slate-700">No content found</h3>
                                <p className="mt-1">Get started by creating your first blog post.</p>
                            </div>
                        ) : (
                            blogs.map(blog => (
                                <div key={blog._id} className="ui-card flex flex-col overflow-hidden">
                                    {blog.imageUrl && (
                                        <div className="h-44 overflow-hidden border-b border-slate-100 bg-slate-100">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={blog.imageUrl} alt={blog.title} className="h-full w-full object-cover" />
                                        </div>
                                    )}
                                    <div className="flex flex-1 flex-col p-4 sm:p-5">
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <span className="ui-badge min-w-0 truncate border-blue-200 bg-blue-50 text-blue-700">
                                                {blog.category}
                                            </span>
                                            <span className="shrink-0 text-xs text-slate-500">{new Date(blog.date || blog.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-slate-900">{blog.title}</h3>
                                        <p className="mt-1.5 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">{blog.description}</p>

                                        <div className="mt-4 flex flex-row-reverse items-center justify-between gap-3 border-t border-slate-100 pt-4">
                                            <div className="flex shrink-0 items-center gap-2">
                                                <button onClick={() => handleEdit(blog)} aria-label="Edit blog post" className="ui-btn-secondary h-10 w-10 px-0 text-slate-500 hover:text-slate-900">
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDelete(blog._id)} aria-label="Delete blog post" className="ui-btn-secondary h-10 w-10 px-0 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-slate-900">{blog.author}</p>
                                                <p className="truncate text-xs text-slate-500">{blog.readTime}</p>
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
