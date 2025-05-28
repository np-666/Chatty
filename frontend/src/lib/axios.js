import axios from "axios";

const backend = import.meta.env.VITE_BACKEND_URL;

export const axiosInstance = axios.create({
    baseURL: import.meta.env.MODE === "development" ? "http://localhost:5001/api" : `${backend}/api`,
    withCredentials: true,
});