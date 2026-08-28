import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  isGuest: boolean;
}

interface GoogleJwtPayload {
  sub: string;
  name: string;
  email: string;
  picture?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loginWithGoogleCredential: (credential: string) => void;
  loginAsGuest: () => void;
  logout: () => void;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'drone_auth_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse cached auth user:', e);
    }
    // Default to Guest Observer if not logged in
    return {
      id: 'guest-default',
      name: 'Guest Observer',
      email: 'guest@flood-response.org',
      avatar: '',
      role: 'Guest Observer',
      isGuest: true,
    };
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const loginWithGoogleCredential = (credential: string) => {
    try {
      const decoded = jwtDecode<GoogleJwtPayload>(credential);
      const googleUser: AuthUser = {
        id: decoded.sub,
        name: decoded.name || 'Google User',
        email: decoded.email || '',
        avatar: decoded.picture || '',
        role: 'Verified Commander',
        isGuest: false,
      };
      setUser(googleUser);
      setIsAuthModalOpen(false);
    } catch (error) {
      console.error('Failed to decode Google JWT credential:', error);
    }
  };

  const loginAsGuest = () => {
    const guestUser: AuthUser = {
      id: `guest-${Date.now().toString().slice(-4)}`,
      name: 'Guest Observer',
      email: 'guest@flood-response.org',
      avatar: '',
      role: 'Guest Observer',
      isGuest: true,
    };
    setUser(guestUser);
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    // Revert to Guest
    setUser({
      id: 'guest-default',
      name: 'Guest Observer',
      email: 'guest@flood-response.org',
      avatar: '',
      role: 'Guest Observer',
      isGuest: true,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loginWithGoogleCredential,
        loginAsGuest,
        logout,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
