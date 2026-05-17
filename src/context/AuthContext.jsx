import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import useApi from '../configs/useApi';
import {
  clearAuthCookies,
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_ID_KEY,
} from '../configs/apiClient';
import {
  getUserRoleFromToken,
  getFullNameFromToken,
  getUserIdFromToken,
  getUsernameFromToken,
  getClinicModeFromToken,
} from '../utils/jwt';
import { normalizeRolesFromAuth } from '../utils/permissions';
import { resolveClinicMode } from '../constants/clinicMode';

const AuthContext = createContext();

function normalizeMustChangePassword(flag) {
  return flag === true || flag === 'true' || flag === 1;
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState({});
  const { post } = useApi();

  const decodeUserFromToken = token => ({
    id: getUserIdFromToken(token) || '',
    role: getUserRoleFromToken(token) || 'Staff',
    fullName:
      getFullNameFromToken(token) ||
      getUsernameFromToken(token) ||
      'User',
    username: getUsernameFromToken(token) || '',
    clinic_mode: resolveClinicMode({ fromToken: getClinicModeFromToken(token) }),
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
          id: userData.id ?? Cookies.get(USER_ID_KEY) ?? '',
          mustChangePassword: normalizeMustChangePassword(userData.mustChangePassword),
          roles: normalizeRolesFromAuth(userData.roles),
          clinic_mode: resolveClinicMode({
            clinic_mode: userData.clinic_mode,
            clinicMode: userData.clinicMode,
            fromToken: getClinicModeFromToken(accessToken),
          }),
        };
        setUser(normalized);
        if (normalized.id !== '' && normalized.id != null) {
          Cookies.set(USER_ID_KEY, String(normalized.id), {
            expires: 7,
            sameSite: 'lax',
          });
        }
        Cookies.set('userData', JSON.stringify(normalized), {
          expires: 7,
          sameSite: 'lax',
        });
      } catch {
        const userInfoFromToken = decodeUserFromToken(accessToken);
        setUser({ ...userInfoFromToken, mustChangePassword: false });
        if (userInfoFromToken.id) {
          Cookies.set(USER_ID_KEY, String(userInfoFromToken.id), {
            expires: 7,
            sameSite: 'lax',
          });
        }
        Cookies.set('userData', JSON.stringify({ ...userInfoFromToken, mustChangePassword: false }), {
          expires: 7,
          sameSite: 'lax',
        });
      }
    } else if (accessToken) {
      setIsAuthenticated(true);
      const userInfoFromToken = decodeUserFromToken(accessToken);
      setUser({ ...userInfoFromToken, mustChangePassword: false });
      if (userInfoFromToken.id) {
        Cookies.set(USER_ID_KEY, String(userInfoFromToken.id), {
          expires: 7,
          sameSite: 'lax',
        });
      }
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
      const idFromResponse = res.user?.id ?? res.user?.user_id ?? res.id ?? res.user_id;
      const normalizedId =
        idFromResponse !== undefined && idFromResponse !== null && String(idFromResponse).trim() !== ''
          ? idFromResponse
          : fromToken.id || '';

      const mustFromResponse = normalizeMustChangePassword(
        res.must_change_password ?? res.mustChangePassword ?? res.user?.must_change_password ?? res.user?.mustChangePassword
      );

      const rolesNormalized = normalizeRolesFromAuth(res.roles ?? res.user?.roles);
      const clinic_mode = resolveClinicMode({
        clinic_mode: res.clinic_mode ?? res.user?.clinic_mode,
        clinicMode: res.clinicMode ?? res.user?.clinicMode,
        fromToken: getClinicModeFromToken(accessToken),
      });

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
          id: normalizedId,
          mustChangePassword: mustFromResponse,
          roles: rolesNormalized,
          clinic_mode,
        };
      } else {
        userInfo = {
          fullName: res.fullName || fromToken.fullName,
          role: res.role || fromToken.role,
          username: fromToken.username || username,
          email: res.email || fromToken.username || username,
          id: normalizedId,
          mustChangePassword: mustFromResponse,
          roles: rolesNormalized,
          clinic_mode,
        };
      }

      setUser(userInfo);
      if (userInfo.id !== '' && userInfo.id != null) {
        Cookies.set(USER_ID_KEY, String(userInfo.id), {
          expires: 7,
          sameSite: 'lax',
        });
      }
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
    if (updatedUserData.roles !== undefined) {
      newUserData.roles = normalizeRolesFromAuth(updatedUserData.roles);
    }
    if (newUserData.id !== '' && newUserData.id != null) {
      Cookies.set(USER_ID_KEY, String(newUserData.id), {
        expires: 7,
        sameSite: 'lax',
      });
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
