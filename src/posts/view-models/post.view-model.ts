import { PostDocument } from '../schemas/post.schema';

export interface PostResponse {
  id: string;
  title: string;
  content: string;
  author: any;
  createdAt?: string;
  updatedAt?: string;
}

export class PostViewModel {
  static toViewModel(post: PostDocument | any): PostResponse {
    if (!post) return null;
    return {
      id: post._id?.toString() || post.id,
      title: post.title,
      content: post.content,
      author: post.author?._id
        ? {
            id: post.author._id.toString(),
            name: post.author.name,
            email: post.author.email,
          }
        : post.author?.toString() || post.author,
      createdAt: post.createdAt?.toISOString ? post.createdAt.toISOString() : post.createdAt,
      updatedAt: post.updatedAt?.toISOString ? post.updatedAt.toISOString() : post.updatedAt,
    };
  }

  static toViewModelList(posts: (PostDocument | any)[]): PostResponse[] {
    return posts.map((post) => this.toViewModel(post));
  }
}
