import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginApi, getUsersApi, getEnquiriesApi, serviceJsonApi, updateUserApi, deleteUserApi, registerApi, updateEnquiryStatusApi, addEnquiryMessageApi, readNotificationsApi } from '../config/api';
import axios from 'axios';

// Async Thunks
export const loginAdmin = createAsyncThunk('admin/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await fetch(loginApi, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...credentials, role: 'admin' }),
    });
    const data = await response.json();

    console.log(response)
    if (!response.ok || !data.success) {
      return rejectWithValue(data.message || 'Login failed');
    }

    if (data?.success) {


      const res = await axios.get("https://api.ipify.org?format=json")
      const ip = res.data.ip;

      console.log("ip", ip)

      const addDynamicAddress = {
        "provider": 25690,
        "address": ip,
        "validityHours": 2

      }

      const whiteListingIp = await axios.post(serviceJsonApi, { addDynamicAddress }, {
        headers: {
          'Content-Type': 'application/json',
        }
      })

      console.log("whiteListingIp", whiteListingIp)

      if (whiteListingIp?.status !== 200) {
        return rejectWithValue(whiteListingIp?.message || 'Your IP Address is not whitelisted. Please contact your distributor to whitelist your IP address.');
      } else {
        const addDynamicAPIKey = {
          "provider": 25690,
          "validityHours": 2
        }
        const validApi = await axios.post(serviceJsonApi, { addDynamicAPIKey }, {
          headers: {
            'Content-Type': 'application/json',
          }
        })
        console.log(validApi)
        if (validApi?.status !== 200) {
          return rejectWithValue(validApi?.message || 'Could not get the token. Please try again.');
        } else {
          localStorage.setItem("apiKey", validApi?.data?.apiKey)

          localStorage.setItem("user", JSON.stringify(data?.user[0]))
        }
      }
    }

    return data.user[0];
  } catch (error) {
    return rejectWithValue(error.message || 'Network error');
  }
});

export const fetchUsers = createAsyncThunk('admin/fetchUsers', async (_, { rejectWithValue }) => {
  try {
    const response = await fetch(getUsersApi);
    const data = await response.json();
    if (!response.ok || !data.success) {
      return rejectWithValue(data.message || 'Failed to fetch users');
    }
    return data.users;
  } catch (error) {
    return rejectWithValue(error.message || 'Network error');
  }
});

export const createUser = createAsyncThunk('admin/createUser', async (userData, { rejectWithValue }) => {
  try {
    const response = await fetch(registerApi, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      return rejectWithValue(data.message || 'Failed to create user');
    }
    return data.user[0];
  } catch (error) {
    return rejectWithValue(error.message || 'Network error');
  }
});

export const updateUser = createAsyncThunk('admin/updateUser', async ({ id, userData }, { rejectWithValue }) => {
  try {
    const response = await fetch(`${updateUserApi}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      return rejectWithValue(data.message || 'Failed to update user');
    }
    return data.user[0];
  } catch (error) {
    return rejectWithValue(error.message || 'Network error');
  }
});

export const deleteUser = createAsyncThunk('admin/deleteUser', async (id, { rejectWithValue }) => {
  try {
    const response = await fetch(`${deleteUserApi}/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      return rejectWithValue(data.message || 'Failed to delete user');
    }
    return id;
  } catch (error) {
    return rejectWithValue(error.message || 'Network error');
  }
});

export const fetchEnquiries = createAsyncThunk('admin/fetchEnquiries', async (adminId, { rejectWithValue }) => {
  try {
    const response = await fetch(`${getEnquiriesApi}/${adminId}`);
    const data = await response.json();
    if (!response.ok || !data.success) {
      return rejectWithValue(data.message || 'Failed to fetch enquiries');
    }
    return data.enquiry;
  } catch (error) {
    return rejectWithValue(error.message || 'Network error');
  }
});

export const updateEnquiryStatus = createAsyncThunk('admin/updateEnquiryStatus', async ({ id, status, responderName }, { rejectWithValue }) => {
  try {
    const response = await fetch(`${updateEnquiryStatusApi}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, responderName, role: 'admin' }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      return rejectWithValue(data.message || 'Failed to update enquiry status');
    }
    return data.enquiry[0];
  } catch (error) {
    return rejectWithValue(error.message || 'Network error');
  }
});

export const addEnquiryMessage = createAsyncThunk('admin/addEnquiryMessage', async ({ id, text, senderName }, { rejectWithValue }) => {
  try {
    const response = await fetch(`${addEnquiryMessageApi}/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: 'admin', senderName, text }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      return rejectWithValue(data.message || 'Failed to add message');
    }
    return data.enquiry[0];
  } catch (error) {
    return rejectWithValue(error.message || 'Network error');
  }
});

