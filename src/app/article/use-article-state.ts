import { HeaderData, SectionData } from "@/lib/article";
import { useReducer } from "react";

const defaultState = {
  raw: "",
  title: "",
  lang: "en",
  pageSlug: "",
  status: "idle" as "idle" | "loading" | "parsing" | "error",
  sections: [] as SectionData[],
  headers: [] as HeaderData[],
};

export type ArticleState = typeof defaultState;
type Action = { type: "setState"; payload: Partial<ArticleState> };

function reducer(state: ArticleState, action: Action) {
  switch (action.type) {
    case "setState":
      return { ...state, ...action.payload };
    default:
      throw new Error();
  }
}

export function useArticleState(initialState?: Partial<ArticleState>) {
  const [state, dispatch] = useReducer(reducer, { ...defaultState, ...initialState });
  const updateArticleState = (payload: Partial<ArticleState>) => dispatch({ type: "setState", payload });
  return [state, updateArticleState] as const;
}
