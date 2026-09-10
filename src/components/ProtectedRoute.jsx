import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const user = sessionStorageStorage.getItem("user");

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;