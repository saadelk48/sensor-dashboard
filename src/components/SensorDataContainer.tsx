import { useState, useMemo, useEffect } from "react";
import { useSensorData } from "../hooks/useSensorData";
import ReactApexChart from "react-apexcharts";
import "./SensorDataContainer.css";
import { useIncident } from "../hooks/useIncident";
import { sendAck, sendComment } from "../services/incidentService";
import { getOperatorEmail, clearAuthData, getFullName, getOperatorRole, getOperatorId } from "../utils/auth";
import { useNavigate } from "react-router-dom";

function fixDate(str: string) {
  return str.includes(".") ? str.split(".")[0] : str;
}

export default function SensorDataContainer() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every second for accurate relative timestamps
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  function timeAgo(dateString: string) {
    // FIX: If timestamp doesn't have 'Z', add it to treat as UTC
    const fixedDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const past = new Date(fixedDateString).getTime();
    const diff = Math.floor((currentTime - past) / 1000);

    if (diff < 60) return `Il y a ${diff} sec`;
    if (diff < 3600) {
      const minutes = Math.floor(diff / 60);
      return `Il y a ${minutes} ${minutes === 1 ? 'min' : 'mins'}`;
    }
    if (diff < 86400) {
      const hours = Math.floor(diff / 3600);
      return `Il y a ${hours} ${hours === 1 ? 'heure' : 'heures'}`;
    }
    const days = Math.floor(diff / 86400);
    return `Il y a ${days} ${days === 1 ? 'jour' : 'jours'}`;
  }

  const { incident, loading: incidentLoading, refresh } = useIncident();

  const currentOperatorEmail = getOperatorEmail();
  const currentUserName = getFullName();
  const userRole = getOperatorRole();

  const shouldSeeIncident = useMemo(() => {
    if (!incident) return false;
    const alertCount = incident.alertCount || 0;
    const role = userRole?.toUpperCase();

    if (alertCount < 3) {
      return role === "OPERATOR";
    } else if (alertCount <= 6) {
      return role === "OPERATOR" || role === "SUPERVISOR";
    } else {
      return role === "OPERATOR" || role === "SUPERVISOR" || role === "DIRECTOR";
    }
  }, [incident, userRole]);

  const myAcknowledgment = useMemo(() => {
    if (!incident || !currentOperatorEmail || !shouldSeeIncident) {
      return null;
    }
    const ack = incident.acknowledgments.find(
      (ack) => ack.operator.email.toLowerCase() === currentOperatorEmail.toLowerCase()
    );
    return ack;
  }, [incident, currentOperatorEmail, shouldSeeIncident]);

  const myComments = useMemo(() => {
    if (!incident || !shouldSeeIncident) return [];
    return incident.comments;
  }, [incident, shouldSeeIncident]);

  const currentOperatorId = myAcknowledgment?.operator.id ?? getOperatorId();
  const displayOperatorName = myAcknowledgment?.operator.fullName || currentUserName;

  async function handleAck() {
    if (!currentOperatorId) {
      console.error("No operator ID found");
      return;
    }
    await sendAck(currentOperatorId);
    refresh();
  }

  async function handleComment(text: string) {
    if (!text.trim() || !currentOperatorId) {
      console.error("No text or no operator ID");
      return;
    }
    await sendComment(currentOperatorId, text);
    refresh();
  }

  function handleLogout() {
    clearAuthData();
    navigate("/");
  }

  // CSV Export Function
  function exportToCSV() {
    // Determine which data to export based on custom date range
    let dataToExport = day; // Default to today's data
    let dateRangeLabel = "aujourd'hui";

    // If user has entered custom dates, export that range
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      dataToExport = all.filter((row) => {
        const rowDate = new Date(fixDate(row.createdAt));
        return rowDate >= start && rowDate <= end;
      });
      
      dateRangeLabel = `${startDate}_${endDate}`;
    }

    if (dataToExport.length === 0) {
      alert("Aucune donnée à exporter pour cette période");
      return;
    }

    // Create CSV content
    const headers = ["ID", "Température (°C)", "Humidité (%)", "Date et Heure"];
    const csvRows = [
      headers.join(","),
      ...dataToExport.map(row => [
        row.id,
        row.temp.toFixed(2),
        row.hum.toFixed(2),
        new Date(fixDate(row.createdAt)).toLocaleString('fr-FR')
      ].join(","))
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    // Create download link with dynamic filename
    const link = document.createElement("a");
    link.href = url;
    link.download = `mesures_dht11_${dateRangeLabel}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const { data, all, day, month, year, loading, error } = useSensorData();

  const [filter, setFilter] = useState<"all" | "day" | "month" | "year" | "custom">("day");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const filteredData = useMemo(() => {
    if (filter === "day") return day;
    if (filter === "month") return month;
    if (filter === "year") return year;
    if (filter === "custom" && startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      return all.filter((row) => {
        const rowDate = new Date(fixDate(row.createdAt));
        return rowDate >= start && rowDate <= end;
      });
    }
    return all;
  }, [filter, startDate, endDate, all, day, month, year]);

  // Temperature Chart Configuration
  const tempChartOptions: any = {
    chart: {
      type: 'area',
      height: 350,
      animations: {
        enabled: true,
        easing: 'smooth',
        speed: 800
      },
      toolbar: {
        show: false
      },
      background: 'transparent',
      fontFamily: '"Geist Mono", monospace'
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.2,
        stops: [0, 90, 100]
      }
    },
    xaxis: {
      type: 'datetime',
      categories: filteredData.map((row) => new Date(fixDate(row.createdAt)).getTime()),
      labels: {
        style: {
          colors: '#94a3b8',
          fontSize: '11px'
        },
        datetimeFormatter: {
          year: 'yyyy',
          month: 'MMM \'yy',
          day: 'dd MMM',
          hour: 'HH:mm'
        }
      }
    },
    yaxis: {
      title: {
        text: 'Température (°C)',
        style: {
          color: '#f87171',
          fontSize: '13px',
          fontWeight: 600
        }
      },
      labels: {
        style: {
          colors: '#94a3b8',
          fontSize: '12px'
        },
        formatter: (val: number) => val.toFixed(1)
      }
    },
    tooltip: {
      theme: 'dark',
      x: {
        format: 'dd MMM HH:mm'
      },
      y: {
        formatter: (val: number) => `${val.toFixed(1)} °C`
      }
    },
    grid: {
      borderColor: '#1e293b',
      strokeDashArray: 4
    },
    colors: ['#f87171']
  };

  const tempChartSeries = [{
    name: 'Température',
    data: filteredData.map((row) => row.temp)
  }];

  // Humidity Chart Configuration
  const humChartOptions: any = {
    chart: {
      type: 'area',
      height: 350,
      animations: {
        enabled: true,
        easing: 'smooth',
        speed: 800
      },
      toolbar: {
        show: false
      },
      background: 'transparent',
      fontFamily: '"Geist Mono", monospace'
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.2,
        stops: [0, 90, 100]
      }
    },
    xaxis: {
      type: 'datetime',
      categories: filteredData.map((row) => new Date(fixDate(row.createdAt)).getTime()),
      labels: {
        style: {
          colors: '#94a3b8',
          fontSize: '11px'
        },
        datetimeFormatter: {
          year: 'yyyy',
          month: 'MMM \'yy',
          day: 'dd MMM',
          hour: 'HH:mm'
        }
      }
    },
    yaxis: {
      title: {
        text: 'Humidité (%)',
        style: {
          color: '#60a5fa',
          fontSize: '13px',
          fontWeight: 600
        }
      },
      labels: {
        style: {
          colors: '#94a3b8',
          fontSize: '12px'
        },
        formatter: (val: number) => val.toFixed(1)
      }
    },
    tooltip: {
      theme: 'dark',
      x: {
        format: 'dd MMM HH:mm'
      },
      y: {
        formatter: (val: number) => `${val.toFixed(1)} %`
      }
    },
    grid: {
      borderColor: '#1e293b',
      strokeDashArray: 4
    },
    colors: ['#60a5fa']
  };

  const humChartSeries = [{
    name: 'Humidité',
    data: filteredData.map((row) => row.hum)
  }];

  if (loading) return <div className="loading-container"><div className="loader"></div></div>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="main">
      <div className="dashboard">
        <div className="header-bar">
          <div className="header-left">
            <div className="logo">DHT11</div>
            <h1>Surveillance Environnementale</h1>
          </div>
          <div className="user-info">
            <button onClick={() => navigate("/archive")} className="archive-btn">
              📋 Archive
            </button>
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

        <div className="filter-section">
          <div className="filter-buttons">
            <button className={filter === "day" ? "active" : ""} onClick={() => setFilter("day")}>
              Aujourd'hui
            </button>
            <button className={filter === "month" ? "active" : ""} onClick={() => setFilter("month")}>
              Ce mois
            </button>
            <button className={filter === "year" ? "active" : ""} onClick={() => setFilter("year")}>
              Cette année
            </button>
            <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
              Tout
            </button>
            <button className="export-btn" onClick={exportToCSV}>
              📥 Exporter CSV
            </button>
          </div>

          <div className="date-range">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <span className="date-separator">→</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <button onClick={() => setFilter("custom")} className={filter === "custom" ? "active" : ""}>
              Appliquer
            </button>
          </div>
        </div>

        <div className="cards-grid">
          <div className="metric-card temp-card">
            <div className="metric-icon">🌡️</div>
            <div className="metric-content">
              <div className="metric-label">Température</div>
              <div className="metric-value">{data?.temp.toFixed(1)}°</div>
              <div className="metric-time">{data ? timeAgo(fixDate(data.createdAt)) : ""}</div>
            </div>
            <div className="metric-glow temp-glow"></div>
          </div>

          <div className="metric-card hum-card">
            <div className="metric-icon">💧</div>
            <div className="metric-content">
              <div className="metric-label">Humidité</div>
              <div className="metric-value">{data?.hum.toFixed(1)}%</div>
              <div className="metric-time">{data ? timeAgo(fixDate(data.createdAt)) : ""}</div>
            </div>
            <div className="metric-glow hum-glow"></div>
          </div>
        </div>

        <div className="charts-container">
          <div className="chart-wrapper">
            <div className="chart-header">
              <h3>Température</h3>
              <div className="chart-badge temp-badge">DHT11</div>
            </div>
            <ReactApexChart 
              options={tempChartOptions} 
              series={tempChartSeries} 
              type="area" 
              height={300} 
            />
          </div>

          <div className="chart-wrapper">
            <div className="chart-header">
              <h3>Humidité</h3>
              <div className="chart-badge hum-badge">DHT11</div>
            </div>
            <ReactApexChart 
              options={humChartOptions} 
              series={humChartSeries} 
              type="area" 
              height={300} 
            />
          </div>
        </div>

        {incident && shouldSeeIncident && (
          <div className="incident-panel">
            <div className="incident-header">
              <h2>🚨 Incident Actif</h2>
              <div className="alert-badge">Alerte #{incident.alertCount || 0}</div>
            </div>

            {incidentLoading && <p className="loading-text">Chargement...</p>}

            {!incidentLoading && incident && (
              <div className="incident-content">
                <div className="incident-info">
                  <div className="info-item">
                    <span className="info-label">ID Incident</span>
                    <span className="info-value">#{incident.id}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Température Max</span>
                    <span className="info-value temp-value">{incident.maxTemperature}°C</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Début</span>
                    <span className="info-value">{new Date(incident.startTime).toLocaleString('fr-FR')}</span>
                  </div>
                </div>

                <div className="operator-section">
                  <div className="operator-header">
                    <h4>{displayOperatorName}</h4>
                  </div>

                  {!myAcknowledgment?.acknowledged ? (
                    <button onClick={handleAck} disabled={!currentOperatorId} className="ack-btn">
                      Confirmer la prise en charge
                    </button>
                  ) : (
                    <div className="ack-status">
                      ✓ Confirmé le {myAcknowledgment.ackTime ? new Date(myAcknowledgment.ackTime).toLocaleString('fr-FR') : ""}
                    </div>
                  )}

                  <div className="comments-section">
                    <h5>Commentaires</h5>
                    <div className="comments-list">
                      {myComments.length === 0 && (
                        <div className="no-comments">Aucun commentaire</div>
                      )}
                      {myComments.map((c, i) => (
                        <div key={i} className="comment-item">
                          <div className="comment-time">{new Date(c.createdAt).toLocaleString('fr-FR')}</div>
                          <div className="comment-text">{c.message}</div>
                        </div>
                      ))}
                    </div>

                    <input
                      type="text"
                      className="comment-input"
                      placeholder="Ajouter un commentaire..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleComment((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = "";
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {incident && !shouldSeeIncident && (
          <div className="incident-panel incident-restricted">
            <div className="incident-header">
              <h2>🔒 Incident Restreint</h2>
            </div>
            <p className="restricted-message">
              Aucun incident accessible pour votre rôle actuellement.
            </p>
            <p className="restricted-info">
              Alertes: {incident.alertCount || 0} / Votre rôle: {userRole}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
