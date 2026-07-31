"use client";

import { FileText, GraduationCap, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { useUsers } from "@/hooks/use-users";
import { useClasses } from "@/hooks/use-classes";
import { useQuery } from "@tanstack/react-query";
import { AssignmentService } from "@/app/integration/scheduler-api/assignment";
import Link from "next/link";
import QueryErrorState from "./admin/query-error-state";

interface Metric {
  title: string;
  value: string;
  description: string;
  icon: React.ForwardRefExoticComponent<
    Omit<React.SVGProps<SVGSVGElement>, "ref"> &
      React.RefAttributes<SVGSVGElement>
  >;
  href: string;
}

export function MetricsCard() {
  const {
    data: users,
    isFetching: isFetchingUser,
    isError: isUsersError,
    refetch: refetchUsers,
  } = useUsers();

  const {
    data: classes,
    isFetching: isFetchingClasses,
    isError: isClassesError,
    refetch: refetchClasses,
  } = useClasses();

  const {
    data: assignments,
    isFetching: isFetchingAssignments,
    isError: isAssignmentsError,
    refetch: refetchAssignments,
  } = useQuery({
    queryKey: ["adminAssignments"],
    queryFn: async () => {
      const assignmentsData = await AssignmentService.GetAssignmentsAdmin();
      if (!assignmentsData) {
        return [];
      }
      return assignmentsData;
    },
  });

  if (isFetchingUser || isFetchingClasses || isFetchingAssignments) {
    return <div>Carregando...</div>;
  }

  if (isUsersError || isClassesError || isAssignmentsError) {
    return (
      <QueryErrorState
        title="Não foi possível carregar as métricas"
        description="Uma ou mais consultas do dashboard falharam. Tente novamente."
        onRetry={() => {
          void Promise.all([
            refetchUsers(),
            refetchClasses(),
            refetchAssignments(),
          ]);
        }}
        retryLabel="Tentar novamente"
        isRetrying={isFetchingUser || isFetchingClasses || isFetchingAssignments}
        className="md:col-span-3"
      />
    );
  }

  const usersCount = users?.length ?? 0;
  const classesCount = classes?.length ?? 0;
  const assignmentsCount = assignments?.length ?? 0;

  const metrics: Metric[] = [
    {
      title: "Total de Usuários",
      value: usersCount.toString(),
      description: "Número de usuários cadastrados",
      icon: Users,
      href: "/admin/users",
    },
    {
      title: "Total de Turmas",
      value: classesCount.toString(),
      description: "Número de turmas disponíveis",
      icon: GraduationCap,
      href: "/admin/classes",
    },
    {
      title: "Total de Atividades",
      value: assignmentsCount.toString(),
      description: "Número de atividades criadas",
      icon: FileText,
      href: "/admin/assignments",
    },
  ];

  return metrics.map((metric, index) => (
    <Card key={index} className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
        <metric.icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{metric.value}</div>
        <p className="text-xs text-muted-foreground">{metric.description}</p>
        <Link href={metric.href} className="block mt-4">
          <Button variant="outline" size="sm" className="w-full">
            Ver Detalhes
          </Button>
        </Link>
      </CardContent>
    </Card>
  ));
}
