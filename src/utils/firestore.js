import {
  arrayRemove,
  arrayUnion,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

export const defaultUserProfile = (user, overrides = {}) => ({
  userId: user.uid,
  email: user.email,
  displayName: user.displayName || overrides.displayName || "",
  watchlist: [],
  portfolioHoldings: [],
  tradeHistory: [],
  realizedPL: 0,
  cashBalance: 100000,
  transactionCostPct: 0.2,
  appliedIndicators: [],
  preferences: {
    theme: "light",
    baseCurrency: "USD",
  },
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...overrides,
});

export const userDocRef = (uid) => doc(db, "users", uid);

export const createUserProfile = async (user, overrides = {}) => {
  const payload = defaultUserProfile(user, overrides);
  await setDoc(userDocRef(user.uid), payload, { merge: true });
};

export const subscribeToUserProfile = (uid, callback) =>
  onSnapshot(userDocRef(uid), callback);

export const updateUserProfile = async (uid, updates) => {
  await updateDoc(userDocRef(uid), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const addWatchlistSymbol = async (uid, symbol) => {
  await updateDoc(userDocRef(uid), {
    watchlist: arrayUnion(symbol),
    updatedAt: serverTimestamp(),
  });
};

export const removeWatchlistSymbol = async (uid, symbol) => {
  await updateDoc(userDocRef(uid), {
    watchlist: arrayRemove(symbol),
    updatedAt: serverTimestamp(),
  });
};

export const addIndicator = async (uid, indicator) => {
  await updateDoc(userDocRef(uid), {
    appliedIndicators: arrayUnion(indicator),
    updatedAt: serverTimestamp(),
  });
};

export const updatePreferences = async (uid, preferences) => {
  await updateDoc(userDocRef(uid), {
    preferences,
    updatedAt: serverTimestamp(),
  });
};

export const updatePortfolio = async (uid, portfolio) => {
  await updateDoc(userDocRef(uid), {
    ...portfolio,
    updatedAt: serverTimestamp(),
  });
};
