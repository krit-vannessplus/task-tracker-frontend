// components/CreateTaskForm.tsx
import React, { useEffect, useState, FormEvent } from "react";
import axios from "axios";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { LIFFProfile } from "./LiffContext";
import { Checkbox } from "./ui/checkbox";
import {
  CardDescription,
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "./ui/card";
import { useRouter } from "next/navigation";
import { Task, TASK_STATUS, TASK_PRIORITY } from "./types";

const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL!;

export default function CreateTaskForm(userProfile: LIFFProfile) {
  const [userId, setUserId] = useState<string | null>(
    userProfile.userId || null
  );
  const [projects, setProjects] = useState<string[]>([]);
  const [employees, setEmployees] = useState<string[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [status, setStatus] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    projectName: "",
    title: "",
    description: "",
    dueDate: "",
    priority: "Medium" as (typeof TASK_PRIORITY)[number],
    assignees: [] as string[],
    followers: [] as string[],
    dependencies: [] as string[],
  });
  const router = useRouter();

  // 1) Initialize LIFF & fetch allowed projects
  useEffect(() => {
    async function initLiff() {
      try {
        setUserId(userProfile.userId);
        const resp = await axios.get(GAS_URL, {
          params: {
            action: "getAllowedProjects",
            userId: userProfile.userId,
          },
        });
        setProjects(resp.data || []);
        console.log("Allowed projects:", resp.data);
      } catch (err) {
        console.error("LIFF init or fetch projects failed", err);
      }
    }
    initLiff();
  }, []);

  // 2) When project changes, fetch employees & tasks
  useEffect(() => {
    if (!form.projectName) {
      setEmployees([]);
      setTasks([]);
      return;
    }

    async function fetchProjectData() {
      try {
        // 1) Fetch employees & tasks in parallel
        const [empRes, taskRes] = await Promise.all([
          axios.get(GAS_URL, {
            params: {
              action: "getAllowedEmployees",
              projectName: form.projectName,
            },
          }),
          axios.get(GAS_URL, {
            params: {
              action: "getTasksForProject",
              projectName: form.projectName,
            },
          }),
        ]);
        // Now empRes.data and taskRes.data hold your JSON results

        setEmployees(empRes.data || []);
        setTasks(taskRes.data || []);
      } catch (err) {
        console.error("Fetch employees or tasks failed", err);
      }
    }

    fetchProjectData();
  }, [form.projectName]);

  // Helpers to handle multi-select via popover + checkbox
  const toggleMulti = (field: keyof typeof form, value: string) => {
    setForm((f) => {
      const list = f[field] as string[];
      const next = list.includes(value)
        ? list.filter((i) => i !== value)
        : [...list, value];
      return { ...f, [field]: next };
    });
  };

  // Handlers
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSelect = (name: string, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
  };

  // 3) Submit form
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Determine status based on dependencies
    const autoStatus = form.dependencies.length > 0 ? "Pending" : "Ready";

    // Build your payload object
    const payloadObj = {
      userId: userId,
      projectName: form.projectName,
      title: form.title,
      description: form.description,
      dueDate: form.dueDate,
      priority: form.priority,
      assignees: form.assignees,
      dependencies: form.dependencies,
      followers: form.followers,
      status: autoStatus, // Add the auto-determined status
    };

    try {
      const res = await axios.get(GAS_URL, {
        params: {
          action: "create",
          payload: JSON.stringify(payloadObj),
        },
      });
      setStatus(res.data);
      setIsSubmitting(false);
    } catch (err) {
      console.error("Create task failed", err);
      setStatus({ status: "fail", message: "Network error" });
      setIsSubmitting(false);
    }
    router.push("/listTasks");
  };

  // Validation
  const isValid =
    !!form.projectName &&
    form.assignees.length > 0 &&
    !!form.priority &&
    !!form.title &&
    !!form.dueDate &&
    !isSubmitting;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Task</CardTitle>
        <CardDescription>Create a new task for your project.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project */}
          <div className="flex flex-col space-y-1">
            <Label htmlFor="projectName">Project</Label>
            <Select
              onValueChange={(value) => handleSelect("projectName", value)}
              value={form.projectName}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="flex flex-col space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input
              name="title"
              value={form.title}
              onChange={handleChange}
              disabled={!form.projectName}
              placeholder="Task title"
              required
            />
          </div>

          {/* Description */}
          <div className="flex flex-col space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              disabled={!form.projectName}
              placeholder="Optional details"
            />
          </div>

          {/* Due Date */}
          <div className="flex flex-col space-y-1">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              type="date"
              name="dueDate"
              value={form.dueDate}
              onChange={handleChange}
              disabled={!form.projectName}
              required
            />
          </div>

          {/* Priority */}
          <div className="flex flex-col space-y-1">
            <Label htmlFor="priority">Priority</Label>
            <Select
              onValueChange={(value) => handleSelect("priority", value)}
              value={form.priority}
              disabled={!form.projectName}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
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

          {/* Assignees */}
          <div className="flex flex-col space-y-1">
            <Label>Assignees</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={!form.projectName}
                  className="justify-start"
                >
                  {form.assignees.length
                    ? form.assignees.join(", ")
                    : "Select assignees"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="space-y-2 max-h-52 overflow-auto">
                {employees.map((emp) => (
                  <div
                    key={emp}
                    className="flex items-center space-x-2 px-2 py-1"
                  >
                    <Checkbox
                      id={`assignees-${emp}`}
                      checked={form.assignees.includes(emp)}
                      onCheckedChange={() => toggleMulti("assignees", emp)}
                    />
                    <Label htmlFor={`assignees-${emp}`}>{emp}</Label>
                  </div>
                ))}
              </PopoverContent>
            </Popover>
          </div>

          {/* Followers */}
          <div className="flex flex-col space-y-1">
            <Label>Followers</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={!form.projectName}
                  className="justify-start"
                >
                  {form.followers.length
                    ? form.followers.join(", ")
                    : "Select followers"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="space-y-2 max-h-52 overflow-auto">
                {employees.map((emp) => (
                  <div
                    key={emp}
                    className="flex items-center space-x-2 px-2 py-1"
                  >
                    <Checkbox
                      id={`followers-${emp}`}
                      checked={form.followers.includes(emp)}
                      onCheckedChange={() => toggleMulti("followers", emp)}
                    />
                    <Label htmlFor={`followers-${emp}`}>{emp}</Label>
                  </div>
                ))}
              </PopoverContent>
            </Popover>
          </div>

          {/* Dependencies */}
          <div className="flex flex-col space-y-1">
            <Label>Dependencies</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={!form.projectName}
                  className="justify-start"
                >
                  {form.dependencies.length
                    ? form.dependencies.join(", ")
                    : "Select dependencies"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="space-y-2 max-h-52 overflow-auto">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center space-x-2 px-2 py-1"
                  >
                    <Checkbox
                      id={`dep-${t.id}`}
                      checked={form.dependencies.includes(t.id)}
                      onCheckedChange={() => toggleMulti("dependencies", t.id)}
                    />
                    <Label htmlFor={`dep-${t.id}`}>{t.id}</Label>
                  </div>
                ))}
              </PopoverContent>
            </Popover>
          </div>

          {/* Submit */}
          <Button type="submit" disabled={!isValid}>
            {isSubmitting ? "Creating Task..." : "Create Task"}
          </Button>

          {status && (
            <pre className="mt-4 bg-gray-50 p-4 rounded">
              {JSON.stringify(status, null, 2)}
            </pre>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
