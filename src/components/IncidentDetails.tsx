import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./IncidentDetails.css";
import { fetchIncidentById } from "../services/incidentService";
import type { Incident } from "../types";
import { getFullName, getOperatorRole, clearAuthData } from "../utils/auth";

export default function IncidentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUserName = getFullName();
  const userRole = getOperatorRole();

  useEffect(() => {
    if (id) {
      loadIncident(parseInt(id));
    }
  }, [id]);

  async function loadIncident(incidentId: number) {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchIncidentById(incidentId);
      setIncident(data);
    } catch (err: any) {
      setError("Erreur lors du chargement de l'incident");
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
    
    if (diffMinutes < 60) return `${diffMinutes} minutes`;
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return `${hours} heure${hours > 1 ? 's' : ''} ${mins} minute${mins > 1 ? 's' : ''}`;
  }

  function handleLogout() {
    clearAuthData();
    navigate("/");
  }

  function handleBackToArchive() {
    navigate("/archive");
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="main">
        <div className="details-container">
          <div className="error-page">
            <h2>❌ Erreur</h2>
            <p>{error || "Incident non trouvé"}</p>
            <button onClick={handleBackToArchive} className="back-btn">
              ← Retour à l'archive
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main">
      <div className="details-container">
        <div className="header-bar">
          <div className="header-left">
            <button onClick={handleBackToArchive} className="back-btn">
              ← Archive
            </button>
            <h1>🚨 Détails de l'Incident #{incident.id}</h1>
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

        <div className="incident-summary">
          <div className="summary-card">
            <div className="summary-icon">📅</div>
            <div className="summary-content">
              <div className="summary-label">Date de début</div>
              <div className="summary-value">
                {new Date(incident.startTime).toLocaleString("fr-FR", {
                  dateStyle: "full",
                  timeStyle: "short",
                })}
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon">🏁</div>
            <div className="summary-content">
              <div className="summary-label">Date de fin</div>
              <div className="summary-value">
                {incident.endTime
                  ? new Date(incident.endTime).toLocaleString("fr-FR", {
                      dateStyle: "full",
                      timeStyle: "short",
                    })
                  : "En cours"}
              </div>
            </div>
          </div>

          <div className="summary-card highlight">
            <div className="summary-icon">🌡️</div>
            <div className="summary-content">
              <div className="summary-label">Température maximale</div>
              <div className="summary-value temp">
                {incident.maxTemperature.toFixed(1)}°C
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon">⏱️</div>
            <div className="summary-content">
              <div className="summary-label">Durée</div>
              <div className="summary-value">
                {calculateDuration(incident.startTime, incident.endTime)}
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon">⚠️</div>
            <div className="summary-content">
              <div className="summary-label">Nombre d'alertes</div>
              <div className="summary-value">{incident.alertCount || 0}</div>
            </div>
          </div>
        </div>

        <div className="details-grid">
          <div className="details-section">
            <h2>👥 Opérateurs</h2>
            {incident.acknowledgments.length === 0 ? (
              <div className="empty-state">Aucun opérateur assigné</div>
            ) : (
              <div className="operators-list-detailed">
                {incident.acknowledgments
                  .filter((ack) => ack.operator && ack.operator.fullName) // Filter out invalid data
                  .map((ack, idx) => (
                    <div key={idx} className="operator-card">
                      <div className="operator-avatar">
                        {ack.operator.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="operator-info">
                        <div className="operator-name">{ack.operator.fullName}</div>
                        <div className="operator-email">{ack.operator.email || "N/A"}</div>
                        {ack.acknowledged && ack.ackTime && (
                        <div className="operator-ack">
                          ✓ Confirmé le{" "}
                          {new Date(ack.ackTime).toLocaleString("fr-FR")}
                        </div>
                      )}
                      {!ack.acknowledged && (
                        <div className="operator-pending">⏳ En attente</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="details-section">
            <h2>💬 Commentaires</h2>
            {incident.comments.length === 0 ? (
              <div className="empty-state">Aucun commentaire</div>
            ) : (
              <div className="comments-list-detailed">
                {incident.comments
                  .filter((comment) => comment.operator && comment.operator.fullName) // Filter out invalid data
                  .map((comment, idx) => (
                    <div key={idx} className="comment-card">
                      <div className="comment-header">
                        <div className="comment-author">
                          <span className="comment-avatar">
                            {comment.operator.fullName.charAt(0).toUpperCase()}
                          </span>
                          <span className="comment-name">
                            {comment.operator.fullName}
                          </span>
                        </div>
                        <div className="comment-time">
                          {new Date(comment.createdAt).toLocaleString("fr-FR")}
                        </div>
                      </div>
                      <div className="comment-message">{comment.message}</div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className="timeline-section">
          <h2>📊 Chronologie</h2>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-marker start"></div>
              <div className="timeline-content">
                <div className="timeline-title">🚨 Incident déclenché</div>
                <div className="timeline-time">
                  {new Date(incident.startTime).toLocaleString("fr-FR")}
                </div>
                <div className="timeline-detail">
                  Température: {incident.maxTemperature.toFixed(1)}°C
                </div>
              </div>
            </div>

            {incident.acknowledgments
              .filter((ack) => ack.acknowledged && ack.ackTime && ack.operator && ack.operator.fullName)
              .map((ack, idx) => (
                <div key={idx} className="timeline-item">
                  <div className="timeline-marker ack"></div>
                  <div className="timeline-content">
                    <div className="timeline-title">
                      ✓ Prise en charge par {ack.operator.fullName}
                    </div>
                    <div className="timeline-time">
                      {new Date(ack.ackTime!).toLocaleString("fr-FR")}
                    </div>
                  </div>
                </div>
              ))}

            {incident.comments
              .filter((comment) => comment.operator && comment.operator.fullName)
              .map((comment, idx) => (
                <div key={idx} className="timeline-item">
                  <div className="timeline-marker comment"></div>
                  <div className="timeline-content">
                    <div className="timeline-title">
                      💬 Commentaire de {comment.operator.fullName}
                    </div>
                    <div className="timeline-time">
                      {new Date(comment.createdAt).toLocaleString("fr-FR")}
                    </div>
                  <div className="timeline-detail">"{comment.message}"</div>
                </div>
              </div>
            ))}

            {incident.endTime && (
              <div className="timeline-item">
                <div className="timeline-marker end"></div>
                <div className="timeline-content">
                  <div className="timeline-title">🏁 Incident résolu</div>
                  <div className="timeline-time">
                    {new Date(incident.endTime).toLocaleString("fr-FR")}
                  </div>
                  <div className="timeline-detail">
                    Durée totale: {calculateDuration(incident.startTime, incident.endTime)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
