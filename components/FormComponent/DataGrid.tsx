"use client";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ColumnDef,
  Row,
  HeaderContext,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type VisibilityState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronDown,
  EllipsisVertical,
  Eye,
  Edit,
  Trash,
  Check,
  ArrowUpDown,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ViewModal } from "@/components/ui/ViewModal";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { DeleteModal } from "../ui/deletemodal";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "../ui/spinner";
import { formatDateKSA, isDateString } from "@/utils/helpers";

/** ✅ TS helpers (no design change) */
type MaybePromise<T = unknown> = T | Promise<T>;
type RowHandler<T> =
  | ((row: T) => MaybePromise<unknown>)
  | (() => MaybePromise<unknown>);

function callHandler<T>(
  handler: RowHandler<T> | undefined,
  row: T,
): Promise<void> {
  if (!handler) return Promise.resolve();

  try {
    const result =
      handler.length >= 1
        ? (handler as (r: T) => MaybePromise<unknown>)(row)
        : (handler as () => MaybePromise<unknown>)();

    return Promise.resolve(result).then(() => undefined);
  } catch {
    return Promise.resolve();
  }
}

function getDefaultSortColumnId<T extends Record<string, any>>(
  columns: ColumnDef<T>[],
): string | null {
  for (const col of columns) {
    if (
      "id" in col &&
      col.id &&
      !["select", "actions", "accumulate"].includes(String(col.id))
    ) {
      return String(col.id);
    }

    if ("accessorKey" in col && typeof col.accessorKey === "string") {
      return col.accessorKey;
    }
  }

  return null;
}

type SortMode = "normal" | "aToZ" | "zToA";

interface DataTableProps<T> {
  initialData: T[];
  columns: ColumnDef<T>[];
  onUpdate?: RowHandler<T>;
  onDelete?: RowHandler<T>;
  onAdd?: () => void;
  showAccumulate?: boolean;
  onAccumulate?: (row: T) => void;
  pageSizeOptions?: number[];
  keyMappings?: any | null;
  loading?: boolean;
  onSelectionChange?: (rows: T[]) => void;
  title?: string;
  headerActions?: React.ReactNode;
  showSortColumnName?: boolean;
  renderActions?: (row: T) => React.ReactNode;
}

