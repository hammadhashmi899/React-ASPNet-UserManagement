import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/api";

function Welcome() {
  const navigate = useNavigate();

  const user = JSON.parse(
    sessionStorage.getItem("user") || "{}"
  );

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isAdmin = user.role?.toLowerCase() === "admin";

  useEffect(() => {
    const getDashboardStats = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/Dashboard/stats");

        setStats({
          totalUsers: response.data.totalUsers || 0,
          activeUsers: response.data.activeUsers || 0,
          inactiveUsers: response.data.inactiveUsers || 0,
        });
      } catch (error) {
        console.error("Dashboard Error:", error);

        setError(
          error.userMessage || "Unable to load dashboard statistics."
        );
      } finally {
        setLoading(false);
      }
    };

    getDashboardStats();
  }, []);

  const logout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    navigate("/");
  };

  return (
    <div className="page">
      <div className="welcome-box">

        <h1>
          Welcome {user.name || "User"}!
        </h1>

        <p>
          Email: {user.email || ""}
        </p>

        <p>
          Role: {user.role || "User"}
        </p>

        <h2>Dashboard</h2>

        {error && (
          <p className="error">
            {error}
          </p>
        )}

        <div className="dashboard-stats">

          <div className="stat-card">
            <h3>Total Users</h3>

            <strong>
              {loading ? "..." : stats.totalUsers}
            </strong>
          </div>

          <div className="stat-card">
            <h3>Active Users</h3>

            <strong>
              {loading ? "..." : stats.activeUsers}
            </strong>
          </div>

          <div className="stat-card">
            <h3>Inactive Users</h3>

            <strong>
              {loading ? "..." : stats.inactiveUsers}
            </strong>
          </div>

        </div>

        <div className="dashboard-actions">

          <button
            onClick={() => navigate("/crud")}
          >
            Manage Emails
          </button>

          <button
            onClick={() => navigate("/users")}
          >
            Manage Users
          </button>

          {isAdmin && (
            <button
              onClick={() => navigate("/audit-logs")}
            >
              Audit Logs
            </button>
          )}

          <button onClick={logout}>
            Logout
          </button>

        </div>

      </div>
    </div>
  );
}

export default Welcome;