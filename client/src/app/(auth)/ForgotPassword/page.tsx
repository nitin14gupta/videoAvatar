"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { apiService } from "@/src/api/apiService";
import { useToast } from "@/src/context/ToastContext";
import CustomCursor from "@/src/component/CustomCursor";

export default function ForgotPasswordPage() {
    const [step, setStep] = useState(1);
    const [show1, setShow1] = useState(false);
    const [show2, setShow2] = useState(false);
    const router = useRouter();
    const { showError, showSuccess } = useToast();
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);

    const onRequest = async () => {
        if (!email) {
            showError("Missing email", "Please enter your email");
            return;
        }
        setLoading(true);
        try {
            const res = await apiService.requestReset(email);
            if (res?.ok) {
                showSuccess("Code sent", "Check your inbox for the reset code");
                setStep(2);
            }
        } catch (e: any) {
            showError("Request failed", e?.message || "Please try again");
        }
        setLoading(false);
    };

    const onVerify = async () => {
        if (!email || !code) {
            showError("Missing fields", "Enter email and code");
            return;
        }
        setLoading(true);
        try {
            const res = await apiService.verifyReset(email, code);
            if (res?.ok) setStep(3);
        } catch (e: any) {
            showError("Invalid code", e?.message || "Please recheck the code");
        }
        setLoading(false);
    };

    const onConfirm = async () => {
        if (!email || !code || !newPassword || !confirm) {
            showError("Missing fields", "Fill all fields");
            return;
        }
        if (newPassword !== confirm) {
            showError("Password mismatch", "Passwords do not match");
            return;
        }
        setLoading(true);
        try {
            const res = await apiService.confirmReset(email, code, newPassword);
            if (res?.ok) {
                showSuccess("Password updated", "You can now sign in");
                router.push("/Login");
            }
        } catch (e: any) {
            showError("Update failed", e?.message || "Please try again");
        }
        setLoading(false);
    };

    const stepLabels = [
        "Enter your email",
        "Verify your code",
        "Set new password"
    ];

    return (
        <div className="min-h-screen bg-[#101621] flex items-center justify-center p-4 relative overflow-hidden">
            <CustomCursor />
            {/* Animated Background Particles */}
            <div className="absolute inset-0 overflow-hidden">
                {[...Array(15)].map((_, i) => {
                    const width = typeof window !== 'undefined' ? window.innerWidth : 1920;
                    const height = typeof window !== 'undefined' ? window.innerHeight : 1080;
                    return (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 rounded-full bg-[#abe6ff]"
                            initial={{
                                x: Math.random() * width,
                                y: Math.random() * height,
                                opacity: 0,
                            }}
                            animate={{
                                y: [null, Math.random() * height],
                                x: [null, Math.random() * width],
                                opacity: [0, 0.8, 0],
                            }}
                            transition={{
                                duration: 5 + Math.random() * 5,
                                repeat: Infinity,
                                delay: Math.random() * 2,
                            }}
                        />
                    );
                })}
            </div>

            {/* Neural Wave Glow Effect */}
            <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            >
                <div className="w-[600px] h-[600px] rounded-full bg-gradient-to-r from-[#4e99ff]/10 to-[#be65ff]/10 blur-3xl" />
            </motion.div>

            <div className="relative w-full max-w-md z-10">
                {/* Main Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="glass-card rounded-3xl shadow-2xl p-8"
                >
                    {/* Logo and Header */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-[#4e99ff] via-[#be65ff] to-[#0fffc3] flex items-center justify-center glow-azure"
                        >
                            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-4xl font-bold gradient-text mb-2"
                            style={{ fontFamily: 'var(--font-orbitron)' }}
                        >
                            Reset Password
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="mt-2 text-[#c3d3e2] text-sm"
                            style={{ fontFamily: 'var(--font-inter)' }}
                        >
                            {stepLabels[step - 1]}
                        </motion.p>
                    </div>

                    {/* Progress Steps */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mb-8"
                    >
                        <div className="flex items-center justify-center space-x-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.6 + i * 0.1, type: "spring" }}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${i <= step
                                            ? 'bg-gradient-to-br from-[#4e99ff] to-[#be65ff] text-white shadow-lg glow-azure'
                                            : 'bg-[#101621]/50 border-2 border-[#4e99ff]/30 text-[#c3d3e2]'
                                            }`}
                                    >
                                        {i < step ? (
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            i
                                        )}
                                    </motion.div>
                                    {i < 3 && (
                                        <motion.div
                                            initial={{ scaleX: 0 }}
                                            animate={{ scaleX: 1 }}
                                            transition={{ delay: 0.7 + i * 0.1 }}
                                            className={`w-12 h-0.5 mx-2 transition-all duration-300 ${i < step ? 'bg-gradient-to-r from-[#4e99ff] to-[#be65ff]' : 'bg-[#4e99ff]/20'
                                                }`}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Step 1: Email */}
                    {step === 1 && (
                        <motion.form
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8 }}
                            onSubmit={(e) => { e.preventDefault(); onRequest(); }}
                            className="space-y-6"
                        >
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-[#c3d3e2] block" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-[#4e99ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                        </svg>
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-[#4e99ff]/30 rounded-xl focus:ring-2 focus:ring-[#4e99ff] focus:border-[#4e99ff] transition-all duration-200 bg-[#101621]/50 backdrop-blur-sm text-white placeholder:text-[#c3d3e2]/50 focus:bg-[#101621]"
                                        placeholder="Enter your email address"
                                        required
                                    />
                                </div>
                            </div>

                            <motion.button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-[#0fffc3] to-[#4e99ff] text-[#101621] font-bold py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0fffc3] focus:ring-offset-2 focus:ring-offset-[#101621] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 glow-mint"
                                style={{ fontFamily: 'var(--font-inter)' }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Sending code...
                                    </div>
                                ) : (
                                    "Send Reset Code"
                                )}
                            </motion.button>
                        </motion.form>
                    )}

                    {/* Step 2: Verification Code */}
                    {step === 2 && (
                        <motion.form
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            onSubmit={(e) => { e.preventDefault(); onVerify(); }}
                            className="space-y-6"
                        >
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-[#c3d3e2] block" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Verification Code
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-[#4e99ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-[#4e99ff]/30 rounded-xl focus:ring-2 focus:ring-[#4e99ff] focus:border-[#4e99ff] transition-all duration-200 bg-[#101621]/50 backdrop-blur-sm text-center text-lg tracking-widest placeholder:text-[#c3d3e2]/50 text-white focus:bg-[#101621]"
                                        placeholder="123456"
                                        maxLength={6}
                                        required
                                    />
                                </div>
                                <p className="text-xs text-[#c3d3e2]/60 text-center" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Enter the 6-digit code sent to {email}
                                </p>
                            </div>

                            <motion.button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-[#0fffc3] to-[#4e99ff] text-[#101621] font-bold py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0fffc3] focus:ring-offset-2 focus:ring-offset-[#101621] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 glow-mint"
                                style={{ fontFamily: 'var(--font-inter)' }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Verifying...
                                    </div>
                                ) : (
                                    "Verify Code"
                                )}
                            </motion.button>
                        </motion.form>
                    )}

                    {/* Step 3: New Password */}
                    {step === 3 && (
                        <motion.form
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            onSubmit={(e) => { e.preventDefault(); onConfirm(); }}
                            className="space-y-6"
                        >
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-[#c3d3e2] block" style={{ fontFamily: 'var(--font-inter)' }}>
                                    New Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-[#4e99ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input
                                        type={show1 ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full pl-10 pr-12 py-3 border border-[#4e99ff]/30 rounded-xl focus:ring-2 focus:ring-[#4e99ff] focus:border-[#4e99ff] transition-all duration-200 bg-[#101621]/50 backdrop-blur-sm text-white placeholder:text-[#c3d3e2]/50 focus:bg-[#101621]"
                                        placeholder="Enter new password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#4e99ff] hover:text-[#0fffc3] transition-colors"
                                        onClick={() => setShow1(!show1)}
                                    >
                                        {show1 ? (
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-[#c3d3e2] block" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-[#4e99ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type={show2 ? "text" : "password"}
                                        value={confirm}
                                        onChange={(e) => setConfirm(e.target.value)}
                                        className="w-full pl-10 pr-12 py-3 border border-[#4e99ff]/30 rounded-xl focus:ring-2 focus:ring-[#4e99ff] focus:border-[#4e99ff] transition-all duration-200 bg-[#101621]/50 backdrop-blur-sm text-white placeholder:text-[#c3d3e2]/50 focus:bg-[#101621]"
                                        placeholder="Confirm new password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#4e99ff] hover:text-[#0fffc3] transition-colors"
                                        onClick={() => setShow2(!show2)}
                                    >
                                        {show2 ? (
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <motion.button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-[#0fffc3] to-[#4e99ff] text-[#101621] font-bold py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0fffc3] focus:ring-offset-2 focus:ring-offset-[#101621] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 glow-mint"
                                style={{ fontFamily: 'var(--font-inter)' }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Updating password...
                                    </div>
                                ) : (
                                    "Update Password"
                                )}
                            </motion.button>
                        </motion.form>
                    )}

                    {/* Back to Login */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="mt-8 text-center"
                    >
                        <Link
                            href="/Login"
                            className="text-sm text-[#4e99ff] hover:text-[#0fffc3] font-medium transition-colors"
                            style={{ fontFamily: 'var(--font-inter)' }}
                        >
                            ← Back to Sign In
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
