import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiFunction } from "../apis/apiFunction"
import { getEnquiryApi, getUserApi, getUsersApi, serviceJsonApi, dealersApi, updateUserApi, deleteUserApi } from "../apis/api";

export const getArticlesRedux = createAsyncThunk("getArticles/getData", async (data) => {
    try {
        const response = await apiFunction(serviceJsonApi, [], data, "POST", false)
        return response
    } catch (error) {
        console.log("getArticles error:", error)
        return null
    }
})

export const getVehiclesRedux = createAsyncThunk("getVehicles/getData", async (data) => {
    try {
        const response = await apiFunction(serviceJsonApi, [], data, "POST", false)
        return response
    } catch (error) {
        console.log("getVehicles error:", error)
        return null
    }
})

export const getDealersRedux = createAsyncThunk("getDealers/getData", async (data = {}) => {
    try {
        const response = await apiFunction(dealersApi, [], data, "GET", false)
        if (response?.dealers) {
            return { data: { array: response.dealers } }
        }
        return response
    } catch (error) {
        console.log("getDealers error:", error)
        return null
    }
})

export const getMyselfRedux = createAsyncThunk("getMyself/getData", async (userId) => {
    try {
        if (!userId) return null
        const response = await apiFunction(getUserApi, [userId], {}, "GET", true)
        if (!response?.user || response?.user?.length === 0) {
            return null
        }
        return response?.user[0]
    } catch (error) {
        console.log("getMyself error:", error)
        return null
    }
})

export const getEnquiryRedux = createAsyncThunk("getEnquiry/getData", async (userId) => {
    try {
        if (!userId) return null
        const response = await apiFunction(getEnquiryApi, [userId], {}, "GET", true)
        if (!response?.enquiry || response?.enquiry?.length === 0) {
            return []
        }
        return response?.enquiry
    } catch (error) {
        console.log("getEnquiry error:", error)
        return []
    }
})

export const getUsersRedux = createAsyncThunk("getUsers/getData", async () => {
    try {
        const response = await apiFunction(getUsersApi, [], {}, "GET", true)
        if (!response?.users || response?.users?.length === 0) {
            return []
        }
        return response?.users
    } catch (error) {
        console.log("getUsers error:", error)
        return []
    }
})

export const updateUserRedux = createAsyncThunk("updateUser/getData", async ({ userId, userData }) => {
    try {
        if (!userId) return null
        const response = await apiFunction(updateUserApi, [userId], userData, "PUT", true)
        if (!response?.user || response?.user?.length === 0) {
            return null
        }
        return response?.user[0]
    } catch (error) {
        console.log("updateUser error:", error)
        return null
    }
})

export const deleteUserRedux = createAsyncThunk("deleteUser/getData", async (userId) => {
    try {
        if (!userId) return null
        const response = await apiFunction(deleteUserApi, [userId], {}, "DELETE", true)
        return response
    } catch (error) {
        console.log("deleteUser error:", error)
        return null
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
        },
        setMyself: (state, action) => {
            state.myself = action.payload
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
            .addCase(updateUserRedux.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(updateUserRedux.fulfilled, (state, action) => {
                state.loading = false
                if (action.payload) {
                    state.myself = {
                        ...state.myself,
                        ...action.payload,
                    }
                }
            })
            .addCase(updateUserRedux.rejected, (state) => {
                state.loading = false
                state.error = "Failed to update user"
            })
            .addCase(deleteUserRedux.fulfilled, (state) => {
                state.myself = null
            })
    }
})

export const getDataReducer = getDataSlice.reducer
export const { setPart, setSelectedVehicle, setMyself } = getDataSlice.actions