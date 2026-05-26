import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "../types";
import { hasToken, loadStoredUser } from "../services/authService";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: loadStoredUser(),
  isAuthenticated: hasToken() && Boolean(loadStoredUser()),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearUser(state) {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
