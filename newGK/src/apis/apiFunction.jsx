import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { navigateTo } from "../functions/navigationRefFunc"

export const apiFunction = async (api, params = [], data = {}, method, withAuth) => {
    let headers = {}
    let response

    if (withAuth) {
        const apiKey = await AsyncStorage.getItem("apiKey")
        headers = {
            'X-Api-Key': apiKey
        }
    }

    const url = params.length > 0 ? `${api}/${params.join('/')}` : api
    
    switch (method) {
        case "GET":
            response = await axios.get(url, { headers });
            break
        case "POST":
            response = await axios.post(url, data, { headers });
            break
        case "PUT":
            response = await axios.put(url, data, { headers });
            break
        case "DELETE":
            response = await axios.delete(url, { headers });
            break
        default:
            return null
    }


    if (response) {
        if (response.data.status == 401) {
            await AsyncStorage.removeItem("apiKey")
            let role = await AsyncStorage.getItem("role")

            navigateTo('Login', { role })
            return
        }
        return response.data
    }
    else {
        return null
    }
}