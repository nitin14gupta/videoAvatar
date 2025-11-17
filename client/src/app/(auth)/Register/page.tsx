"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import EmailVerification from "@/components/EmailVerification";

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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center p-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[#7FC4C9]/20 to-[#4CB1B9]/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-[#4CB1B9]/20 to-[#7FC4C9]/20 rounded-full blur-3xl"></div>
            </div>

            <div className="relative w-full max-w-md">
                {/* Main Card */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
                    {/* Logo and Header */}
                    <div className="text-center mb-8">
                        <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-[#7FC4C9] via-[#4CB1B9] to-[#7FC4C9] flex items-center justify-center shadow-lg">
                            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                            Create your account
                        </h1>
                        <p className="mt-2 text-gray-600 text-sm">
                            Join thousands of educators creating amazing content
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-5">
                        {/* Name Field */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 block">
                                Full Name
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7FC4C9] focus:border-transparent transition-all duration-200 bg-gray-50/50 focus:bg-white placeholder:text-gray-400 text-gray-700"
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 block">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7FC4C9] focus:border-transparent transition-all duration-200 bg-gray-50/50 focus:bg-white placeholder:text-gray-400 text-gray-700"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 block">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    type={show1 ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7FC4C9] focus:border-transparent transition-all duration-200 bg-gray-50/50 focus:bg-white placeholder:text-gray-400 text-gray-700"
                                    placeholder="Create a password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
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

                        {/* Confirm Password Field */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 block">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <input
                                    type={show2 ? "text" : "password"}
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7FC4C9] focus:border-transparent transition-all duration-200 bg-gray-50/50 focus:bg-white placeholder:text-gray-400 text-gray-700"
                                    placeholder="Confirm your password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
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

                        {/* Terms and Conditions */}
                        <div className="space-y-3">
                            <label className="flex items-start gap-3 text-sm text-gray-700">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={agree}
                                        onChange={(e) => setAgree(e.target.checked)}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${agree
                                        ? 'bg-[#7FC4C9] border-[#7FC4C9]'
                                        : 'border-gray-300 hover:border-[#7FC4C9]'
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
                                    <Link href="/Privacy" className="text-[#4CB1B9] hover:text-[#7FC4C9] font-medium transition-colors cursor-pointer">
                                        Privacy Policy
                                    </Link>
                                    {" "}and{" "}
                                    <Link href="/Terms" className="text-[#4CB1B9] hover:text-[#7FC4C9] font-medium transition-colors cursor-pointer">
                                        Terms of Service
                                    </Link>
                                </span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={!agree || loading}
                            className="w-full bg-gradient-to-r from-[#7FC4C9] to-[#4CB1B9] text-white font-semibold py-3 px-4 rounded-xl hover:from-[#4CB1B9] hover:to-[#7FC4C9] focus:outline-none focus:ring-2 focus:ring-[#7FC4C9] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating account...
                                </div>
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="mt-8 mb-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500">or</span>
                            </div>
                        </div>
                    </div>

                    {/* Sign In Link */}
                    <p className="text-center text-sm text-gray-600">
                        Already have an account?{" "}
                        <Link
                            href="/Login"
                            className="font-semibold text-[#4CB1B9] hover:text-[#7FC4C9] transition-colors cursor-pointer"
                        >
                            Sign in here
                        </Link>
                    </p>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-500">
                        By creating an account, you agree to our{" "}
                        <Link href="/Terms" className="text-[#4CB1B9] hover:underline">Terms of Service</Link>
                        {" "}and{" "}
                        <Link href="/Privacy" className="text-[#4CB1B9] hover:underline">Privacy Policy</Link>
                    </p>
                </div>
            </div>

            {/* Registration Disabled Overlay */}
            <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-8 max-w-md mx-4 text-center">
                    <div className="mb-6">
                        <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-gray-400 via-gray-300 to-gray-400 flex items-center justify-center shadow-lg">
                            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Registration Temporarily Disabled
                        </h2>
                        <p className="text-gray-600">
                            New users can't register right now.
                        </p>
                        <p className="text-gray-600 mt-2">
                            Go and login if you already have an account.
                        </p>
                    </div>

                    <Link
                        href="/Login"
                        className="inline-block w-full bg-gradient-to-r from-[#7FC4C9] to-[#4CB1B9] text-white font-semibold py-3 px-4 rounded-xl hover:from-[#4CB1B9] hover:to-[#7FC4C9] focus:outline-none focus:ring-2 focus:ring-[#7FC4C9] focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                        Go to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
