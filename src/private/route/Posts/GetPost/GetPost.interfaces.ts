export interface GetPostPath {
  postId: string;
}

export interface GetPostQuery {
  mini?: boolean;
}

export interface GetPostResponse200 {
  content: string;
  author: string;
}
