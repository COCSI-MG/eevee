"use client";

import { useQuery } from "@tanstack/react-query";
import { ClassesService } from "../integration/scheduler-api/classes";
import { useAuthUser } from "@/hooks/use-auth-user";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { GraduationCap, BookOpen } from "lucide-react";
import Link from "next/link";
import Loader from "@/components/loader";

export default function ClassPage() {
  const { user } = useAuthUser();

  const {
    data: classes,
    isSuccess,
    isPending,
  } = useQuery({
    queryKey: ["classes", user?.id],
    initialData: [],
    queryFn: ({ queryKey }) => {
      return ClassesService.listClassesByUserId(Number(queryKey[1]!));
    },
    enabled: !!user && !!user.id,
  });

  if (isPending) {
    return <Loader />;
  }

  if (!isSuccess) {
    return (
      <div className="flex items-center justify-center h-full">
        <h2 className="text-xl font-bold">
          Ocorreu um erro carregando as classes
        </h2>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Suas classes</h1>
        <p className="text-slate-400 text-lg">
          Selecione uma classe para ver as tarefas e acompanhar o progresso e resultado da tarefa.
        </p>
      </div>

      {classes.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Card
              key={cls.id}
              className="overflow-hidden hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{cls.name}</CardTitle>
                  <GraduationCap className="h-6 w-6" />
                </div>
                <CardDescription className="line-clamp-2">
                  {cls.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="mt-4 flex items-center text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4 mr-1" />
                  <span>
                    {cls.assignments?.length || 0} tarefas disponiveis
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                <Link
                  href={`/classes/assignment/${cls.id}`}
                  className="flex-1 mt-4"
                >
                  <Button
                    variant="default"
                    className="w-full flex items-center"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Assignments
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full">
          <h2 className="text-xl font-bold">No classes found</h2>
          <p className="text-muted-foreground">
            You are not enrolled in any classes.
          </p>
        </div>
      )}
    </div>
  );
}
