"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/src/context/AuthContext";
import { useToast } from "@/src/context/ToastContext";
import EmailVerification from "@/src/component/EmailVerification";
import CustomCursor from "@/src/component/CustomCursor";

export default function RegisterPage() {
    const { register } = useAuth();
    const { showError, showSuccess } = useToast();
    const [show1, setShow1] = useState(false);
    const [show2, setShow2] = useState(false);
    const [agree, setAgree] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [showVerification, setShowVerification] = useState(false);
    const [pendingEmail, setPendingEmail] = useState("");

    const onSubmit = async () => {
        if (!agree) {
            showError("Terms Required", "Please accept the terms and conditions");
            return;
        }
        if (!name || !email || !password || !confirm) {
            showError("Missing fields", "Please fill out all fields");
            return;
        }
        if (password !== confirm) {
            showError("Password mismatch", "Passwords do not match");
            return;
        }
        setLoading(true);
        try {
            await register(name, email, password);
            setPendingEmail(email);
            setShowVerification(true);
            showSuccess("Verification Sent", "Please check your email for a verification code");
        } catch (e: any) {
            showError("Registration Failed", e?.message || "Please try again");
        }
        setLoading(false);
    };

    const handleVerificationComplete = () => {
        setShowVerification(false);
        setPendingEmail("");
        // The AuthContext will handle the redirect to Dashboard
    };

    const handleBackToRegistration = () => {
        setShowVerification(false);
        setPendingEmail("");
    };

    // Show verification component if email verification is needed
    if (showVerification && pendingEmail) {
        return (
            <EmailVerification
                email={pendingEmail}
                onVerified={handleVerificationComplete}
                onBack={handleBackToRegistration}
            />
        );
    }

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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-4xl font-bold gradient-text mb-2"
                            style={{ fontFamily: 'var(--font-orbitron)' }}
                        >
                            Create your account
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="mt-2 text-[#c3d3e2] text-sm"
                            style={{ fontFamily: 'var(--font-inter)' }}
                        >
                            Join thousands creating amazing AI avatars
                        </motion.p>
                    </div>

                    {/* Form */}
                    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-5">
                        {/* Name Field */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="space-y-2"
                        >
                            <label className="text-sm font-semibold text-[#c3d3e2] block" style={{ fontFamily: 'var(--font-inter)' }}>
                                Full Name
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-[#4e99ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-[#4e99ff]/30 rounded-xl focus:ring-2 focus:ring-[#4e99ff] focus:border-[#4e99ff] transition-all duration-200 bg-[#101621]/50 backdrop-blur-sm text-white placeholder:text-[#c3d3e2]/50 focus:bg-[#101621]"
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>
                        </motion.div>

                        {/* Email Field */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                            className="space-y-2"
                        >
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
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                        </motion.div>

                        {/* Password Field */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 }}
                            className="space-y-2"
                        >
                            <label className="text-sm font-semibold text-[#c3d3e2] block" style={{ fontFamily: 'var(--font-inter)' }}>
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-[#4e99ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    type={show1 ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-12 py-3 border border-[#4e99ff]/30 rounded-xl focus:ring-2 focus:ring-[#4e99ff] focus:border-[#4e99ff] transition-all duration-200 bg-[#101621]/50 backdrop-blur-sm text-white placeholder:text-[#c3d3e2]/50 focus:bg-[#101621]"
                                    placeholder="Create a password"
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
                        </motion.div>

                        {/* Confirm Password Field */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8 }}
                            className="space-y-2"
                        >
                            <label className="text-sm font-semibold text-[#c3d3e2] block" style={{ fontFamily: 'var(--font-inter)' }}>
                                Confirm Password
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
                                    placeholder="Confirm your password"
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
                        </motion.div>

                        {/* Terms and Conditions */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.9 }}
                            className="space-y-3"
                        >
                            <label className="flex items-start gap-3 text-sm text-[#c3d3e2]" style={{ fontFamily: 'var(--font-inter)' }}>
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={agree}
                                        onChange={(e) => setAgree(e.target.checked)}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${agree
                                        ? 'bg-[#4e99ff] border-[#4e99ff]'
                                        : 'border-[#4e99ff]/50 hover:border-[#4e99ff]'
                                        }`}>
                                        {agree && (
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                                <span className="leading-relaxed">
                                    I have read and accept the{" "}
                                    <Link href="/Privacy" className="text-[#4e99ff] hover:text-[#0fffc3] font-medium transition-colors">
                                        Privacy Policy
                                    </Link>
                                    {" "}and{" "}
                                    <Link href="/Terms" className="text-[#4e99ff] hover:text-[#0fffc3] font-medium transition-colors">
                                        Terms of Service
                                    </Link>
                                </span>
                            </label>
                        </motion.div>

                        {/* Submit Button */}
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 }}
                            type="submit"
                            disabled={!agree || loading}
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
                                    Creating account...
                                </div>
                            ) : (
                                "Create Account"
                            )}
                        </motion.button>
                    </form>

                    {/* Divider */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.1 }}
                        className="mt-8 mb-6"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[#4e99ff]/20"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-[#101621] text-[#c3d3e2]">or</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Sign In Link */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        className="text-center text-sm text-[#c3d3e2]"
                        style={{ fontFamily: 'var(--font-inter)' }}
                    >
                        Already have an account?{" "}
                        <Link
                            href="/Login"
                            className="font-semibold text-[#4e99ff] hover:text-[#0fffc3] transition-colors"
                        >
                            Sign in here
                        </Link>
                    </motion.p>
                </motion.div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.3 }}
                    className="mt-8 text-center"
                >
                    <p className="text-xs text-[#c3d3e2]/60" style={{ fontFamily: 'var(--font-inter)' }}>
                        By creating an account, you agree to our{" "}
                        <Link href="/Terms" className="text-[#4e99ff] hover:text-[#0fffc3] hover:underline">Terms of Service</Link>
                        {" "}and{" "}
                        <Link href="/Privacy" className="text-[#4e99ff] hover:text-[#0fffc3] hover:underline">Privacy Policy</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
