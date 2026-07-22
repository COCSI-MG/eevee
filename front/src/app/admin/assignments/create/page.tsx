import { Button } from "@/components/ui/button";
import { AssignmentForm } from "../../../../components/assignment/form/assignment-form";
import Link from "next/link";
import { Route } from "@/app/routes";
import { ArrowLeft } from "lucide-react";

export default function CreateAssignmentPage() {
  return (
    <div className="h-fit text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={"ghost"}
            size={"sm"}
            className="text-slate-400 hover:text-white"
            asChild
          >
            <Link href={`${Route.AdminAssignments}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div className="h-4 w-px bg-slate-600 mr-2" />
          <h1 className="text-xl font-semibold">Criar Atividade</h1>
        </div>
      </div>

      <AssignmentForm />
    </div>
  );
}
