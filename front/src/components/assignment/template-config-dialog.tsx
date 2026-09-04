import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings, Check } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Template, TemplateParamType } from "@/app/interface/scheduler-api/template";
import { Tooltip } from "../ui/tooltip";
import { MonacoCodeEditor } from "@/components/editor/monaco-code-editor";

interface TemplateConfigDialogProps {
  configTemplateDialog: Template | null;
  handleCloseConfigDialog: () => void;
  handleConfirmTemplate: () => void;
  paramsValues: Record<number, string>;
  handleSetParamsValues: (paramId: number, value: string) => void;
  isAllParamsFilled: (template: Template) => boolean;
}

export default function TemplateConfigDialog({
    configTemplateDialog,
    handleCloseConfigDialog,
    handleConfirmTemplate,
    paramsValues,
    handleSetParamsValues,
    isAllParamsFilled
}: TemplateConfigDialogProps) {
  const formatTypeHint = (type?: TemplateParamType) => {
    if (!type) return null;
    return `(${type})`;
  };

  return (
    <Dialog
      open={!!configTemplateDialog}
      onOpenChange={handleCloseConfigDialog}
    >
      <DialogContent className="bg-card border-border max-w-4xl max-h-[85vh] overflow-hidden flex flex-col mx-4">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurar Template: {configTemplateDialog?.title}
          </DialogTitle>
        </DialogHeader>

        {configTemplateDialog && (
          <div className="flex-1 overflow-auto px-1 min-w-0">
            <div className="space-y-6 pb-6">
              <p className="text-foreground">
                {configTemplateDialog.description}
              </p>
              <Separator className="bg-primary/30" />

              <div className="space-y-6">
                <h4 className="text-foreground font-medium">
                  Parâmetros do Template <Tooltip message="Adicione o parâmetro para configurar os testes do template" />
                </h4>
                {configTemplateDialog.templateParams.map((param) => (
                  <div key={param.id} className="space-y-3">
                    <Label className="text-primary font-medium text-sm">
                      {param.name} {formatTypeHint(param.type)}
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                    <div className="relative">
                      <div className="border border-border rounded-md overflow-auto min-w-0">
                        <MonacoCodeEditor
                          preset="parameter-input"
                          value={paramsValues[param.id] || ""}
                          onChange={(value) => {
                            handleSetParamsValues(param.id, value || "");
                          }}
                          workerType={configTemplateDialog?.workerType}
                          height="100px"
                          className="sm:h-[120px] lg:h-[140px]"
                        />
                      </div>
                      <div className="absolute top-2 right-2">
                        {paramsValues[param.id]?.trim() ? (
                          <Badge className="bg-success/10 text-success border-success text-xs">
                            <Check className="w-3 h-3" />
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-border text-muted-foreground text-xs"
                          >
                            Vazio
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCloseConfigDialog();
            }}
            className="border-border text-foreground hover:bg-primary/20"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleConfirmTemplate();
            }}
            disabled={
              !configTemplateDialog || !isAllParamsFilled(configTemplateDialog)
            }
            className="bg-primary hover:bg-primary/90 disabled:opacity-50"
          >
            <Check className="w-4 h-4 mr-2" />
            Confirmar Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
