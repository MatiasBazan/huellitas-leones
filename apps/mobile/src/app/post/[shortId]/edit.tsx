import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import type { UpdatePostInput } from '@huellitas/shared';
import { Screen } from '@/components/ui';
import { usePost, useUpdatePost } from '@/features/posts/hooks';
import { PostForm } from '@/features/posts/post-form';
import { colors } from '@/theme';

export default function EditPostScreen() {
  const { shortId } = useLocalSearchParams<{ shortId: string }>();
  const post = usePost(shortId);
  const update = useUpdatePost(post.data?.id ?? '');

  return (
    <Screen>
      {post.data ? (
        <PostForm
          type={post.data.type}
          initial={post.data}
          submitLabel="Guardar cambios"
          submitting={update.isPending}
          error={update.error}
          onSubmit={(body) =>
            update.mutate(body as UpdatePostInput, { onSuccess: () => router.back() })
          }
        />
      ) : (
        <ActivityIndicator color={colors.brandStrong} />
      )}
    </Screen>
  );
}
