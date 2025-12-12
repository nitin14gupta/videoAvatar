"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { apiService } from "@/src/api/apiService";
import { Avatar } from "@/src/api/config";
import { useToast } from "@/src/context/ToastContext";

// TypeScript definitions for Web Speech API
interface SpeechRecognitionInterface extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
}

interface SpeechRecognitionConstructor {
    new(): SpeechRecognitionInterface;
}

declare var SpeechRecognition: SpeechRecognitionConstructor;
declare var webkitSpeechRecognition: SpeechRecognitionConstructor;

interface SpeechRecognitionEvent {
    resultIndex: number;
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
    isFinal: boolean;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognitionErrorEvent {
    error: string;
    message: string;
}

declare global {
    interface Window {
        SpeechRecognition: SpeechRecognitionConstructor;
        webkitSpeechRecognition: SpeechRecognitionConstructor;
    }
}

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
    const [isInitializing, setIsInitializing] = useState(false);
    const [blinkingAnimationUrl, setBlinkingAnimationUrl] = useState<string | null>(null);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
    const audioQueueRef = useRef<Array<{ url: string; audio: HTMLAudioElement }>>([]);
    const isPlayingQueueRef = useRef(false);
    const thinkingSoundRef = useRef<HTMLAudioElement | null>(null);
    const thinkingSoundTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const avatarVideoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const speechRecognitionRef = useRef<SpeechRecognitionInterface | null>(null);
    const conversationWebSocketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        // Fetch avatar details
        const initialize = async () => {
            try {
                // Check if TTS and LLM are initialized (no whisper needed)
                const initStatus = await apiService.getInitializationStatus();

                if (!initStatus.tts || !initStatus.llm) {
                    setIsInitializing(true);
                    // Poll until initialized
                    const checkInterval = setInterval(async () => {
                        const status = await apiService.getInitializationStatus();
                        if (status.tts && status.llm && !status.initializing) {
                            clearInterval(checkInterval);
                            setIsInitializing(false);
                        }
                    }, 1000);

                    // Timeout after 60 seconds
                    setTimeout(() => {
                        clearInterval(checkInterval);
                        setIsInitializing(false);
                    }, 60000);
                } else {
                    setIsInitializing(false);
                }

                // Fetch avatar details
                const res = await apiService.getAvatarById(avatarId);
                setAvatar(res.avatar);

                // Use stored blinking video URL if available, otherwise fallback to generating on-the-fly
                if (res.avatar.blinking_video_url) {
                    setBlinkingAnimationUrl(res.avatar.blinking_video_url);
                } else {
                    // Fallback: generate on-the-fly (for backward compatibility or if processing failed)
                    const animationUrl = apiService.getBlinkingAnimationUrl(avatarId);
                    setBlinkingAnimationUrl(animationUrl);
                }
            } catch (error) {
                console.error("Failed to initialize:", error);
                showError("Error", "Failed to load session");
            } finally {
                setLoading(false);
            }
        };

