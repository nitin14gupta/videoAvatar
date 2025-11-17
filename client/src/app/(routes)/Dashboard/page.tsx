"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/src/context/AuthContext";
import CustomCursor from "@/src/component/CustomCursor";
import AvatarCard from "@/src/component/AvatarCard";
import ConversationCard from "@/src/component/ConversationCard";

export default function DashboardPage() {
    const { user, logout } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [darkMode, setDarkMode] = useState(true);

    // Sample data - replace with actual API calls
    const defaultAvatars = [
        { id: 1, name: "Doctor", role: "Medical Professional", thumbnail: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop" },
        { id: 2, name: "Salesman", role: "Sales Representative", thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop" },
        { id: 3, name: "Teacher", role: "Educator", thumbnail: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop" },
        { id: 4, name: "Consultant", role: "Business Advisor", thumbnail: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop" },
    ];

    const userAvatars = [
        { id: 5, name: user?.name || "Custom Avatar", role: "Personal", thumbnail: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop" },
    ];

    const recentConversations = [
        { id: 1, avatarName: "Doctor", avatarThumbnail: defaultAvatars[0].thumbnail, lastMessage: "Good morning, how can I help you today?", timestamp: "2 hours ago" },
        { id: 2, avatarName: "Salesman", avatarThumbnail: defaultAvatars[1].thumbnail, lastMessage: "Hello! Want to know about our latest products?", timestamp: "1 day ago" },
    ];

    return (
        <div className="min-h-screen bg-[#101621] relative overflow-hidden">
            <CustomCursor />

            {/* Top Bar */}
            <TopBar
                userName={user?.name || "User"}
                userEmail={user?.email || ""}
                showUserMenu={showUserMenu}
                setShowUserMenu={setShowUserMenu}
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                onLogout={logout}
            />

            {/* Main Content */}
            <main className="container mx-auto px-6 py-8 max-w-7xl">
                {/* Welcome Banner */}
                <WelcomeBanner userName={user?.name || "User"} />

                {/* Avatars Section */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Default Avatars */}
                    <AvatarsSection
                        title="Default Avatars"
                        avatars={defaultAvatars}
                        emptyMessage="No default avatars available"
                    />

                    {/* Your Avatars */}
                    <AvatarsSection
                        title="Your Avatars"
                        avatars={userAvatars}
                        emptyMessage="No avatars yet, upload to get started!"
                        showCreateButton={true}
                    />
                </div>

                {/* Recent Conversations */}
                <RecentConversationsSection conversations={recentConversations} />
            </main>

            {/* Floating Create Button */}
            <FloatingCreateButton />
        </div>
    );
}

// Top Bar Component
function TopBar({
    userName,
    userEmail,
    showUserMenu,
    setShowUserMenu,
    darkMode,
    setDarkMode,
    onLogout
}: {
    userName: string;
    userEmail: string;
    showUserMenu: boolean;
    setShowUserMenu: (show: boolean) => void;
    darkMode: boolean;
    setDarkMode: (dark: boolean) => void;
    onLogout: () => void;
}) {
    const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };

        if (showUserMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserMenu, setShowUserMenu]);

    return (
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-card border-b border-[#4e99ff]/10 mb-8"
        >
            <div className="container mx-auto px-6 py-4 max-w-7xl flex items-center justify-between">
                {/* Logo */}
                <div className="text-2xl font-bold gradient-text" style={{ fontFamily: 'var(--font-orbitron)' }}>
                    VideoAvatar
                </div>

                {/* Centered Title */}
                <div className="hidden md:block text-xl font-semibold text-white">
                    Your Dashboard
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-4">
                    {/* Dark Mode Toggle */}
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="p-2 rounded-lg hover:bg-[#171c2b] transition-colors"
                        aria-label="Toggle dark mode"
                    >
                        {darkMode ? (
                            <svg className="w-5 h-5 text-[#c3d3e2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 text-[#c3d3e2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        )}
                    </button>

                    {/* User Profile */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#171c2b] transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4e99ff] to-[#be65ff] flex items-center justify-center text-white font-semibold text-sm">
                                {initials}
                            </div>
                            <div className="hidden md:block text-left">
                                <div className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-inter)' }}>
                                    {userName}
                                </div>
                                <div className="text-xs text-[#c3d3e2]" style={{ fontFamily: 'var(--font-inter)' }}>
                                    {userEmail}
                                </div>
                            </div>
                            <svg className="w-4 h-4 text-[#c3d3e2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {showUserMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute right-0 mt-2 w-48 bg-[#171c2b] border border-[#4e99ff]/20 rounded-xl shadow-xl overflow-hidden z-50"
                            >
                                <button
                                    onClick={() => {
                                        setShowUserMenu(false);
                                        // Navigate to profile
                                    }}
                                    className="w-full px-4 py-3 text-left text-sm text-[#c3d3e2] hover:bg-[#101621] transition-colors"
                                    style={{ fontFamily: 'var(--font-inter)' }}
                                >
                                    Profile
                                </button>
                                <button
                                    onClick={() => {
                                        setShowUserMenu(false);
                                        // Navigate to settings
                                    }}
                                    className="w-full px-4 py-3 text-left text-sm text-[#c3d3e2] hover:bg-[#101621] transition-colors"
                                    style={{ fontFamily: 'var(--font-inter)' }}
                                >
                                    Settings
                                </button>
                                <div className="border-t border-[#4e99ff]/10" />
                                <button
                                    onClick={() => {
                                        setShowUserMenu(false);
                                        onLogout();
                                    }}
                                    className="w-full px-4 py-3 text-left text-sm text-[#ef476f] hover:bg-[#101621] transition-colors"
                                    style={{ fontFamily: 'var(--font-inter)' }}
                                >
                                    Logout
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </motion.nav>
    );
}

// Welcome Banner Component
function WelcomeBanner({ userName }: { userName: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#171c2b] border border-[#4e99ff]/10 rounded-2xl p-6 mb-8"
        >
            <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-inter)' }}>
                Welcome, {userName} 👋
            </h1>
            <p className="text-[#c3d3e2]" style={{ fontFamily: 'var(--font-inter)' }}>
                Create your first avatar or start a conversation!
            </p>
        </motion.div>
    );
}

// Avatars Section Component
function AvatarsSection({
    title,
    avatars,
    emptyMessage,
    showCreateButton = false
}: {
    title: string;
    avatars: any[];
    emptyMessage: string;
    showCreateButton?: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#171c2b] border border-[#4e99ff]/10 rounded-2xl p-6"
        >
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-inter)' }}>
                    {title}
                </h2>
                {showCreateButton && (
                    <button className="px-4 py-2 bg-gradient-to-r from-[#4e99ff] to-[#be65ff] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity" style={{ fontFamily: 'var(--font-inter)' }}>
                        + Create New
                    </button>
                )}
            </div>

            {avatars.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-[#c3d3e2]" style={{ fontFamily: 'var(--font-inter)' }}>
                        {emptyMessage}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {avatars.map((avatar) => (
                        <AvatarCard key={avatar.id} avatar={avatar} />
                    ))}
                </div>
            )}
        </motion.div>
    );
}

// Recent Conversations Section
function RecentConversationsSection({ conversations }: { conversations: any[] }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#171c2b] border border-[#4e99ff]/10 rounded-2xl p-6"
        >
            <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-inter)' }}>
                Recent Conversations
            </h2>

            {conversations.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-[#c3d3e2]" style={{ fontFamily: 'var(--font-inter)' }}>
                        No conversations yet. Start chatting with an avatar!
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {conversations.map((conversation) => (
                        <ConversationCard key={conversation.id} conversation={conversation} />
                    ))}
                </div>
            )}
        </motion.div>
    );
}

// Floating Create Button
function FloatingCreateButton() {
    return (
        <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-[#0fffc3] to-[#4e99ff] rounded-full shadow-lg flex items-center justify-center text-[#101621] font-bold text-2xl hover:scale-110 transition-transform glow-mint z-40"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
        >
            +
        </motion.button>
    );
}
