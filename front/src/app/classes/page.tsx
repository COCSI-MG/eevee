import ClassesTable from "@/components/classes/classes-table";

export default function ClassPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Suas turmas</h1>
        <p className="text-muted-foreground text-lg">
          Acesse as tarefas, provas, práticas e questionários de cada turma.
        </p>
      </div>

      <ClassesTable />
    </div>
  );
}
