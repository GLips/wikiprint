"use client";
import { generateArticleUrl, parseUrl } from "@/app/article/fetch-article";
import { formErrorHandler, TextInput, register, ServerError } from "@/components/form";
import FormError from "@/components/form/form-error";
import { Button, ButtonProps } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLinkIcon, PrinterIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  url: z.string().url(),
});
type Schema = z.infer<typeof schema>;

type Props = {
  slug: string;
  lang?: string;
  error?: string;
  noArticle?: boolean;
  className?: string;
};

export default function WikipediaUrlForm({ slug, lang, error, noArticle, className }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: {
      url: generateArticleUrl(slug, lang),
    },
  });

  const inputUrl = form.watch("url");

  return (
    <div className={cn(["w-full max-w-prose print:hidden", className])}>
      <form
        className="flex flex-col items-end space-y-4 md:space-y-0 md:space-x-4 md:flex-row"
        onSubmit={form.handleSubmit(async ({ url }) => {
          try {
            const { slug, lang } = parseUrl(url);
            if (pathname === `/wiki/${slug}` && searchParams.get("lang") === lang) {
              router.refresh();
            } else {
              router.push(`/wiki/${slug}?lang=${lang}`);
            }
          } catch (e) {
            formErrorHandler(form).handle(e);
          }
        })}
      >
        <TextInput
          className="w-full grow"
          label="Wikipedia URL"
          {...register(form, "url")}
          inputClassName="text-base h-auto py-2.5 bg-white"
        />
        <div className="flex justify-center space-x-4 md:justify-self-end grow">
          <Button
            type="submit"
            variant={noArticle ? "blue" : "default"}
            className={noArticle ? "text-base px-6 grow w-max font-normal block py-2.5 h-auto" : "w-max"}
          >
            {noArticle ? "Get printable article" : "Load"}
          </Button>
          {/* {process.env.NODE_ENV === "development" ? (
                  <Button
                    type="button"
                    onClick={async () => {
                      const result = await parse(raw, { title, id: slug, lang });
                      updateArticleState(result);
                    }}
                  >
                    Parse
                  </Button>
                ) : null} */}
          {!noArticle ? (
            <>
              <ButtonLink
                buttonProps={{ disabled: !form.getValues().url }}
                variant="secondary"
                aria-label="Visit on Wikipedia"
                title="Visit on Wikipedia"
                href={form.getValues().url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLinkIcon size={16} />
              </ButtonLink>
              <Button
                type="button"
                // disabled={!sections.length}
                variant="secondary"
                aria-label="Print this page"
                title="Print this page"
                onClick={() => window.print()}
              >
                <PrinterIcon size={16} />
              </Button>
            </>
          ) : null}
        </div>
      </form>
      <FormError error={error} />
    </div>
  );
}
