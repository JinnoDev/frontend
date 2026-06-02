import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      Cookies.remove('accessToken');
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  register: (data: { email: string; username: string; password: string }) => api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  resetPassword: (email: string) => api.post('/auth/reset-password', { email }),
};

export const usersApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (data: { name?: string; bio?: string; avatar?: string }) => api.patch('/users/me', data),
  getProfile: (userId: string) => api.get(`/users/${userId}`),
  follow: (userId: string) => api.post(`/users/${userId}/follow`),
  unfollow: (userId: string) => api.delete(`/users/${userId}/follow`),
  getFollowers: (userId: string, page = 1) => api.get(`/users/${userId}/followers?page=${page}&limit=50`),
  getFollowing: (userId: string, page = 1) => api.get(`/users/${userId}/following?page=${page}&limit=50`),
  getSaved: (page = 1) => api.get(`/users/me/saved?page=${page}`),
};

export const postsApi = {
  getFeed: (page = 1, limit = 10) => api.get(`/posts/feed?page=${page}&limit=${limit}`),
  getExplorePosts: (page = 1, limit = 30) => api.get(`/posts/explore?page=${page}&limit=${limit}`),
  getPostsByUser: (userId: string, page = 1, limit = 30) => api.get(`/users/${userId}/posts?page=${page}&limit=${limit}`),
  getMyPosts: (page = 1, limit = 30) => api.get(`/users/me/posts?page=${page}&limit=${limit}`),
  createPost: (formData: FormData) => api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updatePost: (postId: string, data: { caption?: string }) => api.patch(`/posts/${postId}`, data),
  deletePost: (postId: string) => api.delete(`/posts/${postId}`),
  likePost: (postId: string) => api.post(`/posts/${postId}/like`),
  unlikePost: (postId: string) => api.delete(`/posts/${postId}/like`),
  repost: (postId: string) => api.post(`/posts/${postId}/repost`),
  savePost: (postId: string) => api.post(`/posts/${postId}/save`),
  unsavePost: (postId: string) => api.delete(`/posts/${postId}/save`),
};

export const commentsApi = {
  getComments: (postId: string, page = 1) => api.get(`/posts/${postId}/comments?page=${page}&limit=50`),
  createComment: (postId: string, text: string) => api.post(`/posts/${postId}/comments`, { text }),
  deleteComment: (commentId: string) => api.delete(`/comments/${commentId}`),
};

export const chatsApi = {
  getChats: (page = 1) => api.get(`/chats?page=${page}`),
  createChat: (participants: string[]) => api.post('/chats', { participants }),
  getMessages: (chatId: string, page = 1) => api.get(`/chats/${chatId}/messages?page=${page}&limit=50`),
  sendMessage: (chatId: string, content: string, type = 'text') => api.post(`/chats/${chatId}/messages`, { content, type }),
  markAsRead: (chatId: string) => api.patch(`/chats/${chatId}/read`),
};

export const notificationsApi = {
  getNotifications: () => api.get('/notifications'),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};

export const searchApi = {
  search: (q: string, page = 1) => api.get(`/search?q=${encodeURIComponent(q)}&page=${page}`),
};

export const uploadAvatar = (file: File) => {
  const fd = new FormData();
  fd.append('avatar', file);
  return api.post('/users/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};
