import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, fetchCurrentUser } from "../services/authService";
import { setAuthData } from "../utils/auth";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("=== STEP 1: Logging in ===");
      const response = await login({ email, password });
      console.log("✓ Login successful");
      console.log("Token received:", response.token);
      
      console.log("=== STEP 2: Fetching user info ===");
      try {
        const userInfo = await fetchCurrentUser(response.token);
        console.log("✓ User info fetched successfully:");
        console.log("Full response:", userInfo);
        console.log("ID:", userInfo.id);
        console.log("Full Name:", userInfo.fullName);
        console.log("Email:", userInfo.email);
        console.log("Role:", userInfo.role);
        
        console.log("=== STEP 3: Saving to localStorage ===");
        setAuthData(response.token, userInfo.id, userInfo.fullName, userInfo.role);
        
        console.log("✓ Auth data saved");
        console.log("Verify - Role in localStorage:", localStorage.getItem('role'));
        console.log("Verify - ID in localStorage:", localStorage.getItem('operatorId'));
        console.log("Verify - Name in localStorage:", localStorage.getItem('fullName'));
        
      } catch (userError: any) {
        console.error("✗ Failed to fetch user info:");
        console.error("Error:", userError);
        console.error("Error message:", userError.message);
        setAuthData(response.token);
      }
      
      console.log("=== STEP 4: Navigating to dashboard ===");
      navigate("/dashboard");
    } catch (err: any) {
      console.error("✗ Login error:", err);
      setError(err.message || "Email ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>
      
      <div className="login-box">
        <div className="login-header">
          <div className="logo-large">DHT11</div>
          <h1>Surveillance Environnementale</h1>
          <p>Connectez-vous pour accéder au tableau de bord</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Adresse Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="exemple@email.com"
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Entrez votre mot de passe"
            />
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? (
              <>
                <span className="spinner"></span>
                Connexion en cours...
              </>
            ) : (
              "Se connecter"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
