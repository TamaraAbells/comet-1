import { useMemo } from 'react'
import Post from '@/components/post/Post'
import PostUsersSidebar from '@/pages/post/PostUsersSidebar'
import { createCommentTree, getParticipants } from '@/utils/commentUtils'
import Comment from '@/components/comment/Comment'
import CreateCommentCard from '@/components/comment/CreateCommentCard'
import { useHasServerPermissions } from '@/hooks/useHasServerPermissions'
import { ServerPermission } from '@/graphql/hooks'
import PostHeader from '@/pages/post/PostHeader'
import Page from '@/components/ui/page/Page'
import { useCommentsQuery, usePostQuery } from '@/graphql/hooks'
import { Helmet } from 'react-helmet-async'

export default function PostPage({ server, postId }) {
  const [canCreateComment] = useHasServerPermissions({
    server,
    permissions: [ServerPermission.CreateComment]
  })

  const { data } = usePostQuery({
    variables: {
      id: postId
    }
  })
  const post = data?.post

  const { data: commentsData } = useCommentsQuery({
    variables: { postId }
  })
  const comments = useMemo(
    () => createCommentTree(commentsData?.comments ?? []),
    [commentsData?.comments]
  )
  const users = useMemo(() => getParticipants(comments), [comments])

  return (
    <Page
      header={<PostHeader post={post} />}
      rightSidebar={<PostUsersSidebar post={post} users={users} />}
    >
      <Helmet>
        <title>{`${post?.title} – ${server?.displayName}`}</title>
      </Helmet>
      <div className="max-h-full h-full scrollbar-custom dark:bg-gray-750">
        <div className="pt-4 px-4">
          {!!post && <Post post={post} isPostPage />}
        </div>

        {canCreateComment && (
          <div className="pt-4 px-4">
            <CreateCommentCard postId={postId} />
          </div>
        )}

        <div className="space-y-2 px-4 pt-4 pb-96">
          {comments.map((comment, index) => (
            <Comment
              key={comment.id}
              comment={comment}
              post={post}
              isLast={index < comments.length - 1}
            />
          ))}
        </div>
      </div>
    </Page>
  )
}
