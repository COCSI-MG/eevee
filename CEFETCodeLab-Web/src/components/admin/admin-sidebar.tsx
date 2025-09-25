"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ADMIN_ROUTES } from "@/app/admin/constants";

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuthUser();

  const isActiveRoute = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Navigation Links */}
      <nav className="flex-1 space-y-1">
        {ADMIN_ROUTES.map((route) => {
          const IconComponent = route.icon;
          const isActive = isActiveRoute(route.href);

          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              )}
            >
              <IconComponent className="mr-3 h-5 w-5" />
              {route.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="mt-auto pt-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:bg-gray-700 hover:text-white"
          onClick={logout}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
