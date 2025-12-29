import type { Incident } from '../types';
import { getToken } from '../utils/auth';

const API = "http://localhost:8080/api/incidents";

export async function fetchActiveIncident(): Promise<Incident | null> {
  const token = getToken();
  const res = await fetch(`${API}/active`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!res.ok) return null;
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
}

// Updated to match your backend endpoint structure
export async function fetchArchivedIncidents(): Promise<Incident[]> {
  const token = getToken();
  const res = await fetch(`${API}/archive`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!res.ok) throw new Error("Failed to fetch archived incidents");
  return res.json();
}

// Updated to match your backend endpoint structure
export async function fetchIncidentById(id: number): Promise<Incident> {
  const token = getToken();
  const res = await fetch(`${API}/archive/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!res.ok) throw new Error("Failed to fetch incident details");
  return res.json();
}

export async function sendAck(operatorId: number): Promise<void> {
  const token = getToken();
  await fetch(`${API}/${operatorId}/ack`, {
    method: "POST",
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}

export async function sendComment(operatorId: number, message: string): Promise<void> {
  const token = getToken();
  await fetch(`${API}/${operatorId}/comment`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ message })
  });
}
