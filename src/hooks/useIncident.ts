import { useEffect, useState } from "react";
import  type { Incident } from "../types";
import { fetchActiveIncident } from "../services/incidentService";

export function useIncident() {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const data = await fetchActiveIncident();
      if (!data || Object.keys(data).length === 0) {
        setIncident(null);
      } else {
        setIncident(data);
      }
    } catch (err) {
      setIncident(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, []);

  return { incident, loading, refresh: load };
}