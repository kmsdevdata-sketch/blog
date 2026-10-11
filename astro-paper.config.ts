import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://astro-paper.pages.dev/",
    title: "Being BE",
    description: "Backend Engineering Notes",
    author: "Minseo Kim",
    profile: "https://satna.ing",
    ogImage: "default-og.jpg",
    lang: "en",
    timezone: "Asia/Bangkok",
    dir: "ltr",
  },
  posts: {
    perPage: 4,
    perIndex: 4,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: true,
      url: "https://github.com/satnaing/astro-paper/edit/main/",
    },
    search: "pagefind",
  },
  socials: [
    { name: "github",   url: "https://github.com/kmsdevdata-sketch" },
    // { name: "x",        url: "https://x.com/username" },
    { name: "linkedin", url: "https://www.linkedin.com/in/%EB%AF%BC%EC%84%9C-%EA%B9%80-79823a416/" },
    { name: "mail",     url: "mailto:kms.dev.data@gmail.com" },
  ],
  // shareLinks: [
  //   { name: "whatsapp", url: "https://wa.me/?text=" },
  //   { name: "facebook", url: "https://www.facebook.com/sharer.php?u=" },
  //   { name: "x",        url: "https://x.com/intent/post?url=" },
  //   { name: "telegram", url: "https://t.me/share/url?url=" },
  //   { name: "pinterest", url: "https://pinterest.com/pin/create/button/?url=" },
  //   { name: "mail",     url: "mailto:?subject=See%20this%20post&body=" },
  // ],
});