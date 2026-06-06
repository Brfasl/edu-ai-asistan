import { apiRequest } from '@/features/common/api/api-client';
import { Platform } from 'react-native';

export async function listDocuments({ token, status } = {}) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await apiRequest(`/api/v1/documents${qs}`, { token });
  return res?.documents || [];
}

export async function uploadDocument({ token, asset }) {
  const name = asset?.name || 'Belge';
  const sizeBytes = typeof asset?.size === 'number' ? asset.size : undefined;
  const lower = name.toLowerCase();
  const type = lower.endsWith('.pdf') ? 'pdf' : lower.match(/\.(png|jpg|jpeg|webp)$/) ? 'image' : 'other';

  const inferredMime =
    asset?.mimeType ||
    (lower.endsWith('.pdf')
      ? 'application/pdf'
      : lower.endsWith('.png')
        ? 'image/png'
        : lower.endsWith('.webp')
          ? 'image/webp'
          : lower.endsWith('.jpg') || lower.endsWith('.jpeg')
            ? 'image/jpeg'
            : 'application/octet-stream');

  const form = new FormData();
  if (Platform.OS === 'web') {
    const webFile = asset?.file;
    if (webFile) {
      form.append('file', webFile, name);
    } else if (asset?.uri) {
      const blob = await fetch(asset.uri).then((r) => r.blob());
      form.append('file', blob, name);
    } else {
      throw new Error('Dosya seçilemedi.');
    }
  } else {
    form.append('file', {
      uri: asset.uri,
      name,
      type: inferredMime,
    });
  }
  form.append('name', name);
  form.append('type', type);
  if (sizeBytes !== undefined) form.append('sizeBytes', String(sizeBytes));
  if (inferredMime) form.append('mimeType', String(inferredMime));

  const res = await apiRequest('/api/v1/documents/upload', {
    method: 'POST',
    token,
    body: form,
  });
  return res?.document;
}

export async function analyzeDocument({ token, documentId }) {
  const res = await apiRequest(`/api/v1/documents/${documentId}/analyze`, {
    method: 'POST',
    token,
    body: {},
  });
  return res;
}

export async function getDocumentAnalysis({ token, documentId }) {
  try {
    const res = await apiRequest(`/api/v1/documents/${documentId}/analysis`, { token });
    return res?.analysis || null;
  } catch (e) {
    if (e?.status === 404) return null;
    throw e;
  }
}

