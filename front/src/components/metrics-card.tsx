"use client";

import { FileText, GraduationCap, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { useQuery } from "@tanstack/react-query";
import { DashboardService } from "@/app/integration/scheduler-api/dashboard";
import Link from "next/link";
import QueryErrorState from "@/components/shared/query-error-state";

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
    data: metricsData,
    isFetching,
    isError,
    refetch
  } = useQuery({
    queryKey: ["adminDashboardMetrics"],
    queryFn: DashboardService.getMetrics,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  if (isFetching) {
    return <div>Carregando...</div>;
  }

  if (isError) {
    return (
      <QueryErrorState
        title="Não foi possível carregar as métricas"
        description="A consulta das métricas do painel falhou. Tente novamente."
        onRetry={() => void refetch()}
        retryLabel="Tentar novamente"
        isRetrying={isFetching}
        className="md:col-span-3"
      />
    );
  }

  const usersCount = metricsData?.usersCount ?? 0;
  const classesCount = metricsData?.classesCount ?? 0;
  const assignmentsCount = metricsData?.assignmentsCount ?? 0;

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
