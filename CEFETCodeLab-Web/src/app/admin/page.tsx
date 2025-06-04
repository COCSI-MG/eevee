import { Route } from '../routes';
import { Button } from '@/components/ui/button';
import { FileText, GraduationCap, Users } from 'lucide-react';
import Link from 'next/link';
import { MetricsCard } from '@/components/metrics-card';

export default async function Admin() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricsCard />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href={Route.AdminUsers + '/new'}>
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center gap-2"
            >
              <Users className="h-6 w-6" />
              <span>Add New User</span>
            </Button>
          </Link>
          <Link href={Route.AdminClasses + '/new'}>
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center gap-2"
            >
              <GraduationCap className="h-6 w-6" />
              <span>Create New Class</span>
            </Button>
          </Link>
          <Link href={Route.AdminAssignments + '/new'}>
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center gap-2"
            >
              <FileText className="h-6 w-6" />
              <span>Create New Assignment</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
