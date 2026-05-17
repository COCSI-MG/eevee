import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SelectedTemplate } from "@/types/shared";
import {
  ClipboardCheck,
  Settings,
  Code,
  Database,
  Layers,
} from "lucide-react";

interface AssignmentFormReviewProps {
  values: Partial<Assignment>;
  classes: { id: number; name: string }[];
  selectedTemplates: SelectedTemplate[] | null; 
}

const AssigmentReview = ({
  values,
  classes,
}: {
  values: AssignmentFormReviewProps["values"];
  classes: AssignmentFormReviewProps["classes"];
}) => {
  return (
    <div>
      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
        <Settings className="w-4 h-4" />
        Configurações
      </h4>
      <div className="bg-slate-700/30 p-4 rounded-lg space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">
              Título
            </p>
            <p className="text-white font-medium">{values.title}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">
              Turma
            </p>
            <p className="text-white font-medium">
              {classes.find((c) => c.id === Number(values.classId))?.name}
            </p>
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide">
            Descrição
          </p>
          <p className="text-white">{values.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">
              Worker Type
            </p>
            <p className="text-white">{values.workerType}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">
              Max Tentativas
            </p>
            <p className="text-white">{values.maxAttempts}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const TemplateReview = ({
  selectedTemplates,
}: {
  selectedTemplates: AssignmentFormReviewProps["selectedTemplates"];
}) => {
  return (
    <div>
      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
        <Code className="w-4 h-4" />
        Templates de teste adicionados ({selectedTemplates ? selectedTemplates.length : 0})
      </h4>

      {selectedTemplates?.length === 0 && (
        <p className="text-sm text-slate-400">Nenhum template selecionado.</p>
      )}

      <div className="space-y-3">
        {selectedTemplates?.map((template, index) => (
          <div key={index} className="bg-slate-700/30 p-4 rounded-lg">
            <h5 className="text-white font-medium mb-2">
              {template.name} 
            </h5>
            <div className="space-y-2">
              {template.params.map((param) => (
                <div
                  key={param.templateParamId}
                  className="bg-slate-800 rounded p-3"
                >
                  <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap">
                    {param.value}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function AssignmentFormReview({
  values,
  classes,
  selectedTemplates,
}: AssignmentFormReviewProps) {
  return (
    <div className="max-w-8xl mx-auto max-h-[500px]">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            Revisão Final
          </CardTitle>
          <p className="text-sm text-slate-400">
            Revise todas as informações antes de criar o assignment
          </p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {/* Configurações */}
              <AssigmentReview values={values} classes={classes} />

              {/* Templates */}
              <TemplateReview selectedTemplates={selectedTemplates} />

              {/* Boilerplate */}
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Código Boilerplate
                </h4>
                <div className="bg-slate-900 border border-slate-600 rounded-lg p-4 max-h-[300px] overflow-auto">
                  <pre className="text-green-400 text-sm font-mono whitespace-pre">
                    {values.boilerplate}
                  </pre>
                </div>
              </div>

              {/* Init SQL Script */}
              {values.initSqlScript && (
                <div>
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Script SQL de Inicialização
                  </h4>
                  <div className="bg-slate-900 border border-slate-600 rounded-lg p-4 max-h-[300px] overflow-auto">
                    <pre className="text-blue-400 text-sm font-mono whitespace-pre">
                      {values.initSqlScript}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
