import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, adminOnly = false }) {
  const token = sessionStorage.getItem("token");
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role?.toLowerCase() !== "admin") {
    return <Navigate to="/welcome" replace />;
  }

  return children;
}

export default ProtectedRoute;