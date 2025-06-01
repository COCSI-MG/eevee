import React from 'react';
import { Button } from '@/components/ui/button';
import { Code, PanelLeft } from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';

export interface WorkspaceHeaderProps {
  showExercisePanel: boolean;
  toggleExercisePanel: () => void;
}

const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  showExercisePanel,
  toggleExercisePanel,
}) => {
  const { push } = useRouter();

  return (
    <header className="flex items-center justify-between p-3 border-b border-slate-700">
      <div className="flex items-center gap-2">
        <Code className="h-5 w-5" />
        <span className="font-bold text-lg">EEVEE</span>
        <div className="ml-4 flex items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showExercisePanel ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={toggleExercisePanel}
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>
                  {showExercisePanel ? 'Ocultar' : 'Mostrar'} painel de
                  exercícios
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => push('/assignment')}>
          Assigments
        </Button>
        <Button variant="ghost" size="sm">
          Ajuda
        </Button>
      </div>
    </header>
  );
};

export default WorkspaceHeader;
