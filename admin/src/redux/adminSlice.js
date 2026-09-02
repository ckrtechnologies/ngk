import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  loginApi,
  getUsersApi,
  getEnquiriesApi,
  serviceJsonApi,
  updateUserApi,
  deleteUserApi,
  registerApi,
  updateEnquiryStatusApi,
  addEnquiryMessageApi,
  readNotificationsApi,
  dealersApi,
  brandsApi,
} from '../config/api';

// Helper for authenticated fetch headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ==============================================================================
// ASYNC THUNKS
// ==============================================================================

/**
 * 1. Login Admin (Clean auth via backend, no client IP whitelisting needed!)
 */
export const loginAdmin = createAsyncThunk('admin/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await fetch(loginApi, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...credentials, role: 'admin' }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return rejectWithValue(data.message || 'Login failed');
    }

    const userObj = data.profile || (data.user && data.user[0]) || data.user;
    const token = data.token;

    if (token) {
      localStorage.setItem('token', token);
    }
    if (userObj) {
      localStorage.setItem('adminUser', JSON.stringify(userObj));
      localStorage.setItem('user', JSON.stringify(userObj));
    }

    return userObj;
  } catch (error) {
    return rejectWithValue(error.message || 'Network communication error');
  }
});

/**
 * 2. Fetch Users
 */
export const fetchUsers = createAsyncThunk('admin/fetchUsers', async (_, { rejectWithValue }) => {
  try {
    const response = await fetch(getUsersApi, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok || !data.success) {
      return rejectWithValue(data.message || 'Failed to fetch users');
    }
    return data.users || [];
  } catch (error) {
    return rejectWithValue(error.message || 'Network error');
  }
});

/**
 * 3. Create User
 */
export const createUser = createAsyncThunk('admin/createUser', async (userData, { rejectWithValue }) => {
  try {
    const response = await fetch(registerApi, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      return rejectWithValue(data.message || 'Failed to create user');
    }
    return data.user || data.profile || userData;
  } catch (error) {
    return rejectWithValue(error.message || 'Network error');
  }
});

/**
 * 4. Update User
 */
