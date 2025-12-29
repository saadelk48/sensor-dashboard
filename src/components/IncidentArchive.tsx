import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./IncidentArchive.css";
import { fetchArchivedIncidents } from "../services/incidentService";
import type { Incident } from "../types";
import { getFullName, getOperatorRole, clearAuthData } from "../utils/auth";

export default function IncidentArchive() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUserName = getFullName();
  const userRole = getOperatorRole();

  useEffect(() => {
    loadIncidents();
  }, []);

  async function loadIncidents() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchArchivedIncidents();
      setIncidents(data);
    } catch (err: any) {
      setError("Erreur lors du chargement des incidents archivés");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function calculateDuration(startTime: string, endTime?: string) {
    if (!endTime) return "En cours";
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const diffMinutes = Math.floor((end - start) / 60000);
    
    if (diffMinutes < 60) return `${diffMinutes} min`;
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return `${hours}h ${mins}min`;
  }

  function handleViewDetails(incidentId: number) {
    navigate(`/archive/${incidentId}`);
  }

  function handleLogout() {
    clearAuthData();
    navigate("/");
  }

  function handleBackToDashboard() {
    navigate("/dashboard");
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="main">
      <div className="archive-container">
        <div className="header-bar">
          <div className="header-left">
            <button onClick={handleBackToDashboard} className="back-btn">
              ← Tableau de bord
            </button>
            <h1>📋 Archive des Incidents</h1>
          </div>
          <div className="user-info">
            <div className="user-badge">
              <span className="user-icon">●</span>
              <div className="user-details">
                <span className="user-name">{currentUserName}</span>
                <span className="user-role">{userRole}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              Déconnexion
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-label">Total Incidents</div>
              <div className="stat-value">{incidents.length}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-content">
              <div className="stat-label">Temp. Max Enregistrée</div>
              <div className="stat-value">
                {incidents.length > 0
                  ? Math.max(...incidents.map((i) => i.maxTemperature)).toFixed(1)
                  : "0"}
                °C
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <div className="stat-label">Total Alertes</div>
              <div className="stat-value">
                {incidents.reduce((sum, i) => sum + (i.alertCount || 0), 0)}
              </div>
            </div>
          </div>
        </div>

        {incidents.length === 0 ? (
          <div className="no-data">
            <div className="no-data-icon">📭</div>
            <h3>Aucun incident archivé</h3>
            <p>Les incidents résolus apparaîtront ici</p>
          </div>
        ) : (
          <div className="incidents-table-container">
            <table className="incidents-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date de début</th>
                  <th>Date de fin</th>
                  <th>Durée</th>
                  <th>Temp. Max (°C)</th>
                  <th>Alertes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((incident) => (
                  <tr key={incident.id} className="incident-row">
                    <td className="incident-id">#{incident.id}</td>
                    <td>{new Date(incident.startTime).toLocaleString("fr-FR")}</td>
                    <td>
                      {incident.endTime
                        ? new Date(incident.endTime).toLocaleString("fr-FR")
                        : "—"}
                    </td>
                    <td>{calculateDuration(incident.startTime, incident.endTime)}</td>
                    <td className="temp-cell">{incident.maxTemperature.toFixed(1)}°C</td>
                    <td className="alert-count">
                      <span className="badge">{incident.alertCount || 0}</span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleViewDetails(incident.id)}
                        className="details-btn"
                      >
                        Détails →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}