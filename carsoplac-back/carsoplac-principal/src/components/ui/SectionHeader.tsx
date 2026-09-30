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
    <div className="w-full text-white py-6 px-4 flex flex-col gap-2">
      <h2 className="text-xl font-bold leading-tight">{title}</h2>

      {subtitle && (
        <p className="text-2xl font-bold text-sage-gray">{subtitle}</p>
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
