import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Editor } from '@monaco-editor/react';
import { Separator } from '../ui/separator';
import { Code } from 'lucide-react';
import { Template } from '@/app/interface/scheduler-api/template';

interface TemplatePreviewDialogProps {
  template: Template | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TemplatePreviewDialog({ template, open, onOpenChange }: TemplatePreviewDialogProps) {
  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 w-[90vw] max-w-3xl max-h-[80vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Code className="w-5 h-5" />
            {template.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-slate-300">{template.description}</p>
          <Separator className="bg-slate-600" />
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">Conteúdo do Template</h4>
            <div className="bg-slate-900 border border-slate-600 rounded-md overflow-hidden">
              <Editor
                value={template.templateContent}
                language="typescript"
                theme="vs-dark"
                height="300px"
                options={{ readOnly: true, minimap: { enabled: false }, scrollBeyondLastLine: false }}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}