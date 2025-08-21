
'use client';

import type { ReactNode} from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  type: 'admin' | 'coach' | 'fenix_master' | 'team_admin';
  name: string;
  avatar?: string | null;
  id?: string; // Coach ID, Admin ID (e.g., 'gestorfenix' or team admin's generated ID)
  assignedCategories?: string[]; // For coach
  teamId?: string; // For team_admin
  currentTeamName?: string; // For team_admin, to display in Navbar
  passwordChangeRequired?: boolean; // For team_admin
}

interface UserDataToUpdate {
  name?: string;
  avatar?: string | null;
  passwordChangeRequired?: boolean;
}


interface AuthContextType {
  user: User | null;
  login: (userType: User['type'], userData: Partial<User>) => void;
  logout: () => void;
  logoutAndLoginAs: (userType: User['type'], userData: Partial<User>) => void;
  updateCurrentUser: (newUserData: UserDataToUpdate) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_STORAGE_KEY = 'authUser_v3'; 

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setIsLoading(true);
    try {
        const storedUser = localStorage.getItem(AUTH_USER_STORAGE_KEY);
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
          setUser(null);
        }
    } catch (error) {
        console.error("Failed to load user from localStorage", error);
        setUser(null);
    } finally {
        setIsLoading(false);
    }
  }, []);


  const login = useCallback((userType: User['type'], userData: Partial<User>) => {
    const newUser: User = {
      type: userType,
      name: userData.name || 'Usuario Desconocido',
      id: userData.id,
      avatar: userData.avatar || null,
      assignedCategories: userData.assignedCategories,
      teamId: userData.teamId,
      currentTeamName: userData.currentTeamName,
      passwordChangeRequired: userData.passwordChangeRequired,
    };
    setUser(newUser);
    try {
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(newUser));
    } catch (error) {
      console.error("Failed to save user to localStorage", error);
    }
    
    if (userType === 'fenix_master') {
        router.push('/gestor-fenix');
    } else {
        router.push('/');
    }
  }, [router]);

  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to remove user from localStorage", error);
    }
    router.push('/login');
  }, [router]);
  
  const logoutAndLoginAs = useCallback((userType: User['type'], userData: Partial<User>) => {
    setUser(null);
    try {
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    } catch (error) {
       console.error("Failed to remove user from localStorage during transition", error);
    }
    
    // Use a short timeout to ensure the state update from logout() propagates
    // before the new login() state update and redirect is triggered.
    setTimeout(() => {
        login(userType, userData);
    }, 50);

  }, [login]);

  const updateCurrentUser = useCallback((newUserData: UserDataToUpdate) => {
    setUser(currentUser => {
      if (!currentUser) return null;
      const updatedUser = { ...currentUser, ...newUserData };
      if (newUserData.hasOwnProperty('avatar')) {
        updatedUser.avatar = newUserData.avatar;
      }
      try {
        localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(updatedUser));
      } catch (error) {
        console.error("Failed to update user in localStorage", error);
      }
      return updatedUser;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, logoutAndLoginAs, updateCurrentUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
