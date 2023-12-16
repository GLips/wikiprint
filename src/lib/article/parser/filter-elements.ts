import { hasClass } from "./identity";

type HastFilter = { tagName: string; className: string | string[] };

export const defaultFilters: HastFilter[] = [
  {
    tagName: "table",
    className: ["infobox", "metadata", "sidebar"],
  },
  {
    tagName: "div",
    className: ["thumb", "navbox", "navbox-styles"],
  },
  {
    tagName: "span",
    className: "mw-editsection",
  },
  {
    tagName: "ul",
    className: "gallery",
  },
  {
    tagName: "figure",
    className: ["mw-default-size", ""]
  },
  {
    tagName: "sup",
    className: "reference",
  },
];

/**
 * Create a function that destructively filters out elements from a Hast tree.
 */
export function createElementFilter(filters: HastFilter[] = defaultFilters) {
  return (node: any) => filterElements(node, filters);
}

export function filterElements(node: any, filters: HastFilter[] = defaultFilters) {
  if (shouldFilter(node, filters)) {
    return false;
  } else if ("children" in node) {
    node.children = node.children.filter((child: any) => filterElements(child, filters));
    return true;
  } else {
    return true;
  }
}

function shouldFilter(node: any, filters: HastFilter[]) {
  return filters.some((filter) => {
    return "tagName" in node && node.tagName === filter.tagName && hasClass(node, filter.className);
  });
}
