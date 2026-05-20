import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  token: string | null;
  user: any | null;
  isBootstrapping: boolean;
  setToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const TOKEN_KEY = 'rozgarsetu-worker-token';
const USER_TYPE_KEY = 'rozgarsetu-user-type';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        if (storedToken) {
          setTokenState(storedToken);
          // Try to fetch profile to get user details
          const { api } = require('../api/client');
          const res = await api.get('/auth/profile', {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          if (res.data.success) {
            setUser(res.data.user);
          }
        }
      } catch (e) {
        console.warn("Auth bootstrapping failed", e);
      } finally {
        setIsBootstrapping(false);
      }
    };

    bootstrap();
  }, []);

  const setToken = async (nextToken: string) => {
    setTokenState(nextToken);
    await AsyncStorage.setItem(TOKEN_KEY, nextToken);
    await AsyncStorage.setItem(USER_TYPE_KEY, 'worker');
    
    // Fetch profile immediately after login
    try {
      const { api } = require('../api/client');
      const res = await api.get('/auth/profile', {
        headers: { Authorization: `Bearer ${nextToken}` }
      });
      if (res.data.success) {
        setUser(res.data.user);
      }
    } catch (e) {
      console.warn("Failed to fetch profile after login", e);
    }
  };

  const logout = async () => {
    setTokenState(null);
    setUser(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_TYPE_KEY]);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isBootstrapping,
      setToken,
      logout,
    }),
    [isBootstrapping, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};
