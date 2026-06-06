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

export async function getProfileStats(ownerId: string) {
  const rows = await prisma.studyActivity.findMany({
    where: { ownerId },
    select: { type: true, count: true, xp: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const totalXp = rows
    .filter((r) => r.type === "xp")
    .reduce((s, r) => s + (r.xp ?? 0), 0);
  const totalTests = rows
    .filter((r) => r.type === "test")
    .reduce((s, r) => s + (r.count ?? 0), 0);
  const totalStudyMinutes = rows
    .filter((r) => r.type === "study")
    .reduce((s, r) => s + ((r as any).minutes ?? 0), 0);

  // Streak: today backward, consecutive days with any activity
  const activityDates = new Set(
    rows.map((r) => r.createdAt.toISOString().split("T")[0])
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i <= 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    if (activityDates.has(key)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return { totalXp, totalTests, totalStudyMinutes, streak };
}

export async function getDailyActivity(ownerId: string, query: WeeklySummaryQuery) {
  const days = query.days;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await prisma.studyActivity.findMany({
    where: { ownerId, createdAt: { gte: since } },
    select: { type: true, count: true, xp: true, minutes: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const DAY_LABELS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() - i);

    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const dayRows = rows.filter(
      (r) => r.createdAt >= dayStart && r.createdAt <= dayEnd
    );

    const testCount = dayRows
      .filter((r) => r.type === "test")
      .reduce((s, r) => s + (r.count ?? 0), 0);
    const xp = dayRows
      .filter((r) => r.type === "xp")
      .reduce((s, r) => s + (r.xp ?? 0), 0);
    const studyMinutes = dayRows
      .filter((r) => r.type === "study")
      .reduce((s, r) => s + (r.minutes ?? 0), 0);

    result.push({
      label: DAY_LABELS[dayStart.getDay()],
      date: dayStart.toISOString().split("T")[0],
      testCount,
      xp,
      studyMinutes,
      isToday: i === 0,
    });
  }

  return { days: result };
}
