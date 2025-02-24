"use client";

import { useQuery } from "@tanstack/react-query";
import { AssignmentService } from "../integration/scheduler-api/assignment";
import { Route } from "../routes";
import { useRouter } from "next/navigation";
import { AuthContext } from "../context/auth-context";
import { useEffect, useState } from "react";

export default function Assignment() {
  const [authContext, setAuthContext] = useState<string | null>(null);
  const { push } = useRouter();

  useEffect(() => {
    const token = AuthContext.getAccessToken();
    setAuthContext(token);
    if (!token) {
      push(`/${Route.Login}`);
    }
  }, [authContext, push]);

  const { data, isSuccess, isPending } = useQuery({
    queryKey: ["assignments-admin"],
    refetchOnWindowFocus: true,
    initialData: [],
    queryFn: AssignmentService.GetMyAssignments,
  });

  const handleTry = (id: number) => {
    push(`${Route.Assignment}/${id}/${Route.Workspace}`);
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-start justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col w-full gap-8 row-start-2 items-center sm:items-start">
        <div>
          <h1 className="text-4xl font-bold text-center">Your assignments</h1>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="min-w-full bg-white dark:bg-gray-800">
            <thead>
              <tr>
                <th className="py-2 px-4 text-start bg-gray-100 dark:bg-gray-700">
                  Title
                </th>
                <th className="py-2 px-4 text-start bg-gray-100 dark:bg-gray-700">
                  Class
                </th>
                <th className="py-2 px-4 text-start bg-gray-100 dark:bg-gray-700">
                  Description
                </th>
                <th className="py-2 px-4 text-start bg-gray-100 dark:bg-gray-700">
                  Max attempts
                </th>
                <th className="py-2 px-4 text-start bg-gray-100 dark:bg-gray-700">
                  Current Attempt
                </th>
                <th className="py-2 px-4 text-start bg-gray-100 dark:bg-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {!isPending &&
                isSuccess &&
                (data ?? []).map((assignment) => (
                  <tr key={assignment.id}>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-700">
                      {assignment.title}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-700">
                      {assignment.class.name}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-700">
                      {assignment.description}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-700">
                      {assignment.maxAttempts}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-700">
                      {assignment.assignmentAttempts.length}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-700">
                      <div
                        onClick={() => {
                          handleTry(assignment.id);
                        }}
                        className="cursor-pointer h-full flex items-center justify-center"
                      >
                        Try
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="30"
                          height="30"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                          className="ml-2"
                        >
                          <path d="M10.478 1.647a.5.5 0 1 0-.956-.294l-4 13a.5.5 0 0 0 .956.294zM4.854 4.146a.5.5 0 0 1 0 .708L1.707 8l3.147 3.146a.5.5 0 0 1-.708.708l-3.5-3.5a.5.5 0 0 1 0-.708l3.5-3.5a.5.5 0 0 1 .708 0m6.292 0a.5.5 0 0 0 0 .708L14.293 8l-3.147 3.146a.5.5 0 0 0 .708.708l3.5-3.5a.5.5 0 0 0 0-.708l-3.5-3.5a.5.5 0 0 0-.708 0" />
                        </svg>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
