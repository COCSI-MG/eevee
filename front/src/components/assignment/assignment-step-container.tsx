import React from "react";
import { cn } from "@/lib/utils";
import { Check, Settings } from "lucide-react";

export interface StepDefinition {
  id: string;
  title: string;
  icon: typeof Settings;
}

export default function AssignmentStepContainer({
  currentStep,
  steps,
}: {
  currentStep: number;
  steps: StepDefinition[];
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 border rounded-lg border-border bg-card/50">
      {/* Mobile: Vertical Layout */}
      <div className="flex flex-col space-y-4 md:hidden">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          return (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-colors",
                  currentStep === stepNumber
                    ? "bg-primary text-primary-foreground"
                    : currentStep > stepNumber
                      ? "bg-success text-success-foreground"
                      : "bg-primary/30 text-foreground",
                )}
              >
                {currentStep > stepNumber ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              <div className="ml-3 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium transition-colors",
                    currentStep === stepNumber
                      ? "text-primary"
                      : currentStep > stepNumber
                        ? "text-success"
                        : "text-muted-foreground",
                  )}
                >
                  Passo {stepNumber}
                </p>
                <p
                  className={cn(
                    "text-xs transition-colors",
                    currentStep === stepNumber
                      ? "text-primary"
                      : currentStep > stepNumber
                        ? "text-success"
                        : "text-muted-foreground",
                  )}
                >
                  {step.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: Horizontal Layout */}
      <div className="hidden md:flex items-center w-full">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          return (
            <React.Fragment key={step.id}>
              <div className="flex items-center flex-shrink-0">
                <div
                  className={cn(
                    "w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0",
                    currentStep === stepNumber
                      ? "bg-primary text-primary-foreground"
                      : currentStep > stepNumber
                        ? "bg-success text-success-foreground"
                        : "bg-primary/30 text-foreground",
                  )}
                >
                  {currentStep > stepNumber ? (
                    <Check className="w-4 h-4 lg:w-5 lg:h-5" />
                  ) : (
                    <step.icon className="w-4 h-4 lg:w-5 lg:h-5" />
                  )}
                </div>
                <div className="ml-2 lg:ml-3 min-w-0">
                  <p
                    className={cn(
                      "text-xs lg:text-sm font-medium transition-colors",
                      currentStep === stepNumber
                        ? "text-primary"
                        : currentStep > stepNumber
                          ? "text-success"
                          : "text-muted-foreground",
                    )}
                  >
                    Passo {stepNumber}
                  </p>
                  <p
                    className={cn(
                      "text-xs transition-colors whitespace-nowrap truncate max-w-[80px] lg:max-w-none",
                      currentStep === stepNumber
                        ? "text-primary"
                        : currentStep > stepNumber
                          ? "text-success"
                          : "text-muted-foreground",
                    )}
                  >
                    {step.title}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-px mx-2 lg:mx-4 transition-colors min-w-[16px]",
                    currentStep > stepNumber ? "bg-success" : "bg-primary/30",
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
