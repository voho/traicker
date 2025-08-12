import type { Route } from "./+types/home";
import { Welcome } from "~/welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TraAIcker" },
    { name: "description", content: "AI hlídač rozpočtu" },
  ];
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <Welcome />;
}
