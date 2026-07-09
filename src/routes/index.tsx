import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hello World" },
      { name: "description", content: "A simple hello world page." },
      { property: "og:title", content: "Hello World" },
      { property: "og:description", content: "A simple hello world page." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        Hello, world!
      </h1>
    </main>
  );
}

