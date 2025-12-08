import { cn } from "@/lib/utils";
import { Check, ClipboardCheck, Code, Layers, Settings } from "lucide-react";

enum Steps {
  CONFIGURATION = 'configuration',
  TEMPLATES = 'templates',
  BoilerplateScript = 'boilerplateScript',
  REVIEW = 'review'
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
    <div className="max-w-7xl mx-auto px-6 py-6 border rounded-lg border-slate-700 bg-slate-800/50">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                currentStep === step.id
                  ? 'bg-blue-600 text-white'
                  : currentStep > step.id
                  ? 'bg-green-600 text white'
                  : 'bg-slate-600 text-slate-300'
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
                className={`text-sm font-medium transition-colors ${
                  currentStep === step.id
                    ? 'text-blue-400'
                    : currentStep > step.id
                    ? 'text-green-400'
                    : 'text-slate-400'
                }`}
              >
                Step {step.id}
              </p>
              <p
                className={`text-xs transition-colors ${
                  currentStep === step.id
                    ? 'text-blue-300'
                    : currentStep > step.id
                    ? 'text-green-300'
                    : 'text-slate-500'
                }`}
              >
                {step.title}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-40 h-px mx-6 transition-colors ${
                  currentStep > step.id ? 'bg-green-600' : 'bg-slate-600'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
