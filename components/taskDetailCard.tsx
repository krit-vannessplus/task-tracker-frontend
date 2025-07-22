// components/TaskDetailCard.tsx
"use client";

import { useState, FormEvent, useEffect } from "react";
import axios from "axios";
import { Card, CardHeader, CardContent, CardFooter } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Task, TASK_STATUS, TASK_PRIORITY } from "./types";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { Checkbox } from "./ui/checkbox";
import { isEqual } from "lodash";

const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL!;

interface TaskDetailCardProps {
  task: Task;
  onBackAction: () => void;
  onUpdateAction: (updated: Task) => void;
}

export default function TaskDetailCard({
  task,
  onBackAction,
  onUpdateAction,
}: TaskDetailCardProps) {
  const [form, setForm] = useState<Task>({
    ...task,
    status: task.status || "Pending", // Update default status
  });
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState<string[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch employees and tasks when component mounts
  useEffect(() => {
    async function fetchData() {
      try {
        const [empRes, taskRes] = await Promise.all([
          axios.get(GAS_URL, {
            params: {
              action: "getAllowedEmployees",
              projectName: task.projectName,
            },
          }),
          axios.get(GAS_URL, {
            params: {
              action: "getTasksForProject",
              projectName: task.projectName,
            },
          }),
        ]);
        setEmployees(empRes.data || []);
        setTasks(taskRes.data?.filter((t: Task) => t.id !== task.id) || []);
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    }
    fetchData();
  }, [task.projectName, task.id]);

  // Check for changes
  useEffect(() => {
    setHasChanges(!isEqual(task, form));
  }, [form, task]);

  const handleChange = (key: keyof Task, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleMulti = (field: keyof Task, value: string) => {
    setForm((prev) => {
      const list = prev[field] as string[];
      return {
        ...prev,
        [field]: list.includes(value)
          ? list.filter((i) => i !== value)
          : [...list, value],
      };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.get(GAS_URL, {
        params: {
          action: "update",
          payload: JSON.stringify(form),
        },
      });
      onUpdateAction(res.data);
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onBackAction}
            className="text-muted-foreground"
          >
            ← Back
          </Button>
          <h2 className="text-2xl font-semibold">Task Details</h2>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 pt-6">
          {/* Read-only fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project</Label>
              <Input value={form.projectName} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Task ID</Label>
              <Input value={form.id} readOnly className="bg-muted" />
            </div>
          </div>

          {/* Title and Description */}
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Due Date, Priority, Status */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => handleChange("dueDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(value) => handleChange("priority", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITY.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => handleChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Multi-select fields */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Assignees</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {form.assignees.length
                      ? form.assignees.join(", ")
                      : "Select assignees"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <div className="space-y-2 p-4 max-h-[200px] overflow-auto">
                    {employees.map((emp) => (
                      <div key={emp} className="flex items-center space-x-2">
                        <Checkbox
                          checked={form.assignees.includes(emp)}
                          onCheckedChange={() => toggleMulti("assignees", emp)}
                        />
                        <Label>{emp}</Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Dependencies</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {form.dependencies.length
                      ? form.dependencies.join(", ")
                      : "Select dependencies"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <div className="space-y-2 p-4 max-h-[200px] overflow-auto">
                    {tasks.map((t) => (
                      <div key={t.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={form.dependencies.includes(t.id)}
                          onCheckedChange={() =>
                            toggleMulti("dependencies", t.id)
                          }
                        />
                        <Label>{t.title}</Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Followers</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {form.followers.length
                      ? form.followers.join(", ")
                      : "Select followers"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <div className="space-y-2 p-4 max-h-[200px] overflow-auto">
                    {employees.map((emp) => (
                      <div key={emp} className="flex items-center space-x-2">
                        <Checkbox
                          checked={form.followers.includes(emp)}
                          onCheckedChange={() => toggleMulti("followers", emp)}
                        />
                        <Label>{emp}</Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t mt-6">
          <div className="flex justify-end w-full gap-4">
            <Button type="button" variant="outline" onClick={onBackAction}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !hasChanges}
              className="px-8"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