export const fetchDealersCatalog = createAsyncThunk('admin/fetchDealersCatalog', async (_, { rejectWithValue }) => {
  try {
    const payload = {
      getBrands: {
        articleCountry: "ZA",
        lang: "en",
        includeAll: true
      }
    };
    const response = await fetch(serviceJsonApi, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': localStorage.getItem('apiKey') },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return rejectWithValue(error.message || 'Network error');
  }
});

export const searchArticlesCatalog = createAsyncThunk('admin/searchArticlesCatalog', async ({ searchType, query }, { rejectWithValue }) => {
  try {
    let payload = {};
    if (searchType === 'number') {
      payload = {
        getArticles: {
          articleCountry: "ZA",
          lang: "en",
          searchQuery: query,
          searchType: 0,
          perPage: 50,
          page: 1,
          includeAll: true
        }
      };
    } else if (searchType === 'vehicle') {
      payload = {
        getArticles: {
          articleCountry: "ZA",
          lang: "en",
          linkageTargetId: query.linkageTargetId,
          linkageTargetType: query.linkageTargetType || "P",
          includeAll: true
        }
      };
    } else {
      payload = {
        getArticles: {
          articleCountry: "ZA",
          lang: "en",
          searchQuery: query,
          searchType: 1, // trade number / description
          perPage: 50,
          page: 1,
          includeAll: true
        }
      };
    }
    const response = await fetch(serviceJsonApi, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return rejectWithValue(error.message || 'Network error');
  }
});

export const markNotificationsAsRead = createAsyncThunk('admin/markNotificationsAsRead', async (id, { rejectWithValue }) => {
  try {
    const response = await fetch(`${readNotificationsApi}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      return rejectWithValue(data.message || 'Failed to update notifications');
    }
    return data.user[0];
  } catch (error) {
    return rejectWithValue(error.message || 'Network error');
  }
});

export const getMyself = createAsyncThunk('admin/getMyself', async (_, { rejectWithValue }) => {
  try {
    const user = JSON.parse(localStorage.getItem('adminUser'))
    const response = await fetch(`${getUsersApi}/${user.id}`);
    const data = await response.json();
    if (!response.ok || !data.success) {
      return rejectWithValue(data.message || 'Failed to fetch users');
    }
    return data.user[0];
  } catch (error) {
    return rejectWithValue(error.message || 'Network error');
  }
});

// Initial State

const initialState = {
  adminUser: null,
  isAuthenticated: false,
  users: [],
  enquiries: [],
  catalogDealers: [],
  catalogArticles: [],
  loading: false,
  actionLoading: false,
  error: null,
  successMessage: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    logout: (state) => {
      state.adminUser = null;
      state.isAuthenticated = false;
      localStorage.removeItem('adminUser');
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginAdmin.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.adminUser = action.payload;
        localStorage.setItem('adminUser', JSON.stringify(action.payload));
      })
      .addCase(loginAdmin.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // Fetch Users
      .addCase(fetchUsers.pending, (state) => { state.loading = true; })
      .addCase(fetchUsers.fulfilled, (state, action) => { state.loading = false; state.users = action.payload; })
      .addCase(fetchUsers.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // Create User
      .addCase(createUser.pending, (state) => { state.actionLoading = true; state.error = null; })
      .addCase(createUser.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.users.push(action.payload);
        state.successMessage = 'User created successfully!';
      })
      .addCase(createUser.rejected, (state, action) => { state.actionLoading = false; state.error = action.payload; })

      // Update User
      .addCase(updateUser.pending, (state) => { state.actionLoading = true; state.error = null; })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.users.findIndex(u => u.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        state.successMessage = 'User updated successfully!';
      })
      .addCase(updateUser.rejected, (state, action) => { state.actionLoading = false; state.error = action.payload; })

      // Delete User
      .addCase(deleteUser.pending, (state) => { state.actionLoading = true; state.error = null; })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.users = state.users.filter(u => u.id !== action.payload);
        state.successMessage = 'User deleted successfully!';
      })
      .addCase(deleteUser.rejected, (state, action) => { state.actionLoading = false; state.error = action.payload; })

      // Fetch Enquiries
      .addCase(fetchEnquiries.pending, (state) => { state.loading = true; })
      .addCase(fetchEnquiries.fulfilled, (state, action) => { state.loading = false; state.enquiries = action.payload; })
      .addCase(fetchEnquiries.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // Update Enquiry Status
      .addCase(updateEnquiryStatus.pending, (state) => { state.actionLoading = true; state.error = null; })
      .addCase(updateEnquiryStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.enquiries.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.enquiries[index] = {
            ...state.enquiries[index],
            ...action.payload,
            status: action.payload.vehicle?.status || action.payload.status,
            messages: action.payload.vehicle?.messages || action.payload.messages
          };
        }
        state.successMessage = 'Enquiry status updated!';
      })
      .addCase(updateEnquiryStatus.rejected, (state, action) => { state.actionLoading = false; state.error = action.payload; })

      // Add Enquiry Message
      .addCase(addEnquiryMessage.pending, (state) => { state.actionLoading = true; state.error = null; })
      .addCase(addEnquiryMessage.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.enquiries.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.enquiries[index] = {
            ...state.enquiries[index],
            ...action.payload,
            messages: action.payload.vehicle?.messages || action.payload.messages
          };
        }
        state.successMessage = 'Message sent successfully!';
      })
      .addCase(addEnquiryMessage.rejected, (state, action) => { state.actionLoading = false; state.error = action.payload; })

      // Fetch Dealers Catalog
      .addCase(fetchDealersCatalog.fulfilled, (state, action) => {
        if (action.payload?.data?.array) {
          state.catalogDealers = action.payload.data.array;
        }
      })

      // Search Articles Catalog
      .addCase(searchArticlesCatalog.pending, (state) => { state.loading = true; state.catalogArticles = []; })
      .addCase(searchArticlesCatalog.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.data?.array) {
          state.catalogArticles = action.payload.data.array;
        }
      })
      .addCase(searchArticlesCatalog.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // Mark Notifications as Read
      .addCase(markNotificationsAsRead.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(markNotificationsAsRead.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.adminUser = action.payload;
        localStorage.setItem('adminUser', JSON.stringify(action.payload));
        localStorage.setItem('user', JSON.stringify(action.payload));
      })
      .addCase(markNotificationsAsRead.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      .addCase(getMyself.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMyself.fulfilled, (state, action) => {
        state.loading = false;
        state.adminUser = action.payload;
      })
      .addCase(getMyself.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
  },
});

export const { logout, clearError, clearSuccess } = adminSlice.actions;
export default adminSlice.reducer;
