import Post from '@/components/post/Post'
import React from 'react'
import { Virtuoso } from 'react-virtuoso'
import { useQuery } from 'urql'
import { POSTS_QUERY, usePostsQuery } from '@/graphql/queries'

export default function Posts({
  variables,
  planet = false,
  embed = false,
  thumbnail = false,
  link = false,
  draggable = false,
  expandable = false
}) {
  const { data } = usePostsQuery(variables)
  const posts = data?.posts?.posts || []

  return (
    <Virtuoso
      overscan={500}
      data={posts}
      itemContent={(index, post) => (
        <Post
          postData={post}
          {...{ planet, embed, thumbnail, link, draggable, expandable }}
        />
      )}
    />
  )
}
