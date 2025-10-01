'use client';

import Link from 'next/link';
import { Code2, LogOut } from 'lucide-react';
import { Route } from '@/app/routes';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/hooks/use-auth-context';

export function Header() {
  const { logout } = useAuthContext();

  return (
    <header className="bg-slate-900 border-b border-slate-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link
            href="/classes"
            className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors"
          >
            <Code2 className="h-8 w-8" />
            <span className="text-2xl font-bold">EEVEE</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href={`/${Route.Classes}`}
              className="text-slate-300 hover:text-white transition-colors"
            >
              Classes
            </Link>
            <Button
              onClick={logout}
              variant="outline"
              className="text-slate-300 hover:text-white transition-colors"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span className="mr-2">Logout</span>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
