"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface AvatarCardProps {
    avatar: {
        id: string;
        name: string;
        role_title: string;
        image_url: string;
        audio_url?: string;
        description?: string;
        specialty?: string;
    };
}

export default function AvatarCard({ avatar }: AvatarCardProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
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

    const handlePreview = () => {
        if (!avatar.audio_url) return;

        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                setIsPlaying(false);
            } else {
                audioRef.current.play();
                setIsPlaying(true);
            }
        } else {
            const audio = new Audio(avatar.audio_url);
            audioRef.current = audio;
            audio.play();
            setIsPlaying(true);

            audio.onended = () => {
                setIsPlaying(false);
            };

            audio.onerror = () => {
                setIsPlaying(false);
            };
        }
    };

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
                    className="object-contain"
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
                {avatar.audio_url && (
                    <button
                        onClick={handlePreview}
                        className="px-3 py-2 bg-[#171c2b] border border-[#4e99ff]/30 text-[#0fffc3] rounded-lg text-xs font-semibold hover:bg-[#4e99ff]/20 transition-all flex items-center gap-1"
                        style={{ fontFamily: 'var(--font-inter)' }}
                    >
                        {isPlaying ? (
                            <>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                </svg>
                                Stop
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                                Preview
                            </>
                        )}
                    </button>
                )}
                <Link href={`/Session/${avatar.id}`} className="flex-1">
                    <button className="w-full px-3 py-2 bg-gradient-to-r from-[#0fffc3] to-[#4e99ff] text-[#101621] rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity" style={{ fontFamily: 'var(--font-inter)' }}>
                        Start
                    </button>
                </Link>
            </div>
        </motion.div>
    );
}

