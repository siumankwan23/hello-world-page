import { createFileRoute } from "@tanstack/react-router";
import { RealEstateApp } from "../components/real-estate-app";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Northstar Realty" },
      { name: "description", content: "A secure real estate agent and client listing management platform." },
      { property: "og:title", content: "Northstar Realty" },
      { property: "og:description", content: "A secure real estate agent and client listing management platform." },
    ],
  }),
  component: Index,
});

function Index() {
  return <RealEstateApp />;
}

