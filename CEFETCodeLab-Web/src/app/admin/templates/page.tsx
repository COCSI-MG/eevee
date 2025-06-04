import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import TemplatesTable from '@/components/templates-table';

export default function TemplatePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Templates</h1>
        <Link href="/admin/templates/new">
          <Button variant={'outline'}>
            <Plus className="h-4 w-4 mr-2" />
            Add Template
          </Button>
        </Link>
      </div>

      <div className="border rounded-md">
        <TemplatesTable />
      </div>
    </div>
  );
}
