"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/src/context/AuthContext";
import { useToast } from "@/src/context/ToastContext";
import { apiService } from "@/src/api/apiService";
import CustomCursor from "./CustomCursor";

interface EmailVerificationProps {
    email: string;
    onVerified: () => void;
    onBack: () => void;
}

export default function EmailVerification({ email, onVerified, onBack }: EmailVerificationProps) {
    const { verifyEmail } = useAuth();
    const { showError, showSuccess } = useToast();
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds

    // Countdown timer
    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleVerify = async () => {
        if (!code || code.length !== 6) {
            showError("Invalid Code", "Please enter a 6-digit verification code");
            return;
        }

        setLoading(true);
        try {
            await verifyEmail(email, code);
            // The AuthContext will handle the redirect to Dashboard
            onVerified();
        } catch (e: any) {
            // Error is already handled in AuthContext
        }
        setLoading(false);
    };

    const handleResend = async () => {
        setResendLoading(true);
        try {
            await apiService.resendVerification(email);
            showSuccess("Code Sent", "A new verification code has been sent to your email");
            setTimeLeft(15 * 60); // Reset timer
        } catch (e: any) {
            showError("Resend Failed", e?.message || "Failed to resend verification code");
        }
        setResendLoading(false);
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setCode(value);
    };

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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-4xl font-bold gradient-text mb-2"
                            style={{ fontFamily: 'var(--font-orbitron)' }}
                        >
                            Verify Your Email
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="mt-2 text-[#c3d3e2] text-sm"
                            style={{ fontFamily: 'var(--font-inter)' }}
                        >
                            We&apos;ve sent a verification code to
                        </motion.p>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-[#4e99ff] font-semibold mt-1"
                            style={{ fontFamily: 'var(--font-inter)' }}
                        >
                            {email}
                        </motion.p>
                    </div>

                    {/* Verification Code Input */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="space-y-6"
                    >
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-[#c3d3e2] block" style={{ fontFamily: 'var(--font-inter)' }}>
                                Enter Verification Code
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={code}
                                    onChange={handleCodeChange}
                                    className="w-full text-center text-3xl font-mono tracking-widest py-4 px-6 border border-[#4e99ff]/30 rounded-xl focus:ring-2 focus:ring-[#4e99ff] focus:border-[#4e99ff] transition-all duration-200 bg-[#101621]/50 backdrop-blur-sm text-white placeholder:text-[#c3d3e2]/30 focus:bg-[#101621]"
                                    placeholder="000000"
                                    maxLength={6}
                                    autoComplete="one-time-code"
                                />
                            </div>
                        </div>

                        {/* Timer */}
                        {timeLeft > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                className="text-center"
                            >
                                <p className="text-sm text-[#c3d3e2]" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Code expires in{" "}
                                    <span className="font-semibold text-[#4e99ff]">
                                        {formatTime(timeLeft)}
                                    </span>
                                </p>
                            </motion.div>
                        )}

                        {/* Verify Button */}
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            onClick={handleVerify}
                            disabled={!code || code.length !== 6 || loading}
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
                                "Verify Email"
                            )}
                        </motion.button>

                        {/* Resend Code */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.9 }}
                            className="text-center"
                        >
                            <p className="text-sm text-[#c3d3e2] mb-2" style={{ fontFamily: 'var(--font-inter)' }}>
                                Didn&apos;t receive the code?
                            </p>
                            <button
                                onClick={handleResend}
                                disabled={resendLoading || timeLeft > 0}
                                className="text-[#4e99ff] hover:text-[#0fffc3] font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ fontFamily: 'var(--font-inter)' }}
                            >
                                {resendLoading ? "Sending..." : "Resend Code"}
                            </button>
                        </motion.div>

                        {/* Back Button */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            className="text-center"
                        >
                            <button
                                onClick={onBack}
                                className="text-[#c3d3e2] hover:text-[#4e99ff] font-medium text-sm transition-colors"
                                style={{ fontFamily: 'var(--font-inter)' }}
                            >
                                ← Back to Registration
                            </button>
                        </motion.div>
                    </motion.div>

                    {/* Help Text */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.1 }}
                        className="mt-8 p-4 bg-[#101621]/50 backdrop-blur-sm border border-[#4e99ff]/20 rounded-xl"
                    >
                        <div className="flex items-start space-x-3">
                            <svg className="h-5 w-5 text-[#4e99ff] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-sm text-[#c3d3e2]" style={{ fontFamily: 'var(--font-inter)' }}>
                                <p className="font-semibold mb-1 text-[#0fffc3]">Check your email</p>
                                <p>Look for an email from VideoAvatar with your verification code. It might take a few minutes to arrive.</p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
