import { apiRequest } from "./queryClient";
import { AuthCredentials, RegisterData, User, VerifyEmailData } from "@/types";

export async function loginUser(credentials: AuthCredentials): Promise<{ user: User; token: string }> {
  const res = await apiRequest("POST", "/api/auth/login", credentials);
  const data = await res.json();
  
  // Store user data in localStorage
  localStorage.setItem("token", data.token);
  localStorage.setItem("userId", data.user.id.toString());
  
  return data;
}

export async function registerUser(userData: RegisterData): Promise<{ user: User; verificationCode: string }> {
  const res = await apiRequest("POST", "/api/auth/register", userData);
  const data = await res.json();
  return data;
}

export async function verifyEmail(verifyData: VerifyEmailData): Promise<{ message: string }> {
  const res = await apiRequest("POST", "/api/auth/verify", verifyData);
  const data = await res.json();
  return data;
}

export async function logoutUser(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout");
  
  // Clean up localStorage
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const res = await apiRequest("GET", "/api/auth/me");
    const data = await res.json();
    return data.user;
  } catch (error) {
    return null;
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem("token");
}

export function getUserId(): number | null {
  const userId = localStorage.getItem("userId");
  return userId ? parseInt(userId) : null;
}
