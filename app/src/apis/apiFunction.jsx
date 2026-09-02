import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { navigateTo } from "../functions/navigationRefFunc"

export const apiFunction = async (api, params = [], data = {}, method = "GET", withAuth = false) => {
    let headers = {
        'Content-Type': 'application/json',
    }
    let response

    try {
        const token = await AsyncStorage.getItem("token")
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        const url = params.length > 0 ? `${api}/${params.join('/')}` : api

        switch (method.toUpperCase()) {
            case "GET":
                response = await axios.get(url, { headers, timeout: 20000 });
                break
            case "POST":
                response = await axios.post(url, data, { headers, timeout: 25000 });
                break
            case "PUT":
                response = await axios.put(url, data, { headers, timeout: 25000 });
                break
            case "DELETE":
                response = await axios.delete(url, { headers, timeout: 20000 });
                break
            default:
                return null
        }
    } catch (error) {
        console.error("API call error:", error?.response?.data || error.message);
        if (error.response?.status === 401 && withAuth) {
            await AsyncStorage.removeItem("token")
            let role = await AsyncStorage.getItem("role")
            navigateTo('Login', { role })
        }
        return error.response?.data || { success: false, message: error.message || "Network Error" };
    }

    if (response) {
        if (response.data?.status === 401 && withAuth) {
            await AsyncStorage.removeItem("token")
            let role = await AsyncStorage.getItem("role")
            navigateTo('Login', { role })
            return response.data
        }
        return response.data
    } else {
        return null
    }
}