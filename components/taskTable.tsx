// components/TaskTable.tsx
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import { useLiffProfile } from "./LiffContext";
import { Badge } from "@/components/ui/badge";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
  PaginationLink,
} from "@/components/ui/pagination";

import TaskDetailCard from "./taskDetailCard";
import { Task, TASK_STATUS, TASK_PRIORITY } from "./types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL!;

const getNextStatus = (currentStatus: string): string => {
  switch (currentStatus) {
    case "Pending":
      return "Ready";
    case "Ready":
      return "In Progress";
    case "In Progress":
      return "Done";
    case "Done":
      return "In Progress"; // Cycle back to In Progress
    default:
      return "Pending";
  }
};

export default function TaskTable() {
  const { userId } = useLiffProfile();
  const [data, setData] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // fetch tasks
  useEffect(() => {
    async function loadTasks() {
      setLoading(true);
      try {
        // 1) get allowed projects
        const projRes = await axios.get<string[]>(GAS_URL, {
          params: { action: "getAllowedProjects", userId },
        });
        const projects = projRes.data;

        // 2) get tasks for each project
        const lists = await Promise.all(
          projects.map((projectName) =>
            axios
              .get<Task[]>(GAS_URL, {
                params: { action: "getTasksForProject", projectName },
              })
              .then((r) => r.data)
          )
        );

        setData(lists.flat());
        console.log("Fetched tasks:", lists.flat());
      } catch (err) {
        console.error("Failed loading tasks", err);
      } finally {
        setLoading(false);
      }
    }
    if (userId) loadTasks();
  }, [userId]);

  const handleStatusUpdate = async (task: Task, newStatus: string) => {
    try {
      const updatedTask = { ...task, status: newStatus };
      console.log("Updating task status:", updatedTask);
      const res = await axios.get(GAS_URL, {
        params: {
          action: "update",
          payload: JSON.stringify(updatedTask),
        },
      });
      console.log("Status updated:", res.data);

      // Update local state
      setData((prev) => prev.map((t) => (t.id === task.id ? res.data : t)));
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  // column definitions
  const columns = React.useMemo<ColumnDef<Task>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "projectName",
        header: "Project",
        filterFn: (row, id, filterValue) => {
          if (!filterValue) return true;
          return row.getValue<string>("projectName") === filterValue;
        },
      },
      {
        accessorKey: "title",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Title
            <ArrowUpDown className="ml-1 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <span>{row.getValue("title")}</span>,
      },
      {
        accessorKey: "dueDate",
        header: () => <div className="text-right">Due</div>,
        cell: ({ row }) => (
          <div className="text-right">{row.getValue<string>("dueDate")}</div>
        ),
      },
      {
        accessorKey: "priority",
        header: "Priority",
        filterFn: (row, id, filterValue) => {
          if (!filterValue) return true;
          return row.getValue<string>("priority") === filterValue;
        },
        cell: ({ row }) => {
          const priority = row.getValue<string>("priority");
          return (
            <Badge
              variant={
                priority === "High"
                  ? "destructive"
                  : priority === "Medium"
                  ? "secondary"
                  : "default"
              }
            >
              {priority}
            </Badge>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        filterFn: (row, id, filterValue) => {
          if (!filterValue) return true;
          return row.getValue<string>("status") === filterValue;
        },
        cell: ({ row }) => {
          const status = row.getValue<string>("status");
          return (
            <Badge
              variant={
                status === "Done"
                  ? "secondary"
                  : status === "In Progress"
                  ? "destructive"
                  : status === "Ready"
                  ? "outline"
                  : "default"
              }
            >
              {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: "assignees",
        header: "Assignees",
        cell: ({ row }) => {
          const assignees = row.getValue<string[]>("assignees");
          return (
            <div className="flex flex-wrap gap-1">
              {assignees?.map((assignee, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {assignee}
                </Badge>
              ))}
            </div>
          );
        },
        filterFn: (row, id, filterValue) => {
          const assignees = row.getValue<string[]>("assignees");
          if (!filterValue || filterValue === "all") return true;
          return (
            assignees?.some((assignee) => assignee === filterValue) ?? false
          );
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const task = row.original;
          const nextStatus = getNextStatus(task.status);

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open actions</span>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setSelectedTask(task)}>
                  View / Update
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleStatusUpdate(task, nextStatus)}
                >
                  {task.status === "Done"
                    ? "Back to In Progress"
                    : `Move to ${nextStatus}`}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    []
  );

  // table instance
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const getAllUniqueAssignees = () => {
    const assigneeSet = new Set<string>();
    data.forEach((task) => {
      task.assignees?.forEach((assignee) => assigneeSet.add(assignee));
    });
    return Array.from(assigneeSet);
  };

  const getAllUniqueProjects = () => {
    const projectSet = new Set<string>();
    data.forEach((task) => {
      if (task.projectName) projectSet.add(task.projectName);
    });
    return Array.from(projectSet);
  };

  if (loading) {
    return <div className="p-4 text-center">Loading tasks…</div>;
  }

  // show detail card if selected
  if (selectedTask) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4 bg-white rounded-lg shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <TaskDetailCard
          task={selectedTask}
          onBackAction={() => setSelectedTask(null)}
          onUpdateAction={(updated) => {
            setData((prev) =>
              prev.map((t) => (t.id === updated.id ? updated : t))
            );
            setSelectedTask(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 py-2">
        <Input
          placeholder="Filter title..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(e) =>
            table.getColumn("title")?.setFilterValue(e.target.value)
          }
          className="max-w-sm"
        />

        <Select
          value={
            (table.getColumn("projectName")?.getFilterValue() as string) ??
            "all"
          }
          onValueChange={(value) => {
            table
              .getColumn("projectName")
              ?.setFilterValue(value === "all" ? "" : value);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {getAllUniqueProjects().map((project) => (
              <SelectItem key={project} value={project}>
                {project}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={
            (table.getColumn("priority")?.getFilterValue() as string) ?? "all"
          }
          onValueChange={(value) => {
            table
              .getColumn("priority")
              ?.setFilterValue(value === "all" ? "" : value);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {Object.values(TASK_PRIORITY).map((priority) => (
              <SelectItem key={priority} value={priority}>
                {priority}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={
            (table.getColumn("status")?.getFilterValue() as string) ?? "all"
          }
          onValueChange={(value) => {
            table
              .getColumn("status")
              ?.setFilterValue(value === "all" ? "" : value);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.values(TASK_STATUS).map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={
            (table.getColumn("assignees")?.getFilterValue() as string) ?? "all"
          }
          onValueChange={(value) => {
            table
              .getColumn("assignees")
              ?.setFilterValue(value === "all" ? "" : value);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All assignees</SelectItem>
            {getAllUniqueAssignees().map((assignee) => (
              <SelectItem key={assignee} value={assignee}>
                {assignee}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((col) => col.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(v) => column.toggleVisibility(!!v)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No tasks found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              {table.getCanPreviousPage() ? (
                <PaginationPrevious onClick={() => table.previousPage()} />
              ) : (
                <PaginationPrevious onClick={() => {}} />
              )}
            </PaginationItem>

            {Array.from({ length: table.getPageCount() }, (_, i) => i + 1).map(
              (page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => table.setPageIndex(page - 1)}
                    isActive={
                      page - 1 === table.getState().pagination.pageIndex
                    }
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              {table.getCanNextPage() ? (
                <PaginationNext onClick={() => table.nextPage()} />
              ) : (
                <PaginationNext onClick={() => {}} />
              )}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
