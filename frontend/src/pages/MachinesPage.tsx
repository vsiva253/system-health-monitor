import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getCoreRowModel,
  useReactTable,
  flexRender,
  type Row,
} from "@tanstack/react-table";
import { fetchMachines } from "../api/machines";
import { useMachineStore } from "../store/machineStore";
import type { Machine } from "../types/machine";

export default function MachinesPage() {
  const { machines, setMachines, filters, setFilters } = useMachineStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["machines"],
    queryFn: fetchMachines,
  });

  useEffect(() => {
    if (data) setMachines(data);
  }, [data, setMachines]);

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

  // ----- TanStack Table Columns -----

  const columns = useMemo(
    () => [
      {
        accessorKey: "machineId",
        size: 150,
        header: () => <div>Machine ID</div>,
        cell: ({ row }: { row: Row<Machine> }) => (
          <div className="text-center">{row.original.machineId}</div>
        ),
      },
      {
        accessorKey: "hostname",
        size: 150,
        header: () => <div>Hostname</div>,
        cell: ({ row }) => (
          <div className="text-left">{row.original.hostname}</div>
        ),
      },
      {
        accessorKey: "os",
        size: 180,
        header: () => <div>OS / Version</div>,
        cell: ({ row }) => (
          <div>
            {row.original.os} {row.original.osVersion}
          </div>
        ),
      },
      {
        accessorKey: "diskEncrypted",
        size: 120,
        header: () => <div>Disk Encrypted</div>,
        cell: ({ row }) => (
          <span
            className={
              row.original.diskEncrypted ? "text-green-600" : "text-red-600"
            }
          >
            {row.original.diskEncrypted ? "Yes" : "No"}
          </span>
        ),
      },
      {
        accessorKey: "osUpdated",
        size: 120,
        header: () => <div>OS Updated</div>,
        cell: ({ row }) => (
          <span
            className={
              row.original.osUpdated ? "text-green-600" : "text-red-600"
            }
          >
            {row.original.osUpdated ? "Up-to-date" : "Pending"}
          </span>
        ),
      },
      {
        accessorKey: "antivirusInstalled",
        size: 120,
        header: () => <div>Antivirus</div>,
        cell: ({ row }) => {
          const ok =
            row.original.antivirusInstalled && row.original.antivirusRunning;
          return (
            <span className={ok ? "text-green-600" : "text-red-600"}>
              {ok ? "OK" : "Issue"}
            </span>
          );
        },
      },
      {
        accessorKey: "sleepPolicyOk",
        size: 140,
        header: () => <div>Sleep Policy</div>,
        cell: ({ row }) => {
          const ok = row.original.sleepPolicyOk;
          const minutes = row.original.sleepTimeoutMinutes;
          return (
            <span className={ok ? "text-green-600" : "text-red-600"}>
              {ok ? "OK" : `Timeout ${minutes} min`}
            </span>
          );
        },
      },
      {
        accessorKey: "lastSeenAt",
        size: 180,
        header: () => <div>Last Seen</div>,
        cell: ({ row }) => (
          <div>
            {new Date(row.original.lastSeenAt || "").toLocaleString() || "-"}
          </div>
        ),
      },
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
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-gray-200">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="border px-4 py-2 text-left">
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
                <tr key={row.id} className="border-b hover:bg-gray-50">
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
      )}
    </div>
  );
}
