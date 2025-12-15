'use client';

import TemplateForm from '@/components/template/template-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TEMPLATE_PAGE_TEXT } from '@/app/admin/templates/constants';

export default function TemplateCreateEditPage() {
  const { back } = useRouter();

  return (
    <div>
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => back()} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {TEMPLATE_PAGE_TEXT.backButton}
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          {TEMPLATE_PAGE_TEXT.title}
        </h1>
      </div>

      <TemplateForm />
    </div>
  );
}
