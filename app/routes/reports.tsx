import type { Route } from "./+types/home";
import { ReportHeader } from "~/routes/reports/components/ReportHeader";
import {Outlet} from "react-router";
import { ReportMenuItem } from "./reports/components/ReportMenuItem";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TraAIcker" },
    { name: "description", content: "AI hlídač rozpočtu" },
  ];
}

export default function Reports({}: Route.ComponentProps) {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-4">
        <ReportHeader />
        <div className="flex space-x-4 mb-4">
          <ReportMenuItem to="/reports/monthly" label="Monthly Overview" />
          <ReportMenuItem to="/reports/history" label="History" />
        </div>
      </div>
      <div className="container mx-auto p-4">
        <Outlet />
      </div>
    </div>
  );
}
