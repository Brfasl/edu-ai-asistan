import { prisma } from "../../core/db";
import type { CreateActivityBody, WeeklySummaryQuery } from "./statistics.schemas";

export async function createActivity(ownerId: string, input: CreateActivityBody) {
  const activity = await prisma.studyActivity.create({
    data: {
      ownerId,
      type: input.type,
      minutes: input.minutes,
      count: input.count,
      xp: input.xp,
      course: input.course?.trim(),
    },
  });

  return {
    id: activity.id,
    type: activity.type,
    minutes: activity.minutes,
    count: activity.count,
    xp: activity.xp,
    course: activity.course,
    createdAt: activity.createdAt.toISOString(),
  };
}

export async function getWeeklySummary(ownerId: string, query: WeeklySummaryQuery) {
  const since = new Date(Date.now() - query.days * 24 * 60 * 60 * 1000);
  const rows = await prisma.studyActivity.findMany({
    where: { ownerId, createdAt: { gte: since } },
    select: { type: true, minutes: true, count: true, xp: true, course: true },
  });

  const studyMinutes = rows
    .filter((r) => r.type === "study")
    .reduce((sum, r) => sum + (r.minutes ?? 0), 0);
  const testsSolved = rows
    .filter((r) => r.type === "test")
    .reduce((sum, r) => sum + (r.count ?? 0), 0);
  const xp = rows
    .filter((r) => r.type === "xp")
    .reduce((sum, r) => sum + (r.xp ?? 0), 0);

  return {
    since: since.toISOString(),
    days: query.days,
    studyMinutes,
    testsSolved,
    xp,
  };
}

export async function getCoursePerformance(ownerId: string, query: WeeklySummaryQuery) {
  const since = new Date(Date.now() - query.days * 24 * 60 * 60 * 1000);
  const rows = await prisma.studyActivity.findMany({
    where: { ownerId, createdAt: { gte: since }, course: { not: null } },
    select: { course: true, minutes: true, count: true, xp: true, type: true },
  });

  const byCourse = new Map<string, { minutes: number; tests: number; xp: number }>();
  for (const r of rows) {
    const course = r.course ?? "";
    if (!course) continue;
    const agg = byCourse.get(course) ?? { minutes: 0, tests: 0, xp: 0 };
    if (r.type === "study") agg.minutes += r.minutes ?? 0;
    if (r.type === "test") agg.tests += r.count ?? 0;
    if (r.type === "xp") agg.xp += r.xp ?? 0;
    byCourse.set(course, agg);
  }

  // Simple “score”: study minutes + tests*10 + xp/10, normalized to 0-100.
  const scored = Array.from(byCourse.entries()).map(([course, agg]) => {
    const raw = agg.minutes + agg.tests * 10 + agg.xp / 10;
    return { course, ...agg, raw };
  });
  const max = Math.max(1, ...scored.map((s) => s.raw));

  const items = scored
    .sort((a, b) => b.raw - a.raw)
    .slice(0, 10)
    .map((s) => ({
      course: s.course,
      scorePercent: Math.round((s.raw / max) * 100),
      studyMinutes: s.minutes,
      testsSolved: s.tests,
      xp: Math.round(s.xp),
    }));

  return { since: since.toISOString(), days: query.days, items };
}

