import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileText,
  CodeSquareIcon,
  FlaskConical,
} from 'lucide-react';
import { Route } from '@/app/routes';

export const ADMIN_ROUTES = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/admin/users',
    label: 'Users',
    icon: Users,
  },
  {
    href: '/admin/classes',
    label: 'Classes',
    icon: GraduationCap,
  },
  {
    href: Route.AdminAssignments,
    label: 'Assignments',
    icon: FileText,
  },
  {
    href: Route.AdminTemplate,
    label: 'Templates',
    icon: CodeSquareIcon,
  },
  {
    href: Route.AdminAttempts,
    label: 'Tentativas de testes',
    icon: FlaskConical,
  },
];