import { parse } from "@/lib/article/parser";
import { ArticleState } from "./use-article-state";

export async function fetchArticleData(url: string): Promise<ArticleState> {
  const { lang, slug } = parseUrl(url);
  const { title, raw } = await fetchArticle(slug, lang);
  const hype = await parse(raw, { id: slug, title, lang });
  return {
    title,
    raw,
    lang,
    pageSlug: slug,
    status: "idle" as const,
    ...hype,
  };
}

type ArticleResponse = {
  parse: {
    title: string;
    text: {
      "*": string;
    };
  };
};

type ArticleError = {
  error: {
    code: string;
    info: string;
  };
};

export async function fetchArticle(slug: string, lang: string = "en") {
  const article = await fetch(generateAPIUrl(slug, lang));
  const data = (await article.json()) as ArticleResponse | ArticleError;
  if ("error" in data) throw new Error("Error from the Wikipedia API: " + data.error.info);
  return {
    title: data.parse.title,
    raw: data.parse.text["*"],
  };
}

export function generateArticleUrl(slug: string, lang: string = "en") {
  return `https://${lang}.wikipedia.org/wiki/${slug}`;
}

export function generateAPIUrl(slug: string, lang: string = "en") {
  const wikiAPIUrl = `https://${lang}.wikipedia.org/w/api.php?`;
  const params = ["action=parse", `page=${slug}`, "prop=text", "origin=*", "format=json", "redirects="];
  return wikiAPIUrl + params.join("&");
}

export function parseUrl(url: string) {
  const urlRegex = /https:\/\/([A-Za-z]+)\.wikipedia\.org\/wiki\/(.*?)(?:$|\/|\?)/;
  const [, lang, slug] = urlRegex.exec(url) ?? [];
  if (!slug) throw new Error("Invalid URL supplied. Please provide a valid Wikipedia URL.");
  return { lang, slug };
}

// Handles URLs like /wiki/Article_name?lang=en
export function parseWikiprintPath(path: string) {
  const pathRegex = /^\/wiki\/(.*?)\?.*?lang=([A-Za-z]+)/;
  const [, slug, lang] = pathRegex.exec(path) ?? [];
  if (!slug)
    throw new Error("Invalid URL supplied. Please provide a valid Wikiprint path like /wiki/Article_name?lang=en.");
  return { slug, lang };
}
