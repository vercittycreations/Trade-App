import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase";
import {
  createUserProfile,
  defaultUserProfile,
  subscribeToUserProfile,
  updateUserProfile,
  addWatchlistSymbol,
  removeWatchlistSymbol,
  addIndicator,
  updatePreferences,
  updatePortfolio,
} from "../utils/firestore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setUserData(null);
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    const unsubscribe = subscribeToUserProfile(user.uid, async (snapshot) => {
      if (!snapshot.exists()) {
        const profile = defaultUserProfile(user);
        await createUserProfile(user);
        setUserData(profile);
        setDataLoading(false);
        return;
      }
      setUserData(snapshot.data() || null);
      setDataLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const register = async ({ email, password, displayName }) => {
    const credentials = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    await createUserProfile(credentials.user, { displayName });
  };

  const login = ({ email, password }) =>
    signInWithEmailAndPassword(auth, email, password);

  const logout = () => signOut(auth);

  const handleUpdateProfile = (updates) => {
    if (!user) return Promise.resolve();
    return updateUserProfile(user.uid, updates);
  };

  const handleAddWatchlist = (symbol) => {
    if (!user) return Promise.resolve();
    return addWatchlistSymbol(user.uid, symbol);
  };

  const handleRemoveWatchlist = (symbol) => {
    if (!user) return Promise.resolve();
    return removeWatchlistSymbol(user.uid, symbol);
  };

  const handleAddIndicator = (indicator) => {
    if (!user) return Promise.resolve();
    return addIndicator(user.uid, indicator);
  };

  const handleUpdatePreferences = (preferences) => {
    if (!user) return Promise.resolve();
    return updatePreferences(user.uid, preferences);
  };

  const handleUpdatePortfolio = (portfolio) => {
    if (!user) return Promise.resolve();
    return updatePortfolio(user.uid, portfolio);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      userData,
      dataLoading,
      register,
      login,
      logout,
      updateUserProfile: handleUpdateProfile,
      addWatchlistSymbol: handleAddWatchlist,
      removeWatchlistSymbol: handleRemoveWatchlist,
      addIndicator: handleAddIndicator,
      updatePreferences: handleUpdatePreferences,
      updatePortfolio: handleUpdatePortfolio,
    }),
    [user, loading, userData, dataLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
