"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AssignmentWorkspaceProps } from "./interface";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

import React, { useEffect } from "react";
import { SchedulingService } from "@/app/integration/scheduler-api/scheduling";

import { Route } from "@/app/routes";
import { useRouter } from "next/navigation";
import { AssignmentService } from "@/app/integration/scheduler-api/assignment";

export default function AssignmentWorkspace({
  params,
}: AssignmentWorkspaceProps) {
  const { id } = React.use(params);
  const [applicationFileContent, setApplicationFileContent] =
    React.useState("");

  const { push } = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: [`assignment-${id}`],
    retryOnMount: true,
    queryFn: () => AssignmentService.GetAssignmentById(Number(id)),
  });
  const {
    mutate: submitAssignment,
    isPending,
    data: workerResult,
  } = useMutation({
    mutationKey: ["submit-assignment"],
    mutationFn: () => {
      return SchedulingService.createScheduling({
        assignmentId: Number(id),
        applicationFileContent,
      });
    },
  });

  useEffect(() => {
    if (!isLoading) {
      setApplicationFileContent(data!.template);
    }
  }, [isLoading, data]);

  const handleSubmission = async () => {
    const response = await submitAssignment();
    console.log(response);
  };

  const handleReturn = () => {
    push(`/${Route.Assignment}`);
  };

  console.log("data", data);

  return (
    <main className="flex flex-col w-full row-start-2 items-center sm:items-start">
      <div className="flex w-full flex-col justify-center">
        {!isLoading && (
          <>
            <h1>Assignment {data!.title} workspace</h1>
            <div className="mb-4 flex flex-col p-2 bg-slate-500">
              <h2>{data!.class?.name}</h2>
              <h2>{data!.title}</h2>
              <p>{data!.description}</p>
            </div>
            <Editor
              height="700px"
              defaultLanguage="typescript"
              defaultValue={data!.template}
              theme="vs-dark"
              value={applicationFileContent}
              onChange={(value) => setApplicationFileContent(value ?? "")}
            />
            <div className="flex justify-between mt-4">
              <div className="w-1/2">
                {workerResult && (
                  <div className="bg-slate-500 p-2 rounded">
                    <h2>Worker result</h2>
                    <p>Score: {workerResult.score}</p>
                    <p>Passes: {workerResult.passes}</p>
                    <p>Fails: {workerResult.fails}</p>
                    <p
                      dangerouslySetInnerHTML={{
                        __html: workerResult.report.replace(/\n/g, "<br />"),
                      }}
                    ></p>
                  </div>
                )}
              </div>
              <div>
                <button
                  onClick={handleReturn}
                  className="mr-4 text-background bg-foreground hover:bg-[#383838] dark:hover:bg-[#ccc] font-bold py-2 px-4 rounded h-12"
                >
                  Voltar
                </button>
                <button
                  onClick={handleSubmission}
                  className={`${
                    isPending ? "bg-red-700" : "bg-red-500"
                  } hover:bg-red-700 text-white font-bold py-2 px-4 rounded h-12`}
                  disabled={isPending}
                >
                  Submit
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
