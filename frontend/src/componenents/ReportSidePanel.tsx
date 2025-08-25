import { motion, AnimatePresence } from "framer-motion";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  getPaginationRowModel,
} from "@tanstack/react-table";
import type { Report } from "../types/report";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  machineName: string;
  reports: Report[];
}

const ReportSidePanel: React.FC<Props> = ({
  isOpen,
  onClose,
  machineName,
  reports,
}) => {

  // Define columns for React Table
  const columns: ColumnDef<Report>[] = [
    {
      accessorKey: "createdAt",
      header: "Timestamp",
      cell: (info) => new Date(info.getValue() as string).toLocaleString(),
    },
    {
      accessorKey: "payload.osUpdated",
      header: "OS Updated",
      cell: (info) => (info.getValue() ? "Up-to-date" : "Pending"),
    },
    {
      accessorKey: "payload.diskEncrypted",
      header: "Disk Encrypted",
      cell: (info) => (info.getValue() ? "Yes" : "No"),
    },
    {
      accessorKey: "payload.antivirusInstalled",
      header: "Antivirus",
      cell: (info) => (info.getValue() ? "OK" : "Issue"),
    },
  ];

  const table = useReactTable({
    data: reports,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(), 
    initialState: { pagination: { pageIndex: 0, pageSize : 10 } },
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="fixed inset-0  bg-opacity-50" onClick={onClose} />

          <motion.div
            className="relative w-1/2 bg-white h-full shadow-xl overflow-y-auto"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-4 flex justify-between items-center border-b">
              <h3 className="text-lg font-bold">Reports: {machineName}</h3>
              <button
                className="text-gray-500 hover:text-gray-800"
                onClick={onClose}
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              {reports.length === 0 ? (
                <p>No reports available.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300">
                    <thead>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id} className="bg-gray-100">
                          {headerGroup.headers.map((header) => (
                            <th key={header.id} className="border px-2 py-1">
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
                        <tr key={row.id} className="border-b">
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="border px-2 py-1">
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

                  {/* Pagination Controls */}
                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      Page {table.getState().pagination.pageIndex + 1} of{" "}
                      {table.getPageCount()}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                      >
                        Next
                      </button>
                      <select
                        value={table.getState().pagination.pageSize}
                        onChange={(e) => {
                          table.setPageSize(Number(e.target.value));
                        }}
                        className="border p-1 rounded"
                      >
                        {[5, 10, 20, 50].map((size) => (
                          <option key={size} value={size}>
                            Show {size}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReportSidePanel;
