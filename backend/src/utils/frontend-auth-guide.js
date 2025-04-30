/**
 * HƯỚNG DẪN SỬ DỤNG REFRESH TOKEN TRÊN FRONTEND
 * 
 * File này cung cấp một hướng dẫn và ví dụ về cách triển khai refresh token
 * trên ứng dụng frontend. Đây chỉ là một mẫu và cần được điều chỉnh cho phù hợp
 * với framework và cấu trúc dự án của bạn.
 * 
 * Lưu ý: Refresh token được lưu trữ trong database nên đã có tính bảo mật cao.
 * Khi đăng xuất, refresh token sẽ bị vô hiệu hóa trong database.
 */

/**
 * Ví dụ 1: Thiết lập Axios Interceptor để xử lý refresh token tự động
 */
// auth.service.js
import axios from 'axios';

// Tạo instance axios
const API_URL = 'http://localhost:3000/api';
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Lưu trữ token sau khi đăng nhập/đăng ký
export const saveTokens = (accessToken, refreshToken) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

// Lấy tokens từ localStorage
export const getTokens = () => {
  return {
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken')
  };
};

// Xóa tokens khi đăng xuất
export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// Thêm Request Interceptor
api.interceptors.request.use(
  (config) => {
    const { accessToken } = getTokens();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Thêm Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Nếu lỗi là 401 và có mã TOKEN_EXPIRED và chưa thử refresh
    if (error.response?.status === 401 && 
        error.response?.data?.code === 'TOKEN_EXPIRED' && 
        !originalRequest._retry) {
      
      // Đánh dấu đã thử refresh token
      originalRequest._retry = true;
      
      try {
        const { refreshToken } = getTokens();
        
        if (!refreshToken) {
          // Không có refresh token, chuyển về trang đăng nhập
          clearTokens();
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        // Gọi API refresh token
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken
        });
        
        // Lưu tokens mới
        const { token, refreshToken: newRefreshToken } = response.data.data;
        saveTokens(token, newRefreshToken);
        
        // Thử lại request ban đầu với token mới
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh token lỗi, đăng xuất
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Ví dụ cho hàm đăng nhập
export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    const { token, refreshToken, user } = response.data.data;
    
    // Lưu tokens và thông tin người dùng
    saveTokens(token, refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { success: true, user };
  } catch (error) {
    return { 
      success: false, 
      message: error.response?.data?.message || 'Đăng nhập thất bại'
    };
  }
};

// Ví dụ cho hàm đăng xuất
export const logout = async () => {
  try {
    const { refreshToken } = getTokens();
    
    // Gọi API đăng xuất với refreshToken để thu hồi token trên server
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Luôn xóa tokens và thông tin người dùng
    clearTokens();
    localStorage.removeItem('user');
    
    // Chuyển hướng về trang đăng nhập
    window.location.href = '/login';
  }
};

/**
 * Ví dụ 2: Phương thức sử dụng trong React
 */
/**
import React, { useState, useEffect, createContext, useContext } from 'react';
import { login, logout, getTokens } from './auth.service';

// Tạo Context cho Authentication
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Kiểm tra đăng nhập khi ứng dụng khởi động
  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('user');
      const { accessToken } = getTokens();
      
      if (storedUser && accessToken) {
        setUser(JSON.parse(storedUser));
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  // Xử lý đăng nhập
  const handleLogin = async (email, password) => {
    setLoading(true);
    const result = await login(email, password);
    
    if (result.success) {
      setUser(result.user);
    }
    
    setLoading(false);
    return result;
  };

  // Xử lý đăng xuất
  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  // Giá trị cung cấp cho Context
  const value = {
    user,
    loading,
    login: handleLogin,
    logout: handleLogout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook để sử dụng AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};
*/

/**
 * Ví dụ 3: Protected Route trong React Router
 */
/**
import { Navigate } from 'react-router-dom';
import { useAuth } from './auth-context';

// Component bảo vệ route yêu cầu đăng nhập
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Sử dụng trong Routes
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/signup" element={<SignupPage />} />
  <Route path="/dashboard" element={
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  } />
</Routes>
*/ 