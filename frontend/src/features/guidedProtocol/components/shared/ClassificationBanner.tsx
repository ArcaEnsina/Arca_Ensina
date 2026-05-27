interface ClassificationBannerProps {
  label: string;
  value: string;
}

export function ClassificationBanner({ label, value }: ClassificationBannerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-arca-blue-100 px-6 py-4 w-full">
      <p className="text-caption text-arca-blue-600 font-medium">{label}</p>
      <p className="text-display-sm font-heading font-bold text-arca-blue-800">{value}</p>
    </div>
  );
}
