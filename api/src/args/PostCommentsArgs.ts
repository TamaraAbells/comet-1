import { ArgsType, Field, ID } from 'type-graphql'
import { Sort } from '@/args/FeedArgs'

@ArgsType()
export class PostCommentsArgs {
  @Field(() => ID)
  postId: string

  @Field(() => Sort, { defaultValue: Sort.TOP })
  sort: Sort = Sort.TOP
}
