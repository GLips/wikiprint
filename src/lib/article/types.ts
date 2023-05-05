import { Element } from "hastscript/lib/core";

export type HeadingElementValues = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
export type HastHeaderElement = Omit<Element, "tagName"> & {
  tagName: HeadingElementValues;
};
export type HeaderData = { title: string; id: string; type: HeadingElementValues };
export type SectionData = { __html: string; id: string; length: number };
