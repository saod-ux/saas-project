export default function Section({
  children,
  className = "",
  as: Tag = "section",
}: {
  children: React.ReactNode;
  className?: string;
  as?: any;
}) {
  return <Tag className={`py-8 md:py-10 ${className}`}>{children}</Tag>;
}


