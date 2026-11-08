import { apiClient } from "./apiClient";

export async function loginUser(email: string, password: string) {
  return apiClient("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}