const GISCUS_ORIGIN = "https://giscus.app";

let activeContainer: HTMLElement | null = null;
let themeObserver: MutationObserver | null = null;
let frameObserver: MutationObserver | null = null;

function theme() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function syncTheme() {
  const iframe = activeContainer?.querySelector<HTMLIFrameElement>(
    "iframe.giscus-frame"
  );
  iframe?.contentWindow?.postMessage(
    { giscus: { setConfig: { theme: theme() } } },
    GISCUS_ORIGIN
  );
}

function mountGiscus() {
  const container = document.querySelector<HTMLElement>("#giscus-comments");
  if (container === activeContainer) return;

  themeObserver?.disconnect();
  frameObserver?.disconnect();
  activeContainer = container;
  if (!container) return;

  const script = document.createElement("script");
  script.src = `${GISCUS_ORIGIN}/client.js`;
  script.async = true;
  script.crossOrigin = "anonymous";
  Object.assign(script.dataset, {
    repo: container.dataset.repo,
    repoId: container.dataset.repoId,
    category: container.dataset.category,
    categoryId: container.dataset.categoryId,
    mapping: "specific",
    term: container.dataset.term,
    strict: "1",
    reactionsEnabled: "1",
    emitMetadata: "0",
    inputPosition: "top",
    loading: "lazy",
    theme: theme(),
    lang: container.dataset.lang,
  });
  container.append(script);

  themeObserver = new MutationObserver(syncTheme);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  frameObserver = new MutationObserver(() => {
    const iframe = container.querySelector<HTMLIFrameElement>(
      "iframe.giscus-frame"
    );
    if (iframe && !iframe.dataset.themeListener) {
      iframe.dataset.themeListener = "true";
      iframe.addEventListener("load", syncTheme);
      syncTheme();
    }
  });
  frameObserver.observe(container, { childList: true, subtree: true });
}

document.addEventListener("astro:page-load", mountGiscus);
mountGiscus();
