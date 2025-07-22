"use client";
import Image from "next/image";

export default function Header() {
  return (
    <header className="flex items-center justify-between p-4 bg-gray-800 text-white">
      <div className="flex items-center">
        <Image
          src="/logo.jpg"
          alt="Logo"
          width={50}
          height={50}
          className="rounded-full"
        />
        <h1 className="ml-2 text-xl font-bold">Task Tracker</h1>
      </div>
      <nav>
        <ul className="flex space-x-4">
          <li>
            <a href="/createTask" className="hover:underline">
              Create Task
            </a>
          </li>
          <li>
            <a href="/listTasks" className="hover:underline">
              List Tasks
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
