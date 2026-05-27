import { TriangleAlert, CheckSquare } from "lucide-react";

interface YesNoStepProps {
  title: string;
  description?: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
}

export function YesNoStep({ title, description, value, onChange }: YesNoStepProps) {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="text-center">
        <h2 className="text-display-sm font-heading font-bold text-foreground">
          {title}
        </h2>
        {description && (
          <p className="text-body-md text-muted-foreground mt-2">{description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-2">
        
        <button
          onClick={() => onChange(true)}
          className="flex flex-col items-center justify-center gap-3 rounded-2xl py-8 transition-all bg-arca-red-600 hover:bg-arca-red-700"
        >
          <TriangleAlert className="h-10 w-10 text-white" />
          <span className="text-display-sm font-heading font-bold text-white">SIM</span>
        </button>

        <button
          onClick={() => onChange(false)}
          className={[
            "flex flex-col items-center justify-center gap-3 rounded-2xl py-8 transition-all",
            value === false
              ? "bg-arca-blue-600 opacity-100"
              : "bg-arca-blue-600 opacity-90 hover:opacity-100",
          ].join(" ")}
        >
          <CheckSquare className="h-10 w-10 text-white" />
          <span className="text-display-sm font-heading font-bold text-white">NÃO</span>
        </button>
      </div>
    </div>
  );
}
