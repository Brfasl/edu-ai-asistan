import { prisma } from "../../core/db";
import { AppError } from "../../core/errors";
import type { CreateGoalBody } from "./goals.schemas";

export function toPublicGoal(goal: {
  id: string;
  title: string;
  examDate: Date;
  color: string;
  emoji: string;
  createdAt: Date;
}) {
  return {
    id: goal.id,
    title: goal.title,
    examDate: goal.examDate.toISOString().split("T")[0],
    color: goal.color,
    emoji: goal.emoji,
    addedAt: goal.createdAt.toISOString(),
  };
}

export async function listGoals(ownerId: string) {
  const goals = await prisma.goal.findMany({
    where: { ownerId },
    orderBy: { examDate: "asc" },
  });
  return goals.map(toPublicGoal);
}

export async function createGoal(ownerId: string, input: CreateGoalBody) {
  const goal = await prisma.goal.create({
    data: {
      ownerId,
      title: input.title.trim(),
      examDate: new Date(`${input.examDate}T00:00:00.000Z`),
      color: input.color ?? "#2BE26E",
      emoji: input.emoji ?? "📚",
    },
  });
  return toPublicGoal(goal);
}

export async function deleteGoal(ownerId: string, goalId: string) {
  const goal = await prisma.goal.findFirst({
    where: { id: goalId, ownerId },
  });
  if (!goal) {
    throw new AppError("GOAL_NOT_FOUND", "Hedef bulunamadı.", 404);
  }
  await prisma.goal.delete({ where: { id: goalId } });
}
