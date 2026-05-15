"use client";
import React, { useState } from "react";
import { Share2, Check } from "lucide-react";

interface ShareButtonProps {
    title: string;
    text: string;
    url: string;
    className?: string;
}

export default function ShareButton({ title, text, url, className }: ShareButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const shareData = {
            title: title,
            text: text,
            url: url.startsWith('http') ? url : `${window.location.origin}${url}`
        };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    console.error("Error sharing:", err);
                }
            }
        } else {
            // Fallback to copy to clipboard
            try {
                await navigator.clipboard.writeText(shareData.url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error("Error copying to clipboard:", err);
            }
        }
    };

    return (
        <button
            onClick={handleShare}
            className={`p-2 rounded-lg transition-all flex items-center justify-center gap-1 ${className || 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            title="Share Product"
        >
            {copied ? (
                <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-[10px] font-bold text-green-600 animate-in fade-in slide-in-from-right-1">Copied!</span>
                </>
            ) : (
                <Share2 className="w-4 h-4" />
            )}
        </button>
    );
}
