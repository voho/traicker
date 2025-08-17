interface PageHeaderProps {
  title: string;
}

export function PageHeader({ title }: PageHeaderProps) {
  return (
    <h2 className="text-2xl font-bold mb-6">{title}</h2>
  );
}
