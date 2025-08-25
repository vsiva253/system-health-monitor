export interface ReportPayload {
  machineId: string;
  hostname?: string;
  os?: string;
  osVersion?: string;
  diskEncrypted?: boolean | null;
  osUpdated?: boolean | null;
  updatesPending?: number | null;
  antivirusInstalled?: boolean | null;
  antivirusRunning?: boolean | null;
  antivirusName?: string | null;
  sleepPolicyOk?: boolean | null;
  sleepTimeoutMinutes?: number | null;
  timestamp?: string;
}

export interface Report {
  _id: string;
  machineId: string;
  payload: ReportPayload;
  createdAt: string;
}
