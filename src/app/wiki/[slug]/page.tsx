// TODO? Add ability to create multi-article, linkable pages with filters pre-applied
// TODO? Add ability to print out multi-article https://www.lulu.com/sell/sell-on-your-site/print-api
// TODO: Lift current filter state to URL params for easier sharing
// TODO: Homepage "fun" articles
// TODO: Add a discreet "Printed from Wikiprint" footer
// TODO: Better loading state than "Loading..."
// TODO: Add ability to hide paragraphs within sections
// TODO: Support nesting within section/header data structure to improve functionality and possibly styling
// TODO? Add a "currently looking at" indicator based on scroll location to the table of contents
//  TODO: Automatically hide all sub-sections via option e.g. References > Bibliography on Republic_of_Ireland page
"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDocumentTitle, useListState } from "@mantine/hooks";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import TableOfContents from "@/components/table-of-contents";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useArticleState } from "@/app/article/use-article-state";
import { fetchArticleData, generateArticleUrl, parseWikiprintPath } from "@/app/article/fetch-article";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import WikipediaUrlForm from "../../../components/wikipedia-url-form";
import { extractError } from "@/lib/error";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";

const defaultBlockSections = [
  "See_also",
  "Notes",
  "References",
  "Further_reading",
  "External_links",
  "Citations",
  "References_and_sources",
  "Sources",
];

const queryClient = new QueryClient();

export default function QueryWrapper(props: HomeProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <Home {...props} />
    </QueryClientProvider>
  );
}
type HomeProps = {
  params: {
    slug: string;
  };
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
};

function Home({ params, searchParams }: HomeProps) {
  // const [error, setError] = useState("");
  const [hiddenIds, hiddenIdsHandlers] = useListState(defaultBlockSections);
  const [state, updateArticleState] = useArticleState({
    pageSlug: params.slug,
    lang: searchParams.lang as string,
    status: "loading" as const,
  });
  const articleUrl = generateArticleUrl(params.slug, searchParams.lang as string);
  const { data, error } = useQuery({
    queryKey: ["article", params.slug, searchParams.lang],
    queryFn: () => fetchArticleData(articleUrl),
    onSuccess(values) {
      updateArticleState(values);
    },
    cacheTime: 60 * 10 * 1000,
    staleTime: Infinity,
  });
  const { raw, title, pageSlug, status, sections, headers, lang } = { ...state, ...data };
  console.log(title);
  useDocumentTitle(title || pageSlug.replace(/_/g, " "));

  const articleRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  useEffect(() => {
    // intercept link clicks inside the prose class
    const handleClick = (e: MouseEvent) => {
      if (e.target instanceof HTMLAnchorElement && !e.metaKey && !e.shiftKey) {
        e.preventDefault();
        const href = e.target.getAttribute("href");
        if (href && href.startsWith("http")) {
          window.open(href, "_blank");
        } else if (href) {
          router.push(href);
        }
      }
    };

    // Prefetch API results for links inside the prose class
    const handleHover = (e: MouseEvent) => {
      if (e.target instanceof HTMLAnchorElement) {
        const href = e.target.getAttribute("href");
        if (href && !href.startsWith("http")) {
          try {
            const { slug, lang } = parseWikiprintPath(href);
            queryClient.prefetchQuery(["article", slug, lang], () => fetchArticleData(generateArticleUrl(slug, lang)), {
              staleTime: Infinity,
            });
          } catch (e) {
            console.error("Failed to parse", href, e);
          }
        }
      }
    };

    articleRef.current?.addEventListener("click", handleClick);
    articleRef.current?.addEventListener("mouseover", handleHover);
    return () => {
      articleRef.current?.removeEventListener("click", handleClick);
      articleRef.current?.removeEventListener("mouseover", handleHover);
    };
  }, [articleRef.current]);

  return (
    <main className="relative flex flex-col items-center justify-between print:mx-[24mm]">
      <div className="flex items-start justify-start w-full gap-8 px-4 mb-48 lg:gap-36 print:mb-0">
        <div className="sticky hidden w-full max-w-xs md:block print:hidden top-header">
          <TableOfContents
            headers={headers}
            show={(id) => hiddenIdsHandlers.filter((x) => x !== id)}
            hide={hiddenIdsHandlers.append}
            hiddenIds={hiddenIds}
          />
        </div>
        <div className={cn(["relative w-full print:max-w-none"])}>
          {pageSlug ? (
            <WikipediaUrlForm slug={pageSlug} lang={lang} className="mb-12" error={extractError(error)} />
          ) : null}
          {status === "loading" ? <div>Loading...</div> : null}
          {status === "idle" && sections.length ? (
            <>
              <div className="prose print:prose-sm" ref={articleRef}>
                {title ? <h1 className="hidden !mb-0 print:block">{title}</h1> : null}
                {sections.map((s) => {
                  const isHidden = hiddenIds.includes(s.id);
                  const show = (id: string) => hiddenIdsHandlers.filter((x) => x !== s.id);
                  const hide = (id: string) => hiddenIdsHandlers.append(s.id);
                  return <Section key={s.id} isHidden={isHidden} toggle={isHidden ? show : hide} {...s} />;
                })}
              </div>
              {/* <div className="fixed left-0 right-0 hidden mx-auto font-mono text-xs text-center print:block">
                Printed from https://wikiprint.vercel.app/wiki/{pageSlug}
              </div> */}
              <RawContent raw={raw} />
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function Section({
  id,
  __html,
  isHidden,
  toggle,
}: {
  id: string;
  isHidden: boolean;
  __html: string;
  toggle: (id: string) => void;
}) {
  // if (isHidden) return null;
  return (
    <section className="relative" id={id}>
      <div
        className={cn([
          {
            "hide-content print:hidden opacity-50 hover:opacity-100 cursor-pointer": isHidden,
          },
        ])}
        onClick={() => {
          if (isHidden) toggle(id);
        }}
        dangerouslySetInnerHTML={{ __html }}
      />
      <div className="absolute top-0 right-4 print:hidden">
        <Button onClick={() => toggle(id)} variant="ghost">
          {isHidden ? <EyeOffIcon strokeWidth={1} size={16} /> : <EyeIcon strokeWidth={1} size={16} />}
        </Button>
      </div>
    </section>
  );
}

function RawContent({ raw }: { raw?: string }) {
  if (process.env.NODE_ENV !== "development" || !raw) return null;
  return (
    <Accordion className="mb-8 prose text-left print:hidden prose-headings:m-0 prose-pre:m-0" type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger className="justify-between font-mono text-3xl font-bold text-left">
          Raw content
        </AccordionTrigger>
        <AccordionContent>
          <pre className="max-h-[50vh] overflow-scroll">{raw}</pre>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
