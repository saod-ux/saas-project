interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

export default function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      {subtitle && (
        <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
      )}
    </div>
  );
}