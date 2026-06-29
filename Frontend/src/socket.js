import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "https://agrigate-backend-drsi.onrender.com";

// Single shared socket instance for the frontend app
const socket = io(SOCKET_URL, { withCredentials: true });

export default socket;
