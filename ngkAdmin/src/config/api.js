const apiURL = "http://localhost:3000";
const SERVICE_URL = "https://webservice.tecalliance.services/pegasus-3-0";

const BASE_URL = `${apiURL}/api`;

export const registerApi = `${BASE_URL}/user/register`;
export const loginApi = `${BASE_URL}/user/login`;
export const getUsersApi = `${BASE_URL}/user/users`;
export const updateUserApi = `${BASE_URL}/user/updateUser`;
export const deleteUserApi = `${BASE_URL}/user/deleteUser`;

export const getEnquiriesApi = `${BASE_URL}/enquiry/getEnquiry`;
export const updateEnquiryStatusApi = `${BASE_URL}/enquiry/updateStatus`;
export const addEnquiryMessageApi = `${BASE_URL}/enquiry/addMessage`;

export const serviceJsonApi = `${SERVICE_URL}/services/TecdocToCatDLB.jsonEndpoint`;
