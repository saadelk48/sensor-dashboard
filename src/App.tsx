import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import SensorDataContainer from "./components/SensorDataContainer";
import IncidentArchive from "./components/IncidentArchive";  // ⭐ ADD THIS
import IncidentDetails from "./components/IncidentDetails";
import { isAuthenticated } from "./utils/auth";
import "./App.css";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/" />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        
        {/* Protected Routes - Require Authentication */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <SensorDataContainer />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/archive"
          element={
            <ProtectedRoute>
              <IncidentArchive />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/archive/:id"
          element={
            <ProtectedRoute>
              <IncidentDetails />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
