// src/components/ui/SectionHeader.tsx

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  onViewAll?: () => void;
};

export default function SectionHeader({
  title,
  subtitle,
  onViewAll,
}: SectionHeaderProps) {
  return (
    <div className="w-full text-white py-6 flex flex-col gap-2">
      <h1 className="h1">{title}</h1>

      {subtitle && (
        <h2 className="h2 text-sage-gray">{subtitle}</h2>
      )}

      {onViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          className="btn btn-outline mt-2 w-fit"
        >
          VER TODO
        </button>
      )}
    </div>
  );
}
