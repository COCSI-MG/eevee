"use client";

import { FileText, GraduationCap, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { useUsers } from "@/hooks/use-users";
import { useEffect, useState } from "react";
import { useClasses } from "@/hooks/use-classes";
import { useQuery } from "@tanstack/react-query";
import { AssignmentService } from "@/app/integration/scheduler-api/assignment";
import Link from "next/link";

interface Metric {
  title: string;
  value: string;
  description: string;
  icon: React.ForwardRefExoticComponent<
    Omit<React.SVGProps<SVGSVGElement>, "ref"> &
      React.RefAttributes<SVGSVGElement>
  >;
  href: string;
}

export function MetricsCard() {
  const [metrics, setMetrics] = useState<Metric[]>([]);

  const {
    data: users,
    isFetching: isFetchingUser,
    isSuccess: isSuccessUsers,
  } = useUsers();

  const {
    data: classes,
    isFetching: isFetchingClasses,
    isSuccess: isSuccessClasses,
  } = useClasses();

  const {
    data: assignments,
    isFetching: isFetchingAssignments,
    isSuccess: isSuccessAssignments,
  } = useQuery({
    queryKey: ["adminAssignments"],
    queryFn: AssignmentService.GetAssignmentsAdmin,
  });

  useEffect(() => {
    if (isSuccessUsers && isSuccessClasses && isSuccessAssignments) {
      setMetrics([
        {
          title: "Total Users",
          value: users.length.toString(),
          description: "Number of registered users",
          icon: Users,
          href: "/admin/users",
        },
        {
          title: "Total Classes",
          value: classes.length.toString(),
          description: "Number of available classes",
          icon: GraduationCap,
          href: "/admin/classes",
        },
        {
          title: "Total Assignments",
          value: assignments.length.toString(),
          description: "Number of assignments created",
          icon: FileText,
          href: "/admin/assignments",
        },
      ]);
    }
  }, [
    users,
    classes,
    assignments,
    isSuccessUsers,
    isSuccessClasses,
    isSuccessAssignments,
  ]);

  if (isFetchingUser || isFetchingClasses || isFetchingAssignments) {
    return <div>Loading...</div>;
  }

  return (metrics ?? []).map((metric) => (
    <Card key={metric.title} className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
        <metric.icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{metric.value}</div>
        <p className="text-xs text-muted-foreground">{metric.description}</p>
        <Link href={metric.href} className="block mt-4">
          <Button variant="outline" size="sm" className="w-full">
            View Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  ));
}
