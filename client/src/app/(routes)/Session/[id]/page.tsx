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
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(true);

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
                    videoRef.current.play().catch(console.error);
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

    const toggleVideo = () => {
        if (streamRef.current) {
            const videoTrack = streamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setVideoEnabled(videoTrack.enabled);
            }
        }
    };

    const toggleAudio = () => {
        if (streamRef.current) {
            const audioTrack = streamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setAudioEnabled(audioTrack.enabled);
            }
        }
    };

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

                        <div className="flex-1 flex items-center justify-center bg-[#101621] rounded-lg overflow-hidden relative min-h-[400px]">
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
                                <>
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        muted
                                        playsInline
                                        className="absolute inset-0 w-full h-full object-cover"
                                        style={{ display: videoEnabled ? 'block' : 'none' }}
                                    />
                                    {!videoEnabled && (
                                        <div className="absolute inset-0 bg-[#101621] flex items-center justify-center">
                                            <div className="text-center">
                                                <svg className="w-16 h-16 text-[#4e99ff] mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                                <p className="text-[#c3d3e2]" style={{ fontFamily: 'var(--font-inter)' }}>Camera Off</p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Control Buttons */}
                        {videoPermission === "granted" && (
                            <div className="mt-4 flex items-center justify-center gap-4">
                                {/* Video Toggle */}
                                <button
                                    onClick={toggleVideo}
                                    className={`p-3 rounded-full transition-all ${videoEnabled
                                        ? "bg-[#0fffc3] text-[#101621] hover:bg-[#0fffc3]/80"
                                        : "bg-[#ef476f] text-white hover:bg-[#ef476f]/80"
                                        }`}
                                    title={videoEnabled ? "Turn off camera" : "Turn on camera"}
                                >
                                    {videoEnabled ? (
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                        </svg>
                                    )}
                                </button>

                                {/* Audio Toggle */}
                                <button
                                    onClick={toggleAudio}
                                    className={`p-3 rounded-full transition-all ${audioEnabled
                                        ? "bg-[#0fffc3] text-[#101621] hover:bg-[#0fffc3]/80"
                                        : "bg-[#ef476f] text-white hover:bg-[#ef476f]/80"
                                        }`}
                                    title={audioEnabled ? "Mute microphone" : "Unmute microphone"}
                                >
                                    {audioEnabled ? (
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Permission Status */}
                        <div className="mt-4 flex gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${videoPermission === "granted" && videoEnabled ? "bg-[#0fffc3]" :
                                    videoPermission === "granted" && !videoEnabled ? "bg-[#ef476f]" :
                                        videoPermission === "denied" ? "bg-[#ef476f]" :
                                            "bg-[#4e99ff]"
                                    }`} />
                                <span className="text-[#c3d3e2]" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Camera: {videoPermission === "granted" ? (videoEnabled ? "On" : "Off") : videoPermission === "denied" ? "Denied" : "Pending"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${audioPermission === "granted" && audioEnabled ? "bg-[#0fffc3]" :
                                    audioPermission === "granted" && !audioEnabled ? "bg-[#ef476f]" :
                                        audioPermission === "denied" ? "bg-[#ef476f]" :
                                            "bg-[#4e99ff]"
                                    }`} />
                                <span className="text-[#c3d3e2]" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Microphone: {audioPermission === "granted" ? (audioEnabled ? "On" : "Off") : audioPermission === "denied" ? "Denied" : "Pending"}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}