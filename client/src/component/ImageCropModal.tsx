"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Cropper, { Area } from "react-easy-crop";

interface ImageCropModalProps {
    isOpen: boolean;
    imageSrc: string;
    onClose: () => void;
    onCropComplete: (croppedImageBlob: Blob) => void;
}

export default function ImageCropModal({
    isOpen,
    imageSrc,
    onClose,
    onCropComplete,
}: ImageCropModalProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropChange = useCallback((crop: { x: number; y: number }) => {
        setCrop(crop);
    }, []);

    const onZoomChange = useCallback((zoom: number) => {
        setZoom(zoom);
    }, []);

    const onCropCompleteCallback = useCallback(
        (croppedArea: Area, croppedAreaPixels: Area) => {
            setCroppedAreaPixels(croppedAreaPixels);
        },
        []
    );

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener("load", () => resolve(image));
            image.addEventListener("error", (error) => reject(error));
            image.setAttribute("crossOrigin", "anonymous");
            image.src = url;
        });

    const getCroppedImg = async (
        imageSrc: string,
        pixelCrop: Area
    ): Promise<Blob> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            throw new Error("No 2d context");
        }

        // Set canvas size to the cropped area
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        // Draw the cropped image
        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        // Convert canvas to blob
        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error("Canvas is empty"));
                    }
                },
                "image/jpeg",
                0.95
            );
        });
    };

    const handleSave = async () => {
        if (!croppedAreaPixels) {
            return;
        }

        setIsProcessing(true);
        try {
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            onCropComplete(croppedImageBlob);
            onClose();
        } catch (error) {
            console.error("Error cropping image:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-[#171c2b] border border-[#4e99ff]/20 rounded-2xl p-6 max-w-2xl w-full"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2
                            className="text-xl font-bold text-white"
                            style={{ fontFamily: "var(--font-orbitron)" }}
                        >
                            Crop Image to Square (1:1)
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-[#c3d3e2] hover:text-white transition-colors"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    <div className="relative w-full h-[400px] bg-[#101621] rounded-lg overflow-hidden mb-4">
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1} // 1:1 aspect ratio
                            onCropChange={onCropChange}
                            onZoomChange={onZoomChange}
                            onCropComplete={onCropCompleteCallback}
                            cropShape="rect"
                            showGrid={true}
                            style={{
                                containerStyle: {
                                    width: "100%",
                                    height: "100%",
                                    position: "relative",
                                },
                            }}
                        />
                    </div>

                    {/* Zoom Control */}
                    <div className="mb-4">
                        <label
                            className="block text-sm font-semibold text-white mb-2"
                            style={{ fontFamily: "var(--font-inter)" }}
                        >
                            Zoom: {zoom.toFixed(2)}x
                        </label>
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.1}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full h-2 bg-[#101621] rounded-lg appearance-none cursor-pointer accent-[#4e99ff]"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-[#171c2b] border border-[#4e99ff]/20 text-[#c3d3e2] rounded-lg hover:bg-[#101621] transition-colors"
                            style={{ fontFamily: "var(--font-inter)" }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isProcessing || !croppedAreaPixels}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-[#0fffc3] to-[#4e99ff] text-[#101621] rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ fontFamily: "var(--font-inter)" }}
                        >
                            {isProcessing ? "Processing..." : "Save Cropped Image"}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

