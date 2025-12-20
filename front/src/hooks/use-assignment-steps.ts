import { useState } from 'react';

export const useAssignmentSteps = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 4;

    const goToNext = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    const goToPrevious = () => setCurrentStep(prev => Math.max(prev - 1, 1));
    const goToStep = (step: number) => {
        if (step >= 1 && step <= totalSteps) setCurrentStep(step);
    };

    return {
        currentStep,
        totalSteps,
        goToNext,
        goToPrevious,
        goToStep,
        isFirstStep: currentStep === 1,
        isLastStep: currentStep === totalSteps,
    };
};