export function ReusableDataTable<T extends Record<string, any>>(
  props: DataTableProps<T>,
) {
  const {
    title,
    initialData,
    columns,
    onUpdate,
    onDelete,
    showAccumulate = false,
    onAccumulate,
    pageSizeOptions = [10, 20, 50],
    keyMappings = {},
    loading = false,
    headerActions,
    showSortColumnName = false,
    renderActions,
  } = props;

  const [data, setData] = useState<T[]>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const defaultSortColumnId = getDefaultSortColumnId(columns);
  const [sorting, setSorting] = useState<SortingState>(
    defaultSortColumnId ? [{ id: defaultSortColumnId, desc: false }] : [],
  );
  const [sortMode, setSortMode] = useState<SortMode>(
    defaultSortColumnId ? "aToZ" : "normal",
  );
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: pageSizeOptions[0],
  });

  const [results] = useState<any[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearchValue = useDebounce(searchValue, 500);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<T | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<T | null>(null);

  // defaultSortColumnId is now computed earlier for state initialization

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor),
  );

  const allColumns: ColumnDef<T>[] = [];

  columns.forEach((col) => {
    if (col.id === "select") {
      allColumns.push({
        id: "select",
        header: ({ table }: HeaderContext<T, unknown>) => (
          <Checkbox
            className="cursor-pointer"
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }: { row: Row<T> }) => (
          <Checkbox
            className="cursor-pointer"
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      });
      return;
    }

    if (col.id === "actions") {
      if (col.cell) {
        allColumns.push(col);
        return;
      }
      allColumns.push({
        ...col,
        cell: ({ row }: { row: Row<T> }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                <span className="sr-only">Open menu</span>
                <EllipsisVertical size={20} />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="center">
              {renderActions?.(row.original)}
              {renderActions && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={() => {
                  setSelectedRow({ ...(row.original as any) });
                  setViewModalOpen(true);
                }}
                className="flex items-center gap-3 px-3 py-2.5"
              >
                <Eye className="w-4 h-4 text-blue-600" />
                View Details
              </DropdownMenuItem>

              {onUpdate && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      void callHandler(onUpdate, row.original);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5"
                  >
                    <Edit className="w-4 h-4 text-amber-600" />
                    Edit Record
                  </DropdownMenuItem>
                </>
              )}

              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setRowToDelete(row.original);
                      setDeleteModalOpen(true);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 text-red-600"
                  >
                    <Trash className="w-4 h-4 text-red-600" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      });

      if (showAccumulate) {
        allColumns.push({
          id: "accumulate",
          header: "Accumulate",
          cell: ({ row }: { row: Row<T> }) => (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAccumulate?.(row.original)}
              className="
                flex items-center justify-center gap-2
                p-2 rounded-md transition-all
                hover:bg-gray-200 dark:hover:bg-gray-700
                text-blue-600 dark:text-blue-400
              "
              title="Accumulate"
            >
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline"></span>
            </Button>
          ),
          enableSorting: false,
          enableHiding: false,
        });
      }

      return;
    }

    allColumns.push(col);
  });

  const table = useReactTable({
    data,
    columns: allColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    enableRowSelection: true,
    globalFilterFn: "includesString",
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row: any, index: number) => {
      if (row.id !== undefined) return `id-${row.id}`;
      if (row.Recid !== undefined) return `recid-${row.Recid}-${index}`;
      if (row.APPID !== undefined) return `appid-${row.APPID}-${index}`;
      return `row-${index}`;
    },
  });

  const dataIds: UniqueIdentifier[] = table.getRowModel().rows.map((r) => r.id);

  useEffect(() => {
    table.setGlobalFilter(debouncedSearchValue);
  }, [debouncedSearchValue, table]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setData((prev) => {
      const oldIndex = dataIds.indexOf(active.id);
      const newIndex = dataIds.indexOf(over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  function handleToggleSortOrder() {
    if (!defaultSortColumnId) return;

    if (sortMode === "normal") {
      setSortMode("aToZ");
      setSorting([{ id: defaultSortColumnId, desc: false }]);
      return;
    }

    if (sortMode === "aToZ") {
      setSortMode("zToA");
      setSorting([{ id: defaultSortColumnId, desc: true }]);
      return;
    }

    setSortMode("normal");
    setSorting([]);
  }

  function getSortButtonLabel() {
    const columnName = showSortColumnName && defaultSortColumnId ? (keyMappings[defaultSortColumnId] || defaultSortColumnId) : "";
    const prefix = columnName ? `${columnName}: ` : "";

    if (sortMode === "normal") return `${prefix}Default`;
    if (sortMode === "aToZ") return `${prefix}Low - High`;
    return `${prefix}High - Low`;
  }

  function getSortButtonIcon() {
    return <ArrowUpDown className="h-4 w-4 ml-2 opacity-70" />;
  }

  useEffect(() => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((r) => r.original);
    props.onSelectionChange?.(selectedRows);
  }, [rowSelection]);

  useEffect(() => {
    setRowSelection({});
  }, [initialData]);

  function DraggableRow({ row }: { row: Row<T> }) {
    const { setNodeRef, isDragging } = useSortable({
      id: row.id,
    });

    return (
      <TableRow
        ref={setNodeRef}
        data-dragging={isDragging}
        className={`border-b last:border-0 hover:bg-[gray-100] dark:hover:bg-gray-700 ${isDragging ? "bg-white dark:bg-[#0a0a0a]" : ""
          }`}
      >
        {row.getVisibleCells().map((cell) => {
          const value = cell.getValue();
          const columnId = cell.column.id;
          const isDate = isDateString(value);

          const isSpecialColumn = ["select", "actions", "accumulate"].includes(
            columnId,
          );
          const isNullOrEmpty =
            value === null ||
            value === undefined ||
            String(value).trim() === "" ||
            String(value) === "null";

          return (
            <TableCell
              key={cell.id}
              className="px-4 py-2 text-sm text-center text-gray-900 dark:text-gray-200"
            >
              {isSpecialColumn
                ? flexRender(cell.column.columnDef.cell, cell.getContext())
                : isDate
                  ? formatDateKSA(value)
                  : isNullOrEmpty
                    ? "-"
                    : flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          );
        })}
      </TableRow>
    );
  }

  console.log("selected-row", selectedRow);
  const handleDownload = () => {
    const visibleColumns = table
      .getVisibleFlatColumns()
      .filter(
        (column) =>
          !["select", "actions", "accumulate"].includes(column.id)
      );

    const headers = visibleColumns.map((col) => {
      const id = col.id;
      return keyMappings[id] || id;
    });

    const rows = table.getRowModel().rows.map((row) =>
      visibleColumns.map((col) => {
        const value = row.getValue(col.id);
        if (value === null || value === undefined) return "";
        if (isDateString(value)) return formatDateKSA(value);
        return String(value);
      })
    );

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((value) => {
            const escaped = String(value).replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${title || "export"}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-center gap-5">
      {(title || headerActions) && (
        <div className="w-full flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {title || ""}
          </h2>
          {headerActions && (
            <div className="flex items-center gap-2">{headerActions}</div>
          )}
        </div>
      )}

      <div className="w-full flex items-center gap-4">
        <input
          type="text"
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-400 dark:bg-gray-800 dark:text-gray-200"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              disabled={!defaultSortColumnId}
              className="h-10 px-4 rounded-xl bg-[#ebf5ff] text-blue-700 border border-blue-200 transition-all duration-200 shadow-sm hover:bg-blue-100 dark:bg-blue-900/20
        dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/30 flex flex-col items-start justify-center gap-0 py-6
      "
            >
              <span className="text-[10px] font-bold text-blue-400 dark:text-blue-500 uppercase tracking-wider">
                Sort By
              </span>
              <div className="flex items-center w-full justify-between min-w-[120px]">
                <span className="text-sm font-semibold truncate capitalize">
                  {getSortButtonLabel()}
                </span>
                {getSortButtonIcon()}
              </div>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-56 rounded-xl border bg-white shadow-xl dark:bg-[#1c1c1f] dark:border-white/10 p-2"
          >
            <DropdownMenuItem
              onClick={() => {
                setSortMode("normal");
                setSorting([]);
              }}
              className="flex items-center justify-between rounded-lg py-2 cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span className="flex items-center gap-2 font-medium">
                {showSortColumnName && defaultSortColumnId ? `${keyMappings[defaultSortColumnId] || defaultSortColumnId}: ` : ""}
                Default
              </span>
              {sortMode === "normal" && <Check className="h-4 w-4 text-blue-500" />}
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1 bg-gray-100 dark:bg-gray-800" />

            <DropdownMenuItem
              onClick={() => {
                if (!defaultSortColumnId) return;
                setSortMode("aToZ");
                setSorting([{ id: defaultSortColumnId, desc: false }]);
              }}
              className="flex items-center justify-between rounded-lg py-2 cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span className="flex items-center gap-2 font-medium">
                Low → High
              </span>
              {sortMode === "aToZ" && <Check className="h-4 w-4 text-blue-500" />}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => {
                if (!defaultSortColumnId) return;
                setSortMode("zToA");
                setSorting([{ id: defaultSortColumnId, desc: true }]);
              }}
              className="flex items-center justify-between rounded-lg py-2 cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span className="flex items-center gap-2 font-medium">
                High → Low
              </span>
              {sortMode === "zToA" && <Check className="h-4 w-4 text-blue-500" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="
                ml-2 h-10 px-4 rounded-lg
                bg-blue-50
                text-blue-700
                border border-blue-200
                transition-all duration-200
                shadow-sm
                hover:bg-linear-to-r
                hover:from-indigo-500
                hover:to-blue-600
                hover:text-white
                hover:border-transparent
                hover:shadow-md
                dark:bg-blue-900/30
                dark:text-blue-300
                dark:border-blue-700
              "
            >
              Columns <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-52 rounded-lg border bg-white shadow-md dark:bg-[#121212] dark:border-white/10"
          >
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  className="capitalize"
                >
                  {keyMappings[column.id] || column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="sm"
          onClick={handleDownload}
          className="
            h-10 px-4 rounded-lg
            bg-linear-to-r from-indigo-500 to-blue-600
            text-white
            hover:from-indigo-600 hover:to-blue-700
            transition-all duration-200
            shadow-md
            hover:shadow-lg
            active:scale-95
          "
        >
          Download Result
        </Button>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#121212]">
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <Table>
            <TableHeader className="bg-gray-100 dark:bg-gray-800">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="px-4 py-2 text-sm font-medium text-center text-gray-800 dark:text-gray-200"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={allColumns.length}>
                    <div className="flex items-center justify-center h-32">
                      <Spinner className="size-10 text-blue-600" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length ? (
                <SortableContext
                  items={dataIds}
                  strategy={verticalListSortingStrategy}
                >
                  {table.getRowModel().rows.map((row) => (
                    <DraggableRow key={row.id} row={row} />
                  ))}
                </SortableContext>
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={allColumns.length}
                    className="text-center py-6"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg rounded-t-none">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected
          </div>

          <div className="flex items-center  md:gap-2">
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8! min-w-15 border border-gray-300 dark:border-gray-600 rounded-md px-2 bg-white dark:bg-gray-700 text-sm shadow-sm">
                <SelectValue
                  placeholder={`${table.getState().pagination.pageSize}`}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[5, 10, 20, 25, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <ViewModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        data={selectedRow}
        title={title ? `${title} Details` : "Record Details"}
        keyMappings={keyMappings}
      />

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        data={rowToDelete}
        onConfirm={async (row) => {
          if (!row) return;
          await callHandler(onDelete, row);
          setDeleteModalOpen(false);
        }}
      />
    </div>
  );
}
