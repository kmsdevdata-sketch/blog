import { getCollection, type CollectionEntry } from "astro:content";
import { getSortedPosts } from "./getSortedPosts";
import { getPostSlug } from "./getPostPaths";

export type BlogLocale = "ko" | "en";

export async function getLocalizedPosts(locale: BlogLocale) {
  return getSortedPosts(
    await getCollection("posts", ({ data }) => data.lang === locale)
  );
}

export function getTranslationKey(post: CollectionEntry<"posts">) {
  return post.data.translationKey ?? getPostSlug(post.id, post.filePath);
}

export async function getPostTranslation(
  post: CollectionEntry<"posts">,
  locale: BlogLocale
) {
  const posts = await getLocalizedPosts(locale);
  return posts.find(
    candidate => getTranslationKey(candidate) === getTranslationKey(post)
  );
}
