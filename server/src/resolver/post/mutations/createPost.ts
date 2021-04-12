import { ArgsType, Field, ID, Publisher } from 'type-graphql'
import { ArrayMaxSize, IsOptional, Length } from 'class-validator'
import { FileUpload, GraphQLUpload } from 'graphql-upload'
import { Context } from '@/types'
import { Post, Server } from '@/entity'
import { PostServerPayload } from '@/resolver/post/subscriptions'
import { handleText, scrapeMetadata, uploadImageSingle } from '@/util'

@ArgsType()
export class CreatePostArgs {
  @Field()
  @Length(1, 300, { message: 'Title must be no longer than 300 characters.' })
  title: string

  @Field({ nullable: true })
  @IsOptional()
  @Length(1, 5000, { message: 'URL must be no longer than 5000 characters.' })
  linkUrl?: string

  @Field({ nullable: true })
  @IsOptional()
  @Length(1, 100000, {
    message: 'Text must be between 1 and 100000 characters'
  })
  text?: string

  @Field(() => ID)
  serverId: string

  @Field(() => [GraphQLUpload], { nullable: true })
  @IsOptional()
  @ArrayMaxSize(10, { message: 'Cannot upload more than 10 images' })
  images?: FileUpload[]
}

export async function createPost(
  { em, user }: Context,
  { title, linkUrl, text, serverId, images }: CreatePostArgs,
  notifyPostCreated: Publisher<PostServerPayload>
): Promise<Post> {
  if (text) {
    text = handleText(text)
    if (!text) text = null
  }

  const server = await em.findOne(Server, serverId)

  const imageUrls = []

  if (images && images.length > 0) {
    for (const image of images) {
      const imageUrl = await uploadImageSingle(image)
      imageUrls.push(imageUrl)
    }
  }

  const post = em.create(Post, {
    title,
    linkUrl,
    author: user,
    server,
    linkMetadata: linkUrl ? await scrapeMetadata(linkUrl) : null,
    imageUrls,
    text: text
  })

  await em.persistAndFlush(post)

  await this.votePost({ user, em }, post.id)
  post.isVoted = true
  post.voteCount = 1
  await notifyPostCreated({ postId: post.id, serverId })
  return post
}
