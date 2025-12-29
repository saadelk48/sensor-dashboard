import { useEffect, useState } from "react";
import type { SensorData } from "../types";
import { fetchSensorData } from "../services/sensorService";

function fixDate(str: string) {
  return str.includes(".") ? str.split(".")[0] : str;
}

export function useSensorData() {
  const [data, setData] = useState<SensorData | null>(null);
  const [all, setAll] = useState<SensorData[]>([]);
  const [day, setDay] = useState<SensorData[]>([]);
  const [month, setMonth] = useState<SensorData[]>([]);
  const [year, setYear] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const rawData = await fetchSensorData();
        setAll(rawData);
        setData(rawData[rawData.length - 1] || null);

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        setDay(rawData.filter(r => new Date(fixDate(r.createdAt)) >= startOfDay));
        setMonth(rawData.filter(r => new Date(fixDate(r.createdAt)) >= startOfMonth));
        setYear(rawData.filter(r => new Date(fixDate(r.createdAt)) >= startOfYear));

        setLoading(false);
      } catch (err) {
        setError("Failed to load sensor data");
        setLoading(false);
      }
    }

    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, []);

  return { data, all, day, month, year, loading, error };
}