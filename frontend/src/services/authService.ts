import { apiClient } from "./apiClient";

export function loginUser(email: string, password: string) {
  return apiClient("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export function getCurrentUser() {
  return apiClient("/auth/me");
}

export function logoutUser() {
  return apiClient("/auth/logout", {
    method: "POST",
  });
}