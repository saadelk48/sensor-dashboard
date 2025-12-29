import type { LoginCredentials, LoginResponse } from '../types';

const API_URL = "https://coldchain-backend-8hma.onrender.com/api/auth";

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Login error response:", errorText);
      
      if (response.status === 401) {
        throw new Error("Email ou mot de passe incorrect");
      } else if (response.status === 404) {
        throw new Error("Service de connexion non disponible");
      } else {
        throw new Error(`Erreur de connexion (${response.status})`);
      }
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Login failed:", error);
    throw error;
  }
}

export async function fetchCurrentUser(token: string): Promise<{ id: number; fullName: string; email: string; role: string }> {
  console.log("Calling /api/auth/me with token:", token.substring(0, 20) + "...");
  
  try {
    const response = await fetch(`${API_URL}/me`, {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log("Response status from /me:", response.status);
    console.log("Response ok:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response from /me:", errorText);
      throw new Error(`Failed to fetch user info: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Raw response from /me:", data);
    
    return data;
  } catch (error: any) {
    console.error("Exception in fetchCurrentUser:", error);
    throw error;
  }
}

export async function register(credentials: LoginCredentials & { fullName: string }): Promise<void> {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(credentials)
  });

  if (!response.ok) {
    throw new Error("Registration failed");
  }
}
