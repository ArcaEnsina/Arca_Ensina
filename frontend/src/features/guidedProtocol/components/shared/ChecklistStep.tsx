import { Card, CardContent } from "@/components/ui/card";

interface ChecklistItem {
  id: string;
  label: string;
}

interface ChecklistStepProps {
  title: string;
  items: ChecklistItem[];
  checked: string[];
  onChange: (id: string) => void;
}

export function ChecklistStep({ title, items, checked, onChange }: ChecklistStepProps) {
  return (
    <div className="flex flex-col gap-4 w-full">
      <h2 className="text-heading-lg font-heading text-center text-foreground">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const isChecked = checked.includes(item.id);
          return (
            <Card
              key={item.id}
              size="sm"
              className={[
                "cursor-pointer transition-all select-none min-h-17",
                isChecked
                  ? "ring-2 ring-arca-blue-600 bg-arca-blue-50"
                  : "hover:bg-muted",
              ].join(" ")}
              onClick={() => onChange(item.id)}
            >
              <CardContent className="flex items-center justify-between gap-3">
                <p className="text-body-md text-foreground">{item.label}</p>
                <div
                  className={[
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border-2 transition-all",
                    isChecked
                      ? "border-arca-blue-600 bg-arca-blue-600"
                      : "border-neutral-300 bg-white",
                  ].join(" ")}
                >
                  {isChecked && (
                    <svg
                      viewBox="0 0 12 10"
                      fill="none"
                      className="h-3 w-3"
                    >
                      <path
                        d="M1 5l3.5 3.5L11 1"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
