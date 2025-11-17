"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

interface AvatarCardProps {
    avatar: {
        id: string;
        name: string;
        role_title: string;
        image_url: string;
        description?: string;
        specialty?: string;
    };
}

export default function AvatarCard({ avatar }: AvatarCardProps) {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    return (
        <motion.div
            className="bg-[#101621] border border-[#4e99ff]/10 rounded-xl p-4 hover:border-[#4e99ff]/30 transition-all group relative"
            whileHover={{ y: -4 }}
        >
            {/* Avatar Thumbnail */}
            <div className="relative w-full aspect-square mb-3 rounded-lg overflow-hidden">
                <Image
                    src={avatar.image_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop"}
                    alt={avatar.name}
                    fill
                    className="object-cover"
                />
            </div>

            {/* Avatar Info */}
            <div className="mb-3">
                <h3 className="text-white font-semibold text-sm mb-1" style={{ fontFamily: 'var(--font-inter)' }}>
                    {avatar.name}
                </h3>
                <p className="text-[#c3d3e2] text-xs" style={{ fontFamily: 'var(--font-inter)' }}>
                    {avatar.role_title}
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <button className="flex-1 px-3 py-2 bg-gradient-to-r from-[#0fffc3] to-[#4e99ff] text-[#101621] rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity" style={{ fontFamily: 'var(--font-inter)' }}>
                    Start
                </button>
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 hover:bg-[#171c2b] rounded-lg transition-colors"
                    >
                        <svg className="w-4 h-4 text-[#c3d3e2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showMenu && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute right-0 mt-2 w-32 bg-[#171c2b] border border-[#4e99ff]/20 rounded-lg shadow-xl overflow-hidden z-10"
                        >
                            <button className="w-full px-3 py-2 text-left text-xs text-[#c3d3e2] hover:bg-[#101621] transition-colors" style={{ fontFamily: 'var(--font-inter)' }}>
                                Rename
                            </button>
                            <button className="w-full px-3 py-2 text-left text-xs text-[#c3d3e2] hover:bg-[#101621] transition-colors" style={{ fontFamily: 'var(--font-inter)' }}>
                                Duplicate
                            </button>
                            <button className="w-full px-3 py-2 text-left text-xs text-[#ef476f] hover:bg-[#101621] transition-colors" style={{ fontFamily: 'var(--font-inter)' }}>
                                Delete
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

