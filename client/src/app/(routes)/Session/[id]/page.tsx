"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { apiService } from "@/src/api/apiService";
import { API_CONFIG } from "@/src/api/config";
import { Avatar } from "@/src/api/config";
import CustomCursor from "@/src/component/CustomCursor";
import { useToast } from "@/src/context/ToastContext";

interface Message {
    sender: "user" | "avatar";
    content: string;
    timestamp: Date;
}

export default function SessionPage() {
    const params = useParams();
    const avatarId = params.id as string;
    const { showError, showSuccess } = useToast();

    const [avatar, setAvatar] = useState<Avatar | null>(null);
    const [loading, setLoading] = useState(true);
    const [videoPermission, setVideoPermission] = useState<"granted" | "denied" | "pending">("pending");
    const [audioPermission, setAudioPermission] = useState<"granted" | "denied" | "pending">("pending");
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [transcription, setTranscription] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [playingAudio, setPlayingAudio] = useState<string | null>(null);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<any>(null); // Can be MediaRecorder or Web Audio processor
    const websocketRef = useRef<WebSocket | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        // Fetch avatar details
        const fetchAvatar = async () => {
            try {
                const res = await apiService.getAvatarById(avatarId);
                setAvatar(res.avatar);
            } catch (error) {
                console.error("Failed to fetch avatar:", error);
                showError("Error", "Failed to load avatar");
            } finally {
                setLoading(false);
            }
        };

        if (avatarId) {
            fetchAvatar();
        }
    }, [avatarId, showError]);

    useEffect(() => {
        // Request camera and microphone permissions
        const requestPermissions = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: {
                        sampleRate: 16000,
                        channelCount: 1,
                        echoCancellation: true,
                        noiseSuppression: true,
                    }
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
            if (websocketRef.current) {
                websocketRef.current.close();
            }
            if (audioPlayerRef.current) {
                audioPlayerRef.current.pause();
                audioPlayerRef.current = null;
            }
        };
    }, []);

    const connectWebSocket = () => {
        try {
            const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https' : 'http';
            const wsUrl = API_CONFIG.ENDPOINTS.WHISPER.WEBSOCKET(protocol);

            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log("WebSocket connected");
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "transcription" && data.text) {
                        setTranscription(prev => {
                            // Append new text, handling partial updates
                            if (prev && data.text.startsWith(prev)) {
                                return data.text;
                            }
                            return prev + " " + data.text;
                        });
                    } else if (data.type === "final" && data.text) {
                        setTranscription(data.text);
                    } else if (data.type === "error") {
                        console.error("Whisper error:", data.message);
                        showError("Transcription Error", data.message);
                    }
                } catch (e) {
                    console.error("Error parsing WebSocket message:", e);
                }
            };

            ws.onerror = (error) => {
                console.error("WebSocket error:", error);
                showError("Connection Error", "Failed to connect to transcription service");
            };

            ws.onclose = () => {
                console.log("WebSocket closed");
            };

            websocketRef.current = ws;
        } catch (error) {
            console.error("Failed to create WebSocket:", error);
            showError("Connection Error", "Failed to initialize transcription");
        }
    };

    const startRecording = async () => {
        if (!streamRef.current) {
            showError("Error", "No audio stream available");
            return;
        }

        try {
            // Connect WebSocket first
            connectWebSocket();

            // Wait a bit for WebSocket to connect
            await new Promise(resolve => setTimeout(resolve, 100));

            // Use Web Audio API to capture raw PCM audio directly
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const source = audioContext.createMediaStreamSource(streamRef.current);

            // Create a script processor to capture audio samples
            const bufferSize = 4096;
            const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);

            const recordingState = { active: true };

            processor.onaudioprocess = (event) => {
                if (!recordingState.active || !websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
                    return;
                }

                try {
                    const inputData = event.inputBuffer.getChannelData(0);
                    const pcmData = new Int16Array(inputData.length);

                    // Convert float32 (-1 to 1) to int16
                    for (let i = 0; i < inputData.length; i++) {
                        const sample = Math.max(-1, Math.min(1, inputData[i]));
                        pcmData[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                    }

                    // Send PCM data to WebSocket
                    websocketRef.current.send(pcmData.buffer);
                } catch (error) {
                    console.error("Error processing audio:", error);
                }
            };

            // Connect the processor
            source.connect(processor);
            processor.connect(audioContext.destination);

            // Store processor reference for cleanup
            (mediaRecorderRef as any).current = { processor, audioContext, source, recordingState };

            audioChunksRef.current = [];
            setTranscription("");
            setIsRecording(true);
            setAudioEnabled(true);

            // Enable audio track
            if (streamRef.current) {
                const audioTrack = streamRef.current.getAudioTracks()[0];
                if (audioTrack) {
                    audioTrack.enabled = true;
                }
            }
        } catch (error) {
            console.error("Error starting recording:", error);
            showError("Recording Error", "Failed to start audio recording");
        }
    };

    const stopRecording = async () => {
        setIsRecording(false);
        setAudioEnabled(false);

        // Cleanup Web Audio API processor
        if (mediaRecorderRef.current && (mediaRecorderRef.current as any).processor) {
            const { processor, audioContext, source, recordingState } = mediaRecorderRef.current as any;
            if (recordingState) {
                recordingState.active = false;
            }
            try {
                source.disconnect();
                processor.disconnect();
                processor.onaudioprocess = null;
            } catch (e) {
                console.error("Error disconnecting audio processor:", e);
            }
            mediaRecorderRef.current = null;
        }

        // Disable audio track
        if (streamRef.current) {
            const audioTrack = streamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = false;
            }
        }

        // Finalize transcription and close WebSocket
        if (websocketRef.current) {
            // Wait a bit for final audio chunks
            await new Promise(resolve => setTimeout(resolve, 500));
            websocketRef.current.close();
        }

        // Send final transcription to LLM if we have text
        if (transcription.trim()) {
            await sendToLLM(transcription.trim());
        }
    };

    const sendToLLM = async (text: string) => {
        if (!text.trim() || !avatar) return;

        setIsProcessing(true);
        try {
            // Add user message to UI
            const userMessage: Message = {
                sender: "user",
                content: text,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, userMessage]);

            // Send to LLM
            const response = await apiService.chatWithAvatar(avatarId, text, conversationId || undefined);

            // Update conversation ID
            if (response.conversation_id) {
                setConversationId(response.conversation_id);
            }

            // Add avatar response to UI
            const avatarMessage: Message = {
                sender: "avatar",
                content: response.avatar_response,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, avatarMessage]);

            // Play TTS audio if available
            if (response.audio_url) {
                playTTSAudio(response.audio_url);
            }

            // Clear transcription
            setTranscription("");

            showSuccess("Response", "Avatar responded!");
        } catch (error: any) {
            console.error("Error sending to LLM:", error);
            showError("Error", error?.message || "Failed to get avatar response");
        } finally {
            setIsProcessing(false);
        }
    };

    const playTTSAudio = (audioUrl: string) => {
        try {
            // Stop any currently playing audio
            if (audioPlayerRef.current) {
                audioPlayerRef.current.pause();
                audioPlayerRef.current = null;
            }

            // Create new audio element and play
            const audio = new Audio(audioUrl);
            audioPlayerRef.current = audio;
            setPlayingAudio(audioUrl);

            audio.onended = () => {
                setPlayingAudio(null);
                audioPlayerRef.current = null;
            };

            audio.onerror = () => {
                console.error("Error playing TTS audio");
                setPlayingAudio(null);
                audioPlayerRef.current = null;
            };

            audio.play().catch((error) => {
                console.error("Error playing audio:", error);
                setPlayingAudio(null);
            });
        } catch (error) {
            console.error("Error setting up TTS audio:", error);
        }
    };

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
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
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
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
                    {/* Left Side - Avatar & Conversation */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-[#171c2b] border border-[#4e99ff]/20 rounded-2xl p-6 flex flex-col overflow-hidden"
                    >
                        <div className="mb-4">
                            <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-inter)' }}>
                                {avatar.name}
                            </h2>
                            <p className="text-[#c3d3e2] text-sm" style={{ fontFamily: 'var(--font-inter)' }}>
                                {avatar.role_title}
                            </p>
                        </div>

                        {/* Avatar Image */}
                        <div className="relative w-full aspect-square bg-[#101621] rounded-lg overflow-hidden mb-4">
                            <Image
                                src={avatar.image_url}
                                alt={avatar.name}
                                fill
                                className="object-cover"
                            />
                        </div>

                        {/* Conversation Messages */}
                        <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                            {messages.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-[#c3d3e2] text-sm" style={{ fontFamily: 'var(--font-inter)' }}>
                                        Start speaking to begin the conversation
                                    </p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-3 rounded-lg ${msg.sender === "user"
                                            ? "bg-[#4e99ff]/20 ml-auto max-w-[80%]"
                                            : "bg-[#0fffc3]/10 mr-auto max-w-[80%]"
                                            }`}
                                    >
                                        <p className="text-white text-sm" style={{ fontFamily: 'var(--font-inter)' }}>
                                            {msg.content}
                                        </p>
                                    </motion.div>
                                ))
                            )}
                            {isProcessing && (
                                <div className="bg-[#0fffc3]/10 p-3 rounded-lg mr-auto max-w-[80%]">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-[#0fffc3] rounded-full animate-pulse" />
                                        <p className="text-[#c3d3e2] text-sm" style={{ fontFamily: 'var(--font-inter)' }}>
                                            {avatar.name} is thinking...
                                        </p>
                                    </div>
                                </div>
                            )}
                            {playingAudio && (
                                <div className="bg-[#4e99ff]/20 p-3 rounded-lg mr-auto max-w-[80%]">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-[#4e99ff] rounded-full animate-pulse" />
                                        <p className="text-[#c3d3e2] text-sm" style={{ fontFamily: 'var(--font-inter)' }}>
                                            🔊 {avatar.name} is speaking...
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Transcription Display */}
                        {transcription && (
                            <div className="bg-[#101621] border border-[#4e99ff]/30 rounded-lg p-3 mb-4">
                                <p className="text-[#c3d3e2] text-xs mb-1" style={{ fontFamily: 'var(--font-inter)' }}>
                                    You said:
                                </p>
                                <p className="text-white text-sm" style={{ fontFamily: 'var(--font-inter)' }}>
                                    {transcription}
                                </p>
                            </div>
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

                                {/* Audio/Mic Toggle */}
                                <button
                                    onClick={toggleAudio}
                                    className={`p-3 rounded-full transition-all ${isRecording
                                        ? "bg-[#ef476f] text-white hover:bg-[#ef476f]/80 animate-pulse"
                                        : "bg-[#0fffc3] text-[#101621] hover:bg-[#0fffc3]/80"
                                        }`}
                                    title={isRecording ? "Stop recording" : "Start recording"}
                                >
                                    {isRecording ? (
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Status Indicators */}
                        <div className="mt-4 flex gap-4 text-sm justify-center">
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
                                <div className={`w-3 h-3 rounded-full ${isRecording ? "bg-[#ef476f] animate-pulse" :
                                    audioPermission === "granted" ? "bg-[#0fffc3]" :
                                        audioPermission === "denied" ? "bg-[#ef476f]" :
                                            "bg-[#4e99ff]"
                                    }`} />
                                <span className="text-[#c3d3e2]" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Mic: {isRecording ? "Recording" : audioPermission === "granted" ? "Ready" : audioPermission === "denied" ? "Denied" : "Pending"}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
