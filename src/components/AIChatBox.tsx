"use client";

import { useEffect } from "react";
import "@n8n/chat/style.css";

export default function AIChatBox() {
    useEffect(() => {
        const initChat = async () => {
            try {
                const webhookUrl = process.env.NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL;

                if (!webhookUrl) {
                    console.warn("AIChatBox: NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL is not defined. Chat disabled.");
                    return;
                }

                // 1. Dynamic check for connectivity to prevent "Failed to fetch" unhandled errors
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 3000);

                    const response = await fetch(webhookUrl, {
                        method: 'GET', // Try a simple GET first to see if it exists
                        signal: controller.signal
                    }).catch(() => null);

                    clearTimeout(timeoutId);

                    if (!response || response.status === 404) {
                        console.warn(`AIChatBox: Webhook unreachable (Status: ${response?.status || 'Network Error'}). Disabling AI Chat.`);
                        return;
                    }
                } catch (connectivityError) {
                    console.warn("AIChatBox: Connectivity check failed. Skipping initialization.");
                    return;
                }

                // 2. Dynamic import the library only if connectivity is confirmed
                const { createChat } = await import("@n8n/chat");

                // 3. Ensure container exists
                const container = document.getElementById('n8n-chat-container');
                if (!container) return;

                createChat({
                    webhookUrl,
                    showWelcomeScreen: true,
                    initialMessages: [
                        'Hello! I\'m your Pillora AI assistant. 👋',
                        'How can I help you with your healthcare needs today?'
                    ],
                    i18n: {
                        en: {
                            title: 'Pillora AI',
                            subtitle: 'Expert Health & Platform Support',
                            footer: 'Secure • Professional • Instant',
                            getStarted: 'Start Consultation',
                            inputPlaceholder: 'Search medicines, check blood...',
                            closeButtonTooltip: 'Close Chat',
                        },
                    },
                });
            } catch (error) {
                // Seal all errors from this component to prevent top-level crashes
                console.warn("AIChatBox: Gracefully handled initialization failure to prevent UI crash.", error);
            }
        };

        if (typeof window !== "undefined") {
            initChat();
        }
    }, []);

    return (
        <div id="n8n-chat-container" className="fixed bottom-0 right-0 z-[9999]">
            <style jsx global>{`
                :root {
                    --chat--color--primary: #2563eb;
                    --chat--color--primary-shade-50: #1d4ed8;
                    --chat--color--primary--shade-100: #1e40af;
                    --chat--color--secondary: #4f46e5;
                    --chat--spacing: 1rem;
                    --chat--border-radius: 1.25rem;
                    
                    /* CSS Variables for n8n input */
                    --chat--message-input--background: #ffffff;
                    --chat--message-input--color: #000000;
                    --chat--message-input--placeholder--color: #6b7280;
                    
                    --chat--header--background: linear-gradient(135deg, #4f46e5 0%, #2563eb 100%);
                    --chat--header--color: #ffffff;
                    --chat--message--bot--background: #ffffff;
                    --chat--message--bot--color: #000000;
                    --chat--message--user--background: #2563eb;
                    --chat--message--user--color: #ffffff;
                    --chat--window--width: 380px;
                    --chat--window--height: 550px;
                    --chat--toggle--background: #2563eb;
                }

                /* FORCE OVERRIDE: This targets the exact input element inside n8n's shadow or container */
                #n8n-chat input, 
                #n8n-chat textarea,
                .n8n-chat-input,
                div[class*="n8n-chat-input"] input {
                    color: #000000 !important;
                    caret-color: #2563eb !important;
                    -webkit-text-fill-color: #000000 !important; /* Fix for some browser overrides */
                    opacity: 1 !important;
                }

                /* Ensure the cursor is visible even if the input is focused */
                #n8n-chat input:focus {
                    caret-color: #2563eb !important;
                }

                #n8n-chat {
                    font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
                }

                .n8n-chat-widget {
                    z-index: 9999 !important;
                }
            `}</style>
        </div>
    );
}