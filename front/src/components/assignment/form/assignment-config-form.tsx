import { WorkerExibitionMap } from "@/app/admin/assignments/constants";
import { Class } from "@/app/interface/scheduler-api/class";
import { WorkerType } from "@/app/interface/scheduler-api/worker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tooltip } from "@/components/ui/tooltip";
import { ErrorMessage, Field } from "formik";

export interface AssignmentConfigFormProps {
  classes: Class[];
}

export const AssignmentConfigForm = ({
  classes,
}: AssignmentConfigFormProps) => (
  <Card className="bg-slate-800 border-slate-700 max-h-[700px]">
    <CardHeader>
      <CardTitle className="text-white flex items-center justify-between">
        Informações do Assignment
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-white">
          Título
        </Label>
        <Field
          type="text"
          name="title"
          className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
          placeholder="Título do Assignment"
        />
        <ErrorMessage
          name="title"
          component="div"
          className="text-red-500 text-sm"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description" className="text-white">
          Descrição
        </Label>
        <Field
          as="textarea"
          type="text"
          name="description"
          className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
          placeholder="Descreva o que os alunos devem fazer"
        />
        <ErrorMessage
          name="description"
          component="div"
          className="text-red-500 text-sm"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="classId" className="block text-sm font-medium">
          Disciplina do Trabalho
        </Label>
        <Field
          as="select"
          name="classId"
          className="mt-1 block w-full px-3 py-2 border text-gray-700 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="">Selecione uma turma</option>
          {classes?.map((classRecord) => (
            <option key={classRecord.id} value={classRecord.id}>
              {classRecord.name}
            </option>
          ))}
        </Field>
        <ErrorMessage
          name="classId"
          component="div"
          className="text-red-500 text-sm"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="workerType" className="block text-sm font-medium">
          Tipo de Worker <Tooltip message="Kit de ferramentas para corrigir os exercícios" />
        </Label>
        <p className="block text-sm font-medium ">
          Selecione o tipo de worker que será utilizado para corrigir os
          exercícios dos alunos. Ele terá que ser condizente com os testes
          abaixo.
        </p>
        <Field
          as="select"
          id="workerType"
          name="workerType"
          className="mt-1 block w-full px-3 py-2 border text-gray-700  border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          {Object.entries(WorkerType).map(([key, value]) => (
            <option key={key} value={value}>
              {WorkerExibitionMap[value]}
            </option>
          ))}
        </Field>
        <ErrorMessage
          name="workerType"
          component="div"
          className="text-red-500 text-sm"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="maxAttempts" className="block text-sm font-medium">
          Máximo de Tentativas <Tooltip message="Quantidade de tentativas para realizar a tarefa" />
        </Label>
        <Field
          type="number"
          name="maxAttempts"
          className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
          placeholder="Número máximo de tentativas permitidas"
        />
        <ErrorMessage
          name="maxAttempts"
          component="div"
          className="text-red-500 text-sm"
        />
      </div>
    </CardContent>
  </Card>
);
