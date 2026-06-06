import { apiRequest } from '@/features/common/api/api-client';

export async function getGoals({ token } = {}) {
  const res = await apiRequest('/api/v1/goals', { token });
  return res?.goals || [];
}

export async function createGoal({ token, title, examDate, color, emoji } = {}) {
  const res = await apiRequest('/api/v1/goals', {
    method: 'POST',
    token,
    body: { title, examDate, color, emoji },
  });
  return res?.goal || null;
}

export async function deleteGoal({ token, id } = {}) {
  await apiRequest(`/api/v1/goals/${id}`, {
    method: 'DELETE',
    token,
  });
}
