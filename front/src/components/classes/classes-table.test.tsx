import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ClassesTable from './classes-table';
import { ClassesService } from '@/app/integration/scheduler-api/classes';
import { LearningActivities } from '@/app/integration/scheduler-api/learning-activity';
import { ExamService } from '@/app/integration/scheduler-api/exam';

jest.mock('@/hooks/use-auth-context', () => ({ useAuthContext: () => ({ user: { userId: 7 } }) }));
jest.mock('@/app/integration/scheduler-api/classes', () => ({ ClassesService: { listClassesByUserId: jest.fn() } }));
jest.mock('@/app/integration/scheduler-api/learning-activity', () => ({ LearningActivities: { list: jest.fn() } }));
jest.mock('@/app/integration/scheduler-api/exam', () => ({ ExamService: { listByClass: jest.fn() } }));
const group = { id: 12, name: 'Arquitetura', description: '', assignments: [] };
function show() {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={cache}><ClassesTable /></QueryClientProvider>);
}
beforeEach(() => {
  jest.clearAllMocks();
  (ClassesService.listClassesByUserId as jest.Mock).mockResolvedValue([group]);
});
it('loads real totals when the class response lacks summaries, without showing false zeros', async () => {
  let resolveLearning!: (value: unknown) => void;
  (LearningActivities.list as jest.Mock).mockReturnValue(new Promise(resolve => { resolveLearning = resolve; }));
  (ExamService.listByClass as jest.Mock).mockResolvedValue({ data: [{}], meta: { total: 4 } });
  show();
  expect(await screen.findByRole('link', { name: 'Práticas: Carregando — Arquitetura' })).toHaveTextContent('…');
  expect(screen.queryByRole('link', { name: 'Práticas: 0 — Arquitetura' })).toBeNull();
  resolveLearning([{kind:'practice'},{kind:'quiz'},{kind:'quiz'}]);
  expect(await screen.findByRole('link', { name: 'Práticas: 1 — Arquitetura' })).toHaveAttribute('href','/classes/12?view=learning');
  expect(await screen.findByRole('link', { name: 'Questionários: 2 — Arquitetura' })).toBeInTheDocument();
  expect(await screen.findByRole('link', { name: 'Provas: 4 — Arquitetura' })).toHaveAttribute('href','/classes/12?view=exams');
});
it('uses server summaries without extra requests and keeps badges readable independently of hover', async () => {
  (ClassesService.listClassesByUserId as jest.Mock).mockResolvedValue([{...group,activityCounts:{exams:3,practices:1,quizzes:2}}]);
  show();
  const link = await screen.findByRole('link',{name:'Práticas: 1 — Arquitetura'});
  expect(link.querySelector('.bg-muted')).toHaveClass('text-foreground');
  expect(LearningActivities.list).not.toHaveBeenCalled();
  expect(ExamService.listByClass).not.toHaveBeenCalled();
});
it('shows unavailable rather than zero when loading counts fails', async () => {
  (LearningActivities.list as jest.Mock).mockRejectedValue(new Error('Offline'));
  (ExamService.listByClass as jest.Mock).mockResolvedValue({data:[],meta:{total:0}});
  show();
  await waitFor(() => expect(screen.getByRole('link',{name:'Práticas: Indisponível — Arquitetura'})).toHaveTextContent('—'));
  expect(screen.getByRole('button',{name:'Tentar carregar os totais novamente'})).toBeInTheDocument();
});
