import api from './api';

export const register = (data) => api.post('/Auth/register', data);
export const verifyOtp = (data) => api.post('/Auth/verify-otp', data);
export const resendOtp = (data) => api.post('/Auth/resend-otp', data);
export const login = (data) => api.post('/Auth/login', data);
export const forgotPassword = (data) => api.post('/Auth/forgot-password', data);
export const resetPassword = (data) => api.post('/Auth/reset-password', data);