        if (avatarId) {
            initialize();
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
            // Stop recording if active
            if (isRecording && speechRecognitionRef.current) {
                try {
                    speechRecognitionRef.current.stop();
                } catch (e) {
                    console.error("Error stopping speech recognition:", e);
                }
            }

            // Stop all media tracks
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => {
                    track.stop();
                    track.enabled = false;
                });
                streamRef.current = null;
            }

            // Close conversation WebSocket if open
            if (conversationWebSocketRef.current) {
                try {
                    conversationWebSocketRef.current.close();
                } catch (e) {
                    console.error("Error closing conversation WebSocket:", e);
                }
                conversationWebSocketRef.current = null;
            }

            // Cleanup audio queue
            audioQueueRef.current.forEach(({ url, audio }) => {
                audio.pause();
                audio.src = '';
                URL.revokeObjectURL(url);
            });
            audioQueueRef.current = [];
            isPlayingQueueRef.current = false;

            if (audioPlayerRef.current) {
                audioPlayerRef.current.pause();
                audioPlayerRef.current.src = '';
                audioPlayerRef.current = null;
            }

            // Cleanup thinking sound
            if (thinkingSoundRef.current) {
                try {
                    thinkingSoundRef.current.pause();
                    thinkingSoundRef.current.currentTime = 0;
                    thinkingSoundRef.current = null;
                } catch (e) {
                    console.error("Error stopping thinking sound in cleanup:", e);
                }
            }
            if (thinkingSoundTimeoutRef.current) {
                clearTimeout(thinkingSoundTimeoutRef.current);
                thinkingSoundTimeoutRef.current = null;
            }
        };
    }, []);

    // Check if Web Speech API is available
    const isSpeechRecognitionAvailable = () => {
        return typeof window !== 'undefined' && (
            'SpeechRecognition' in window ||
            'webkitSpeechRecognition' in window
        );
    };

    const startRecording = () => {
        // Check if Web Speech API is available
        if (!isSpeechRecognitionAvailable()) {
            showError("Not Supported", "Speech recognition is not supported in your browser. Please use Chrome or Edge.");
            return;
        }

        try {
            // Get SpeechRecognition (Chrome/Edge) or webkitSpeechRecognition (Safari)
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const recognition = new SpeechRecognition();

            // Configure recognition
            recognition.continuous = true; // Keep listening until stopped
            recognition.interimResults = true; // Get interim results as you speak
            recognition.lang = "en-US"; // Language (can be made configurable)

            // Handle results
            recognition.onresult = (event: SpeechRecognitionEvent) => {
                let fullTranscript = "";

                // Process ALL results from the beginning to get complete transcript
                for (let i = 0; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    fullTranscript += transcript + " ";
                }

                // Update transcription with complete text
                const trimmedTranscript = fullTranscript.trim();
                if (trimmedTranscript) {
                    setTranscription(trimmedTranscript);
                }
            };

            // Handle errors
            recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                console.error("Speech recognition error:", event.error);
                if (event.error === "no-speech") {
                    // User stopped speaking, this is normal
                    return;
                } else if (event.error === "not-allowed") {
                    showError("Permission Denied", "Microphone permission was denied. Please enable it in your browser settings.");
                } else {
                    showError("Recognition Error", `Speech recognition error: ${event.error}`);
                }
            };

            // Handle end of recognition
            recognition.onend = () => {
                console.log("Speech recognition ended");
                setIsRecording(false);
                setAudioEnabled(false);
            };

            // Start recognition
            recognition.start();
            speechRecognitionRef.current = recognition;

            // Clear previous transcription
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
            console.error("Error starting speech recognition:", error);
            showError("Recording Error", "Failed to start speech recognition");
        }
    };

    const stopRecording = async () => {
        setIsRecording(false);
        setAudioEnabled(false);

        // Get current transcription before stopping (in case it gets cleared)
        let finalText = transcription.trim();

        // Stop speech recognition - this will trigger onend event
        if (speechRecognitionRef.current) {
            try {
                // Wait a brief moment to ensure final results are processed
                speechRecognitionRef.current.stop();

                // Wait a bit for final results to be processed
                await new Promise(resolve => setTimeout(resolve, 300));

                // Get the final transcription after stopping
                finalText = transcription.trim();
            } catch (e) {
                console.error("Error stopping speech recognition:", e);
            }
            speechRecognitionRef.current = null;
        }

        // Disable audio track
        if (streamRef.current) {
            const audioTrack = streamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = false;
            }
        }

        // Send final transcription to LLM if we have text
        if (finalText) {
            await sendToLLM(finalText);
            // Clear transcription after sending
            setTranscription("");
        } else {
            // Clear transcription if empty
            setTranscription("");
        }
    };

    const playThinkingSound = () => {
        if (!avatar) return;

        // Get thinking sound URLs - handle both array and JSON string
        let thinkingSounds: string[] = [];

        if (avatar.thinking_sound_urls) {
            // If it's already an array, use it
            if (Array.isArray(avatar.thinking_sound_urls)) {
                thinkingSounds = avatar.thinking_sound_urls;
            } else if (typeof avatar.thinking_sound_urls === 'string') {
                // If it's a JSON string, parse it
                try {
                    thinkingSounds = JSON.parse(avatar.thinking_sound_urls);
                } catch (e) {
                    console.warn("Failed to parse thinking_sound_urls:", e);
                }
            }
        }

        // Fallback to single thinking_sound_url if no variations available
        if (thinkingSounds.length === 0 && avatar.thinking_sound_url) {
            thinkingSounds = [avatar.thinking_sound_url];
        }

        if (thinkingSounds.length === 0) {
            console.log("No thinking sounds available for avatar");
            return;
        }

        // Randomly select a thinking sound variation
        const randomIndex = Math.floor(Math.random() * thinkingSounds.length);
        const selectedSoundUrl = thinkingSounds[randomIndex];

        try {
            // Stop any existing thinking sound
            stopThinkingSound();

            // Create and play thinking sound
            const audio = new Audio(selectedSoundUrl);
            audio.loop = true; // Loop until stopped
            audio.volume = 0.6; // Slightly lower volume than TTS

            thinkingSoundRef.current = audio;

            audio.play().catch((error) => {
                console.error("Error playing thinking sound:", error);
            });

            console.log(`Playing thinking sound: ${selectedSoundUrl}`);
        } catch (error) {
            console.error("Error setting up thinking sound:", error);
        }
    };

    const stopThinkingSound = () => {
        if (thinkingSoundRef.current) {
            try {
                thinkingSoundRef.current.pause();
                thinkingSoundRef.current.currentTime = 0;
                thinkingSoundRef.current = null;
            } catch (error) {
                console.error("Error stopping thinking sound:", error);
            }
        }
        // Clear timeout if exists
        if (thinkingSoundTimeoutRef.current) {
            clearTimeout(thinkingSoundTimeoutRef.current);
            thinkingSoundTimeoutRef.current = null;
        }
    };

    const sendToLLM = async (text: string) => {
        if (!text.trim() || !avatar) return;

        setIsProcessing(true);

        // Start thinking sound after 2 seconds of latency
        thinkingSoundTimeoutRef.current = setTimeout(() => {
            playThinkingSound();
        }, 2000);

        try {
            // Add user message to UI
            const userMessage: Message = {
                sender: "user",
                content: text,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, userMessage]);

            // Initialize avatar response message (will be updated as chunks arrives)
            setMessages(prev => {
                const initialAvatarMessage: Message = {
                    sender: "avatar",
                    content: "",
                    timestamp: new Date()
                };
                return [...prev, initialAvatarMessage];
            });

            // Track if first audio chunk has been received
            let firstAudioChunkReceived = false;

            // Create streaming chat WebSocket
            const ws = apiService.createStreamingChat(
                avatarId,
                text,
                conversationId || undefined,
                // onTextChunk - update UI with text as it arrives
                (chunk: string) => {
                    setMessages(prev => {
                        const updated = [...prev];
                        // Find the last avatar message (the one we just created)
                        for (let i = updated.length - 1; i >= 0; i--) {
                            if (updated[i].sender === "avatar") {
                                updated[i] = {
                                    ...updated[i],
                                    content: updated[i].content + chunk
                                };
                                break;
                            }
                        }
                        return updated;
                    });
                },
                // onAudioChunk - play audio chunk immediately
                (chunkText: string, audioBase64: string) => {
                    // Stop thinking sound when first TTS audio arrives
                    if (!firstAudioChunkReceived) {
                        stopThinkingSound();
                        firstAudioChunkReceived = true;
                    }
                    playTTSAudioChunk(audioBase64);
                },
                // onComplete - finalize response
                (fullResponse: string, newConversationId: string) => {
                    // Ensure thinking sound is stopped
                    stopThinkingSound();

                    if (newConversationId) {
                        setConversationId(newConversationId);
                    }
                    setIsProcessing(false);
                    setTranscription("");
                    showSuccess("Response", "Avatar responded!");
                },
                // onError
                (error: string) => {
                    // Stop thinking sound on error
                    stopThinkingSound();

                    console.error("Streaming chat error:", error);
                    showError("Error", error);
                    setIsProcessing(false);
                }
            );

            // Store conversation WebSocket reference for cleanup
            conversationWebSocketRef.current = ws;

        } catch (error: any) {
            // Stop thinking sound on error
            stopThinkingSound();

            console.error("Error starting streaming chat:", error);
            showError("Error", error?.message || "Failed to start conversation");
            setIsProcessing(false);
        }
    };

    const playTTSAudioChunk = (base64Data: string) => {
        try {
            // Convert base64 to blob URL
            const audioBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            const blob = new Blob([audioBytes], { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(blob);

            // Create audio element
            const audio = new Audio(audioUrl);

            // Add to queue
            audioQueueRef.current.push({ url: audioUrl, audio });

            // Start playing queue if not already playing
            if (!isPlayingQueueRef.current) {
                playNextInQueue();
            }

            // Show playing indicator
            setPlayingAudio(audioUrl);
        } catch (error) {
            console.error("Error setting up TTS audio chunk:", error);
        }
    };

    const playNextInQueue = () => {
        if (audioQueueRef.current.length === 0) {
            isPlayingQueueRef.current = false;
            setPlayingAudio(null);
            return;
        }

        isPlayingQueueRef.current = true;
        const { url, audio } = audioQueueRef.current.shift()!;

        audio.onended = () => {
            URL.revokeObjectURL(url);
            playNextInQueue(); // Play next chunk
        };

        audio.onerror = () => {
            console.error("Error playing TTS audio chunk");
            URL.revokeObjectURL(url);
            playNextInQueue(); // Continue with next chunk
        };

        audio.play().catch((error) => {
            console.error("Error playing audio chunk:", error);
            URL.revokeObjectURL(url);
            playNextInQueue();
        });
    };

    const playTTSAudioFromBase64 = (base64Data: string) => {
        // Legacy method for non-streaming (fallback)
        playTTSAudioChunk(base64Data);
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

    if (loading || isInitializing) {
        return (
            <div className="min-h-screen bg-[#101621] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#4e99ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="text-white" style={{ fontFamily: 'var(--font-inter)' }}>
                        {isInitializing ? 'Initializing services...' : 'Loading session...'}
                    </div>
                    {isInitializing && (
                        <div className="text-[#c3d3e2] text-sm mt-2" style={{ fontFamily: 'var(--font-inter)' }}>
                            This may take a minute on first startup
                        </div>
                    )}
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

                        {/* Avatar with Blinking Animation */}
                        <div className="relative w-full aspect-square bg-[#101621] rounded-lg overflow-hidden mb-4">
                            {blinkingAnimationUrl ? (
                                <video
                                    ref={avatarVideoRef}
                                    src={blinkingAnimationUrl}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                    onLoadedData={() => {
                                        // Ensure video plays
                                        if (avatarVideoRef.current) {
                                            avatarVideoRef.current.play().catch(console.error);
                                        }
                                    }}
                                />
                            ) : (
                                <Image
                                    src={avatar.image_url}
                                    alt={avatar.name}
                                    fill
                                    className="object-cover"
                                />
                            )}
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
