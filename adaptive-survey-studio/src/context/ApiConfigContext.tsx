import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl, setApiBaseUrl as saveApiBaseUrl } from '../services/apiConfig';

export type BackendConnectionStatus = 'connected' | 'offline' | 'checking';

interface ApiConfigContextType {
  baseUrl: string;
  status: BackendConnectionStatus;
  lastChecked: Date | null;
  setBaseUrl: (url: string) => void;
  checkConnection: () => Promise<boolean>;
}

const ApiConfigContext = createContext<ApiConfigContextType | undefined>(undefined);

export function ApiConfigProvider({ children }: { children: React.ReactNode }) {
  const [baseUrl, setBaseUrlState] = useState<string>(getApiBaseUrl());
  const [status, setStatus] = useState<BackendConnectionStatus>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    setStatus('checking');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const url = `${baseUrl.replace(/\/+$/, '')}/openapi.json`;

      const res = await fetch(url, { signal: controller.signal, mode: 'cors' });
      clearTimeout(timeoutId);

      if (res.ok || res.status === 401 || res.status === 403) {
        setStatus('connected');
        setLastChecked(new Date());
        return true;
      }
      setStatus('offline');
      setLastChecked(new Date());
      return false;
    } catch {
      setStatus('offline');
      setLastChecked(new Date());
      return false;
    }
  }, [baseUrl]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const setBaseUrl = (url: string) => {
    saveApiBaseUrl(url);
    setBaseUrlState(url);
    checkConnection();
  };

  return (
    <ApiConfigContext.Provider
      value={{
        baseUrl,
        status,
        lastChecked,
        setBaseUrl,
        checkConnection,
      }}
    >
      {children}
    </ApiConfigContext.Provider>
  );
}

export function useApiConfig() {
  const context = useContext(ApiConfigContext);
  if (!context) {
    throw new Error('useApiConfig must be used within an ApiConfigProvider');
  }
  return context;
}
