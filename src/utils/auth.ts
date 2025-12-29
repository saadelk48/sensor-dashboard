export function getOperatorId(): number | null {
  const opId = localStorage.getItem('operatorId');
  return opId ? parseInt(opId, 10) : null;
}

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function getOperatorEmail(): string | null {
  const token = getToken();
  if (!token) return null;
  
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    return decoded.sub || null;
  } catch (e) {
    console.error('Error decoding token:', e);
    return null;
  }
}

export function getOperatorRole(): string | null {
  // Get role from localStorage
  const role = localStorage.getItem('role');
  console.log("Role from localStorage:", role); // Debug log
  return role;
}

export function setAuthData(token: string, operatorId?: number, fullName?: string, role?: string): void {
  localStorage.setItem('token', token);
  
  if (operatorId) {
    localStorage.setItem('operatorId', operatorId.toString());
  }
  
  if (fullName) {
    localStorage.setItem('fullName', fullName);
  } else {
    const email = getOperatorEmail();
    if (email) {
      localStorage.setItem('fullName', email);
    }
  }
  
  if (role) {
    localStorage.setItem('role', role);
    console.log("Role saved to localStorage:", role); // Debug log
  }
}

export function clearAuthData(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('operatorId');
  localStorage.removeItem('fullName');
  localStorage.removeItem('role');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function getFullName(): string | null {
  return localStorage.getItem('fullName');
}