import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { getMyselfRedux, setMyself } from '../../redux/getData';
import Toast from 'react-native-toast-message';

export const AuthContext = createContext({
  isLoading: true,
  isAuthenticated: false,
  userToken: null,
  userRole: null,
  currentUser: null,
  signIn: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Initialize and validate session on app startup
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedRole = await AsyncStorage.getItem('role');
        const storedUserId = await AsyncStorage.getItem('userId');
        const storedUser = await AsyncStorage.getItem('user');

        if ((storedToken || storedUserId) && storedRole) {
          const parsedRole = storedRole.toLowerCase();
          setUserToken(storedToken || 'local_session');
          setUserRole(parsedRole);

          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              setCurrentUser(parsedUser);
              dispatch(setMyself(parsedUser));
            } catch (e) {
              // Ignore JSON parse error
            }
          }

          // Hydrate with latest backend profile if userId is available
          if (storedUserId) {
            try {
              const freshUser = await dispatch(getMyselfRedux(storedUserId)).unwrap();
              if (freshUser) {
                setCurrentUser(freshUser);
                await AsyncStorage.setItem('user', JSON.stringify(freshUser));
                if (freshUser.role) {
                  const updatedRole = freshUser.role.toLowerCase();
                  setUserRole(updatedRole);
                  await AsyncStorage.setItem('role', updatedRole);
                }
              }
            } catch (err) {
              console.log('Session profile hydration check notice:', err);
            }
          }
        } else {
          // No active session found
          setUserToken(null);
          setUserRole(null);
          setCurrentUser(null);
        }
      } catch (err) {
        console.log('Session bootstrap error:', err);
        setUserToken(null);
        setUserRole(null);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, [dispatch]);

  const signIn = useCallback(
    async ({ token, role, user, userId }) => {
      try {
        const normalizedRole = (role || user?.role || 'owner').toLowerCase();
        if (token) {
          await AsyncStorage.setItem('token', token);
          setUserToken(token);
        } else {
          setUserToken('active_session');
        }

        await AsyncStorage.setItem('role', normalizedRole);
        setUserRole(normalizedRole);

        const effectiveUserId = userId || user?.id;
        if (effectiveUserId) {
          await AsyncStorage.setItem('userId', String(effectiveUserId));
        }

        if (user) {
          await AsyncStorage.setItem('user', JSON.stringify(user));
          setCurrentUser(user);
          dispatch(setMyself(user));
        }

        if (effectiveUserId) {
          dispatch(getMyselfRedux(effectiveUserId));
        }
      } catch (error) {
        console.error('Auth signIn storage error:', error);
      }
    },
    [dispatch]
  );

  const signOut = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'userId', 'role', 'user']);
      setUserToken(null);
      setUserRole(null);
      setCurrentUser(null);
      dispatch(setMyself(null));
      Toast.show({
        type: 'success',
        text1: 'Signed Out',
        text2: 'You have been securely signed out.',
      });
    } catch (error) {
      console.error('Auth signOut error:', error);
    }
  }, [dispatch]);

  const refreshProfile = useCallback(async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      if (storedUserId) {
        const freshUser = await dispatch(getMyselfRedux(storedUserId)).unwrap();
        if (freshUser) {
          setCurrentUser(freshUser);
          await AsyncStorage.setItem('user', JSON.stringify(freshUser));
        }
      }
    } catch (err) {
      console.log('refreshProfile error:', err);
    }
  }, [dispatch]);

  const isAuthenticated = Boolean(userToken && userRole);

  const value = {
    isLoading,
    isAuthenticated,
    userToken,
    userRole,
    currentUser,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
