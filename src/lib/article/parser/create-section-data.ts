import { Element, Root } from "hastscript/lib/core";
import { HastHeaderElement, HeaderData, HeadingElementValues, SectionData } from "../types";
import { visit } from "unist-util-visit";
import { collectSiblings } from "./collect-siblings";
import { toHtml } from "hast-util-to-html";

type ReturnType = {
  header: HeaderData;
  section: SectionData;
};

export function createSectionData(
  node: HastHeaderElement,
  index: number,
  parent: Element | Root
): ReturnType {
  const header = getHeaderData(node);
  console.log("parent", parent);
  const section = { id: header.id, ...getSectionData(parent.children, index, node) };
  return { section, header };
}

const headingElementList = ["h1", "h2", "h3", "h4", "h5", "h6"];

function getHeaderData(node: HastHeaderElement) {
  let title = "";
  let id = "";
  let tagName = node.tagName;

  // Visit the nodes of the heading since an inner <span> contains the id
  visit(
    node,
    (x) => ["text", "element"].includes(x.type),
    (c) => {
      if ("tagName" in c && headingElementList.includes(c.tagName)) {
        tagName = c.tagName as HeadingElementValues;
      }
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

  return { type: tagName, title, id };
}

function getSectionData(...params: Parameters<typeof collectSiblings>) {
  const siblings = collectSiblings(...params);
  return { __html: toHtml(siblings), length: siblings.children.length };
}
