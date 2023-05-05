import React, { ReactNode } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { HeaderData, HeadingElementValues } from "@/lib/article/types";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { EyeIcon, EyeOffIcon } from "lucide-react";

type Props = {
  headers: HeaderData[];
  hiddenIds: string[];
  hide: (id: string) => void;
  show: (id: string) => void;
  className?: string;
};

export default function TableOfContents({ headers, hiddenIds, hide, show, className }: Props) {
  return (
    <ScrollArea className={cn(["w-full h-[calc(100vh-var(--header-height))] max-w-xs", className])}>
      {headers.length ? <h2 className="mt-4 text-sm font-light uppercase text-slate-500">Contents</h2> : null}
      <ul className="pt-4 pb-16 ml-4 space-y-4">
        {headers.map((h) => {
          const isHidden = hiddenIds.includes(h.id);
          return (
            <TocHeading key={h.id} isHidden={isHidden} id={h.id} type={h.type} toggle={isHidden ? show : hide}>
              {h.title}
            </TocHeading>
          );
        })}
      </ul>
    </ScrollArea>
  );
}

function TocHeading({
  type,
  isHidden,
  id,
  children,
  toggle,
}: {
  type: HeadingElementValues;
  id: string;
  isHidden: boolean;
  children: ReactNode;
  toggle: (id: string) => void;
}) {
  const El = type;
  return (
    <li
      className={cn([
        {
          "flex justify-between items-center gap-8": true,
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
            "text-xl font-[350] font-serif text-slate-800": type === "h2" || type === "h1",
            "text-sm text-slate-500": type !== "h2" && type !== "h1",
          },
        ])}
        href={isHidden ? "#" : `#${id}`}
        onClick={() => {
          if (isHidden) {
            toggle(id);
          }
        }}
      >
        {children}
      </a>
      <Button className="text-xs font-light" variant="ghost" size="sm" onClick={() => toggle(id)}>
        {isHidden ? <EyeOffIcon strokeWidth={1} size={16} /> : <EyeIcon strokeWidth={1} size={16} />}
      </Button>
    </li>
  );
}
