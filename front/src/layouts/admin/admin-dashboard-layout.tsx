import type React from "react";

import Link from "next/link";
import {
  Code,
} from "lucide-react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminMobileHeader } from "@/components/admin/admin-mobile-header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function AdminDashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen">
      <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-50 bg-sidebar text-sidebar-foreground">
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="px-3 py-4 flex flex-1 flex-col">
            <Link href="/admin" className="flex items-center pl-3 mb-10">
              <div className="relative w-8 h-8 mr-2 rounded-full bg-primary flex items-center justify-center">
                <Code className="w-4 h-4 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">EEVEE</h1>
            </Link>

            <AdminSidebar />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="md:pl-72">
        <AdminMobileHeader />

        {/* Page Content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
