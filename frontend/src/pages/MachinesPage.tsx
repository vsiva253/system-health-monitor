import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMachines } from "../api/machines";
import { useMachineStore } from "../store/machineStore";

export default function MachinesPage() {
  const { machines, setMachines, filters, setFilters } = useMachineStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["machines"],
    queryFn: fetchMachines,
  });

  useEffect(() => {
    if (data) setMachines(data);
  }, [data, setMachines]);

  const filteredMachines = machines.filter((m) => {
    let ok = true;
    if (filters.os) ok = ok && m.os === filters.os;
    if (filters.hasIssues !== undefined) {
      const issues =
        !m.diskEncrypted ||
        !m.osUpdated ||
        !m.antivirusInstalled ||
        !m.antivirusRunning ||
        !m.sleepPolicyOk;
      ok = ok && (filters.hasIssues ? issues : !issues);
    }
    return ok;
  });

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Machines</h2>

      {/* Filters */}
      <div className="mb-4 flex space-x-4">
        <select
          value={filters.os || ""}
          onChange={(e) => setFilters({ os: e.target.value || undefined })}
          className="border p-2 rounded"
        >
          <option value="">All OS</option>
          <option value="Windows">Windows</option>
          <option value="Linux">Linux</option>
          <option value="macOS">macOS</option>
        </select>

        <select
          value={
            filters.hasIssues === undefined
              ? ""
              : filters.hasIssues
              ? "true"
              : "false"
          }
          onChange={(e) => {
            const v = e.target.value;
            setFilters({ hasIssues: v === "" ? undefined : v === "true" });
          }}
          className="border p-2 rounded"
        >
          <option value="">All Status</option>
          <option value="true">Has Issues</option>
          <option value="false">No Issues</option>
        </select>

        <button
          onClick={() => refetch()}
          className="bg-blue-600 text-white px-3 py-1 rounded"
        >
          Refresh
        </button>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2">Machine ID</th>
              <th className="p-2">Hostname</th>
              <th className="p-2">OS</th>
              <th className="p-2">Disk Encrypted</th>
              <th className="p-2">OS Updated</th>
              <th className="p-2">Antivirus</th>
              <th className="p-2">Sleep Policy</th>
              <th className="p-2">Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {filteredMachines.map((m) => (
              <tr key={m.machineId} className="border-b hover:bg-gray-50">
                <td className="p-2">{m.machineId}</td>
                <td className="p-2">{m.hostname}</td>
                <td className="p-2">
                  {m.os} {m.osVersion}
                </td>
                <td
                  className={`p-2 ${
                    m.diskEncrypted ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {m.diskEncrypted ? "Yes" : "No"}
                </td>
                <td
                  className={`p-2 ${
                    m.osUpdated ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {m.osUpdated ? "Up-to-date" : "Pending"}
                </td>
                <td
                  className={`p-2 ${
                    m.antivirusInstalled && m.antivirusRunning
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {m.antivirusInstalled && m.antivirusRunning ? "OK" : "Issue"}
                </td>
                <td
                  className={`p-2 ${
                    m.sleepPolicyOk ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {m.sleepPolicyOk
                    ? "OK"
                    : `Timeout ${m.sleepTimeoutMinutes} min`}
                </td>
                <td className="p-2">
                  {new Date(m.lastSeenAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
