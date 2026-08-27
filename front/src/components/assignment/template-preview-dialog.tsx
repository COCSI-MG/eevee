import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Separator } from '../ui/separator';
import { Code } from 'lucide-react';
import { Template } from '@/app/interface/scheduler-api/template';
import { getWorkerLanguageConfig } from '@/lib/monaco/worker-editor-config';
import { MonacoCodeEditor } from '@/components/editor/monaco-code-editor';

interface TemplatePreviewDialogProps {
  template: Template | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TemplatePreviewDialog({ template, open, onOpenChange }: TemplatePreviewDialogProps) {
  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border w-[90vw] max-w-3xl max-h-[80vh] overflow-auto mx-4">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Code className="w-5 h-5" />
            {template.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-foreground">{template.description}</p>
          <Separator className="bg-primary/30" />
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">Conteúdo do Template</h4>
            <div className="bg-slate-900 border border-slate-600 rounded-md overflow-auto min-w-0">
              <MonacoCodeEditor
                preset="read-only-preview"
                path={`template-${template.id}${getWorkerLanguageConfig(template.workerType).fileExtension}`}
                value={template.content}
                workerType={template.workerType}
                height="300px"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
