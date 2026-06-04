import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Single shared socket instance for the frontend app
const socket = io(SOCKET_URL, { withCredentials: true });

export default socket;
