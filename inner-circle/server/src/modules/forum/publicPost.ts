export interface ForumPostRecord {
  id: string
  authorAlias: string
  body: string
  room: string
  createdAt: Date
  authorId: string
  authorEmail?: string
  realName?: string
  studentId?: string
}

export interface PublicForumPost {
  id: string
  authorAlias: string
  body: string
  room: string
  createdAt: Date
}

export const toPublicForumPost = (post: ForumPostRecord): PublicForumPost => ({
  id: post.id,
  authorAlias: post.authorAlias,
  body: post.body,
  room: post.room,
  createdAt: post.createdAt,
})
