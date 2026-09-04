// API Configuration for NGK2 Admin Portal

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const BASE_URL = API_BASE;

// Auth & Users
export const registerApi = `${BASE_URL}/auth/register`;
export const loginApi = `${BASE_URL}/auth/login`;
export const getUsersApi = `${BASE_URL}/users/users`;
export const getUserDetailApi = `${BASE_URL}/users`;
export const updateUserApi = `${BASE_URL}/users/updateUser`;
export const deleteUserApi = `${BASE_URL}/users/deleteUser`;
export const readNotificationsApi = `${BASE_URL}/users/readNotifications`;

// Enquiries & Discussion
export const getEnquiriesApi = `${BASE_URL}/enquiries`;
export const updateEnquiryStatusApi = `${BASE_URL}/enquiries/updateStatus`;
export const addEnquiryMessageApi = `${BASE_URL}/enquiries/addMessage`;

// Dealers Directory
export const dealersApi = `${BASE_URL}/dealers`;

// TecDoc Pegasus 3.0 Backend Proxy
export const serviceJsonApi = `${BASE_URL}/tecdoc/services/TecdocToCatDLB.jsonEndpoint`;
export const manufacturersApi = `${BASE_URL}/tecdoc/manufacturers`;
export const modelSeriesApi = `${BASE_URL}/tecdoc/series`;
export const vehiclesApi = `${BASE_URL}/tecdoc/vehicles`;
export const articlesByVehicleApi = `${BASE_URL}/tecdoc/articles/by-vehicle`;
export const articlesByPartApi = `${BASE_URL}/tecdoc/articles/by-part`;
export const brandsApi = `${BASE_URL}/tecdoc/brands`;

// File Uploads
export const uploadApi = `${BASE_URL}/upload`;
