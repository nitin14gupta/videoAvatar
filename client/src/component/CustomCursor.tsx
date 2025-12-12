"use client";

import { useEffect, useState } from "react";

export default function CustomCursor() {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const updateCursorPosition = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY });
        };

        const handleMouseEnter = () => setIsVisible(true);
        const handleMouseLeave = () => setIsVisible(false);

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const isInteractive =
                target.tagName === "A" ||
                target.tagName === "BUTTON" ||
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.tagName === "SELECT" ||
                target.onclick !== null ||
                target.style.cursor === "pointer" ||
                window.getComputedStyle(target).cursor === "pointer";
            setIsHovering(isInteractive);
        };

        window.addEventListener("mousemove", updateCursorPosition);
        window.addEventListener("mouseover", handleMouseOver);
        document.addEventListener("mouseenter", handleMouseEnter);
        document.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            window.removeEventListener("mousemove", updateCursorPosition);
            window.removeEventListener("mouseover", handleMouseOver);
            document.removeEventListener("mouseenter", handleMouseEnter);
            document.removeEventListener("mouseleave", handleMouseLeave);
            document.body.classList.remove("custom-cursor-active");
        };
    }, []);

    if (!isVisible) return null;

    return (
        <div
            className="custom-cursor fixed pointer-events-none z-9999"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: "translate(-25%, -25%)",
                transition: "transform 0.15s cubic-bezier(0.2, 0, 0.2, 1)",
            }}
        >

            {/* White Cursor Arrow */}
            <div
                className="absolute"
                style={{
                    width: "18px",
                    height: "18px",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                }}
            >
                <svg
                    width="32"
                    height="32"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M2 2L14 9L9 10.5L6.5 15L2 6Z"
                        fill="black"
                        stroke="white"
                        strokeWidth="0.9"
                    />
                </svg>
            </div>
        </div>
    );
}

