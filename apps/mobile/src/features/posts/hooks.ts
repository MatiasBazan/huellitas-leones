import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import type {
  CreatePostInput,
  FeedQuery,
  PostResponse,
  ReportLostInput,
  ResolvePostInput,
  UpdatePostInput,
} from '@huellitas/shared';
import { postsApi } from '@/api/posts';
import { petKeys } from '@/features/pets/hooks';

export type FeedFilters = Omit<FeedQuery, 'cursor' | 'limit'>;

export const postKeys = {
  feed: (filters: FeedFilters) => ['posts', 'feed', filters] as const,
  detail: (shortId: string) => ['posts', 'detail', shortId] as const,
  mine: ['posts', 'mine'] as const,
};

/** Tras cualquier cambio: refresca feed, mis publicaciones y mascotas (estado PERDIDA) */
function afterChange(queryClient: QueryClient, post?: PostResponse) {
  if (post) queryClient.setQueryData(postKeys.detail(post.shortId), post);
  void queryClient.invalidateQueries({ queryKey: ['posts'] });
  void queryClient.invalidateQueries({ queryKey: ['pets'] });
}

export function useFeed(filters: FeedFilters) {
  return useInfiniteQuery({
    queryKey: postKeys.feed(filters),
    queryFn: ({ pageParam }) => postsApi.feed({ ...filters, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

export function usePost(shortId: string) {
  return useQuery({ queryKey: postKeys.detail(shortId), queryFn: () => postsApi.get(shortId) });
}

export function useMyPosts() {
  return useQuery({ queryKey: postKeys.mine, queryFn: postsApi.mine });
}

export function useReportLost(petId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReportLostInput) => postsApi.reportLost(petId, input),
    onSuccess: (post) => {
      afterChange(queryClient, post);
      queryClient.removeQueries({ queryKey: petKeys.detail(petId) });
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePostInput) => postsApi.create(input),
    onSuccess: (post) => afterChange(queryClient, post),
  });
}

export function useUpdatePost(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePostInput) => postsApi.update(id, input),
    onSuccess: (post) => afterChange(queryClient, post),
  });
}

export function useResolvePost(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ResolvePostInput) => postsApi.resolve(id, input),
    onSuccess: (post) => afterChange(queryClient, post),
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => postsApi.remove(id),
    onSuccess: () => afterChange(queryClient),
  });
}

export function useContact() {
  return useMutation({ mutationFn: (id: string) => postsApi.contact(id) });
}
