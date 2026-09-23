import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QuizSpace } from './quiz-space';
import { LearningActivity } from '@/app/interface/scheduler-api/learning-activity';
import { LearningActivities } from '@/app/integration/scheduler-api/learning-activity';
jest.mock('@/app/integration/scheduler-api/learning-activity', () => ({
  LearningActivities: { attempts: jest.fn(), submit: jest.fn() },
  learningError: () => 'Não foi possível enviar.',
}));
const activity: LearningActivity = {
  id: 1, classId: 2, kind: 'quiz', title: 'SQL', description: '', published: true,
  startDate: null, dueDate: null, maxAttempts: 1, feedbackReleased: false, practice: null,
  questions: [{ id: 'q1', prompt: 'Qual comando insere linhas?', choices: [{ id: 'a', text: 'INSERT' }, { id: 'b', text: 'UPDATE' }] }],
};
function show() {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={cache}><QuizSpace activity={activity} /></QueryClientProvider>);
}
afterEach(() => jest.restoreAllMocks());
it('submits native radio selections without a client-side grade or preview', async () => {
  (LearningActivities.attempts as jest.Mock).mockResolvedValue([]);
  (LearningActivities.submit as jest.Mock).mockResolvedValue({ id: 1, score: null });
  jest.spyOn(window, 'confirm').mockReturnValue(true);
  show();
  expect(screen.queryByRole('button', { name: /executar|verificar/i })).toBeNull();
  expect(screen.getByRole('button', { name: 'Enviar respostas' })).toBeDisabled();
  fireEvent.click(screen.getByRole('radio', { name: 'INSERT' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Enviar respostas' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: 'Enviar respostas' }));
  await waitFor(() => expect(LearningActivities.submit).toHaveBeenCalledWith(1, [{ questionId: 'q1', choiceId: 'a' }]));
  expect(await screen.findByRole('status')).toHaveTextContent('Respostas registradas');
});
it('shows a pending result and prevents further sends at the attempt limit', async () => {
  (LearningActivities.attempts as jest.Mock).mockResolvedValue([{ id: 1, userId: 7, attempt: 1, createdAt: '2026-09-23T12:00:00Z', score: null, answers: [{ questionId: 'q1', choiceId: 'a' }] }]);
  show();
  expect(await screen.findByText(/Resultado aguardando liberação/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Enviar respostas' })).toBeDisabled();
  expect(screen.queryByText(/Resposta correta:/)).toBeNull();
});
