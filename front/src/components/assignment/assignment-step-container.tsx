import { cn } from "@/lib/utils";
import { Check, ClipboardCheck, Code, Layers, Settings } from "lucide-react";

enum Steps {
  CONFIGURATION = "configuration",
  WORKER_CONFIGURATION = "workerConfiguration",
  TEMPLATES = "templates",
  BoilerplateScript = "boilerplateScript",
  REVIEW = "review",
}

const steps: {
  id: number;
  title: string;
  icon: typeof Settings;
}[] = [
  { id: 1, title: Steps.CONFIGURATION, icon: Settings },
  { id: 2, title: Steps.TEMPLATES, icon: Code },
  { id: 3, title: Steps.BoilerplateScript, icon: Layers },
  { id: 4, title: Steps.REVIEW, icon: ClipboardCheck },
];

export default function AssignmentStepContainer({
  currentStep,
}: {
  currentStep: number;
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 border rounded-lg border-slate-700 bg-slate-800/50">
      {/* Mobile: Vertical Layout */}
      <div className="flex flex-col space-y-4 md:hidden">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                "w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-colors",
                currentStep === step.id
                  ? "bg-blue-600 text-white"
                  : currentStep > step.id
                  ? "bg-green-600 text-white"
                  : "bg-slate-600 text-slate-300"
              )}
            >
              {currentStep > step.id ? (
                <Check className="w-5 h-5" />
              ) : (
                <step.icon className="w-5 h-5" />
              )}
            </div>
            <div className="ml-3 flex-1">
              <p
                className={cn(
                  "text-sm font-medium transition-colors",
                  currentStep === step.id
                    ? "text-blue-400"
                    : currentStep > step.id
                    ? "text-green-400"
                    : "text-slate-400"
                )}
              >
                Step {index + 1}
              </p>
              <p
                className={cn(
                  "text-xs transition-colors",
                  currentStep === step.id
                    ? "text-blue-300"
                    : currentStep > step.id
                    ? "text-green-300"
                    : "text-slate-500"
                )}
              >
                {step.title}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Horizontal Layout */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                currentStep === step.id
                  ? "bg-blue-600 text-white"
                  : currentStep > step.id
                  ? "bg-green-600 text-white"
                  : "bg-slate-600 text-slate-300"
              )}
            >
              {currentStep > step.id ? (
                <Check className="w-5 h-5" />
              ) : (
                <step.icon className="w-5 h-5" />
              )}
            </div>
            <div className="ml-3">
              <p
                className={cn(
                  "text-sm font-medium transition-colors",
                  currentStep === index + 1
                    ? "text-blue-400"
                    : currentStep > index + 1
                    ? "text-green-400"
                    : "text-slate-400"
                )}
              >
                Step {index + 1}
              </p>
              <p
                className={cn(
                  "text-xs transition-colors whitespace-nowrap",
                  currentStep === step.id
                    ? "text-blue-300"
                    : currentStep > step.id
                    ? "text-green-300"
                    : "text-slate-500"
                )}
              >
                {step.title}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-12 lg:w-40 h-px mx-3 lg:mx-6 transition-colors",
                  currentStep > step.id ? "bg-green-600" : "bg-slate-600"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
