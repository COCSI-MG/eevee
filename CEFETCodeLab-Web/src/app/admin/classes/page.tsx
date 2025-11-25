import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import ClassesTable from "@/components/classes-table";

export default function ClassesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
        <Link href="/admin/classes/new">
          <Button variant={"outline"}>
            <Plus className="h-4 w-4 mr-2" />
            Add Class
          </Button>
        </Link>
      </div>
      <div className="border rounded-md">
        <ClassesTable />
      </div>
    </div>
  );
}
