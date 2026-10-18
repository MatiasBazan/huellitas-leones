import { router } from 'expo-router';
import type { CreatePostInput } from '@huellitas/shared';
import { Screen } from '@/components/ui';
import { useCreatePost } from '@/features/posts/hooks';
import { PostForm } from '@/features/posts/post-form';

export default function NewFoundScreen() {
  const create = useCreatePost();
  return (
    <Screen>
      <PostForm
        type="ENCONTRADA"
        submitLabel="Publicar"
        submitting={create.isPending}
        error={create.error}
        onSubmit={(body) =>
          create.mutate(body as CreatePostInput, {
            onSuccess: (post) =>
              router.replace({ pathname: '/post/[shortId]', params: { shortId: post.shortId } }),
          })
        }
      />
    </Screen>
  );
}
