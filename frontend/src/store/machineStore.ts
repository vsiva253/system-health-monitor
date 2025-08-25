import { create } from "zustand";
import type { Machine } from "../types/machine";

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
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
}));
