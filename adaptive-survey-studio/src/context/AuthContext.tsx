import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (email?: string) => void;
  signOut: () => void;
}

const STORAGE_KEY_AUTH = 'pm_studio_auth_user';

const DEMO_USER: User = {
  id: 'usr_pm_lead',
  name: 'Lead Strategist',
  email: 'pratik.mandalkar22@vit.edu',
  role: 'Principal Researcher',
  organization: 'Dentsu Organisation',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH);
      if (saved) return JSON.parse(saved);
      // Default to logged-in demo user for seamless evaluation
      return DEMO_USER;
    } catch {
      return DEMO_USER;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    }
  }, [user]);

  const signIn = (email?: string) => {
    setUser({
      ...DEMO_USER,
      email: email || DEMO_USER.email,
    });
  };

  const signOut = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
