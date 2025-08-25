export interface Machine {
  _id: string;
  machineId: string;
  hostname: string;
  os: string;
  osVersion: string;
  diskEncrypted: boolean;
  osUpdated: boolean;
  antivirusInstalled: boolean;
  antivirusRunning: boolean;
  sleepPolicyOk: boolean;
  sleepTimeoutMinutes?: number;
  lastSeenAt?: string;
}
