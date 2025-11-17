"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface ConversationCardProps {
    conversation: {
        id: number;
        avatarName: string;
        avatarThumbnail: string;
        lastMessage: string;
        timestamp: string;
    };
}

export default function ConversationCard({ conversation }: ConversationCardProps) {
    return (
        <motion.div
            className="bg-[#101621] border border-[#4e99ff]/10 rounded-xl p-4 hover:border-[#4e99ff]/30 transition-all flex items-center gap-4 cursor-pointer group"
            whileHover={{ x: 4 }}
        >
            {/* Avatar Thumbnail */}
            <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                <Image
                    src={conversation.avatarThumbnail}
                    alt={conversation.avatarName}
                    fill
                    className="object-cover"
                />
            </div>

            {/* Conversation Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-white font-semibold text-sm" style={{ fontFamily: 'var(--font-inter)' }}>
                        {conversation.avatarName}
                    </h3>
                    <span className="text-[#c3d3e2] text-xs" style={{ fontFamily: 'var(--font-inter)' }}>
                        {conversation.timestamp}
                    </span>
                </div>
                <p className="text-[#c3d3e2] text-sm truncate" style={{ fontFamily: 'var(--font-inter)' }}>
                    {conversation.lastMessage}
                </p>
            </div>

            {/* Continue Button */}
            <button className="px-4 py-2 bg-gradient-to-r from-[#4e99ff] to-[#be65ff] text-white rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity opacity-0 group-hover:opacity-100" style={{ fontFamily: 'var(--font-inter)' }}>
                Continue
            </button>
        </motion.div>
    );
}

