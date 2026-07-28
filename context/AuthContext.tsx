"use client";

import React, {
  createContext,
  ReactNode,
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";

export interface AuthUser {
  token: string;
  userId?: string;
  Username1?: string;
  Email?: string;
  [key: string]: any;
}

export type AuthData = AuthUser;

export type AuthContextType = {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  loading: boolean;
  isTimeoutWarningOpen: boolean;
  countdown: number;
  resetInactivityTimer: () => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  loading: true,
  isTimeoutWarningOpen: false,
  countdown: 30,
  resetInactivityTimer: () => {},
  logout: () => {},
});

export const AuthProvider = ({
  children,
  authData = null,
}: {
  children: ReactNode;
  authData?: AuthUser | null;
}) => {
  const [user, setUser] = useState<AuthUser | null>(authData);
  const [loading, setLoading] = useState(true);
  const [isTimeoutWarningOpen, setIsTimeoutWarningOpen] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const router = useRouter();
  
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const TIMEOUT_DURATION = 5 * 60 * 1000; // 5 minutes total
  const WARNING_THRESHOLD = 4.5 * 60 * 1000; // 4 minutes 30 seconds before warning

  const logout = useCallback(async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout API failed", e);
    }
    
    setUser(null);
    localStorage.removeItem("authData");
    setIsTimeoutWarningOpen(false);
    
    // Use hard redirect to ensure all state and server-side cookies are fully cleared/synced
    window.location.href = "/login";
  }, []);

  const startInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    
    setIsTimeoutWarningOpen(false);
    setCountdown(30);

    inactivityTimerRef.current = setTimeout(() => {
      setIsTimeoutWarningOpen(true);
      
      let timeLeft = 30;
      countdownTimerRef.current = setInterval(() => {
        timeLeft -= 1;
        setCountdown(timeLeft);
        if (timeLeft <= 0) {
          clearInterval(countdownTimerRef.current!);
          logout();
        }
      }, 1000);
    }, WARNING_THRESHOLD);
  }, [logout]);

  const resetInactivityTimer = useCallback(() => {
    if (user) {
      startInactivityTimer();
    }
  }, [user, startInactivityTimer]);

  useEffect(() => {
    // 1) Try to get details from localStorage (always the most complete source for non-token fields)
    const storedAuth = localStorage.getItem("authData");
    const parsed = storedAuth ? JSON.parse(storedAuth) : null;

    if (authData?.token) {
      // 2) If server provided a token, use it but merge with stored details (UserId, etc.)
      const mergedUser = { ...(parsed || {}), ...authData };
      // Explicitly ensure we don't accidentally wipe userId if it was in parsed but not in authData
      if (!mergedUser.userId && parsed?.userId) mergedUser.userId = parsed.userId;
      if (!mergedUser.UserId && parsed?.UserId) mergedUser.UserId = parsed.UserId;
      if (!mergedUser.Userid && parsed?.Userid) mergedUser.Userid = parsed.Userid;
      
      setUser(mergedUser);
    } else if (parsed) {
      // 3) Fallback to full local storage if no server token (middleware might have missed it or we're on a public page)
      setUser(parsed);
    }
    setLoading(false);
  }, [authData]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("authData", JSON.stringify(user));
      startInactivityTimer();

      const activityEvents = ["mousemove", "mousedown", "keypress", "scroll", "touchstart"];
      const handleActivity = () => resetInactivityTimer();

      activityEvents.forEach((event) => {
        window.addEventListener(event, handleActivity);
      });

      return () => {
        activityEvents.forEach((event) => {
          window.removeEventListener(event, handleActivity);
        });
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      };
    } else {
      localStorage.removeItem("authData");
    }
  }, [user, resetInactivityTimer, startInactivityTimer]);

  const value = useMemo<AuthContextType>(
    () => ({ 
      user, 
      setUser, 
      loading, 
      isTimeoutWarningOpen, 
      countdown, 
      resetInactivityTimer,
      logout 
    }),
    [user, loading, isTimeoutWarningOpen, countdown, resetInactivityTimer, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
