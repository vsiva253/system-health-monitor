import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";

import { fetchMachines } from "../api/machines";
import { fetchReports } from "../api/reports";
import type { Machine } from "../types/machine";
import type { Report } from "../types/report";

export default function MachinesPage() {
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [filters, setFilters] = useState<{ os?: string; hasIssues?: boolean }>(
    {}
  );
  const {
    data: machines = [],
    isLoading,
    refetch,
  } = useQuery<Machine[]>({
    queryKey: ["machines"],
    queryFn: fetchMachines,
  });
  const { data: reports } = useQuery<Report[]>({
    queryKey: ["reports", selectedMachine?.machineId],
    queryFn: () => fetchReports(selectedMachine!.machineId),
    enabled: !!selectedMachine,
  });
  console.log(reports);

  const filteredMachines = useMemo(() => {
    return machines.filter((m) => {
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
  }, [machines, filters]);

  const columns = useMemo(
    () => [
      { accessorKey: "machineId", header: "Machine ID" },
      { accessorKey: "hostname", header: "Hostname" },
      { accessorKey: "os", header: "OS / Version" },
      { accessorKey: "diskEncrypted", header: "Disk Encrypted" },
      { accessorKey: "osUpdated", header: "OS Updated" },
      { accessorKey: "antivirusInstalled", header: "Antivirus" },
      { accessorKey: "sleepPolicyOk", header: "Sleep Policy" },
      { accessorKey: "lastSeenAt", header: "Last Seen" },
    ],
    []
  );

  const table = useReactTable<Machine>({
    data: filteredMachines,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Machines</h2>

      {/* Filters */}
      <div className="mb-4 flex space-x-4">
        <select
          value={filters.os || ""}
          onChange={(e) =>
            setFilters({ ...filters, os: e.target.value || undefined })
          }
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
            setFilters({
              ...filters,
              hasIssues: v === "" ? undefined : v === "true",
            });
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
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="bg-gray-200">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="border px-4 py-2 text-left"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`border-b hover:bg-gray-50 cursor-pointer ${
                      selectedMachine?._id === row.original._id
                        ? "bg-gray-100"
                        : ""
                    }`}
                    onClick={() => setSelectedMachine(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="border px-4 py-2">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Reports */}
          {selectedMachine && reports && reports?.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-2">
                Reports for {selectedMachine.hostname} (
                {selectedMachine.machineId})
              </h3>
              <table className="min-w-full border border-gray-300">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border px-4 py-2">Timestamp</th>
                    <th className="border px-4 py-2">OS Updated</th>
                    <th className="border px-4 py-2">Disk Encrypted</th>
                    <th className="border px-4 py-2">Antivirus</th>
                    <th className="border px-4 py-2">Sleep Policy</th>
                  </tr>
                </thead>
                <tbody>
                  <tbody>
                    {(reports || []).map((r) => (
                      <tr key={r._id} className="border-b hover:bg-gray-50">
                        <td className="border px-4 py-2">
                          {new Date(r.createdAt).toLocaleString()}
                        </td>
                        <td className="border px-4 py-2">
                          {r.payload.osUpdated ? "Up-to-date" : "Pending"}
                        </td>
                        <td className="border px-4 py-2">
                          {r.payload.diskEncrypted ? "Yes" : "No"}
                        </td>
                        <td className="border px-4 py-2">
                          {r.payload.antivirusInstalled &&
                          r.payload.antivirusRunning
                            ? "OK"
                            : "Issue"}
                        </td>
                        <td className="border px-4 py-2">
                          {r.payload.sleepPolicyOk
                            ? "OK"
                            : `Timeout ${r.payload.sleepTimeoutMinutes} min`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
