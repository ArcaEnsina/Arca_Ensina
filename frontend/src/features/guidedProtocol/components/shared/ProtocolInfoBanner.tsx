import { Info } from "lucide-react";

interface ProtocolInfoBannerProps {
  message: string;
}

export function ProtocolInfoBanner({ message }: ProtocolInfoBannerProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-accent p-4 w-full">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-arca-blue-50">
        <Info className="h-4 w-4 text-arca-blue-600" />
      </div>
      <p className="text-body-md text-foreground">{message}</p>
    </div>
  );
}
