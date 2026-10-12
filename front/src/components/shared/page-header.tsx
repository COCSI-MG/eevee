import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type BackNavigation = { href: string; onBack?: never } | { href?: never; onBack: () => void };

type PageHeaderProps = BackNavigation & {
  title: ReactNode;
  backLabel?: string;
};

export default function PageHeader( { title, backLabel = "Voltar", href, onBack } : PageHeaderProps ) {
  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" asChild={href !== undefined} onClick={onBack}>
        {href !== undefined ? (
          <Link href={href}>
            <ArrowLeft className="mr-2 h-4 w-4" />

            {backLabel}
          </Link>
        ) : (
          <>
            <ArrowLeft className="mr-2 h-4 w-4" />

            {backLabel}
          </>
        )}
      </Button>
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
    </div>
  );
}
