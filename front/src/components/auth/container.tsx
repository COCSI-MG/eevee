import { Code } from 'lucide-react';
import React from 'react';

interface AuthContainerProps {
  context: 'login' | 'register';
  children: React.JSX.Element;
}

export default function AuthContainer({ ...props }: AuthContainerProps) {
  return (
    <div className="max-w-md w-full space-y-8">
      <div className="text-center">
        <div className="flex justify-center">
          <div className="relative w-16 h-16 rounded-full bg-primary flex items-center justify-center">
            <Code className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>
        <h1 className="mt-4 text-3xl font-extrabold text-foreground">
          EEVEE Code Lab
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {props.context === 'login'
            ? 'Faca login na sua conta para acessar seu painel'
            : 'Crie sua conta e comece a programar conosco'}
        </p>
      </div>
      {/* Form children render by parent */}
      {props.children}
    </div>
  );
}
