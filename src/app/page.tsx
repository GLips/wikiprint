"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useListState } from "@mantine/hooks";
import { useArticleState } from "@/app/article/use-article-state";
import { useEffect, useRef } from "react";
import WikipediaUrlForm from "@/components/wikipedia-url-form";

const schema = z.object({
  url: z.string().url(),
});
type Schema = z.infer<typeof schema>;

const defaultBlockSections = [
  "See_also",
  "Notes",
  "References",
  "Further_reading",
  "External_links",
  "Citations",
  "References_and_sources",
  "Sources",
];

export default function Home({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: {
      url: `https://en.wikipedia.org/wiki/${params.slug ? params.slug : "French_cuisine"}`,
    },
  });

  const formRef = useRef<HTMLFormElement>(null);
  const [hiddenIds, hiddenIdsHandlers] = useListState(defaultBlockSections);
  const [state, updateArticleState] = useArticleState();
  const { raw, title, pageSlug, status, sections, headers } = state;

  useEffect(() => {
    formRef.current?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
  }, []);

  return (
    <main className="relative flex flex-col items-center justify-center px-4 print:mx-[24mm]">
      <div className="mb-8 prose">
        <h1 className="mb-4 font-serif text-6xl !leading-[1.1em] tracking-tight">
          Get a printable version of any Wikipedia article (for free)
        </h1>
        <p>
          Have you ever tried to print a Wikipedia article? It's horrendous. A convoluted jumble of text, tables,
          images, and references. It makes for a great ink cartridge endurance test, but it's otherwise not very useful.
        </p>
        <p>Now, thankfully, there's a solution.</p>
        <h2 className="!mb-0">Enter a Wikipedia article below</h2>
        <div className="flex flex-col w-full not-prose">
          <div className="flex justify-center">
            <WikipediaUrlForm slug={"French_cuisine"} noArticle />
          </div>
        </div>
      </div>
    </main>
  );
}
