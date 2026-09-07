'use client';

import Link from 'next/link';
import { Code2, LogOut } from 'lucide-react';
import { Route } from '@/app/routes';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/hooks/use-auth-context';

export function Header() {
  const { logout } = useAuthContext();

  return (
    <header className="border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link
            href="/classes"
            className="flex items-center gap-2 text-sidebar-foreground hover:text-sidebar-primary transition-colors"
          >
            <Code2 className="h-8 w-8" />
            <span className="text-2xl font-bold">EEVEE</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href={`/${Route.Classes}`}
              className="text-sidebar-foreground hover:text-sidebar-primary transition-colors"
            >
              Turmas
            </Link>
            <Button
              onClick={logout}
              variant="outline"
              className="border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span className="mr-2">Sair</span>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
