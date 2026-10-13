const analyticsUrl = "https://api.vercel.com/v1/query/web-analytics/visits/count";
const projectId = "prj_FkmT8MXnuaQoXqf9m5aHKCrhuTsO";
const teamSlug = "kimminseo-s-projects";

type AnalyticsCount = {
  data?: { pageviews?: unknown; visitors?: unknown };
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
  range?: { since: number; until: number }
) {
  const url = new URL(analyticsUrl);
  url.searchParams.set("projectId", projectId);
  url.searchParams.set("slug", teamSlug);
  if (range) {
    url.searchParams.set("since", String(range.since));
    url.searchParams.set("until", String(range.until));
  }

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

export async function GET() {
  const token = process.env.VERCEL_ANALYTICS_TOKEN;
  if (!token) {
    return Response.json({ error: "Visitor counts unavailable" }, { status: 503 });
  }

  try {
    const [today, lifetime] = await Promise.all([
      getCount(token, utcToday(new Date())),
      getCount(token),
    ]);

    return Response.json(
      { todayVisitors: today.visitors, totalViews: lifetime.pageviews },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
    );
  } catch (error) {
    console.error("Unable to load visitor counts", error);
    return Response.json({ error: "Visitor counts unavailable" }, { status: 502 });
  }
}
