import api from './api';

export const getFavorites = async () => {
  const response = await api.get('/users/me/favorites');
  return response.data;
};

export const addFavorite = async (productId: number) => {
  await api.post(`/users/me/favorites/${productId}`);
};

export const removeFavorite = async (productId: number) => {
  await api.delete(`/users/me/favorites/${productId}`);
};