"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/hooks/use-auth-context";
import { ADMIN_ROUTES } from "@/app/admin/constants";

export function AdminMobileHeader() {
  const pathname = usePathname();
  const { logout } = useAuthContext();

  const isActiveRoute = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex items-center border-b border-sidebar-border bg-sidebar p-4 text-sidebar-foreground md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          {/* Mobile menu content with active state logic */}
          <div className="flex flex-col h-full overflow-y-auto">
            <nav className="flex-1 space-y-1 p-4">
              {ADMIN_ROUTES.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer rounded-lg transition",
                    isActiveRoute(route.href)
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <div className="flex items-center flex-1">
                    <route.icon
                      className={cn(
                        "h-5 w-5 mr-3",
                        isActiveRoute(route.href)
                          ? "text-sidebar-accent-foreground"
                          : "text-sidebar-foreground"
                      )}
                    />
                    {route.label}
                  </div>
                </Link>
              ))}
            </nav>
            <div className="p-3">
              <Button
                variant="outline"
                className="w-full justify-start border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
                size="sm"
                onClick={logout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex items-center justify-center flex-1">
        <Link href="/admin" className="flex items-center">
          <div className="relative w-8 h-8 mr-4 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold">C</span>
          </div>
          <h1 className="text-xl font-bold">Code Lab</h1>
        </Link>
      </div>
    </div>
  );
}
