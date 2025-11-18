"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { apiService } from "@/src/api/apiService";
import { Avatar } from "@/src/api/config";
import CustomCursor from "@/src/component/CustomCursor";

export default function SessionPage() {
    const params = useParams();
    const avatarId = params.id as string;

    const [avatar, setAvatar] = useState<Avatar | null>(null);
    const [loading, setLoading] = useState(true);
    const [videoPermission, setVideoPermission] = useState<"granted" | "denied" | "pending">("pending");
    const [audioPermission, setAudioPermission] = useState<"granted" | "denied" | "pending">("pending");

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        // Fetch avatar details
        const fetchAvatar = async () => {
            try {
                const res = await apiService.getAvatarById(avatarId);
                setAvatar(res.avatar);
            } catch (error) {
                console.error("Failed to fetch avatar:", error);
            } finally {
                setLoading(false);
            }
        };

        if (avatarId) {
            fetchAvatar();
        }
    }, [avatarId]);

    useEffect(() => {
        // Request camera and microphone permissions
        const requestPermissions = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    streamRef.current = stream;
                }

                setVideoPermission("granted");
                setAudioPermission("granted");
            } catch (error: any) {
                console.error("Permission error:", error);
                if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
                    setVideoPermission("denied");
                    setAudioPermission("denied");
                }
            }
        };

        requestPermissions();

        // Cleanup on unmount
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#101621] flex items-center justify-center">
                <div className="text-white" style={{ fontFamily: 'var(--font-inter)' }}>
                    Loading session...
                </div>
            </div>
        );
    }

    if (!avatar) {
        return (
            <div className="min-h-screen bg-[#101621] flex items-center justify-center">
                <div className="text-white" style={{ fontFamily: 'var(--font-inter)' }}>
                    Avatar not found
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#101621] relative overflow-hidden">
            <CustomCursor />

            <div className="container mx-auto px-6 py-8 max-w-7xl h-screen flex flex-col">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-orbitron)' }}>
                        Session with {avatar.name}
                    </h1>
                </motion.div>

                {/* Main Content */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Side - Avatar */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-[#171c2b] border border-[#4e99ff]/20 rounded-2xl p-6 flex flex-col"
                    >
                        <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-inter)' }}>
                            {avatar.name}
                        </h2>
                        <p className="text-[#c3d3e2] mb-4" style={{ fontFamily: 'var(--font-inter)' }}>
                            {avatar.role_title}
                        </p>

                        <div className="flex-1 flex items-center justify-center">
                            <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-[#0fffc3]">
                                <Image
                                    src={avatar.image_url}
                                    alt={avatar.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>

                        {avatar.description && (
                            <p className="text-[#c3d3e2] text-sm mt-4" style={{ fontFamily: 'var(--font-inter)' }}>
                                {avatar.description}
                            </p>
                        )}
                    </motion.div>

                    {/* Right Side - User Video */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-[#171c2b] border border-[#4e99ff]/20 rounded-2xl p-6 flex flex-col"
                    >
                        <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-inter)' }}>
                            Your Video
                        </h2>

                        <div className="flex-1 flex items-center justify-center bg-[#101621] rounded-lg overflow-hidden relative">
                            {videoPermission === "pending" && (
                                <div className="text-center p-8">
                                    <div className="text-[#c3d3e2] mb-4" style={{ fontFamily: 'var(--font-inter)' }}>
                                        Requesting camera and microphone access...
                                    </div>
                                </div>
                            )}

                            {videoPermission === "denied" && (
                                <div className="text-center p-8">
                                    <div className="text-[#ef476f] mb-4" style={{ fontFamily: 'var(--font-inter)' }}>
                                        Camera and microphone access denied
                                    </div>
                                    <p className="text-[#c3d3e2] text-sm" style={{ fontFamily: 'var(--font-inter)' }}>
                                        Please enable camera and microphone permissions in your browser settings
                                    </p>
                                </div>
                            )}

                            {videoPermission === "granted" && (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>

                        {/* Permission Status */}
                        <div className="mt-4 flex gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${videoPermission === "granted" ? "bg-[#0fffc3]" :
                                    videoPermission === "denied" ? "bg-[#ef476f]" :
                                        "bg-[#4e99ff]"
                                    }`} />
                                <span className="text-[#c3d3e2]" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Camera: {videoPermission === "granted" ? "On" : videoPermission === "denied" ? "Denied" : "Pending"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${audioPermission === "granted" ? "bg-[#0fffc3]" :
                                    audioPermission === "denied" ? "bg-[#ef476f]" :
                                        "bg-[#4e99ff]"
                                    }`} />
                                <span className="text-[#c3d3e2]" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Microphone: {audioPermission === "granted" ? "On" : audioPermission === "denied" ? "Denied" : "Pending"}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

