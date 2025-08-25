import axios from "axios";
import type { Machine } from "../types/machine";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const fetchMachines = async (): Promise<Machine[]> => {
  const res = await axios.get(`${API_BASE}/machines`);
  return res.data.items;
};
