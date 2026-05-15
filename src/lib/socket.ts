
import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'https://apex-backend-theta.vercel.app';

export const socket = io(SOCKET_URL, {
    autoConnect: false,
    withCredentials: true,
});
