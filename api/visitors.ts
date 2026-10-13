const analyticsUrl = "https://api.vercel.com/v1/query/web-analytics/visits/count";
const aggregateUrl = "https://api.vercel.com/v1/query/web-analytics/visits/aggregate";
const projectId = "prj_FkmT8MXnuaQoXqf9m5aHKCrhuTsO";
const teamSlug = "kimminseo-s-projects";

type AnalyticsCount = {
  data?: { pageviews?: unknown; visitors?: unknown };
};
type AnalyticsTrend = {
  data?: Array<{ timestamp?: unknown; pageviews?: unknown }>;
};

function utcToday(now: Date) {
  const since = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  return { since, until: since + 24 * 60 * 60 * 1000 };
}

async function getCount(
  token: string,
  range?: { since: number; until: number },
  path?: string
) {
  const url = new URL(analyticsUrl);
  url.searchParams.set("projectId", projectId);
  url.searchParams.set("slug", teamSlug);
  if (range) {
    url.searchParams.set("since", String(range.since));
    url.searchParams.set("until", String(range.until));
  }
  if (path) url.searchParams.set("filter", `requestPath eq '${path}'`);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Analytics API returned ${response.status}`);

  const body = (await response.json()) as AnalyticsCount;
  const { pageviews, visitors } = body.data ?? {};
  if (
    typeof pageviews !== "number" ||
    typeof visitors !== "number" ||
    !Number.isFinite(pageviews) ||
    !Number.isFinite(visitors)
  ) {
    throw new Error("Analytics API returned invalid counts");
  }
  return { pageviews, visitors };
}

async function getDailyViews(token: string, now: Date) {
  const today = utcToday(now).since;
  const since = today - 6 * 24 * 60 * 60 * 1000;
  const until = today + 24 * 60 * 60 * 1000;
  const url = new URL(aggregateUrl);
  url.searchParams.set("projectId", projectId);
  url.searchParams.set("slug", teamSlug);
  url.searchParams.set("since", String(since));
  url.searchParams.set("until", String(until));
  url.searchParams.set("by", "day");
  url.searchParams.set("limit", "7");

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Analytics API returned ${response.status}`);
  const body = (await response.json()) as AnalyticsTrend;
  if (!Array.isArray(body.data)) throw new Error("Analytics API returned invalid trend");

  const counts = new Map<string, number>();
  for (const row of body.data) {
    if (
      typeof row.timestamp !== "string" ||
      typeof row.pageviews !== "number" ||
      !Number.isFinite(row.pageviews)
    ) throw new Error("Analytics API returned invalid trend");
    counts.set(row.timestamp.slice(0, 10), row.pageviews);
  }
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(since + index * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    return { date, views: counts.get(date) ?? 0 };
  });
}

export async function GET(request: Request) {
  const token = process.env.VERCEL_ANALYTICS_TOKEN;
  if (!token) {
    return Response.json({ error: "Visitor counts unavailable" }, { status: 503 });
  }

  try {
    const path = new URL(request.url).searchParams.get("path");
    if (path !== null) {
      if (!/^\/(?:en\/)?posts\/[a-z0-9/_-]+\/$/.test(path) || path.length > 240) {
        return Response.json({ error: "Invalid post path" }, { status: 400 });
      }
      // Analytics records Astro's trailing-slash URLs without the final slash.
      const { pageviews } = await getCount(token, undefined, path.slice(0, -1));
      return Response.json(
        { views: pageviews },
        { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
      );
    }

    const now = new Date();
    const [today, lifetime, dailyViews] = await Promise.all([
      getCount(token, utcToday(now)),
      getCount(token),
      getDailyViews(token, now),
    ]);

    return Response.json(
      { todayVisitors: today.visitors, totalViews: lifetime.pageviews, dailyViews },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
    );
  } catch (error) {
    console.error("Unable to load visitor counts", error);
    return Response.json({ error: "Visitor counts unavailable" }, { status: 502 });
  }
}
