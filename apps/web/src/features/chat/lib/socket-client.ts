import { io, type Socket } from "socket.io-client";
import { accessTokenManager } from "@/features/auth/lib/access-token";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;
const socketOrigin = new URL(apiBaseUrl).origin;

export const socketClient: Socket = io(`${socketOrigin}/realtime`, {
  autoConnect: false,
  withCredentials: true,
  transports: ["websocket", "polling"],
  auth: (cb) => {
    cb({ token: accessTokenManager.get() });
  },
});
