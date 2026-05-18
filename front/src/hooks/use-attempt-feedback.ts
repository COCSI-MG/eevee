'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AttemptAdminService } from '@/app/integration/scheduler-api/attempt';
import { AssignmentAttempt } from '@/app/interface/scheduler-api/assignment-attempt';

const FEEDBACK_TIMEOUT_MS = 60_000;

export function useAttemptFeedback(attempt: AssignmentAttempt) {
  const [isOpen, setIsOpen] = useState(false);
  const [requested, setRequested] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  const hasCachedFeedback = Boolean(attempt.refinedReport);
  const isCompleted = attempt.status === 'completed';

  useEffect(() => {
    if (!requested || hasCachedFeedback || !isCompleted) return;
    const timer = setTimeout(() => setTimedOut(true), FEEDBACK_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [requested, hasCachedFeedback, isCompleted]);

  const { data } = useQuery({
    queryKey: ['attempt-feedback', attempt.id],
    queryFn: () => AttemptAdminService.getFeedback(attempt.id),
    enabled: requested && isCompleted && !hasCachedFeedback && !timedOut,
    refetchInterval: (query) =>
      query.state.data?.refinedReport ? false : 3000,
  });

  const aiFeedback = attempt.refinedReport ?? data?.refinedReport;
  const isGenerating = isCompleted && requested && !aiFeedback && !timedOut;

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open && isCompleted && !hasCachedFeedback && !requested) {
      setRequested(true);
      try {
        await AttemptAdminService.requestFeedback(attempt.id);
      } catch {
        // Polling will continue to check for feedback
      }
    }
  };

  return {
    isOpen,
    handleOpenChange,
    feedback: aiFeedback ?? attempt.report,
    isGenerating,
  };
}
