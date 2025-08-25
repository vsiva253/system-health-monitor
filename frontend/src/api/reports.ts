import axios from "axios";
import type { Report } from "../types/report";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const fetchReports = async (machineId: string): Promise<Report[]> => {
  const res = await axios.get(`${API_BASE}/api/reports/${machineId}`);
  return res.data || [];
};
