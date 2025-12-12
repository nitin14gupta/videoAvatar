"use client";

import Link from "next/link";
import { Menu, X, Github, Sparkles, Search, Command } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Keyboard shortcut for search (Ctrl+K or Cmd+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                setShowSearchModal(true);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Navigation Items
    const navItems = [
        { name: "Components", href: "/get-started/components" },
        { name: "Templates", href: "/get-started/templates" },
        { name: "Docs", href: "/get-started/introduction" },
        { name: "Pricing", href: "/get-started/pricing" },
    ];

    return (
        <header
            className={`fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out ${isScrolled
                ? "top-4 w-[90%] max-w-5xl"
                : "top-6 w-[95%] max-w-6xl"
                }`}
        >
            {/* --- The Glassy Island --- */}
            <div className="relative z-50 flex h-16 items-center justify-between px-2 pl-4 pr-2 md:px-6 rounded-full border border-white/10 bg-zinc-950/70 backdrop-blur-xl shadow-lg shadow-black/20 transition-all duration-300 hover:border-white/20 hover:shadow-indigo-500/10">

                {/* --- Logo Section --- */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative h-9 w-9 overflow-hidden rounded-full bg-indigo-500/10 border border-indigo-500/20 p-1.5 transition-all duration-300 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/40">
                        <div className="relative h-full w-full rounded-full overflow-hidden">
                            <Image
                                src="/next.svg"
                                alt="Uilora Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-indigo-500 blur-[20px] opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                    </div>
                    <span className="hidden sm:block text-xl font-bold text-white tracking-tight">
                        Uilora<span className="text-indigo-500">.</span>
                    </span>
                </Link>

                {/* --- Desktop Nav --- */}
                <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all duration-300"
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>

                {/* --- Right Actions --- */}
                <div className="flex items-center gap-2">
                    {/* Search Button */}
                    <button
                        onClick={() => setShowSearchModal(true)}
                        className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-400 hover:text-white hover:border-white/20 transition-all group"
                    >
                        <Search className="h-3.5 w-3.5 group-hover:text-indigo-400 transition-colors" />
                        <span className="hidden lg:inline">Search</span>
                        <div className="hidden lg:flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] font-mono text-zinc-500">
                            <Command className="h-2.5 w-2.5" />
                            <span>K</span>
                        </div>
                    </button>

                    {/* Github Icon */}
                    <Link
                        href="https://github.com/nitin14gupta"
                        target="_blank"
                        className="group relative p-2.5 rounded-full text-zinc-400 hover:text-white transition-colors hover:bg-white/5"
                    >
                        <Github size={20} />
                    </Link>

                    {/* Get Started Button */}
                    <Link
                        href="/get-started/components"
                        className="hidden sm:flex relative group overflow-hidden px-5 py-2.5 rounded-full bg-white text-zinc-950 font-bold text-xs transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]"
                    >
                        <span className="relative z-10">Get Started</span>
                        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-linear-to-r from-transparent via-zinc-200/50 to-transparent z-0" />
                    </Link>

                    {/* Mobile Toggle */}
                    <button
                        className="md:hidden p-2.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* --- Mobile Menu Dropdown --- */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 right-0 mt-2 p-2 rounded-3xl border border-white/10 bg-zinc-950/90 backdrop-blur-xl overflow-hidden shadow-2xl md:hidden"
                    >
                        <div className="flex flex-col p-2 space-y-1">
                            <button
                                onClick={() => {
                                    setShowSearchModal(true);
                                    setIsMobileMenuOpen(false);
                                }}
                                className="flex items-center justify-between px-4 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors group"
                            >
                                <div className="flex items-center gap-2">
                                    <Search className="h-4 w-4" />
                                    <span className="font-medium">Search Components</span>
                                </div>
                                <Sparkles className="h-4 w-4 opacity-0 group-hover:opacity-100 text-indigo-500 transition-opacity" />
                            </button>

                            <div className="h-px bg-white/5 my-2 mx-4" />

                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="flex items-center justify-between px-4 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors group"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <span className="font-medium">{item.name}</span>
                                    <Sparkles className="h-4 w-4 opacity-0 group-hover:opacity-100 text-indigo-500 transition-opacity" />
                                </Link>
                            ))}

                            <div className="h-px bg-white/5 my-2 mx-4" />

                            <Link
                                href="/get-started/components"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex w-full items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white text-black font-bold active:scale-95 transition-transform"
                            >
                                Get Started
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </header>
    );
}