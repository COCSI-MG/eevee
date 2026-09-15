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
import { formatDateTime } from "@/utils/date";
import { ASSIGNMENT_FORM_TEXT } from "./constants";

interface AssignmentFormReviewProps {
  values: Partial<Assignment>;
  classes: { id: number; name: string }[];
  selectedTemplates: SelectedTemplate[] | null;
  weightError: string | null;
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
      <h4 className="text-foreground font-medium mb-3 flex items-center gap-2">
        <Settings className="w-4 h-4" />
        {ASSIGNMENT_FORM_TEXT.REVIEW.CONFIG_TITLE}
      </h4>
      <div className="bg-primary/10 p-4 rounded-lg space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {ASSIGNMENT_FORM_TEXT.REVIEW.ACTIVITY_TITLE}
            </p>
            <p className="text-foreground font-medium">{values.title}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {ASSIGNMENT_FORM_TEXT.REVIEW.CLASS}
            </p>
            <p className="text-foreground font-medium">
              {classes.find((c) => c.id === Number(values.classId))?.name}
            </p>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {ASSIGNMENT_FORM_TEXT.REVIEW.DESCRIPTION_LABEL}
          </p>
          <p className="text-foreground">{values.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {ASSIGNMENT_FORM_TEXT.REVIEW.WORKER_TYPE}
            </p>
            <p className="text-foreground">{values.workerType}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {ASSIGNMENT_FORM_TEXT.REVIEW.MAX_ATTEMPTS}
            </p>
            <p className="text-foreground">{values.maxAttempts}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">
              Data de início
            </p>
            <p className="text-white">{formatDateTime(values.startDate)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">
              Data de entrega
            </p>
            <p className="text-white">{formatDateTime(values.dueDate)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const TemplateReview = ({
  selectedTemplates,
  weightError,
}: {
  selectedTemplates: AssignmentFormReviewProps["selectedTemplates"];
  weightError: AssignmentFormReviewProps["weightError"];
}) => {
  return (
    <div>
      <h4 className="text-foreground font-medium mb-3 flex items-center gap-2">
        <Code className="w-4 h-4" />
        {ASSIGNMENT_FORM_TEXT.REVIEW.TEMPLATES_ADDED(selectedTemplates?.length ?? 0)}
      </h4>

      {selectedTemplates?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {ASSIGNMENT_FORM_TEXT.REVIEW.NO_TEMPLATE_SELECTED}
        </p>
      )}

      <div className="space-y-3">
        {selectedTemplates?.map((template, index) => (
          <div key={index} className="bg-primary/10 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-foreground font-medium">
                {template.name}
              </h5>
              {template.weight !== undefined && (
                <span className="text-xs text-success font-medium tabular-nums">
                  {template.weight.toFixed(2)}%
                </span>
              )}
            </div>
            <div className="space-y-2">
              {template.params.map((param) => (
                <div
                  key={param.templateParamId}
                  className="bg-card rounded p-3"
                >
                  <pre className="text-success text-xs font-mono whitespace-pre-wrap">
                    {param.value}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {weightError && (
        <p className="text-sm text-destructive mt-3">{weightError}</p>
      )}
    </div>
  );
};

export default function AssignmentFormReview({
  values,
  classes,
  selectedTemplates,
  weightError,
}: AssignmentFormReviewProps) {
  return (
    <div className="max-w-8xl mx-auto max-h-[500px]">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            {ASSIGNMENT_FORM_TEXT.REVIEW.TITLE}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {ASSIGNMENT_FORM_TEXT.REVIEW.DESCRIPTION}
          </p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {/* Configurações */}
              <AssigmentReview values={values} classes={classes} />

              {/* Templates */}
              <TemplateReview
                selectedTemplates={selectedTemplates}
                weightError={weightError}
              />

              {/* Boilerplate */}
              <div>
                <h4 className="text-foreground font-medium mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  {ASSIGNMENT_FORM_TEXT.BOILERPLATE.TITLE}
                </h4>
                <div className="bg-background border border-border rounded-lg p-4 max-h-[300px] overflow-auto">
                  <pre className="text-success text-sm font-mono whitespace-pre">
                    {values.boilerplate}
                  </pre>
                </div>
              </div>

              {/* Init SQL Script */}
              {values.initSqlScript && (
                <div>
                  <h4 className="text-foreground font-medium mb-3 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    {ASSIGNMENT_FORM_TEXT.INIT_SQL.TITLE}
                  </h4>
                  <div className="bg-background border border-border rounded-lg p-4 max-h-[300px] overflow-auto">
                    <pre className="text-primary text-sm font-mono whitespace-pre">
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
