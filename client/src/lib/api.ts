import type { CareGuide, GenerateGuidePayload } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:3001' : '');

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message ?? 'Request failed.');
  }

  return payload.data ?? payload;
}

export async function generateGuide(payload: GenerateGuidePayload): Promise<CareGuide> {
  const result = await fetchJson<CareGuide>('/api/guides/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return result;
}

export async function getGuides(): Promise<CareGuide[]> {
  return fetchJson<CareGuide[]>('/api/guides');
}

export async function deleteGuide(id: string): Promise<void> {
  await fetchJson(`/api/guides/${id}`, {
    method: 'DELETE',
  });
}

export async function updateChecklist(id: string, itemId: string, completed: boolean): Promise<CareGuide> {
  const result = await fetchJson<CareGuide>(`/api/guides/${id}/checklist/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ completed }),
  });
  return result;
}
