"use client";

import Image from "next/image";
import { Inter } from "next/font/google";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Fragment, ReactElement, ReactNode, createElement, useState } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { rehype } from "rehype";
import { CONTINUE, SKIP, visit } from "unist-util-visit";
import { filter } from "unist-util-filter";
import { h } from "hastscript";
// import rehypeFormat from "rehype-format";
import { useListState } from "@mantine/hooks";
import { ElementContent } from "react-markdown/lib/ast-to-react";
import { toHtml } from "hast-util-to-html";
import { env } from "process";

const filters = [
  {
    tagName: "table",
    className: "infobox",
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
  actions,
}: {
  type: HeadingElement;
  id: string;
  hideList: string[];
  children: ReactNode;
  actions: ReactNode;
}) {
  const El = type;
  return (
    <li
      className={cn([
        {
          "flex justify-between items-center": true,
          "opacity-50": hideList.includes(id),
          "ml-4": type === "h3",
          "ml-8": type === "h4",
          "ml-12": type === "h5",
        },
      ])}
    >
      <span
        className={cn([
          { "text-2xl font-[350] font-serif text-slate-800": type === "h2", "text-sm text-slate-500": type !== "h2" },
        ])}
      >
        {children}
      </span>
      {actions}
    </li>
  );
}

type HeadingElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
type HeaderData = { title: string; id: string; type: HeadingElement };
type SectionData = { __html: string; id: string };

async function parse(html: string, hideList: string[]) {
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
          node.properties.href = node.properties.href.replace(/\/wiki\//, "?");
          addClass(node, "print:font-normal print:no-underline");
        } else if (node.tagName === "div" && hasClass(node, "hatnote")) {
          addClass(node, "print:hidden");
        }
      });
    })
    .use(() => (tree, file) => {
      // Gather each heading and its subsequent non-heading elements
      visit(tree, "element", (node, index, parent) => {
        if (!parent || typeof index !== "number" || !isHeading(node.tagName)) return CONTINUE;

        let title = "";
        let id = "";

        // Visit the nodes of the heading since an inner <span> contains the id
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

        // Create a root node, aka a fragment.
        const section = h(null, [node]);

        // Add next siblings until we find another heading
        for (let i = index + 1; i < parent.children.length; i++) {
          const sibling = parent.children[i];
          if ("tagName" in sibling && isHeading(sibling.tagName)) {
            break;
          } else {
            section.children.push(sibling);
          }
        }
        headers.push({ title, id, type: node.tagName });
        sections.push({ __html: toHtml(section), id: id || "" });
        // Don't add the section built above, it will be returned as data instead.
        parent.children.splice(index, section.children.length - 1);
        return [SKIP, index];
      });
    })
    .process(html);
  console.log("Ending", Date.now() - start + "ms");
  return { headers, sections };
}

export default function Home() {
  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: {
      url: "https://en.wikipedia.org/wiki/Wicklow_Mountains",
    },
  });

  const [hideList, setHideList] = useListState(defaultBlockSections);
  const [sections, setSections] = useListState<SectionData>([]);
  const [title, setTitle] = useState<string | null>(null);
  const [raw, setRaw] = useState<string>("");
  const [toc, tocHandlers] = useListState<HeaderData>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "parsing" | "error">("idle");

  return (
    <main className="relative flex flex-col items-center justify-between min-h-screen print:mx-[24mm]">
      <div
        className={cn([
          "sticky top-0 bg-white py-4 print:hidden z-10 w-full px-4 font-mono text-sm flex items-center max-h-28 overflow-hidden border-bottom",
        ])}
      >
        <Image
          alt="An animated anthropomorphic printer, spitting out papers"
          // className="translate-x-[15%]"
          src="/printer.gif"
          fetchPriority="high"
          width={180}
          height={180}
        />
        <p className={cn(["font-serif text-4xl -translate-x-16"])}>Wikiprint</p>
        <div className="absolute bottom-0 w-full h-6 bg-gradient-to-b from-transparent to-white" />
      </div>

      <div className="flex items-start justify-start w-full gap-24 px-4">
        <div className="sticky w-full max-w-xs print:hidden top-[112px]">
          <ScrollArea className="w-full h-[100vh] max-w-xs">
            <ul className="space-y-4">
              {toc.map((h) => (
                <TocHeading
                  key={h.id}
                  hideList={hideList}
                  id={h.id}
                  type={h.type}
                  actions={
                    <Button
                      className="text-sm"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (hideList.includes(h.id)) {
                          setHideList.filter((x) => x !== h.id);
                        } else {
                          setHideList.append(h.id);
                        }
                      }}
                    >
                      {hideList.includes(h.id) ? "Show" : "Hide"}
                    </Button>
                  }
                >
                  {h.title}
                </TocHeading>
              ))}
            </ul>
          </ScrollArea>
        </div>
        <div className={cn(["relative w-full print:max-w-none pb-48 print:pb-0"])}>
          <div className="flex items-end w-full py-4 bg-white print:hidden">
            <form
              className="flex items-end flex-grow space-x-4 max-w-prose"
              onSubmit={form.handleSubmit(async ({ url }) => {
                setStatus("loading");
                // https://en.wikipedia.org/w/api.php?action=parse&page=Wicklow_Mountains&prop=wikitext&origin=*&format=json
                // Regex to pull page name from Wikipedia URL
                const urlRegex = /https:\/\/en\.wikipedia\.org\/wiki\/(.*?)(?:$|\/|\?)/;
                const pageTitle = urlRegex.exec(url)?.[1];
                if (!pageTitle) throw new Error("Invalid URL");
                const wikiAPIUrl = `https://en.wikipedia.org/w/api.php?`;
                const params = [
                  "action=parse",
                  `page=${pageTitle}`,
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
                requestAnimationFrame(() => setStatus("parsing"));
                const hype = await parse(html, hideList);
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
                    const r = await parse(raw, hideList);
                    tocHandlers.setState(r.headers);
                    setSections.setState(r.sections);
                  }}
                >
                  Parse
                </Button>
              ) : null}
            </form>
          </div>
          <div className="prose">
            {/* <div className="font-mono">Status: {status}</div> */}
            {title ? <h1>{title}</h1> : null}
            {process.env.NODE_ENV === "development" && raw ? (
              <div className="print:hidden">
                <h2>Raw content</h2>
                <pre className="max-h-[50vh] overflow-scroll">{raw}</pre>
              </div>
            ) : null}
            {/* <h2>Parsed content</h2> */}
            {sections.map((s) => {
              return <Section key={s.id} isHidden={hideList.includes(s.id)} {...s} />;
            })}
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({ id, __html, isHidden }: { id: string; isHidden: boolean; __html: string }) {
  if (isHidden) return null;
  return <section id={id} dangerouslySetInnerHTML={{ __html }} />;
}
