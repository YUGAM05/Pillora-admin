"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setToken, setUser as setStoredUser, getToken, getUser, clearAuth } from "@/lib/tokenStorage";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, Lock, Mail, KeyRound, ShieldCheck } from "lucide-react";
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
                clearAuth();
                setError("Access Denied. Admin account required.");
            }

        } catch (err: any) {
            if (err.message === "Network Error" || err.code === "ERR_NETWORK") {
                setError("Unable to connect to the server. Please check your internet connection or try again later.");
            } else {
                setError(err.response?.data?.message || "Invalid email or password");
            }
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
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 font-sans">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-blue-50 to-transparent" aria-hidden="true" />

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative w-full max-w-[400px]"
            >
                <div className="mb-6 flex flex-col items-center text-center">
                    <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <Image src="/pillora-logo-v2.svg" alt="Pillora" fill className="object-contain p-0.5" />
                    </div>
                    <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
                        {mfaStep ? 'Admin verification' : 'Sign in to Pillora Admin'}
                    </h1>
                    <p className="mt-1.5 text-sm text-slate-500">
                        {mfaStep ? 'Enter the 6-digit code from your authenticator app' : 'Enter your credentials to access Pillora'}
                    </p>
                </div>

                <div className="ui-card p-6 sm:p-8">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            role="alert"
                            className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm font-medium text-rose-700"
                        >
                            <Lock className="mt-0.5 h-4 w-4 shrink-0" /> <span>{error}</span>
                        </motion.div>
                    )}

                    <AnimatePresence mode="wait">
                    {mfaStep ? (
                        <motion.form key="mfa" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleMfaVerify} className="space-y-5">
                            {mfaSetup && qrCode ? (
                                <div className="space-y-3 text-center">
                                    <p className="text-sm text-slate-600">Scan this QR code with your authenticator app:</p>
                                    <Image src={qrCode} alt="MFA QR Code" width={160} height={160} className="mx-auto rounded-xl border border-slate-200 p-2" unoptimized />
                                </div>
                            ) : (
                                <div className="flex justify-center">
                                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                        <KeyRound className="h-6 w-6" />
                                    </span>
                                </div>
                            )}
                            <div>
                                <label htmlFor="mfa-code" className="ui-label text-center">6-digit code</label>
                                <input
                                    id="mfa-code"
                                    className="ui-input min-h-[52px] text-center text-2xl font-semibold tracking-[0.5em]"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    value={mfaCode}
                                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    required
                                    autoFocus
                                    placeholder="000000"
                                />
                            </div>
                            <button
                                className="ui-btn-primary min-h-[44px] w-full"
                                type="submit"
                                disabled={loading || mfaCode.length !== 6}
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify and continue'}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setMfaStep(false); setMfaSetup(false); setError(''); setMfaCode(''); }}
                                className="w-full text-center text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
                            >
                                ← Back to sign in
                            </button>
                        </motion.form>
                    ) : (
                        <motion.form key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleEmailLogin} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="ui-label">Email address</label>
                                <div className="relative">
                                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        id="email"
                                        required
                                        type="email"
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="ui-input pl-10"
                                        placeholder="name@pillora.in"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="ui-label">Password</label>
                                <div className="relative">
                                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        id="password"
                                        required
                                        type="password"
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="ui-input pl-10"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="ui-btn-dark mt-2 min-h-[44px] w-full"
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
                            </button>
                        </motion.form>
                    )}
                    </AnimatePresence>
                </div>

                <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                    <ShieldCheck className="h-3.5 w-3.5" /> Secure super admin portal
                </p>
            </motion.div>
        </div>
    );
}
