import Config from "react-native-config"

const apiURL = Config.API_URL || "https://ngkapi.ckrtechnologies.in"
const BASE_URL = `${apiURL}/api`

// Auth & Users
export const registerApi = `${BASE_URL}/auth/register`
export const loginApi = `${BASE_URL}/auth/login`
export const getUserApi = `${BASE_URL}/users/user`
export const getUsersApi = `${BASE_URL}/users/users`
export const updatePasswordApi = `${BASE_URL}/auth/updatePassword`
export const sendOtpApi = `${BASE_URL}/auth/sendOtp`
export const verifyOtpApi = `${BASE_URL}/auth/verifyOtp`
export const readNotificationsApi = `${BASE_URL}/users/readNotifications`

// Enquiries
export const addEnquiryApi = `${BASE_URL}/enquiries/add`
export const getEnquiryApi = `${BASE_URL}/enquiries/getEnquiry`
export const updateEnquiryStatusApi = `${BASE_URL}/enquiries/updateStatus`
export const addEnquiryMessageApi = `${BASE_URL}/enquiries/addMessage`

// Garage & Watchlist
export const addVehicleToGarageApi = `${BASE_URL}/garage/addVehicleToGarage`
export const addSearchHistoryApi = `${BASE_URL}/garage/addSearchHistory`
export const addVehicleToWatchlistApi = `${BASE_URL}/garage/addVehicleToWatchlist`
export const removeFromWatchlistApi = `${BASE_URL}/garage/removeFromWatchlist`

// Dealers Directory
export const dealersApi = `${BASE_URL}/dealers`

// File Uploads
export const uploadApi = `${BASE_URL}/upload`

export const popularBrandsApi = `${BASE_URL}/tecdoc/popular-brands`
export const serviceJsonApi = `${BASE_URL}/tecdoc/services/TecdocToCatDLB.jsonEndpoint`
export const manufacturersApi = `${BASE_URL}/tecdoc/manufacturers`
export const modelSeriesApi = `${BASE_URL}/tecdoc/series`
export const vehiclesApi = `${BASE_URL}/tecdoc/vehicles`
export const articlesByVehicleApi = `${BASE_URL}/tecdoc/articles/by-vehicle`
export const articlesByPartApi = `${BASE_URL}/tecdoc/articles/by-part`
export const articles360FramesApi = `${BASE_URL}/tecdoc/articles/360-frames`
export const brandsApi = `${BASE_URL}/tecdoc/brands`