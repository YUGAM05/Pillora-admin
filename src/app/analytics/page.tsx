"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, LayoutDashboard, ExternalLink } from "lucide-react";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({ 
    subsets: ["latin"],
    weight: ['400', '500', '600', '700', '800'],
    variable: '--font-jakarta',
});

export default function AnalyticsPage() {
    const router = useRouter();

    return (
        <div className={`min-h-screen bg-[#FDFDFF] text-slate-900 ${jakarta.variable} font-sans p-6 md:p-12`}>
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <button 
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-4 hover:text-blue-600 transition-colors"
                    >
                        <ChevronLeft className="w-3 h-3" /> Back to Dashboard
                    </button>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight font-jakarta">
                        Google <span className="text-blue-600">Data Studio</span> Insights
                    </h1>
                    <p className="text-slate-500 font-medium text-lg italic mt-2">Deep-dive reporting and business intelligence dashboard</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="px-5 py-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" /> Live External Feed
                    </div>
                </div>
            </div>

            {/* Iframe Container */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-7xl mx-auto bg-white border border-slate-100 rounded-[3rem] shadow-2xl shadow-blue-900/5 overflow-hidden relative"
            >
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600" />
                
                <div className="p-8 md:p-12">
                    <div className="aspect-[4/3] md:aspect-video w-full rounded-3xl overflow-hidden bg-slate-50 border border-slate-100">
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
                    
                    <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-6 p-8 bg-slate-900 rounded-[2rem] text-white">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-blue-400">
                                <LayoutDashboard className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="font-bold text-lg mb-1">Interactive Reporting</p>
                                <p className="text-slate-400 text-sm">Filter data and interact with charts directly in the frame above.</p>
                            </div>
                        </div>
                        <a 
                            href="https://datastudio.google.com/reporting/3926f1c3-92a4-4fb0-84f2-4b08dfa74f61/page/DMMyF" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-xl shadow-blue-600/20 active:scale-95 whitespace-nowrap"
                        >
                            Open Original <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </motion.div>

            {/* Footer Text */}
            <div className="max-w-7xl mx-auto mt-12 text-center">
                <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.4em]">Pillora Business Intelligence • Confidential</p>
            </div>
        </div>
    );
}
