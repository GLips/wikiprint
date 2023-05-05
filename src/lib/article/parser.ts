import { rehype } from "rehype";
import { HeaderData, HastHeaderElement, HeadingElementValues, SectionData } from "./types";
import { filter } from "unist-util-filter";
import { CONTINUE, SKIP, visit } from "unist-util-visit";
import { h } from "hastscript";
import { Element, Root } from "hastscript/lib/core";
import { createElementFilter } from "./parser/filter-elements";
import { hasClass, addClass, isHeading, isContentWrapper } from "./parser/identity";
import { createSectionData } from "./parser/create-section-data";

type ParseOptions = {
  title: string;
  id: string;
  lang: string;
};
export async function parse(html: string, options: ParseOptions) {
  // Log time to run filter
  const start = Date.now();
  log("Starting");
  const headers: HeaderData[] = [];
  const sections: SectionData[] = [];
  let hasShortDescription = false;
  await rehype()
    .use(() => (tree: Root) => {
      // Remove unwanted elements like images and info tables
      filter(tree, { cascade: true }, createElementFilter());
      // TODO: Abstract element checks & mutations this once pattern becomes more clear
      // Update element styles to be more readable on web and or print
      visit(tree, "element", (node) => {
        if (node.tagName === "a") {
          if (!node.properties || typeof node.properties.href !== "string") return;
          // Don't print links with a style different than default text
          addClass(node, "print:font-normal print:no-underline");
          // Support some, but not all /wiki/*:* links URLs by linking directly to Wikipedia
          // Example valid link in this format: https://en.wikipedia.org/wiki/Wikipedia:Unusual_place_names)
          const specialLinks = ["File", "Help", "Template", "Category", "Portal", "Special"];
          const href = node.properties.href;
          if (specialLinks.some((l) => href.startsWith(`/wiki/${l}:`))) {
            node.properties.href = `https://${options.lang}.wikipedia.org${node.properties.href}`;
            node.properties.target = "_blank";
            node.properties.rel = "noopener noreferrer";
          } else if (href.startsWith("/wiki/")) {
            node.properties.href = `${node.properties.href}?lang=${options.lang}`;
          }
        } else if (node.tagName === "div" && hasClass(node, "hatnote")) {
          // Don't print notes like "Main article: ..." but do show them on the page
          addClass(node, "print:hidden");
        } else if (node.tagName === "div" && hasClass(node, "shortdescription")) {
          // Show article's short description if it has one
          addClass(node, "mb-8 text-slate-500");
          hasShortDescription = true;
          if (!node.properties) return;
          node.properties.style = undefined;
        }
      });
    })
    .use(() => (tree: Root) => {
      // Gather each heading and its subsequent non-heading elements into sections
      visit(tree, "element", (node, index, parent) => {
        if (!parent || typeof index !== "number") return CONTINUE;

        let headerNode: HastHeaderElement;
        let indexToUse: number;
        let parentNode: Element | Root;

        // First element of the content is not headings, so we create a section for it differently.
        if (isContentWrapper(node)) {
          const id = options.id;
          // Always hide the H1 title on print, we add it back in React
          // This way, if someone hides the topmost content, the title will still be visible
          const className = hasShortDescription ? "mb-0 print:hidden" : "print:hidden";
          headerNode = h("h1", { id, className }, options.title) as HastHeaderElement;
          indexToUse = 0;
          parentNode = node;
        } else if (isHeading(node)) {
          headerNode = node;
          indexToUse = index + 1;
          parentNode = parent;
        } else {
          return CONTINUE;
        }

        const { header, section } = createSectionData(headerNode, indexToUse, parentNode);
        headers.push(header);
        sections.push(section);
        return CONTINUE;
      });
    })
    .process(html);
  log("Ending", Date.now() - start + "ms");
  return { headers, sections };
}

function log(...args: any[]) {
  if (process.env.NODE_ENV !== "development") return;
  console.log(...args);
}
