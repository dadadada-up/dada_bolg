'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { validateToken, getUserFromToken, generateToken, validateCredentials } from '@/lib/auth';

// 定义认证上下文的类型
interface AuthContextType {
  isAuthenticated: boolean;
  user: { username: string } | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 提供认证上下文的组件
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<{ username: string } | null>(null);

  // 初始化时检查是否已登录
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token && validateToken(token)) {
      const userData = getUserFromToken(token);
      if (userData) {
        setIsAuthenticated(true);
        setUser(userData);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }, []);

  // 登录功能
  const login = async (username: string, password: string): Promise<boolean> => {
    if (validateCredentials(username, password)) {
      const token = generateToken(username);
      localStorage.setItem('auth_token', token);
      setIsAuthenticated(true);
      setUser({ username });
      return true;
    }
    return false;
  };

  // 登出功能
  const logout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 使用认证上下文的钩子
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 