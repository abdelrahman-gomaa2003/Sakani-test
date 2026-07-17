import { createContext, useState, useEffect } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    if (!userId) return null;
    const { data, error } = await authService.getProfile(userId);
    if (error) {
      console.warn("Profile fetch error:", error.message);
      return null;
    }
    return data;
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { user: currentUser } = await authService.getUser();
        if (currentUser) {
          setUser(currentUser);
          const prof = await fetchProfile(currentUser.id);
          setProfile(prof);
        }
      } catch (e) {
        console.warn("Auth init error:", e);
      }
      setLoading(false);
    };
    init();

    const { data: { subscription } } = authService.onAuthStateChange(
      async (newUser) => {
        setUser(newUser);
        if (newUser) {
          const prof = await fetchProfile(newUser.id);
          setProfile(prof);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      const prof = await fetchProfile(user.id);
      setProfile(prof);
    }
  };

  const signUp = async ({ email, password, fullName, role, verificationStatus }) => {
    const { data, error } = await authService.signUp({ email, password, fullName, role });
    if (!error && data?.user) {
      await new Promise((r) => setTimeout(r, 1000));

      let prof = await fetchProfile(data.user.id);

      if (!prof) {
        const profileData = {
          id: data.user.id,
          full_name: fullName,
          email: email,
          role: role,
        };
        if (verificationStatus) {
          profileData.verification_status = verificationStatus;
        }
        const { error: insertError } = await authService.createProfile(profileData);
        if (insertError) {
          console.warn("Manual profile create failed:", insertError.message);
        }
      } else if (verificationStatus && prof.verification_status !== verificationStatus) {
        await authService.updateProfile(data.user.id, { verification_status: verificationStatus });
      }
    }
    return { data, error };
  };

  const signIn = async ({ email, password }) => {
    const { data, error } = await authService.signIn({ email, password });
    if (!error && data?.user) {
      setUser(data.user);
      const prof = await fetchProfile(data.user.id);
      setProfile(prof);
    }
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await authService.signOut();
    if (!error) {
      setUser(null);
      setProfile(null);
    }
    return { error };
  };

  const reauthenticate = async (email, password) => {
    const { error } = await authService.reauthenticate(email, password);
    return { error };
  };

  const updatePassword = async (newPassword) => {
    const { data, error } = await authService.updatePassword(newPassword);
    return { data, error };
  };

  const isLoggedIn = !!user;

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, isLoggedIn, signUp, signIn, signOut, refreshProfile, reauthenticate, updatePassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
