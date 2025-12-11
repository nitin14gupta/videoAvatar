"use client";
// Realistic reptile cursor: articulated spine with fixed segment lengths and orientation.
// Desktop-only. Canvas-based, no layout thrash. Tail undulates with slight noise.

import { useEffect, useMemo, useRef } from "react";

type Segment = { x: number; y: number; angle: number };

export default function CustomCursor() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const pointerRef = useRef({ x: 0, y: 0 });
    const segmentsRef = useRef<Segment[]>([]);
    const rafRef = useRef<number | null>(null);
    const timeRef = useRef(0);

    const isDesktop = useMemo(() => {
        if (typeof window === "undefined") return false;
        return window.matchMedia("(pointer: fine)").matches;
    }, []);

    useEffect(() => {
        if (!isDesktop) return;
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const onResize = () => {
            const dpr = Math.min(2, window.devicePixelRatio || 1);
            canvas.width = Math.floor(window.innerWidth * dpr);
            canvas.height = Math.floor(window.innerHeight * dpr);
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        onResize();
        window.addEventListener("resize", onResize);

        const segCount = 32;
        const startX = window.innerWidth / 2;
        const startY = window.innerHeight / 2;
        segmentsRef.current = Array.from({ length: segCount }, (_, i) => ({ x: startX - i * 8, y: startY, angle: 0 }));

        const onMove = (e: PointerEvent) => {
            pointerRef.current.x = e.clientX;
            pointerRef.current.y = e.clientY;
        };
        window.addEventListener("pointermove", onMove, { passive: true });

        const render = () => {
            timeRef.current += 0.016;
            const { x: px, y: py } = pointerRef.current;
            const segments = segmentsRef.current;

            // Constraints: each segment keeps a fixed length to the previous
            const length = 12; // bone length
            // Head seeks the pointer with easing
            const head = segments[0];
            head.x += (px - head.x) * 0.25;
            head.y += (py - head.y) * 0.25;
            for (let i = 1; i < segments.length; i++) {
                const prev = segments[i - 1];
                const s = segments[i];
                // add slight sine offset to emulate reptile slither
                const wave = Math.sin(timeRef.current * 6 + i * 0.5) * 2.2;
                const dx = prev.x - s.x;
                const dy = prev.y - s.y;
                const ang = Math.atan2(dy, dx) + wave * 0.01;
                s.angle = ang;
                const tx = prev.x - Math.cos(ang) * length;
                const ty = prev.y - Math.sin(ang) * length;
                s.x += (tx - s.x) * 0.9;
                s.y += (ty - s.y) * 0.9;
            }

            // draw
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // body
            for (let i = segments.length - 1; i >= 0; i--) {
                const s = segments[i];
                const t = i / segments.length;
                const w = 14 * (1 - t * 0.85); // taper
                ctx.save();
                ctx.translate(s.x, s.y);
                ctx.rotate(s.angle);
                ctx.beginPath();
                ctx.fillStyle = i < 4 ? "#9be870" : "rgba(188,19,254," + (0.15 + 0.7 * (1 - t)) + ")";
                ctx.strokeStyle = "rgba(125,18,255,0.5)";
                ctx.lineWidth = 1.2;
                ctx.ellipse(0, 0, w, w * 0.6, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }

            // head details: eyes + little legs
            ctx.save();
            ctx.translate(head.x, head.y);
            ctx.fillStyle = "#2d2a2e";
            ctx.beginPath();
            ctx.arc(6, -4, 2.2, 0, Math.PI * 2);
            ctx.arc(6, 4, 2.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            rafRef.current = requestAnimationFrame(render);
        };
        rafRef.current = requestAnimationFrame(render);

        return () => {
            window.removeEventListener("resize", onResize);
            window.removeEventListener("pointermove", onMove);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [isDesktop]);

    if (!isDesktop) return null;
    return (
        <canvas
            ref={canvasRef}
            className="pointer-events-none fixed inset-0 z-[60] mix-blend-screen"
            aria-hidden
        />
    );
}