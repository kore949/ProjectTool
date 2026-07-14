import api from './api';

export const getProjects = () => api.get('/Projects');
export const getTasks = (projectId) => api.get('/Tasks', { params: projectId ? { projectId } : {} });
export const getUsers = () => api.get('/Users');
export const createProject = (data) => api.post('/Projects', data);
export const updateProject = (id, data) => api.put(`/Projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/Projects/${id}`);
export const createTask = (data) => api.post('/Tasks', data);
export const updateTask = (id, data) => api.put(`/Tasks/${id}`, data);
export const deleteTask = (id) => api.delete(`/Tasks/${id}`);
export const getMyProfile = () => api.get('/Users/me');
export const updateMyProfile = (data) => api.put('/Users/me', data);
export const changeMyPassword = (data) => api.post('/Users/me/change-password', data);
export const createUser = (data) => api.post('/Users', data);
export const updateUserAdmin = (id, data) => api.put(`/Users/${id}`, data);
export const deleteUserAdmin = (id) => api.delete(`/Users/${id}`);
export const bulkSetUserStatus = (userIds, isActive) => api.patch('/Users/bulk-status', { userIds, isActive });