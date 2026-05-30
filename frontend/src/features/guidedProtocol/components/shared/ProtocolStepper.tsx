interface ProtocolStepperProps {
  currentStep: number;
  totalSteps: number;
}

export function ProtocolStepper({ currentStep, totalSteps }: ProtocolStepperProps) {
  return (
    <div className="w-full">
      <p className="text-caption font-semibold text-arca-blue-600 mb-3">
        Etapa {currentStep} de {totalSteps}
      </p>
      <div className="relative flex items-center justify-between">

        <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-neutral-200" />
        <div
          className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-arca-blue-600 transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1;
          const isActive = step === currentStep;
          const isDone = step < currentStep;
          return (
            <div
              key={step}
              className={[
                "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all",
                isActive
                  ? "border-arca-blue-600 bg-arca-blue-600 text-white"
                  : isDone
                    ? "border-arca-blue-400 bg-arca-blue-400 text-white"
                    : "border-neutral-300 bg-white text-neutral-400",
              ].join(" ")}
            >
              {step}
            </div>
          );
        })}
      </div>
    </div>
  );
}
