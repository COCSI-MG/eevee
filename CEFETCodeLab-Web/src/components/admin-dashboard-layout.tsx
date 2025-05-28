'use client';

import type React from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileText,
  LogOut,
  Menu,
  Code,
  CodeSquareIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthUser } from '@/hooks/use-auth-user';
import { toast } from '@/hooks/use-toast';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function AdminDashboardLayout({
  children,
}: DashboardLayoutProps) {
  const { user, logout } = useAuthUser();
  const pathname = usePathname();
  const { push } = useRouter();

  useEffect(() => {
    if (user && !user.isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access this page.',
        variant: 'destructive',
      });
      push('/classes');
    }
  }, [push, user]);

  const routes = useMemo(
    () => [
      {
        href: '/admin',
        label: 'Dashboard',
        icon: LayoutDashboard,
        active: pathname === '/admin',
      },
      {
        href: '/admin/users',
        label: 'Users',
        icon: Users,
        active: pathname.startsWith('/admin/users'),
      },
      {
        href: '/admin/classes',
        label: 'Classes',
        icon: GraduationCap,
        active: pathname.startsWith('/admin/classes'),
      },
      {
        href: '/admin/assignments',
        label: 'Assignments',
        icon: FileText,
        active: pathname.startsWith('/admin/assignments'),
      },
      {
        href: '/admin/templates',
        label: 'Templates',
        icon: CodeSquareIcon,
        active: pathname.startsWith('/admin/templates'),
      },
    ],
    [pathname]
  );

  return (
    <div className="h-full relative">
      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
        <div className="flex flex-col h-full overflow-y-auto">
          <div className="px-3 py-4 flex flex-1 flex-col">
            <Link href="/admin" className="flex items-center pl-3 mb-10">
              <div className="relative w-8 h-8 mr-2 rounded-full bg-primary flex items-center justify-center">
                <Code />
              </div>
              <h1 className="text-xl font-bold text-white">EEVEE CEFET/RJ</h1>
            </Link>
            <nav className="flex-1 space-y-1">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    'text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition',
                    route.active ? 'text-white bg-white/10' : 'text-zinc-400'
                  )}
                >
                  <div className="flex items-center flex-1">
                    <route.icon
                      className={cn(
                        'h-5 w-5 mr-3',
                        route.active ? 'text-white' : 'text-zinc-400'
                      )}
                    />
                    {route.label}
                  </div>
                </Link>
              ))}
            </nav>
          </div>
          <div className="p-3">
            <Button
              variant="outline"
              className="w-full justify-start text-zinc-400 hover:text-white"
              size="sm"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
      <main className="md:pl-72 h-full">
        <div className="flex items-center p-4 border-b md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-gray-900">
              <div className="flex flex-col h-full overflow-y-auto">
                <div className="px-3 py-4 flex flex-1 flex-col">
                  <Link
                    href="/dashboard"
                    className="flex items-center pl-3 mb-10"
                  >
                    <div className="relative w-8 h-8 mr-4 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground font-bold">
                        C
                      </span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Code Lab</h1>
                  </Link>
                  <nav className="flex-1 space-y-1">
                    {routes.map((route) => (
                      <Link
                        key={route.href}
                        href={route.href}
                        className={cn(
                          'text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition',
                          route.active
                            ? 'text-white bg-white/10'
                            : 'text-zinc-400'
                        )}
                      >
                        <div className="flex items-center flex-1">
                          <route.icon
                            className={cn(
                              'h-5 w-5 mr-3',
                              route.active ? 'text-white' : 'text-zinc-400'
                            )}
                          />
                          {route.label}
                        </div>
                      </Link>
                    ))}
                  </nav>
                </div>
                <div className="p-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-zinc-400 hover:text-white"
                    size="sm"
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center justify-center flex-1">
            <Link href="/dashboard" className="flex items-center">
              <div className="relative w-8 h-8 mr-4 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">C</span>
              </div>
              <h1 className="text-xl font-bold">Code Lab</h1>
            </Link>
          </div>
        </div>
        <div className="p-6 h-full">{children}</div>
      </main>
    </div>
  );
}
