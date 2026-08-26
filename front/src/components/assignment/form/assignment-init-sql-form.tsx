"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorMessage } from "formik";
import { Database } from "lucide-react";
import { MonacoCodeEditor } from "@/components/editor/monaco-code-editor";

export interface AssignmentInitSqlFormProps {
  initSqlScript?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setFieldValue: (field: string, value: any) => void;
}

export const AssignmentInitSqlForm: React.FC<AssignmentInitSqlFormProps> = ({
  initSqlScript,
  setFieldValue,
}) => {
  return (
    <Card className="bg-slate-800 border-slate-700 max-h-[600px]">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Database className="w-5 h-5" />
          Script SQL de Inicialização
        </CardTitle>
      </CardHeader>
      <CardContent>
        <span className="text-sm text-slate-400 mb-2 block">
          Forneça o script SQL que será executado para inicializar o banco de
          dados PostgreSQL antes da execução do código do aluno. Utilize este
          campo para criar tabelas, inserir dados iniciais (seeds), etc.
        </span>
        <MonacoCodeEditor
          preset="form-field"
          path="init.sql"
          height={400}
          value={initSqlScript ?? ""}
          onChange={(value) => setFieldValue("initSqlScript", value)}
        />
        <ErrorMessage
          name="initSqlScript"
          component="div"
          className="text-red-500 text-sm"
        />
      </CardContent>
    </Card>
  );
};
