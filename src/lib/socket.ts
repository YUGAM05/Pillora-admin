
import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || (process.env.NODE_ENV === 'production' ? 'https://apex-backend-theta.vercel.app' : 'http://localhost:5000');

/**
 * Real-time updates need a long-running Socket.io server. The production
 * backend runs on Vercel serverless, which cannot host websockets, so
 * connecting there only produces an endless loop of 404 polling requests.
 * Real-time is therefore enabled only when a dedicated NEXT_PUBLIC_SOCKET_URL
 * is configured, or in local development.
 */
export const REALTIME_ENABLED = !!process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NODE_ENV !== 'production';

export const socket = io(SOCKET_URL, {
    autoConnect: false,
    withCredentials: true,
    reconnectionAttempts: 5,
    reconnectionDelayMax: 10000,
});

if (!REALTIME_ENABLED) {
    // Existing callers use socket.connect(); make it a no-op so pages keep
    // working (they already re-fetch data) without spamming failed requests.
    socket.connect = (() => socket) as typeof socket.connect;
}
