"use client";

import { useQuery } from "@tanstack/react-query";
import { AssignmentService } from "../integration/scheduler-api/assignment";
import { Route } from "../routes";
import { useRouter } from "next/navigation";
import { AuthContext } from "../context/auth-context";
import { useEffect, useState } from "react";
import { Button } from '@/components/ui/button';
import { Code } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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
    queryKey: ['assignments-admin'],
    refetchOnWindowFocus: true,
    initialData: [],
    queryFn: AssignmentService.GetMyAssignments,
  });

  const handleTry = (id: number) => {
    push(`${Route.Assignment}/${id}/${Route.Workspace}`);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold tracking-tight">My assignments</h1>
        <p className="text-muted-foreground mt-1">
          Here you can find all your assignments.
        </p>
      </div>

      {!isPending && isSuccess && data.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((assignment) => (
            <Card
              key={assignment.id}
              className="overflow-hidden hover:shadow-md transition-shadow"
            >
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">
                      {assignment.title}
                    </h3>
                  </div>
                  <p className="text-sm line-clamp-2 mb-4">
                    {assignment.description}
                  </p>
                  <Button
                    className="w-full"
                    onClick={() => handleTry(assignment.id)}
                  >
                    <Code className="h-4 w-4 mr-2" />
                    Open in Workspace
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full">
          <h2 className="text-2xl font-bold">No assignments found</h2>
          <p className="text-muted-foreground mt-1">
            You don&apos;t have any assignments yet.
          </p>
        </div>
      )}
    </div>
  );
}
