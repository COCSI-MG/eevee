import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import AssignmentsTable from "@/components/assignments-table";
import { Route } from "@/app/routes";

export default function AssignmentsAdminPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>

        <Link href={`/${Route.AdminAssignmentCreate}`}>
          <Button variant={"outline"}>
            <Plus className="h-4 w-4 mr-2" />
            Add Assignment
          </Button>
        </Link>
      </div>
      <div className="border rounded-md">
        <AssignmentsTable />
      </div>
    </div>
  );
}
