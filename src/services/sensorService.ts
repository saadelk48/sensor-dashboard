import type { SensorData } from '../types';
import   { getToken } from '../utils/auth';

const API_URL = "http://localhost:8080/api/measurements";

export async function fetchSensorData(): Promise<SensorData[]> {
  const token = getToken();
  const response = await fetch(API_URL, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) throw new Error("Failed to fetch sensor data");
  
  const raw = await response.json();
  return raw.map((m: any) => ({
    id: m.id,
    temp: m.temperature,
    hum: m.humidity,
    createdAt: m.timestamp
  }));
}