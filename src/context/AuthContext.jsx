import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import useApi from '../configs/useApi';
import {
  clearAuthCookies,
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
} from '../configs/apiClient';
import {
  getUserRoleFromToken,
  getFullNameFromToken,
  getUsernameFromToken,
} from '../utils/jwt';

const AuthContext = createContext();

function normalizeMustChangePassword(flag) {
  return flag === true || flag === 'true' || flag === 1;
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState({});
  const { post } = useApi();

  const decodeUserFromToken = token => ({
    role: getUserRoleFromToken(token) || 'Staff',
    fullName:
      getFullNameFromToken(token) ||
      getUsernameFromToken(token) ||
      'User',
    username: getUsernameFromToken(token) || '',
  });

  useEffect(() => {
    const accessToken = Cookies.get(ACCESS_TOKEN_KEY);
    const storedUserData = Cookies.get('userData');

    if (accessToken && storedUserData) {
      setIsAuthenticated(true);
      try {
        const userData = JSON.parse(storedUserData);
        const normalized = {
          ...userData,
          mustChangePassword: normalizeMustChangePassword(userData.mustChangePassword),
        };
        setUser(normalized);
        Cookies.set('userData', JSON.stringify(normalized), {
          expires: 7,
          sameSite: 'lax',
        });
      } catch {
        const userInfoFromToken = decodeUserFromToken(accessToken);
        setUser({ ...userInfoFromToken, mustChangePassword: false });
        Cookies.set('userData', JSON.stringify({ ...userInfoFromToken, mustChangePassword: false }), {
          expires: 7,
          sameSite: 'lax',
        });
      }
    } else if (accessToken) {
      setIsAuthenticated(true);
      const userInfoFromToken = decodeUserFromToken(accessToken);
      setUser({ ...userInfoFromToken, mustChangePassword: false });
      Cookies.set('userData', JSON.stringify({ ...userInfoFromToken, mustChangePassword: false }), {
        expires: 7,
        sameSite: 'lax',
      });
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const login = async ({ username, password } = {}) => {
    clearAuthCookies();

    try {
      const res = await post('/auth/login', {
        username,
        password,
      });

      const accessToken =
        res.access || res.accessToken || res.token || res.access_token;
      const refreshToken =
        res.refresh || res.refreshToken || res.refresh_token;

      if (!accessToken) {
        setIsAuthenticated(false);
        throw new Error('Invalid login response');
      }

      Cookies.set(ACCESS_TOKEN_KEY, accessToken, {
        expires: 7,
        sameSite: 'lax',
      });
      if (refreshToken) {
        Cookies.set(REFRESH_TOKEN_KEY, refreshToken, {
          expires: 14,
          sameSite: 'lax',
        });
      }

      setIsAuthenticated(true);

      const fromToken = decodeUserFromToken(accessToken);

      const mustFromResponse = normalizeMustChangePassword(
        res.must_change_password ?? res.mustChangePassword ?? res.user?.must_change_password ?? res.user?.mustChangePassword
      );

      let userInfo;
      if (res.user && typeof res.user === 'object') {
        userInfo = {
          fullName:
            res.user.fullName ||
            res.user.name ||
            fromToken.fullName,
          role: res.user.role || fromToken.role,
          username:
            res.user.username ||
            res.user.email ||
            fromToken.username ||
            username,
          email: res.user.email || username,
          mustChangePassword: mustFromResponse,
        };
      } else {
        userInfo = {
          fullName: res.fullName || fromToken.fullName,
          role: res.role || fromToken.role,
          username: fromToken.username || username,
          email: res.email || fromToken.username || username,
          mustChangePassword: mustFromResponse,
        };
      }

      setUser(userInfo);
      Cookies.set('userData', JSON.stringify(userInfo), {
        expires: 7,
        sameSite: 'lax',
      });
      return { mustChangePassword: userInfo.mustChangePassword === true };
    } catch (err) {
      setIsAuthenticated(false);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await post('/auth/logout');
    } catch {
      // Optional endpoint — ignore failures
    } finally {
      setIsAuthenticated(false);
      setUser({});
      clearAuthCookies();
      window.location.href = '/login';
    }
  };

  const updateUser = updatedUserData => {
    const newUserData = {
      ...user,
      ...updatedUserData,
    };
    if (updatedUserData.mustChangePassword !== undefined) {
      newUserData.mustChangePassword = normalizeMustChangePassword(updatedUserData.mustChangePassword);
    }
    setUser(newUserData);
    Cookies.set('userData', JSON.stringify(newUserData), {
      expires: 7,
      sameSite: 'lax',
    });
  };

  const mustChangePassword = user?.mustChangePassword === true;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        mustChangePassword,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
