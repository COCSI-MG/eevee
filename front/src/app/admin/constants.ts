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
    label: 'Painel',
    icon: LayoutDashboard,
  },
  {
    href: '/admin/users',
    label: 'Usuários',
    icon: Users,
  },
  {
    href: '/admin/classes',
    label: 'Turmas',
    icon: GraduationCap,
  },
  {
    href: Route.AdminAssignments,
    label: 'Atividades',
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