'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Code, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';

const WorkspaceHeader: React.FC = () => {
  const { back } = useRouter();

  return (
    <header className="flex items-center justify-between p-3 border-b border-slate-700">
      <div className="flex items-center gap-2">
        <Code className="h-5 w-5" />
        <span className="font-bold text-lg">EEVEE</span>
        <div className="ml-4 flex items-center">
          <Info className="h-4 w-4 text-slate-400" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => back()}>
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
