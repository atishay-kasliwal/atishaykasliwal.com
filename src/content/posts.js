import {
  formatPostDate,
  getAllPostTags,
  getFeaturedPosts,
  getPostBySlug,
  getPosts,
  getRelatedPosts,
} from '../lib/content/publicContent.js';

export const BLOG_POSTS = getPosts();
export const FEATURED_POSTS = getFeaturedPosts();
export const getPost = getPostBySlug;
export const ALL_TAGS = getAllPostTags();
export const relatedPosts = getRelatedPosts;
