import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiFunction } from "../apis/apiFunction"
import { getEnquiryApi, getUserApi, getUsersApi, serviceJsonApi } from "../apis/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const getArticlesRedux = createAsyncThunk("getArticles/getData", async (data) => {
    try {

        const response = await apiFunction(serviceJsonApi, [], data, "POST", true)
        return response
        return response
    } catch (error) {
        console.log(error)
    }
})

export const getVehiclesRedux = createAsyncThunk("getVehicles/getData", async (data) => {
    try {
        console.log(data, "datadatadatadatadatadata")
        const response = await apiFunction(serviceJsonApi, [], data, "POST", true)

        return response
    } catch (error) {
        console.log(error)
    }
})

export const getDealersRedux = createAsyncThunk("getDealers/getData", async (data) => {
    try {
        const response = await apiFunction(serviceJsonApi, [], data, "POST", true)

        return response
    } catch (error) {
        console.log(error)
    }
})

export const getMyselfRedux = createAsyncThunk("getMyself/getData", async (userId) => {
    try {
        console.log(userId, "userId")
        const response = await apiFunction(getUserApi, [userId], {}, "GET", true)
        if (response?.user?.length === 0) {
            return null
        }
        return response?.user[0]
    } catch (error) {
        console.log(error)
    }
})

export const getEnquiryRedux = createAsyncThunk("getEnquiry/getData", async (userId) => {
    try {
        const response = await apiFunction(getEnquiryApi, [userId], {}, "GET", true)
        console.log(response, "getEnquiryApi")
        if (response?.enquiry?.length === 0) {
            return null
        }
        return response?.enquiry
    } catch (error) {
        console.log(error)
    }
})

export const getUsersRedux = createAsyncThunk("getUsers/getData", async () => {
    try {
        const response = await apiFunction(getUsersApi, [], {}, "GET", true)
        console.log(response, "getUsersApi")
        if (response?.users?.length === 0) {
            return null
        }
        return response?.users
    } catch (error) {
        console.log(error)
    }
})



const initialState = {
    articles: null,
    loading: false,
    error: null,
    vehicles: null,
    dealers: null,
    myself: null,
    enquiry: null,
    users: null,
    part: null,
    selectedVehicle: null,
}

const getDataSlice = createSlice({
    name: "getData",
    initialState,
    reducers: {
        setPart: (state, action) => {
            state.part = action.payload
        },
        setSelectedVehicle: (state, action) => {
            state.selectedVehicle = action.payload
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getArticlesRedux.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(getArticlesRedux.fulfilled, (state, action) => {
                state.articles = action.payload
                state.loading = false
                state.error = null
            })
            .addCase(getArticlesRedux.rejected, (state) => {
                state.loading = false
                state.articles = null
                state.error = "Failed to fetch articles"
            })
            .addCase(getVehiclesRedux.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(getVehiclesRedux.fulfilled, (state, action) => {
                state.vehicles = action.payload
                state.loading = false
                state.error = null
            })
            .addCase(getVehiclesRedux.rejected, (state) => {
                state.loading = false
                state.vehicles = null
                state.error = "Failed to fetch vehicles"
            })
            .addCase(getDealersRedux.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(getDealersRedux.fulfilled, (state, action) => {
                state.dealers = action.payload
                state.loading = false
                state.error = null
            })
            .addCase(getDealersRedux.rejected, (state) => {
                state.loading = false
                state.dealers = null
                state.error = "Failed to fetch dealers"
            })
            .addCase(getMyselfRedux.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(getMyselfRedux.fulfilled, (state, action) => {
                state.myself = action.payload
                state.loading = false
                state.error = null
            })
            .addCase(getMyselfRedux.rejected, (state) => {
                state.loading = false
                state.myself = null
                state.error = "Failed to fetch myself"
            })
            .addCase(getEnquiryRedux.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(getEnquiryRedux.fulfilled, (state, action) => {
                state.enquiry = action.payload
                state.loading = false
                state.error = null
            })
            .addCase(getEnquiryRedux.rejected, (state) => {
                state.loading = false
                state.enquiry = null
                state.error = "Failed to fetch enquiry"
            })
            .addCase(getUsersRedux.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(getUsersRedux.fulfilled, (state, action) => {
                state.users = action.payload
                state.loading = false
                state.error = null
            })
            .addCase(getUsersRedux.rejected, (state) => {
                state.loading = false
                state.users = null
                state.error = "Failed to fetch users"
            })
    }
})

export const getDataReducer = getDataSlice.reducer
export const {setPart, setSelectedVehicle} = getDataSlice.actions