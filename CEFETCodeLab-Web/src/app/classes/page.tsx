import ClassesTable from "@/components/classes-table";

export default function ClassPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Suas classes</h1>
        <p className="text-slate-400 text-lg">
          Selecione uma classe para ver as tarefas e acompanhar o progresso e resultado da tarefa.
        </p>
      </div>

      <ClassesTable />
    </div>
  );
}
