import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("reports", "routes/reports.tsx", [
    index("routes/reports/index.tsx"),
    route("monthly", "routes/reports/monthly/index.tsx"),
    route("history", "routes/reports/history/index.tsx"),
  ]),
] satisfies RouteConfig;
