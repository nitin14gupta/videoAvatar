"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiService } from "@/src/api/apiService";
import { useToast } from "@/src/context/ToastContext";
import ImageCropModal from "./ImageCropModal";

interface CreateAvatarModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateAvatarModal({ isOpen, onClose, onSuccess }: CreateAvatarModalProps) {
    const { showError, showSuccess } = useToast();
    const [loading, setLoading] = useState(false);
    const [generatingPrompt, setGeneratingPrompt] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [roleTitle, setRoleTitle] = useState("");
    const [description, setDescription] = useState("");
    const [specialty, setSpecialty] = useState("");
    const [personality, setPersonality] = useState("");
    const [templatePrompt, setTemplatePrompt] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [audioDuration, setAudioDuration] = useState<number | null>(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);

    const imageInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check if it's an image file
            if (!file.type.startsWith("image/")) {
                showError("Image Error", "Please select an image file");
                return;
            }

            // Read the file and show crop modal
                    const reader = new FileReader();
                    reader.onloadend = () => {
                const imageUrl = reader.result as string;
                setImageToCrop(imageUrl);
                setShowCropModal(true);
                    };
                    reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = (croppedImageBlob: Blob) => {
        // Create a File from the blob
        const croppedFile = new File([croppedImageBlob], "cropped-avatar.jpg", {
            type: "image/jpeg",
        });
        
        setImageFile(croppedFile);
        
        // Create preview URL
        const previewUrl = URL.createObjectURL(croppedImageBlob);
        setImagePreview(previewUrl);
        
        setShowCropModal(false);
        setImageToCrop(null);
    };

