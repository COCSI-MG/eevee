import type React from 'react';
import AdminDashboardLayout from '@/layouts/admin/admin-dashboard-layout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminDashboardLayout>{children}</AdminDashboardLayout>;
}
