import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "user" | "professional" | "admin";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  subscription_status: string | null;
  stripe_customer_id: string | null;
  subscription_end: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Safety timeout — never stay loading forever (3 seconds)
    const timeout = setTimeout(() => {
      if (isMounted && isLoading) {
        console.warn("Auth loading timeout reached, forcing ready state");
        setIsLoading(false);
      }
    }, 3000);

    // Check for existing session first
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      if (!isMounted) return;
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      
      if (existingSession?.user) {
        try {
          await fetchUserData(existingSession.user.id, existingSession.user.email ?? null);
        } catch (error) {
          console.error("Error fetching user data on init:", error);
          setProfile(null);
          setRoles([]);
        }
      }
      
      if (isMounted) setIsLoading(false);
    }).catch((error) => {
      console.error("Error getting session:", error);
      if (isMounted) {
        setProfile(null);
        setRoles([]);
        setIsLoading(false);
      }
    });

    // Then set up listener for subsequent changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!isMounted) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          // Fire and forget to avoid blocking the auth state change callback
          fetchUserData(currentSession.user.id).catch((error) => {
            console.error("Error fetching user data on auth change:", error);
            if (isMounted) {
              setProfile(null);
              setRoles([]);
            }
          });
        } else {
          setProfile(null);
          setRoles([]);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  async function fetchUserData(userId: string) {
    try {
      // Fetch profile — upsert if missing
      let { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (!profileData) {
        // Profile doesn't exist yet — create with defaults
        const { data: newProfile } = await supabase
          .from("profiles")
          .insert({
            user_id: userId,
            subscription_status: "inactive",
          })
          .select("*")
          .single();
        profileData = newProfile;
      }

      if (profileData) {
        setProfile({
          ...profileData,
          subscription_status: profileData.subscription_status ?? "inactive",
        });
      }

      // Fetch roles
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      
      if (rolesData) {
        setRoles(rolesData.map((r) => r.role as AppRole));
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }

  async function signUp(email: string, password: string, fullName: string) {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: "https://app.apostandonavida.com.br",
          data: {
            full_name: fullName,
          },
        },
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  }

  function hasRole(role: AppRole): boolean {
    return roles.includes(role);
  }

  async function refreshProfile() {
    if (user?.id) {
      await fetchUserData(user.id);
    }
  }

  const value: AuthContextType = {
    user,
    session,
    profile,
    roles,
    isLoading,
    signUp,
    signIn,
    signOut,
    hasRole,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
