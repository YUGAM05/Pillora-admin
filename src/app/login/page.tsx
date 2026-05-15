"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setToken, setUser as setStoredUser, getToken, getUser } from "@/lib/tokenStorage";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, Lock, Mail, KeyRound } from "lucide-react";
import api from "@/lib/api";
import Image from "next/image";


export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [email, setEmail] = useState("admin@pillora.in");
    const [password, setPassword] = useState("");

    // MFA state for admin login
    const [mfaStep, setMfaStep] = useState(false);
    const [mfaSetup, setMfaSetup] = useState(false);
    const [mfaCode, setMfaCode] = useState("");
    const [mfaUserId, setMfaUserId] = useState("");
    const [qrCode, setQrCode] = useState("");

    useEffect(() => {
        const user = getUser();
        const token = getToken();
        if (user && token) {
            if (user.role === 'admin') router.push("/");
            else router.push("/login");
        }
    }, [router]);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await api.post("/auth/login", { email, password });
            const data = res.data;

            // ✅ Handle MFA required (admin flow) — DO NOT save token here
            if (data.mfaRequired) {
                setMfaUserId(data.userId);
                setMfaStep(true);
                return;
            }

            // ✅ Handle MFA setup required (first-time admin)
            if (data.mfaSetupRequired) {
                setMfaUserId(data.userId);
                setQrCode(data.qrCode);
                setMfaSetup(true);
                setMfaStep(true);
                return;
            }

            // ✅ Non-admin: token is present, save it
            if (!data.token) {
                setError("Login failed: no token received. Please try again.");
                return;
            }

            setToken(data.token);
            setStoredUser(JSON.stringify({
                _id: data._id,
                name: data.name,
                email: data.email,
                role: data.role,
                status: data.status
            }));

            window.dispatchEvent(new Event('storage'));

            if (data.isPasswordResetRequired) {
                router.push("/auth/change-password");
                return;
            }

            if (data.role === 'admin') {
                router.push("/");
            } else {
                // Not an admin, don't allow login here
                localStorage.clear();
                setError("Access Denied. Admin account required.");
            }

        } catch (err: any) {
            setError(err.response?.data?.message || "Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    const handleMfaVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await api.post('/auth/verify-mfa', {
                userId: mfaUserId,
                token: mfaCode,
            });
            const data = res.data;
            if (!data.token) {
                setError("MFA verification failed: no token received.");
                return;
            }
            setToken(data.token);
            setStoredUser(JSON.stringify({
                _id: data._id,
                name: data.name,
                email: data.email,
                role: data.role,
                status: data.status
            }));
            window.dispatchEvent(new Event('storage'));
            router.push("/");
        } catch (err: any) {
            setError(err.response?.data?.message || "Invalid authenticator code");
            setMfaCode("");
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-6 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/5 blur-[120px] rounded-full" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white border border-gray-100 p-10 rounded-[2.5rem] shadow-2xl relative z-10"
            >
                <div className="text-center mb-8">
                    <div className="mb-6 flex justify-center">
                        <div className="p-4 bg-primary/5 rounded-3xl relative w-16 h-16">
                            <Image src="/pillora-logo-v2.svg" alt="Pillora" fill className="object-contain" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                        {mfaStep ? 'Admin Verification' : 'Welcome Back'}
                    </h2>
                    <p className="text-gray-500 mt-2 text-sm font-medium">
                        {mfaStep ? 'Enter your 6-digit authenticator code' : 'Enter your credentials to access Pillora'}
                    </p>
                </div>

                {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold text-center border border-red-100 flex items-center justify-center gap-2">
                        <Lock className="w-4 h-4" /> {error}
                    </motion.div>
                )}

                <AnimatePresence mode="wait">
                {mfaStep ? (
                    <motion.form key="mfa" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleMfaVerify} className="space-y-6">
                        <div className="flex items-center justify-center mb-2">
                            <div className="p-4 bg-blue-50 rounded-2xl">
                                <KeyRound className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>
                        {mfaSetup && qrCode && (
                            <div className="text-center space-y-3 mb-4">
                                <p className="text-slate-500 text-sm">Scan this QR code with your Authenticator app:</p>
                                <Image src={qrCode} alt="MFA QR Code" width={160} height={160} className="mx-auto rounded-xl border border-slate-100 p-2" unoptimized />
                            </div>
                        )}
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">6-Digit Code</label>
                            <input
                                className="block w-full px-4 py-4 rounded-2xl border border-slate-200 bg-gray-50 text-slate-900 text-center text-2xl tracking-[0.5em] font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                maxLength={6}
                                value={mfaCode}
                                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                required
                                autoFocus
                                placeholder="000000"
                            />
                        </div>
                        <button
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-600/30 disabled:opacity-70 transition-all"
                            type="submit"
                            disabled={loading || mfaCode.length !== 6}
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Verify & Access Admin'}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setMfaStep(false); setMfaSetup(false); setError(''); setMfaCode(''); }}
                            className="w-full text-sm text-slate-400 hover:text-blue-600 transition-colors text-center font-medium"
                        >
                            ← Back to Login
                        </button>
                    </motion.form>
                ) : (
                    <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-gray-900 transition-all"
                                placeholder="name@pillora.in"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Password</label>
                            <Link href="/forgot-password" className="text-[10px] font-black text-primary uppercase hover:underline">Forgot?</Link>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                required
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-gray-900 tracking-widest transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-gray-900/20 hover:bg-gray-800 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Sign In"}
                    </button>
                </form>

                    <p className="text-[10px] text-gray-400 text-center mt-8 font-medium">
                        Secure Super Admin Portal
                    </p>
                    </motion.div>
                )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

