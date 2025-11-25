import { MoreHorizontal, Pencil, Trash2Icon } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import DeleteAlertDialog from "./delete-alert-dialog";
import { useState } from "react";
import Link from "next/link";
import { JSX } from "react";

interface TableActionsProps {
  href?: string;
  onDelete: () => void;
  otherActions?: JSX.Element[];
}

export default function TableActions({
  href,
  onDelete,
  otherActions = [],
}: TableActionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {otherActions.length > 0 && (
            <>{otherActions.map((component) => component)}</>
          )}
          <Link href={href ?? "#"}>
            <DropdownMenuItem>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => {
              setOpen(true);
            }}
          >
            <Trash2Icon className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {open && (
        <DeleteAlertDialog
          onDelete={() => {
            onDelete();
            setOpen(false);
          }}
          resourceName="item"
          open={open}
          onOpenChange={setOpen}
          hasTrigger={false}
        />
      )}
    </>
  );
}
