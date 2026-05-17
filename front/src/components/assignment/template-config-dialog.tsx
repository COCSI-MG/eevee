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
import dynamic from "next/dynamic";
import { Template, TemplateParamType } from "@/app/interface/scheduler-api/template";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

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
      <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl max-h-[85vh] overflow-hidden flex flex-col mx-4">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurar Template: {configTemplateDialog?.title}
          </DialogTitle>
        </DialogHeader>

        {configTemplateDialog && (
          <div className="flex-1 overflow-auto px-1 min-w-0">
            <div className="space-y-6 pb-6">
              <p className="text-slate-300">
                {configTemplateDialog.description}
              </p>
              <Separator className="bg-slate-600" />

              <div className="space-y-6">
                <h4 className="text-white font-medium">
                  Parâmetros do Template
                </h4>
                {configTemplateDialog.templateParams.map((param) => (
                  <div key={param.id} className="space-y-3">
                    <Label className="text-blue-300 font-medium text-sm">
                      {param.name} {formatTypeHint(param.type)}
                      <span className="text-red-400 ml-1">*</span>
                    </Label>
                    <div className="relative">
                      <div className="border border-slate-600 rounded-md overflow-auto min-w-0">
                        <Editor
                          value={paramsValues[param.id] || ""}
                          onChange={(value) => {
                            handleSetParamsValues(param.id, value || "");
                          }}
                          theme="vs-dark"
                          defaultLanguage="typescript"
                          height="100px"
                          className="sm:h-[120px] lg:h-[140px]"
                          options={{
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            fontSize: 12,
                            lineHeight: 16,
                            wordWrap: "on",
                          }}
                        />
                      </div>
                      <div className="absolute top-2 right-2">
                        {paramsValues[param.id]?.trim() ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                            <Check className="w-3 h-3" />
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-slate-500 text-slate-400 text-xs"
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
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
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
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <Check className="w-4 h-4 mr-2" />
            Confirmar Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
