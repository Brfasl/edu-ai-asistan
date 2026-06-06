import { apiRequest } from '@/features/common/api/api-client';

export async function logActivity({ token, type, minutes, count, xp, course } = {}) {
  if (!token) return null;
  try {
    const body = {};
    if (type) body.type = type;
    if (minutes !== undefined) body.minutes = minutes;
    if (count !== undefined) body.count = count;
    if (xp !== undefined) body.xp = xp;
    if (course) body.course = course;
    const res = await apiRequest('/api/v1/stats/activity', {
      method: 'POST',
      token,
      body,
    });
    return res?.activity || null;
  } catch {
    return null; // aktivite loglama kritik değil, sessizce geç
  }
}

export async function getWeeklySummary({ token, days = 7 } = {}) {
  const res = await apiRequest(`/api/v1/stats/weekly-summary?days=${days}`, { token });
  return res?.summary || null;
}

export async function getCoursePerformance({ token, days = 7 } = {}) {
  const res = await apiRequest(`/api/v1/stats/course-performance?days=${days}`, { token });
  return res?.performance?.items || [];
}

export async function getDailyActivity({ token, days = 7 } = {}) {
  const res = await apiRequest(`/api/v1/stats/daily-activity?days=${days}`, { token });
  return res?.days || [];
}

export async function getProfileStats({ token } = {}) {
  const res = await apiRequest('/api/v1/stats/profile-stats', { token });
  return res || null;
}
