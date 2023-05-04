"use client";

import Image from "next/image";
import { Inter } from "next/font/google";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Fragment, ReactElement, ReactNode, createElement, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { rehype } from "rehype";
import { CONTINUE, EXIT, SKIP, visit } from "unist-util-visit";
import { filter } from "unist-util-filter";
import { h } from "hastscript";
import rehypeFormat from "rehype-format";
import { useListState } from "@mantine/hooks";
import { ElementContent } from "react-markdown/lib/ast-to-react";
import { toHtml } from "hast-util-to-html";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Root } from "hastscript/lib/core";

const filters = [
  {
    tagName: "table",
    className: "infobox",
  },
  {
    tagName: "table",
    className: "sidebar",
  },
  {
    tagName: "div",
    className: "thumb",
  },
  {
    tagName: "sup",
    className: "reference",
  },
  {
    tagName: "span",
    className: "mw-editsection",
  },
  {
    tagName: "div",
    className: "navbox",
  },
  {
    tagName: "div",
    className: "navbox-styles",
  },
];

function shouldFilter(node: any) {
  return filters.some((filter) => {
    return node.tagName === filter.tagName && node.properties?.className?.includes(filter.className);
  });
}

function filterTable(node: any) {
  if (shouldFilter(node)) {
    return false;
  } else if (node.children) {
    node.children = node.children.filter(filterTable);
    return true;
  } else {
    return true;
  }
}

function addClass(node: any, className: string) {
  if (!node.properties) node.properties = {};
  if (!Array.isArray(node.properties.className)) node.properties.className = [];
  node.properties.className.push(className);
}

function hasClass(node: any, className: string) {
  if (!node.properties || typeof node.properties !== "object") return false;

  if (typeof node.properties.className === "string") {
    return node.properties.className === className;
  } else if (Array.isArray(node.properties.className)) {
    return node.properties.className.includes(className);
  } else {
    return false;
  }
}

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
  "Sources",
  "References_and_sources",
];

const headingElementList = ["h1", "h2", "h3", "h4", "h5", "h6"];
function isHeading(node: string): node is HeadingElement {
  return headingElementList.includes(node);
}

function TocHeading({
  type,
  hideList,
  id,
  children,
  toggle,
}: {
  type: HeadingElement;
  id: string;
  hideList: string[];
  children: ReactNode;
  toggle: (id: string) => void;
}) {
  const El = type;
  const isHidden = hideList.includes(id);
  return (
    <li
      className={cn([
        {
          "flex justify-between items-center": true,
          "opacity-50": isHidden,
          "ml-4": type === "h3",
          "ml-8": type === "h4",
          "ml-12": type === "h5",
        },
      ])}
    >
      <a
        className={cn([
          {
            "text-2xl font-[350] font-serif text-slate-800": type === "h2" || type === "h1",
            "text-sm text-slate-500": type !== "h2" && type !== "h1",
          },
        ])}
        href={isHidden ? "#" : `#${id}`}
        onClick={(e) => {
          if (isHidden) {
            e.preventDefault();
            toggle(id);
          }
        }}
      >
        {children}
      </a>
      <Button className="text-sm" variant="ghost" size="sm" onClick={() => toggle(id)}>
        {isHidden ? "Show" : "Hide"}
      </Button>
    </li>
  );
}

type HeadingElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
type HeaderData = { title: string; id: string; type: HeadingElement };
type SectionData = { __html: string; id: string };

function collectSiblings(siblings: ElementContent[], startingIndex: number = 0, firstElement?: ElementContent) {
  const index = firstElement ? startingIndex + 1 : startingIndex;
  // Create a root node, aka a fragment.
  const section = h(null, firstElement ? [firstElement] : []);

  // Add next siblings until we find another heading
  for (let i = index; i < siblings.length; i++) {
    const sibling = siblings[i];
    console.log(i, sibling);
    if ("tagName" in sibling && isHeading(sibling.tagName)) {
      break;
    } else {
      section.children.push(sibling);
    }
  }
  return section;
}

