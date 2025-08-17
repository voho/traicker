import {Link, useLocation} from "react-router";

interface ReportMenuItemProps {
  to: string;
  label: string;
}

export function ReportMenuItem({ to, label }: ReportMenuItemProps) {
  const { pathname } = useLocation();
  const isActive = pathname === to;

  return (
    <Link
      to={to}
      className={`px-4 py-2 rounded ${isActive ? "bg-blue-500" : "bg-gray-700"}`}
    >
      {label}
    </Link>
  );
}
