"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, LayoutDashboard, ExternalLink } from "lucide-react";

export default function AnalyticsPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
            {/* Header */}
            <div className="mb-6">
                <div>
                    <button
                        onClick={() => router.push('/')}
                        className="-ml-2 inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                        <ChevronLeft className="h-4 w-4" /> Back to dashboard
                    </button>
                    <h1 className="mt-3 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                        Google Data Studio insights
                    </h1>
                    <p className="ui-subtitle">Deep-dive reporting and business intelligence dashboard</p>
                </div>
            </div>

            {/* Iframe Container */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="ui-card overflow-hidden"
            >
                <div className="p-4 sm:p-5">
                    <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 md:aspect-video">
                        <iframe 
                            width="100%" 
                            height="100%" 
                            src="https://datastudio.google.com/embed/reporting/3926f1c3-92a4-4fb0-84f2-4b08dfa74f61/page/DMMyF" 
                            frameBorder="0" 
                            style={{ border: 0 }} 
                            allowFullScreen 
                            sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                        ></iframe>
                    </div>
                    
                    <div className="mt-4 flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <LayoutDashboard className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900">Interactive reporting</p>
                                <p className="text-sm text-slate-500">Filter data and interact with charts directly in the frame above.</p>
                            </div>
                        </div>
                        <a
                            href="https://datastudio.google.com/reporting/3926f1c3-92a4-4fb0-84f2-4b08dfa74f61/page/DMMyF"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ui-btn-primary w-full shrink-0 sm:w-auto"
                        >
                            Open original <ExternalLink className="h-4 w-4" />
                        </a>
                    </div>
                </div>
            </motion.div>

            {/* Footer Text */}
            <div className="mt-8 text-center">
                <p className="text-xs text-slate-400">Pillora Business Intelligence • Confidential</p>
            </div>
            </div>
        </div>
    );
}
