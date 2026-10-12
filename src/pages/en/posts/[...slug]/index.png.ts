import { getCollection } from "astro:content";
import { GET } from "@/pages/posts/[...slug]/index.png";
import { getPostSlug } from "@/utils/getPostPaths";
import config from "@/config";

export async function getStaticPaths() {
  if (!config.features.dynamicOgImage) return [];

  const posts = await getCollection(
    "posts",
    ({ data }) => data.lang === "en" && !data.draft && !data.ogImage
  );

  return posts.map(post => ({
    params: { slug: getPostSlug(post.id, post.filePath) },
    props: post,
  }));
}

export { GET };
