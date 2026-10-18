import type {
  ContactResponse,
  CreatePostInput,
  FeedQuery,
  FeedResponse,
  PostResponse,
  ReportLostInput,
  ResolvePostInput,
  UpdatePostInput,
} from '@huellitas/shared';
import { api } from './client';

function toQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  return entries.length
    ? `?${entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')}`
    : '';
}

export const postsApi = {
  feed: (query: FeedQuery) =>
    api<FeedResponse>(`/posts${toQuery(query as Record<string, string | undefined>)}`, {
      auth: false,
    }),
  get: (shortId: string) => api<PostResponse>(`/posts/${shortId}`, { auth: false }),
  mine: () => api<PostResponse[]>('/posts/mine'),
  create: (body: CreatePostInput) => api<PostResponse>('/posts', { method: 'POST', body }),
  reportLost: (petId: string, body: ReportLostInput) =>
    api<PostResponse>(`/pets/${petId}/report-lost`, { method: 'POST', body }),
  update: (id: string, body: UpdatePostInput) =>
    api<PostResponse>(`/posts/${id}`, { method: 'PATCH', body }),
  resolve: (id: string, body: ResolvePostInput) =>
    api<PostResponse>(`/posts/${id}/resolve`, { method: 'POST', body }),
  remove: (id: string) => api<void>(`/posts/${id}`, { method: 'DELETE' }),
  contact: (id: string) => api<ContactResponse>(`/posts/${id}/contact`, { auth: false }),
};
