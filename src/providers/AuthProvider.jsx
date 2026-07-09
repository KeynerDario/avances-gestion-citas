import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          roles (name, permissions),
          dependencies (name)
        `)
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error("Error cargando perfil", err);
      setError("No se pudo cargar el perfil de usuario");
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    checkSession();

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === "SIGNED_IN" && session?.user) {
            setUser(session.user);
            await fetchProfile(session.user.id);
          } else if (event === "PASSWORD_RECOVERY") {
            setUser(session?.user || null);
          } else if (event === "SIGNED_OUT") {
            setUser(null);
            setProfile(null);
          }
        },
      );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const signUp = async (email, password, userData) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
            document_number: userData.document_number,
            role: userData.role || "APRENDIZ",
            dependency_id: userData.dependency_id || null,
          },
        },
      });
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetPassword = async (email) => {
    try {
      setError(null);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const hasRole = (requiredRoles) => {
    if (!profile?.roles?.name) return false;
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(profile.roles.name);
    }
    return profile.roles.name === requiredRoles;
  };

  const isAdmin = () => hasRole("SUPERADMIN");
  const isCoordination = () => hasRole(["COORDINACION", "SUPERADMIN"]);
  const isProfessional = () => hasRole("PROFESIONAL");
  const isAprendiz = () => hasRole("APRENDIZ");

  const value = {
    user,
    profile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshProfile,
    hasRole,
    isAdmin,
    isCoordination,
    isProfessional,
    isAprendiz,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
