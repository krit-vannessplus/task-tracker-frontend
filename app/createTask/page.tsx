// app/createTask/page.tsx
"use client";

import { useLiffProfile } from "@/components/LiffContext";
import CreateTaskForm from "@/components/createTaskForm";

export default function CreateTaskPage() {
  const { userId, displayName } = useLiffProfile();

  return (
    <div>
      {/* your form/UI here */}
      <CreateTaskForm userId={userId} displayName={displayName} />
    </div>
  );
}