type ParseOptions = {
  title: string;
  id: string;
};
async function parse(html: string, options: ParseOptions) {
  // Log time to run filter
  const start = Date.now();
  console.log("Starting");
  const headers: HeaderData[] = [];
  const sections: SectionData[] = [];
  await rehype()
    .use(() => (tree, file) => {
      // Remove table.infobox
      filter(tree, { cascade: true }, filterTable);
      visit(tree, "element", (node) => {
        if (node.tagName === "a") {
          if (!node.properties || typeof node.properties.href !== "string") return;
          // TODO: Style external links, but hide that style when printing
          // node.properties.href = node.properties.href.replace(/\/wiki\//, "?");
          addClass(node, "print:font-normal print:no-underline");
        } else if (node.tagName === "div" && hasClass(node, "hatnote")) {
          addClass(node, "print:hidden");
        }
      });
    })
    .use(() => (tree, file) => {
      // Gather each heading and its subsequent non-heading elements
      visit(tree, "element", (node, index, parent) => {
        if (!parent || typeof index !== "number") return CONTINUE;

        let title = "";
        let id = "";
        let type: HeadingElement = "h2";
        let section: Root;

        if (node.tagName === "div" && hasClass(node, "mw-parser-output")) {
          title = options.title;
          id = options.id;
          type = "h1";
          section = collectSiblings(node.children, 0, h("h1", null, title));
          headers.push({ title, id, type });
          sections.push({ __html: toHtml(section), id: id || "" });
          return CONTINUE;
        } else if (isHeading(node.tagName)) {
          // Visit the nodes of the heading since an inner <span> contains the id
          type = node.tagName;
          visit(
            node,
            (x) => ["text", "element"].includes(x.type),
            (c) => {
              if (c.type === "text") {
                title += c.value;
              } else if ("properties" in c && c.properties && c.properties.id) {
                id = c.properties.id as string;
                // Duplicate IDs aren't allowed in HTML, so remove the ID from the heading
                // We add ID to the section element in React instead
                c.properties.id = undefined;
              }
            }
          );
          section = collectSiblings(parent.children as ElementContent[], index, node);
          // headers.push({ title, id, type });
          // sections.push({ __html: toHtml(section), id: id || "" });
          parent.children.splice(index, section.children.length - 1);
        } else {
          return CONTINUE;
        }

        headers.push({ title, id, type });
        sections.push({ __html: toHtml(section), id });
        // Don't add the section built above, it will be returned as data instead.
        return [SKIP, index];
      });
    })
    .use([rehypeFormat])
    .process(html);
  console.log("Ending", Date.now() - start + "ms");
  return { headers, sections };
}

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
      url: `https://en.wikipedia.org/wiki/${params.slug}`,
    },
  });

  const [hideList, setHideList] = useListState(defaultBlockSections);
  const [sections, setSections] = useListState<SectionData>([]);
  const [title, setTitle] = useState<string>("");
  const [pageSlug, setPageSlug] = useState<string>(params.slug);
  const [raw, setRaw] = useState<string>("");
  const [toc, tocHandlers] = useListState<HeaderData>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "parsing" | "error">("idle");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
  }, []);

  return (
    <main className="relative flex flex-col items-center justify-between print:mx-[24mm]">
      <div
        className={cn([
          "sticky top-0 bg-white py-4 print:hidden z-10 w-full px-4 font-mono text-sm flex items-center h-header overflow-hidden border-bottom",
        ])}
      >
        <Image
          alt="An animated cartoon printer with a face, spitting out papers"
          // className="translate-x-[15%]"
          src="/printer.gif"
          fetchPriority="high"
          width={180}
          height={180}
        />
        <p className={cn(["font-serif text-4xl -translate-x-16"])}>Wikiprint</p>
        <div className="absolute bottom-0 w-full h-6 bg-gradient-to-b from-transparent to-white" />
      </div>

      <div className="flex items-start justify-start w-full gap-24 px-4 pb-48 print:pb-0">
        <div className="sticky w-full max-w-xs print:hidden top-header">
          <ScrollArea className="w-full max-h-[100vh] h-full max-w-xs">
            <ul className="space-y-4">
              {toc.map((h) => (
                <TocHeading
                  key={h.id}
                  hideList={hideList}
                  id={h.id}
                  type={h.type}
                  toggle={(id) => {
                    if (hideList.includes(id)) {
                      setHideList.filter((x) => x !== id);
                    } else {
                      setHideList.append(id);
                    }
                  }}
                >
                  {h.title}
                </TocHeading>
              ))}
            </ul>
          </ScrollArea>
        </div>
        <div className={cn(["relative w-full print:max-w-none"])}>
          <div className="flex items-end w-full py-4 bg-white print:hidden">
            <form
              ref={formRef}
              className="flex items-end flex-grow space-x-4 max-w-prose"
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
            </form>
          </div>
          {status === "loading" ? <div>Loading...</div> : null}
          {status === "idle" && sections.length ? (
            <>
              <div className="prose">
                {sections.map((s) => {
                  return <Section key={s.id} isHidden={hideList.includes(s.id)} {...s} />;
                })}
              </div>
              <RawContent raw={raw} />
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function Section({ id, __html, isHidden }: { id: string; isHidden: boolean; __html: string }) {
  if (isHidden) return null;
  return <section id={id} dangerouslySetInnerHTML={{ __html }} />;
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
