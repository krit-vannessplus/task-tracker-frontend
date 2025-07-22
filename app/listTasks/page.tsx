// app/listTasks/page.tsx
"use client";

import TaskTable from "@/components/taskTable";

export default function ListTasksPage() {
  return (
    <div className="p-4">
      <TaskTable />
    </div>
  );
}
