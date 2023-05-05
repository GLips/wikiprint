import { h } from "hastscript";
import type { Element, Root } from "hastscript/lib/core";
import { isHeading } from "./identity";

type ElementContent = Element["children"][number];
type RootContent = Root["children"][number];

export function collectSiblings(
  siblings: ElementContent[] | RootContent[],
  //   startingIndex: number = 0,
  index: number = 0,
  firstElement?: Element
) {
  //   const index = firstElement ? startingIndex + 1 : startingIndex;
  const section = createRootNode(firstElement);

  // Add next siblings until we find another heading
  for (let i = index; i < siblings.length; i++) {
    const sibling = siblings[i];
    if ("tagName" in sibling && isHeading(sibling)) {
      break;
    } else {
      section.children.push(sibling);
    }
  }
  return section;
}

/**
 * Create a root Hast node, aka a fragment.
 */
function createRootNode(firstElement?: Element) {
  return h(null, firstElement ? [firstElement] : []);
}
