const analyticsUrl = "https://api.vercel.com/v1/query/web-analytics/visits/count";
const projectId = "prj_FkmT8MXnuaQoXqf9m5aHKCrhuTsO";
const teamSlug = "kimminseo-s-projects";

type AnalyticsCount = {
  data?: { pageviews?: unknown; visitors?: unknown };
};

function startOfTodayInSeoul(now: Date): number {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return new Date(`${date}T00:00:00+09:00`).getTime();
}

async function getCount(token: string, since?: number) {
  const url = new URL(analyticsUrl);
  url.searchParams.set("projectId", projectId);
  url.searchParams.set("slug", teamSlug);
  if (since !== undefined) {
    url.searchParams.set("since", String(since));
    url.searchParams.set("until", String(Date.now()));
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
      getCount(token, startOfTodayInSeoul(new Date())),
      getCount(token),
    ]);

    return Response.json(
      { todayVisitors: today.visitors, totalViews: lifetime.pageviews },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (error) {
    console.error("Unable to load visitor counts", error);
    return Response.json({ error: "Visitor counts unavailable" }, { status: 502 });
  }
}
