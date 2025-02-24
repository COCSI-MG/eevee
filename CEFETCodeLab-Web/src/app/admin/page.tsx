"use client";
import { useRouter } from "next/navigation";
import { Route } from "../routes";

export default function Admin() {
  const { push } = useRouter();

  const redirectToManageUsers = () => {
    push(Route.AdminUsers);
  };

  const redirectToManageClasses = () => {
    push(Route.AdminClasses);
  };

  const redirectToManageAssignments = () => {
    push(Route.AdminAssignments);
  };

  return (
    <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
      <h1 className="text-4xl font-bold text-center">Admin Dashboard</h1>
      <div className="flex flex-col gap-8 w-full sm:flex-row sm:justify-around">
        <div
          onClick={redirectToManageUsers}
          className="flex flex-col justify-center items-center p-4 hover:bg-slate-500 bg-white dark:bg-gray-800 rounded-lg shadow-md cursor-pointer"
        >
          <div className="flex items-center justify-center w-16 h-16 text-white rounded-full">
            <svg
              fill="white"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 640 512"
            >
              <path d="M144 0a80 80 0 1 1 0 160A80 80 0 1 1 144 0zM512 0a80 80 0 1 1 0 160A80 80 0 1 1 512 0zM0 298.7C0 239.8 47.8 192 106.7 192l42.7 0c15.9 0 31 3.5 44.6 9.7c-1.3 7.2-1.9 14.7-1.9 22.3c0 38.2 16.8 72.5 43.3 96c-.2 0-.4 0-.7 0L21.3 320C9.6 320 0 310.4 0 298.7zM405.3 320c-.2 0-.4 0-.7 0c26.6-23.5 43.3-57.8 43.3-96c0-7.6-.7-15-1.9-22.3c13.6-6.3 28.7-9.7 44.6-9.7l42.7 0C592.2 192 640 239.8 640 298.7c0 11.8-9.6 21.3-21.3 21.3l-213.3 0zM224 224a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zM128 485.3C128 411.7 187.7 352 261.3 352l117.3 0C452.3 352 512 411.7 512 485.3c0 14.7-11.9 26.7-26.7 26.7l-330.7 0c-14.7 0-26.7-11.9-26.7-26.7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold">Manage Users</h2>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Add, edit, or remove users from the system.
          </p>
        </div>
        <div
          onClick={redirectToManageClasses}
          className="flex flex-col justify-center items-center p-4 hover:bg-slate-500 bg-white dark:bg-gray-800 rounded-lg shadow-md cursor-pointer"
        >
          <div className="flex items-center justify-center w-16 h-16 text-white rounded-full">
            <svg
              fill="white"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 640 512"
            >
              <path d="M160 64c0-35.3 28.7-64 64-64L576 0c35.3 0 64 28.7 64 64l0 288c0 35.3-28.7 64-64 64l-239.2 0c-11.8-25.5-29.9-47.5-52.4-64l99.6 0 0-32c0-17.7 14.3-32 32-32l64 0c17.7 0 32 14.3 32 32l0 32 64 0 0-288L224 64l0 49.1C205.2 102.2 183.3 96 160 96l0-32zm0 64a96 96 0 1 1 0 192 96 96 0 1 1 0-192zM133.3 352l53.3 0C260.3 352 320 411.7 320 485.3c0 14.7-11.9 26.7-26.7 26.7L26.7 512C11.9 512 0 500.1 0 485.3C0 411.7 59.7 352 133.3 352z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold">Manage Classes</h2>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Create and manage classes and schedules.
          </p>
        </div>
        <div
          onClick={redirectToManageAssignments}
          className="flex flex-col items-center p-4 bg-white hover:bg-slate-500 dark:bg-gray-800 rounded-lg shadow-md cursor-pointer"
        >
          <div className="flex items-center justify-center w-16 h-16 text-white rounded-full">
            <svg
              fill="white"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
            >
              <path d="M152.1 38.2c9.9 8.9 10.7 24 1.8 33.9l-72 80c-4.4 4.9-10.6 7.8-17.2 7.9s-12.9-2.4-17.6-7L7 113C-2.3 103.6-2.3 88.4 7 79s24.6-9.4 33.9 0l22.1 22.1 55.1-61.2c8.9-9.9 24-10.7 33.9-1.8zm0 160c9.9 8.9 10.7 24 1.8 33.9l-72 80c-4.4 4.9-10.6 7.8-17.2 7.9s-12.9-2.4-17.6-7L7 273c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l22.1 22.1 55.1-61.2c8.9-9.9 24-10.7 33.9-1.8zM224 96c0-17.7 14.3-32 32-32l224 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-224 0c-17.7 0-32-14.3-32-32zm0 160c0-17.7 14.3-32 32-32l224 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-224 0c-17.7 0-32-14.3-32-32zM160 416c0-17.7 14.3-32 32-32l288 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-288 0c-17.7 0-32-14.3-32-32zM48 368a48 48 0 1 1 0 96 48 48 0 1 1 0-96z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold">Manage Assignments</h2>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Create, edit, and assign assignments to classes.
          </p>
        </div>
      </div>
    </main>
  );
}
