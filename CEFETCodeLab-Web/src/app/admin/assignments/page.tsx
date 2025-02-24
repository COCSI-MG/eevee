"use client";
import { AssignmentService } from "@/app/integration/scheduler-api/assignment";
import { Route } from "@/app/routes";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export default function AssignmentsAdminPage() {
  const { push } = useRouter();

  const { data, isSuccess, isPending } = useQuery({
    queryKey: ["adminAssignments"],
    retryOnMount: true,
    initialData: [],
    queryFn: AssignmentService.GetAssignmentsAdmin,
  });

  const handleEditAssignment = (id: number) => {
    push(`/${Route.AdminAssignments}/${id}`);
  };

  const handleAddAssignment = () => {
    push(`/${Route.AdminAssignmentCreate}`);
  };

  return (
    <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
      <h1 className="text-4xl font-bold text-center">
        Admin Dashboard - Assignments
      </h1>
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
                Number of Attempts
              </th>
              <th className="py-2 px-4 text-start bg-gray-100 dark:bg-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {!isPending &&
              isSuccess &&
              (data ?? []).map((assignment) => {
                const attempts = assignment.assignmentAttempts.length;
                return (
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
                      {attempts}
                    </td>
                    <td className="py-5 border-b border-gray-200 dark:border-gray-700">
                      <div className="cursor-pointer h-1/2 flex items-center justify-around">
                        <div
                          onClick={() => handleEditAssignment(assignment.id)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 512 512"
                            fill="currentColor"
                            height={30}
                          >
                            <path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152L0 424c0 48.6 39.4 88 88 88l272 0c48.6 0 88-39.4 88-88l0-112c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 112c0 22.1-17.9 40-40 40L88 464c-22.1 0-40-17.9-40-40l0-272c0-22.1 17.9-40 40-40l112 0c13.3 0 24-10.7 24-24s-10.7-24-24-24L88 64z" />
                          </svg>
                        </div>
                        <div>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 448 512"
                            fill="rgb(200, 0, 0)"
                            height={30}
                          >
                            <path d="M170.5 51.6L151.5 80l145 0-19-28.4c-1.5-2.2-4-3.6-6.7-3.6l-93.7 0c-2.7 0-5.2 1.3-6.7 3.6zm147-26.6L354.2 80 368 80l48 0 8 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-8 0 0 304c0 44.2-35.8 80-80 80l-224 0c-44.2 0-80-35.8-80-80l0-304-8 0c-13.3 0-24-10.7-24-24S10.7 80 24 80l8 0 48 0 13.8 0 36.7-55.1C140.9 9.4 158.4 0 177.1 0l93.7 0c18.7 0 36.2 9.4 46.6 24.9zM80 128l0 304c0 17.7 14.3 32 32 32l224 0c17.7 0 32-14.3 32-32l0-304L80 128zm80 64l0 208c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-208c0-8.8 7.2-16 16-16s16 7.2 16 16zm80 0l0 208c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-208c0-8.8 7.2-16 16-16s16 7.2 16 16zm80 0l0 208c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-208c0-8.8 7.2-16 16-16s16 7.2 16 16z" />
                          </svg>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
        <div className="mt-4">
          <button
            onClick={handleAddAssignment}
            className="rounded-md cursor-pointer border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          >
            Add Assignment
          </button>
        </div>
      </div>
    </main>
  );
}
