import { rehype } from "rehype";
import { HeaderData, HeadingElement, SectionData } from "./types";
import { filter } from "unist-util-filter";
import { CONTINUE, SKIP, visit } from "unist-util-visit";
import { h } from "hastscript";
import { toHtml } from "hast-util-to-html";
import { Root } from "hastscript/lib/core";
import { createElementFilter, filterElements } from "./parser/filter-elements";
import { hasClass, addClass, isHeading } from "./parser/identity";
import { collectSiblings } from "./parser/collect-siblings";

type ParseOptions = {
  title: string;
  id: string;
};
export async function parse(html: string, options: ParseOptions) {
  // Log time to run filter
  const start = Date.now();
  console.log("Starting");
  const headers: HeaderData[] = [];
  const sections: SectionData[] = [];
  let hasShortDescription = false;
  await rehype()
    .use(() => (tree: Root) => {
      // Remove table.infobox
      filter(tree, { cascade: true }, createElementFilter());
      visit(tree, "element", (node) => {
        if (node.tagName === "a") {
          if (!node.properties || typeof node.properties.href !== "string") return;
          addClass(node, "print:font-normal print:no-underline");
        } else if (node.tagName === "div" && hasClass(node, "hatnote")) {
          addClass(node, "print:hidden");
        } else if (node.tagName === "div" && hasClass(node, "shortdescription")) {
          addClass(node, "mb-8 text-slate-500");
          hasShortDescription = true;
          if (!node.properties) return;
          node.properties.style = undefined;
        }
      });
    })
    .use(() => (tree: Root) => {
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
          section = collectSiblings(
            node.children,
            0,
            // Always hide the H1 title on print, we add it back in React
            // This way, if someone hides the topmost content, the title will still be visible
            h("h1", { className: hasShortDescription ? "mb-0 print:hidden" : "print:hidden" }, title)
          );
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
          section = collectSiblings(parent.children, index + 1, node);
          // headers.push({ title, id, type });
          // sections.push({ __html: toHtml(section), id: id || "" });
          parent.children.splice(index, section.children.length - 1);
          headers.push({ title, id, type });
          sections.push({ __html: toHtml(section), id });
          return [SKIP, index];
        } else {
          return CONTINUE;
        }
      });
    })
    .process(html);
  console.log("Ending", Date.now() - start + "ms");
  return { headers, sections };
}