export const updateUser = createAsyncThunk('admin/updateUser', async ({ id, userData }, { rejectWithValue }) => {
  try {
    const response = await fetch(`${updateUserApi}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      return rejectWithValue(data.message || 'Failed to update user');
    }
    return data.user?.[0] || data.user || userData;
  } catch (error) {
    return rejectWithValue(error.message || 'Network error');
  }
});

/**
 * 5. Delete User
 */
export const deleteUser = createAsyncThunk('admin/deleteUser', async (id, { rejectWithValue }) => {
  try {
    const response = await fetch(`${deleteUserApi}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
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

/**
 * 6. Fetch Enquiries
 */
export const fetchEnquiries = createAsyncThunk('admin/fetchEnquiries', async (adminId, { rejectWithValue }) => {
  try {
    const url = adminId ? `${getEnquiriesApi}/${adminId}` : getEnquiriesApi;
    const response = await fetch(url, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok || !data.success) {
      return rejectWithValue(data.message || 'Failed to fetch enquiries');
    }
    return data.enquiry || [];
  } catch (error) {
    return rejectWithValue(error.message || 'Network error');
  }
});

/**
 * 7. Update Enquiry Status
 */
export const updateEnquiryStatus = createAsyncThunk(
  'admin/updateEnquiryStatus',
  async ({ id, status, responderName }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${updateEnquiryStatusApi}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, responderName, role: 'admin' }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        return rejectWithValue(data.message || 'Failed to update enquiry status');
      }
      return data.enquiry?.[0] || data.enquiry || { id, status };
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

/**
 * 8. Add Enquiry Message
 */
export const addEnquiryMessage = createAsyncThunk(
  'admin/addEnquiryMessage',
  async ({ id, text, senderName }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${addEnquiryMessageApi}/${id}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ sender: 'admin', senderName, text }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        return rejectWithValue(data.message || 'Failed to add message');
      }
      return data.enquiry?.[0] || data.enquiry;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

/**
 * 9. Fetch Dealers Catalog
 */
export const fetchDealersCatalog = createAsyncThunk('admin/fetchDealersCatalog', async (_, { rejectWithValue }) => {
  try {
    // 1. Try fetching backend database dealers
    const res = await fetch(dealersApi, { headers: getAuthHeaders() });
    const data = await res.json();
    if (data.dealers && data.dealers.length > 0) {
      return { data: { array: data.dealers } };
    }

    // 2. Fallback to TecDoc brands via backend proxy
    const fallbackRes = await fetch(brandsApi, { headers: getAuthHeaders() });
    const fallbackData = await fallbackRes.json();
    return fallbackData;
  } catch (error) {
    return rejectWithValue(error.message || 'Network error');
  }
});

/**
 * 10. Search Articles Catalog (Via Backend TecDoc Proxy)
 */
export const searchArticlesCatalog = createAsyncThunk(
  'admin/searchArticlesCatalog',
  async ({ searchType, query }, { rejectWithValue }) => {
    try {
      let payload = {};
      if (searchType === 'number') {
        payload = {
          getArticles: {
            articleCountry: 'ZA',
            lang: 'en',
            searchQuery: query,
            searchType: 0,
            perPage: 50,
            page: 1,
            includeAll: true,
          },
        };
      } else if (searchType === 'vehicle') {
        payload = {
          getArticles: {
            articleCountry: 'ZA',
            lang: 'en',
            linkageTargetId: query.linkageTargetId || query.carId || query,
            linkageTargetType: query.linkageTargetType || 'P',
            includeAll: true,
          },
        };
      } else {
        payload = {
          getArticles: {
            articleCountry: 'ZA',
            lang: 'en',
            searchQuery: query,
            searchType: 1,
            perPage: 50,
            page: 1,
            includeAll: true,
          },
        };
      }

      const response = await fetch(serviceJsonApi, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

/**
 * 11. Mark Notifications as Read
 */
export const markNotificationsAsRead = createAsyncThunk('admin/markNotificationsAsRead', async (id, { rejectWithValue }) => {
  try {
    const response = await fetch(`${readNotificationsApi}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      return rejectWithValue(data.message || 'Failed to update notifications');
    }
    return data.user?.[0] || data.user;
  } catch (error) {
    return rejectWithValue(error.message || 'Network error');
  }
});

/**
 * 12. Get Current Admin User Profile
 */
export const getMyself = createAsyncThunk('admin/getMyself', async (_, { rejectWithValue }) => {
  try {
    const cached = localStorage.getItem('adminUser');
    if (!cached) return null;
    const user = JSON.parse(cached);
    const response = await fetch(`${getUsersApi}/${user.id}`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok || !data.success) {
      return user; // Return cached if server fetch fails
    }
    return data.user?.[0] || data.user || user;
  } catch (error) {
    return rejectWithValue(error.message || 'Network error');
  }
});

// ==============================================================================
// INITIAL STATE & SLICE DEFINITION
// ==============================================================================

const getInitialUser = () => {
  try {
    const u = localStorage.getItem('adminUser');
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
};

const initialState = {
  adminUser: getInitialUser(),
  isAuthenticated: !!localStorage.getItem('token') || !!localStorage.getItem('adminUser'),
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
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('apiKey');
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
      .addCase(loginAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.adminUser = action.payload;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create User
      .addCase(createUser.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.users.push(action.payload);
        state.successMessage = 'User created successfully!';
      })
      .addCase(createUser.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Update User
      .addCase(updateUser.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.users.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        state.successMessage = 'User updated successfully!';
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Delete User
      .addCase(deleteUser.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.users = state.users.filter((u) => u.id !== action.payload);
        state.successMessage = 'User deleted successfully!';
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Fetch Enquiries
      .addCase(fetchEnquiries.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchEnquiries.fulfilled, (state, action) => {
        state.loading = false;
        state.enquiries = action.payload;
      })
      .addCase(fetchEnquiries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Enquiry Status
      .addCase(updateEnquiryStatus.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateEnquiryStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.enquiries.findIndex((e) => e.id === action.payload.id);
        if (index !== -1) {
          state.enquiries[index] = {
            ...state.enquiries[index],
            ...action.payload,
            status: action.payload.status || state.enquiries[index].status,
            messages: action.payload.messages || state.enquiries[index].messages,
          };
        }
        state.successMessage = 'Enquiry status updated!';
      })
      .addCase(updateEnquiryStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Add Enquiry Message
      .addCase(addEnquiryMessage.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(addEnquiryMessage.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.enquiries.findIndex((e) => e.id === action.payload.id);
        if (index !== -1) {
          state.enquiries[index] = {
            ...state.enquiries[index],
            ...action.payload,
            messages: action.payload.messages || state.enquiries[index].messages,
          };
        }
        state.successMessage = 'Message sent successfully!';
      })
      .addCase(addEnquiryMessage.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Fetch Dealers Catalog
      .addCase(fetchDealersCatalog.fulfilled, (state, action) => {
        if (action.payload?.data?.array) {
          state.catalogDealers = action.payload.data.array;
        } else if (Array.isArray(action.payload?.data)) {
          state.catalogDealers = action.payload.data;
        }
      })

      // Search Articles Catalog
      .addCase(searchArticlesCatalog.pending, (state) => {
        state.loading = true;
        state.catalogArticles = [];
      })
      .addCase(searchArticlesCatalog.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.articles) {
          state.catalogArticles = action.payload.articles;
        } else if (action.payload?.data?.array) {
          state.catalogArticles = action.payload.data.array;
        }
      })
      .addCase(searchArticlesCatalog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Mark Notifications as Read
      .addCase(markNotificationsAsRead.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(markNotificationsAsRead.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.adminUser = action.payload;
        localStorage.setItem('adminUser', JSON.stringify(action.payload));
      })
      .addCase(markNotificationsAsRead.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Get Myself
      .addCase(getMyself.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMyself.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.adminUser = action.payload;
        }
      })
      .addCase(getMyself.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError, clearSuccess } = adminSlice.actions;
export default adminSlice.reducer;
