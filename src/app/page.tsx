// TODO: Homepage explainer
// TODO: Add a discreet "Printed from Wikiprint" footer
// TODO: Add a "View on Wikipedia" button
// TODO: Fix formatting for math articles e.g. https://en.wikipedia.org/wiki/Fourier_transform
// TODO: Refactor to clean up code and put it in the right places
//   TODO: Finalize support for /wiki/* URLs
// TODO: Better loading state than "Loading..."
// TODO: Add ability to hide paragraphs within sections
// TODO: Lift current filter state to URL params for easier sharing
// TODO: Support nesting within section/header data structure to improve functionality and possibly styling
// TODO? Add a "currently looking at" indicator based on scroll location to the table of contents
//  TODO: Automatically hide all sub-sections via option e.g. References > Bibliography on Republic_of_Ireland page
// TODO? Look into NextJS 13 suspense boundaries?
"use client";

import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { useListState } from "@mantine/hooks";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HeaderData, SectionData, parse } from "@/lib/article";
import TableOfContents from "@/components/table-of-contents";
import { EyeIcon, EyeOffIcon, PrinterIcon } from "lucide-react";

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

export default function Home() {
  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: {
      url: "https://en.wikipedia.org/wiki/Wicklow_Mountains",
    },
  });

  const [hideList, hideListHandlers] = useListState(defaultBlockSections);
  const [sections, setSections] = useListState<SectionData>([]);
  const [title, setTitle] = useState<string>("");
  const [pageSlug, setPageSlug] = useState<string>("");
  const [raw, setRaw] = useState<string>("");
  const [toc, tocHandlers] = useListState<HeaderData>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "parsing" | "error">("idle");

  return (
    <main className="relative flex flex-col items-center justify-between print:mx-[24mm]">
      <div className="flex items-start justify-start w-full px-4 mb-48 gap-36 print:mb-0">
        <div className="sticky w-full max-w-xs print:hidden top-header">
          <TableOfContents
            headers={toc}
            show={(id) => hideListHandlers.filter((x) => x !== id)}
            hide={hideListHandlers.append}
            hideList={hideList}
          />
        </div>
        <div className={cn(["relative w-full print:max-w-none"])}>
          <div className="flex w-full py-4 bg-white print:hidden">
            <form
              className="flex items-end flex-grow mb-8 space-x-4 max-w-prose"
              onSubmit={form.handleSubmit(async ({ url }) => {
                setStatus("loading");
                // https://en.wikipedia.org/w/api.php?action=parse&page=Wicklow_Mountains&prop=wikitext&origin=*&format=json
                // Regex to pull page name from Wikipedia URL
                const urlRegex = /https:\/\/en\.wikipedia\.org\/wiki\/(.*?)(?:$|\/|\?)/;
                const pageSlug = urlRegex.exec(url)?.[1];
                if (!pageSlug) throw new Error("Invalid URL");
                const wikiAPIUrl = `https://en.wikipedia.org/w/api.php?`;
                const params = [
                  "action=parse",
                  `page=${pageSlug}`,
                  "prop=text",
                  "origin=*",
                  "format=json",
                  "redirects=",
                ];
                const { parse: content } = await (await fetch(wikiAPIUrl + params.join("&"))).json();
                console.log({ rawContent: content });
                const html = content.text["*"];
                setTitle(content.title);
                setRaw(html);
                setPageSlug(pageSlug);
                requestAnimationFrame(() => setStatus("parsing"));
                const hype = await parse(html, { id: pageSlug, title: content.title });
                setSections.setState(hype.sections);
                tocHandlers.setState(hype.headers);
                setRaw(html);
                requestAnimationFrame(() => setStatus("idle"));
              })}
            >
              <div className="w-full">
                <Label htmlFor="url">Wikipedia URL</Label>
                <Input className="w-full" {...form.register("url")} />
              </div>
              <Button type="submit">Load</Button>
              {process.env.NODE_ENV === "development" ? (
                <Button
                  type="button"
                  onClick={async () => {
                    const r = await parse(raw, { title, id: pageSlug });
                    tocHandlers.setState(r.headers);
                    setSections.setState(r.sections);
                  }}
                >
                  Parse
                </Button>
              ) : null}
              <Button
                type="button"
                variant="secondary"
                aria-label="Print this page"
                title="Print this page"
                onClick={() => window.print()}
              >
                <PrinterIcon size={16} />
              </Button>
            </form>
          </div>
          {status === "loading" ? <div>Loading...</div> : null}
          {status === "idle" && sections.length ? (
            <>
              <div className="prose">
                {title ? <h1 className="hidden mb-0 print:block">{title}</h1> : null}
                {sections.map((s) => {
                  const isHidden = hideList.includes(s.id);
                  const show = (id: string) => hideListHandlers.filter((x) => x !== s.id);
                  const hide = (id: string) => hideListHandlers.append(s.id);
                  return <Section key={s.id} isHidden={isHidden} toggle={isHidden ? show : hide} {...s} />;
                })}
              </div>
              {/* <div className="fixed left-0 right-0 hidden mx-auto font-mono text-xs text-center print:block">
                Printed from https://wikiprint.vercel.app/wiki/{pageSlug}
              </div> */}
              <RawContent raw={raw} />
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function Section({
  id,
  __html,
  isHidden,
  toggle,
}: {
  id: string;
  isHidden: boolean;
  __html: string;
  toggle: (id: string) => void;
}) {
  // if (isHidden) return null;
  return (
    <section className="relative" id={id}>
      <div
        className={cn([
          {
            "hide-content print:hidden opacity-50 hover:opacity-100 cursor-pointer": isHidden,
          },
        ])}
        onClick={() => {
          if (isHidden) toggle(id);
        }}
        dangerouslySetInnerHTML={{ __html }}
      />
      <div className="absolute top-0 right-4 print:hidden">
        <Button onClick={() => toggle(id)} variant="ghost">
          {isHidden ? <EyeOffIcon strokeWidth={1} size={16} /> : <EyeIcon strokeWidth={1} size={16} />}
        </Button>
      </div>
    </section>
  );
}

function RawContent({ raw }: { raw?: string }) {
  if (process.env.NODE_ENV !== "development" || !raw) return null;
  return (
    <Accordion className="mb-8 prose text-left print:hidden prose-headings:m-0 prose-pre:m-0" type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger className="justify-between font-mono text-3xl font-bold text-left">
          Raw content
        </AccordionTrigger>
        <AccordionContent>
          <pre className="max-h-[50vh] overflow-scroll">{raw}</pre>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
