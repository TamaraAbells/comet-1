import {
  Arg,
  Args,
  Authorized,
  Ctx,
  ID,
  Mutation,
  Resolver
} from 'type-graphql'
import { Context } from '@/types'
import { User, Folder, Post, Comment, ServerUserJoin, Message } from '@/entity'
import {
  uploadImage,
  handleUnderscore,
  createAccessToken,
  tagGenerator
} from '@/util'
import isEmail from 'validator/lib/isEmail'
import * as argon2 from 'argon2'
import {
  LoginResponse,
  UpdateUserArgs,
  ChangePasswordArgs
} from '@/resolver/user'
import { CustomError } from '@/types/CustomError'

@Resolver()
export class UserMutations {
  @Mutation(() => LoginResponse, { description: 'Create an account' })
  async createAccount(
    @Ctx() { em }: Context,
    @Arg('name') name: string,
    @Arg('password') password: string,
    @Arg('email') email: string
  ): Promise<LoginResponse> {
    email = email.toLowerCase()
    if (!isEmail(email)) throw new Error('error.login.invalidEmail')

    name = name
      .replace(/ +(?= )/g, '') // remove repeated spaces
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // remove zero-width characters
      .trim() // remove leading and trailing whitespace
    if (name.length < 2 || name.length > 32)
      throw new Error('error.login.nameLength')

    const bannedSubstrings = ['@', '#', ':', '```']

    for (const s of bannedSubstrings) {
      if (name.includes(s)) throw new CustomError('user.login.illegalName', s)
    }

    const foundUser = await em.findOne(User, {
      email: handleUnderscore(email)
    })
    if (foundUser) throw new Error('error.login.emailInUse')

    const passwordHash = await argon2.hash(password)

    let tag = tagGenerator()

    while (
      await em.findOne(User, {
        $and: [{ name: { $ilike: handleUnderscore(name) } }, { tag }]
      })
    ) {
      tag = tagGenerator()
    }

    const user = em.create(User, {
      name,
      tag,
      passwordHash,
      lastLogin: new Date(),
      email
    })

    const favoritesFolder = em.create(Folder, {
      name: 'Favorites',
      owner: user
    })

    const readLaterFolder = em.create(Folder, {
      name: 'Read Later',
      owner: user
    })
    await em.persistAndFlush([user, favoritesFolder, readLaterFolder])
    await em.persistAndFlush(user)

    const accessToken = createAccessToken(user)
    return {
      accessToken,
      user
    } as LoginResponse
  }

  @Mutation(() => LoginResponse, {
    description: 'Log in with email and password'
  })
  async login(
    @Ctx() { em }: Context,
    @Arg('email') email: string,
    @Arg('password') password: string
  ): Promise<LoginResponse> {
    email = email.toLowerCase()
    if (!isEmail(email)) throw new Error('error.login.invalidEmail')
    const user = await em.findOne(User, { email })
    if (!user) throw new Error('error.login.invalid')
    const match = await argon2.verify(user.passwordHash, password)
    if (!match) throw new Error('error.login.invalid')
    if (user.isBanned)
      throw new CustomError(
        'error.login.banned',
        user.banReason ? `: ${user.banReason}` : ''
      )
    user.lastLogin = new Date()
    await em.persistAndFlush(user)
    return {
      accessToken: createAccessToken(user),
      user
    } as LoginResponse
  }

  @Authorized()
  @Mutation(() => LoginResponse, { description: 'Change password' })
  async changePassword(
    @Ctx() { em, user }: Context,
    @Args() { password, currentPassword }: ChangePasswordArgs
  ): Promise<LoginResponse> {
    const match = await argon2.verify(user.passwordHash, currentPassword)
    if (!match) throw new Error('error.login.wrongPassword')
    user.passwordHash = await argon2.hash(password)
    await em.persistAndFlush(user)
    return {
      accessToken: createAccessToken(user),
      user
    } as LoginResponse
  }

  @Authorized()
  @Mutation(() => User, { description: 'Update user properties' })
  async updateUser(
    @Args()
    { name, email, avatarFile }: UpdateUserArgs,
    @Ctx() { user, em }: Context
  ): Promise<User> {
    const avatarUrl = avatarFile
      ? await uploadImage(avatarFile, {
          width: 256,
          height: 256
        })
      : user.avatarUrl
    em.assign(user, {
      name: name ? name : user.name,
      email: email ? email : user.email,
      avatarUrl
    })
    await em.persistAndFlush(user)
    return user
  }

  @Authorized('ADMIN')
  @Mutation(() => Boolean, {
    description:
      'Ban user globally and optionally purge all posts, comments, and messages (requires admin)'
  })
  async banUserGlobal(
    @Ctx() { em }: Context,
    @Arg('userId', () => ID, { description: 'ID of user to ban' })
    userId: string,
    @Arg('purge', {
      defaultValue: false,
      description: "Purge (remove all) user's posts, comments, and messages"
    })
    purge: boolean,
    @Arg('reason', { nullable: true, description: 'Reason for ban' })
    reason?: string
  ): Promise<boolean> {
    const user = await em.findOneOrFail(User, userId)
    await em
      .createQueryBuilder(User)
      .update({
        isBanned: true,
        banReason: reason
      })
      .where({ id: userId })
      .execute()
    await em.nativeDelete(ServerUserJoin, { user })
    if (purge) {
      await em
        .createQueryBuilder(Post)
        .update({
          isRemoved: true,
          removedReason: reason
        })
        .where({ author: user })
        .execute()

      await em
        .createQueryBuilder(Comment)
        .update({
          isRemoved: true,
          removedReason: reason
        })
        .where({ author: user })
        .execute()

      await em
        .createQueryBuilder(Message)
        .update({
          isRemoved: true
        })
        .where({ author: user })
        .execute()
    }
    return true
  }

  @Authorized('ADMIN')
  @Mutation(() => Boolean, {
    description: 'Unban a user globally (requires admin)'
  })
  async unbanUserGlobal(
    @Arg('userId', () => ID, { description: 'ID of user to unban' })
    userId: string,
    @Ctx() { em }: Context
  ): Promise<boolean> {
    await em
      .createQueryBuilder(User)
      .update({
        isBanned: false,
        banReason: null
      })
      .where({ id: userId })
      .execute()
    return true
  }
}
