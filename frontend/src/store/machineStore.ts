import { create } from "zustand";

export interface Machine {
  machineId: string;
  hostname: string;
  os: string;
  osVersion: string;
  diskEncrypted: boolean | null;
  osUpdated: boolean | null;
  antivirusInstalled: boolean | null;
  antivirusRunning: boolean | null;
  sleepPolicyOk: boolean | null;
  sleepTimeoutMinutes: number | null;
  lastSeenAt: string; // ISO string
}

interface MachineState {
  machines: Machine[];
  setMachines: (machines: Machine[]) => void;
  filters: { os?: string; hasIssues?: boolean };
  setFilters: (filters: Partial<MachineState["filters"]>) => void;
}

export const useMachineStore = create<MachineState>((set) => ({
  machines: [],
  setMachines: (machines) => set({ machines }),
  filters: {},
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
}));
