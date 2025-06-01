'use client';

import TemplateForm from '@/components/template/template-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

export default function TemplateCreateEditPage() {
  const { back } = useRouter();
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => back()} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          {id === 'new' ? 'Create' : 'Edit'}
          Template
        </h1>
      </div>
      <TemplateForm />
    </div>
  );
}
