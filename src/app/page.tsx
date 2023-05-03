"use client";

import Image from "next/image";
import { Inter } from "next/font/google";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const inter = Inter({ subsets: ["latin"] });

const schema = z.object({
  url: z.string().url(),
});
type Schema = z.infer<typeof schema>;

export default function Home() {
  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: {
      url: "https://en.wikipedia.org/wiki/Wicklow_Mountains",
    },
  });

  const [wikitext, setWikitext] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);

  return (
    <main className="flex flex-col items-center justify-between min-h-screen p-24">
      <div
        className={cn(["print:hidden z-10 items-center justify-between w-full max-w-5xl font-mono text-sm lg:flex"])}
      >
        <p
          className={cn([
            "fixed top-0 left-0 flex justify-center w-full pt-8 pb-6 border-b border-gray-300 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 lg:static lg:w-auto lg:rounded-xl lg:border lg:p-4",
          ])}
        >
          Wikiprint
        </p>
        <div className="flex items-end justify-center w-full h-48 lg:static lg:h-auto lg:w-auto">
          <form
            className="flex items-end space-x-4"
            onSubmit={form.handleSubmit(async ({ url }) => {
              console.log("Handling");
              // https://en.wikipedia.org/w/api.php?action=parse&page=Wicklow_Mountains&prop=wikitext&origin=*&format=json
              // Regex to pull page name from Wikipedia URL
              const urlRegex = /https:\/\/en\.wikipedia\.org\/wiki\/(.*?)(?:$|\/|\?)/;
              const pageTitle = urlRegex.exec(url)?.[1];
              console.log(pageTitle);
              if (!pageTitle) throw new Error("Invalid URL");
              const wikiAPIUrl = `https://en.wikipedia.org/w/api.php?`;
              const params = [
                "action=query",
                `titles=${pageTitle}`,
                "prop=extracts",
                "origin=*",
                "format=json",
                "explaintext=1",
                "exlimit=max",
                "redirects=",
              ];
              const data = await (await fetch(wikiAPIUrl + params.join("&"))).json();
              const pages = data.query.pages;
              const key = Object.keys(pages)[0];
              console.log(data, key);
              setTitle(pages[key].title);
              setWikitext(pages[key].extract);
            })}
          >
            <div>
              <Label htmlFor="url">Wikipedia URL</Label>
              <Input {...form.register("url")} />
            </div>
            <Button type="submit">Load</Button>
          </form>
        </div>
      </div>

      <div className={cn(["relative flex flex-col prose print:max-w-none"])}>
        {/* {wikitext ? <div dangerouslySetInnerHTML={{ __html: wikitext }} /> : null} */}
        {title ? <h1>{title}</h1> : null}
        {wikitext ? (
          <ReactMarkdown>
            {wikitext
              .replaceAll(/\n/g, "\n\n")
              .replaceAll(/==== (.*?)(?: ====)/g, `#### $1`)
              .replaceAll(/=== (.*?)(?: ===)/g, `### $1`)
              .replaceAll(/== (.*?)(?: ==)/g, `## $1`)}
          </ReactMarkdown>
        ) : null}
      </div>
    </main>
  );
}
