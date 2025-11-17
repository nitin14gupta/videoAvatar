"use client";

import { useEffect, useState } from "react";

export default function CustomCursor() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [cursorTrail, setCursorTrail] = useState<Array<{ x: number; y: number; id: number }>>([]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
            setCursorTrail((prev) => {
                const newTrail = [...prev, { x: e.clientX, y: e.clientY, id: Date.now() }];
                return newTrail.slice(-10); // Keep last 10 positions
            });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-50">
            {cursorTrail.map((point, index) => (
                <div
                    key={point.id}
                    className="absolute w-2 h-2 rounded-full bg-[#0fffc3] opacity-30 blur-sm"
                    style={{
                        left: point.x - 4,
                        top: point.y - 4,
                        transition: "opacity 0.3s",
                        opacity: (10 - index) / 10 * 0.3,
                    }}
                />
            ))}
            <div
                className="absolute w-4 h-4 rounded-full border-2 border-[#0fffc3] pointer-events-none"
                style={{
                    left: mousePosition.x - 8,
                    top: mousePosition.y - 8,
                    transition: "transform 0.1s",
                    boxShadow: "0 0 20px rgba(15, 255, 195, 0.5)",
                }}
            />
        </div>
    );
}

