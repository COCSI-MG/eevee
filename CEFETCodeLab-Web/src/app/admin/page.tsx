'use client';
import { Route } from '../routes';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  GraduationCap,
  LucideProps,
  User,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { UsersService } from '../integration/scheduler-api/user';
import { ClassesService } from '../integration/scheduler-api/classes';
import {
  ForwardRefExoticComponent,
  RefAttributes,
  useEffect,
  useState,
} from 'react';
import { AssignmentService } from '../integration/scheduler-api/assignment';

interface Metrics {
  title: string;
  value: string;
  description: string;
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
  >;
  href: string;
}

export default function Admin() {
  const [metrics, setMetrics] = useState<Metrics[]>([]);

  const usersQuery = useQuery({
    queryKey: ['users'],
    initialData: [],
    queryFn: UsersService.getAllUsers,
  });
  const classQuery = useQuery({
    queryKey: ['classes'],
    initialData: [],
    queryFn: ClassesService.listClasses,
  });
  const assignmentQuery = useQuery({
    queryKey: ['adminAssignments'],
    queryFn: AssignmentService.GetAssignmentsAdmin,
  });

  useEffect(() => {
    if (
      usersQuery.isSuccess &&
      classQuery.isSuccess &&
      assignmentQuery.isSuccess
    ) {
      setMetrics([
        {
          title: 'Total Users',
          value: usersQuery.data.length.toString(),
          description: 'Total numbers of users coding with EEVEE',
          icon: User,
          href: Route.AdminUsers,
        },
        {
          title: 'Total Classes',
          value: classQuery.data.length.toString(),
          description: 'Total number of classes created',
          icon: GraduationCap,
          href: Route.AdminClasses,
        },
        {
          title: 'Total Assignments',
          value: assignmentQuery.data.length.toString(),
          description: 'Total number of assignments created',
          icon: FileText,
          href: Route.AdminAssignments,
        },
      ]);
    }
  }, [
    usersQuery.isSuccess,
    classQuery.isSuccess,
    assignmentQuery.isSuccess,
    usersQuery.data,
    classQuery.data,
    assignmentQuery.data,
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {(metrics ?? []).map((metric) => (
          <Card
            key={metric.title}
            className="hover:shadow-md transition-shadow"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                {metric.description}
              </p>
              <Link href={metric.href} className="block mt-4">
                <Button variant="outline" size="sm" className="w-full">
                  View Details
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
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
