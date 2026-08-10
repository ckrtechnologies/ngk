import Config from "react-native-config"

const apiURL = "http://192.168.1.46:3001"
// const liveUrl = "https://ngkapi.argosmob.online"
const SERVICE_URL = "https://webservice.tecalliance.services/pegasus-3-0"
// const BASE_URL = `${liveUrl}/api`
const BASE_URL = `${apiURL}/api`

export const registerApi = `${BASE_URL}/user/register`
export const loginApi = `${BASE_URL}/user/login`
export const getUserApi = `${BASE_URL}/user/user`
export const addEnquiryApi = `${BASE_URL}/enquiry/add`
export const getEnquiryApi = `${BASE_URL}/enquiry/getEnquiry`
export const updateEnquiryStatusApi = `${BASE_URL}/enquiry/updateStatus`
export const addEnquiryMessageApi = `${BASE_URL}/enquiry/addMessage`
export const addVehicleToGarageApi = `${BASE_URL}/user/addVehicleToGarage`
export const serviceJsonApi = `${SERVICE_URL}/services/TecdocToCatDLB.jsonEndpoint`
export const addSearchHistoryApi = `${BASE_URL}/user/addSearchHistory`
export const getUsersApi = `${BASE_URL}/user/users`
export const addVehicleToWatchlistApi = `${BASE_URL}/user/addVehicleToWatchlist`
export const removeFromWatchlistApi = `${BASE_URL}/user/removeFromWatchlist`
export const updatePasswordApi = `${BASE_URL}/user/updatePassword`
export const sendOtpApi = `${BASE_URL}/user/sendOtp`
export const verifyOtpApi = `${BASE_URL}/user/verifyOtp`
export const readNotificationsApi = `${BASE_URL}/user/readNotifications`;