    const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const audio = new Audio();
            audio.onloadedmetadata = () => {
                const duration = audio.duration;
                if (duration < 6 || duration > 40) {
                    showError("Audio Error", "Audio must be between 6 and 40 seconds");
                    setAudioFile(null);
                    return;
                }
                setAudioFile(file);
                setAudioDuration(duration);
            };
            audio.onerror = () => {
                showError("Audio Error", "Invalid audio file");
                setAudioFile(null);
            };
            audio.src = URL.createObjectURL(file);
        }
    };

    const handleGeneratePrompt = async () => {
        if (!roleTitle || !description) {
            showError("Missing Info", "Please provide role title and description first");
            return;
        }

        setGeneratingPrompt(true);
        try {
            const prompt = await apiService.generateTemplatePrompt(roleTitle, description, specialty || undefined);
            setTemplatePrompt(prompt);
            showSuccess("Generated", "Template prompt generated successfully!");
        } catch (error: any) {
            showError("Generation Failed", error?.message || "Failed to generate template prompt");
        } finally {
            setGeneratingPrompt(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !roleTitle || !imageFile) {
            showError("Missing Fields", "Please fill in all required fields");
            return;
        }

        setLoading(true);
        try {
            // Upload image
            const imageResult = await apiService.uploadAvatarImage(imageFile);

            // Upload audio if provided
            let audioUrl = null;
            if (audioFile) {
                const audioResult = await apiService.uploadAvatarAudio(audioFile);
                audioUrl = audioResult.url;
            }

            // Create avatar
            await apiService.createAvatar({
                name,
                role_title: roleTitle,
                description: description || undefined,
                image_url: imageResult.url,
                audio_url: audioUrl || undefined,
                language: "en",
                specialty: specialty || undefined,
                personality: personality || undefined,
                template_prompt: templatePrompt || undefined,
            });

            showSuccess("Success", "Avatar created successfully!");
            onSuccess();
            handleClose();
        } catch (error: any) {
            showError("Creation Failed", error?.message || "Failed to create avatar");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setName("");
        setRoleTitle("");
        setDescription("");
        setSpecialty("");
        setPersonality("");
        setTemplatePrompt("");
        setImageFile(null);
        setAudioFile(null);
        setImagePreview(null);
        setAudioDuration(null);
        setShowCropModal(false);
        setImageToCrop(null);
        // Clean up object URLs
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-[#171c2b] border border-[#4e99ff]/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-orbitron)' }}>
                            Create Custom Avatar
                        </h2>
                        <button
                            onClick={handleClose}
                            className="text-[#c3d3e2] hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-semibold text-white mb-2" style={{ fontFamily: 'var(--font-inter)' }}>
                                Avatar Image (will be cropped to 1:1) *
                            </label>
                            <div className="flex items-center gap-4">
                                {imagePreview ? (
                                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-[#4e99ff]">
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-24 h-24 rounded-lg border-2 border-dashed border-[#4e99ff]/30 flex items-center justify-center">
                                        <svg className="w-8 h-8 text-[#4e99ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => imageInputRef.current?.click()}
                                    className="px-4 py-2 bg-[#4e99ff]/20 border border-[#4e99ff] text-[#4e99ff] rounded-lg hover:bg-[#4e99ff]/30 transition-colors"
                                    style={{ fontFamily: 'var(--font-inter)' }}
                                >
                                    {imageFile ? "Change Image" : "Upload Image"}
                                </button>
                                <input
                                    ref={imageInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </div>
                        </div>

                        {/* Audio Upload */}
                        <div>
                            <label className="block text-sm font-semibold text-white mb-2" style={{ fontFamily: 'var(--font-inter)' }}>
                                Voice Audio (6-40 seconds)
                            </label>
                            <div className="flex items-center gap-4">
                                {audioFile ? (
                                    <div className="px-4 py-2 bg-[#171c2b] border border-[#0fffc3] rounded-lg">
                                        <p className="text-[#0fffc3] text-sm" style={{ fontFamily: 'var(--font-inter)' }}>
                                            {audioFile.name} ({audioDuration?.toFixed(1)}s)
                                        </p>
                                    </div>
                                ) : (
                                    <div className="px-4 py-2 bg-[#171c2b] border border-[#4e99ff]/30 rounded-lg">
                                        <p className="text-[#c3d3e2] text-sm" style={{ fontFamily: 'var(--font-inter)' }}>
                                            No audio selected
                                        </p>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => audioInputRef.current?.click()}
                                    className="px-4 py-2 bg-[#4e99ff]/20 border border-[#4e99ff] text-[#4e99ff] rounded-lg hover:bg-[#4e99ff]/30 transition-colors"
                                    style={{ fontFamily: 'var(--font-inter)' }}
                                >
                                    {audioFile ? "Change Audio" : "Upload Audio"}
                                </button>
                                <input
                                    ref={audioInputRef}
                                    type="file"
                                    accept="audio/*"
                                    onChange={handleAudioChange}
                                    className="hidden"
                                />
                            </div>
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-semibold text-white mb-2" style={{ fontFamily: 'var(--font-inter)' }}>
                                Name *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2 bg-[#101621] border border-[#4e99ff]/20 rounded-lg text-white focus:border-[#4e99ff] focus:outline-none"
                                style={{ fontFamily: 'var(--font-inter)' }}
                                required
                            />
                        </div>

                        {/* Role Title */}
                        <div>
                            <label className="block text-sm font-semibold text-white mb-2" style={{ fontFamily: 'var(--font-inter)' }}>
                                Role Title *
                            </label>
                            <input
                                type="text"
                                value={roleTitle}
                                onChange={(e) => setRoleTitle(e.target.value)}
                                className="w-full px-4 py-2 bg-[#101621] border border-[#4e99ff]/20 rounded-lg text-white focus:border-[#4e99ff] focus:outline-none"
                                style={{ fontFamily: 'var(--font-inter)' }}
                                placeholder="e.g., Doctor, Teacher, Consultant"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-white mb-2" style={{ fontFamily: 'var(--font-inter)' }}>
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-2 bg-[#101621] border border-[#4e99ff]/20 rounded-lg text-white focus:border-[#4e99ff] focus:outline-none"
                                style={{ fontFamily: 'var(--font-inter)' }}
                                rows={2}
                            />
                        </div>

                        {/* Language */}
                        <div>
                            <label className="block text-sm font-semibold text-white mb-2" style={{ fontFamily: 'var(--font-inter)' }}>
                                Language
                            </label>
                            <select
                                value="en"
                                className="w-full px-4 py-2 bg-[#101621] border border-[#4e99ff]/20 rounded-lg text-white focus:border-[#4e99ff] focus:outline-none"
                                style={{ fontFamily: 'var(--font-inter)' }}
                                disabled
                            >
                                <option value="en">English</option>
                            </select>
                        </div>

                        {/* Specialty */}
                        <div>
                            <label className="block text-sm font-semibold text-white mb-2" style={{ fontFamily: 'var(--font-inter)' }}>
                                Specialty
                            </label>
                            <input
                                type="text"
                                value={specialty}
                                onChange={(e) => setSpecialty(e.target.value)}
                                className="w-full px-4 py-2 bg-[#101621] border border-[#4e99ff]/20 rounded-lg text-white focus:border-[#4e99ff] focus:outline-none"
                                style={{ fontFamily: 'var(--font-inter)' }}
                                placeholder="e.g., Dentistry, Mathematics, Sales"
                            />
                        </div>

                        {/* Personality */}
                        <div>
                            <label className="block text-sm font-semibold text-white mb-2" style={{ fontFamily: 'var(--font-inter)' }}>
                                Personality
                            </label>
                            <input
                                type="text"
                                value={personality}
                                onChange={(e) => setPersonality(e.target.value)}
                                className="w-full px-4 py-2 bg-[#101621] border border-[#4e99ff]/20 rounded-lg text-white focus:border-[#4e99ff] focus:outline-none"
                                style={{ fontFamily: 'var(--font-inter)' }}
                                placeholder="e.g., Friendly, professional, patient"
                            />
                        </div>

                        {/* Template Prompt */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Template Prompt
                                </label>
                                <button
                                    type="button"
                                    onClick={handleGeneratePrompt}
                                    disabled={generatingPrompt || !roleTitle || !description}
                                    className="px-3 py-1 bg-gradient-to-r from-[#0fffc3] to-[#4e99ff] text-[#101621] rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ fontFamily: 'var(--font-inter)' }}
                                >
                                    {generatingPrompt ? "Generating..." : "Generate with AI"}
                                </button>
                            </div>
                            <textarea
                                value={templatePrompt}
                                onChange={(e) => setTemplatePrompt(e.target.value)}
                                className="w-full px-4 py-2 bg-[#101621] border border-[#4e99ff]/20 rounded-lg text-white focus:border-[#4e99ff] focus:outline-none"
                                style={{ fontFamily: 'var(--font-inter)' }}
                                rows={4}
                                placeholder="AI-generated prompt will appear here..."
                            />
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 px-4 py-2 bg-[#171c2b] border border-[#4e99ff]/20 text-[#c3d3e2] rounded-lg hover:bg-[#101621] transition-colors"
                                style={{ fontFamily: 'var(--font-inter)' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-[#0fffc3] to-[#4e99ff] text-[#101621] rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                                style={{ fontFamily: 'var(--font-inter)' }}
                            >
                                {loading ? "Creating..." : "Create Avatar"}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>

            {/* Image Crop Modal */}
            {showCropModal && imageToCrop && (
                <ImageCropModal
                    isOpen={showCropModal}
                    imageSrc={imageToCrop}
                    onClose={() => {
                        setShowCropModal(false);
                        setImageToCrop(null);
                        // Reset file input
                        if (imageInputRef.current) {
                            imageInputRef.current.value = "";
                        }
                    }}
                    onCropComplete={handleCropComplete}
                />
            )}
        </AnimatePresence>
    );
}

