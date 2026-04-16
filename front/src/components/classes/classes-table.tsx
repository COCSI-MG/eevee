"use client";

import { ClassesService } from "@/app/integration/scheduler-api/classes";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, GraduationCap, Loader } from "lucide-react";
import Link from "next/link";

export default function ClassesTable() {
  const { user } = useAuthContext();

  const {
    data: classes,
    isSuccess,
    isPending,
  } = useQuery({
    queryKey: ["classes", user?.userId],
    initialData: [],
    queryFn: ({ queryKey }) => {
      return ClassesService.listClassesByUserId(Number(queryKey[1]!));
    },
    enabled: !!user && !!user.userId,
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

  if (isSuccess && classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-xl font-bold">Nenhuma classe encontrada</h2>
        <p className="text-muted-foreground">
          Você não está matriculado em nenhuma classe.
        </p>
      </div>
    );
  }

  return (
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
              <span>{cls.assignments?.length || 0} tarefas disponiveis</span>
            </div>
          </CardContent>
          <CardFooter>
            <Link
              href={`/classes/assignment/${cls.id}`}
              className="flex-1 mt-4"
            >
              <Button variant="default" className="w-full flex items-center">
                <BookOpen className="h-4 w-4 mr-2" />
                Assignments
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
