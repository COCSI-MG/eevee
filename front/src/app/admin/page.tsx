import { Route } from "../routes";
import { Button } from "@/components/ui/button";
import { FileText, GraduationCap, Users } from "lucide-react";
import Link from "next/link";
import { MetricsCard } from "@/components/metrics-card";

export default function Admin() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Painel</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricsCard />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Ações Rápidas</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href={Route.AdminUsers + "/new"}>
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center gap-2"
            >
              <Users className="h-6 w-6" />
              <span>Adicionar Novo Usuário</span>
            </Button>
          </Link>
          <Link href={Route.AdminClasses + "/new"}>
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center gap-2"
            >
              <GraduationCap className="h-6 w-6" />
              <span>Criar Nova Turma</span>
            </Button>
          </Link>
          <Link href={Route.AdminAssignments + "/create"}>
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center gap-2"
            >
              <FileText className="h-6 w-6" />
              <span>Criar Nova Atividade</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
