import type { Element } from "hastscript/lib/core";
import { HeadingElement } from "../types";

export function addClass(node: any, className: string) {
  if (!node.properties) node.properties = {};
  if (!Array.isArray(node.properties.className)) node.properties.className = [];
  node.properties.className.push(className);
}

/**
 * Could potentially be replaced by unist-util-select if deeper functionality is required
 * https://github.com/syntax-tree/unist-util-select
 *
 * @param el The Hast element to check.
 * @param className If checking multiple classes, pass an array, not a string with multiple classes separated by spaces.
 *
 * @see https://github.com/syntax-tree/hastscript
 */
export function hasClass(
  el: Element,
  className: string | string[],
  options: { matchAny: boolean } = { matchAny: true }
): boolean {
  if (!el.properties) return false;

  const classes = Array.isArray(className) ? className : [className];
  const checkFunction = getChecker(el.properties.className);

  return options.matchAny ? classes.some(checkFunction) : classes.every(checkFunction);
}

const getChecker =
  (haystack: any) =>
  (needle: string): boolean => {
    if (typeof haystack === "string") {
      // Handle string of space-separated CSS classes
      return haystack.split(" ").includes(needle);
    } else if (Array.isArray(haystack)) {
      return haystack.includes(needle);
    } else {
      return false;
    }
  };

const headingElementList = ["h1", "h2", "h3", "h4", "h5", "h6"];
/**
 * Check if provided string is a heading
 */
export function isHeading(node: string): node is HeadingElement {
  return headingElementList.includes(node);
}
