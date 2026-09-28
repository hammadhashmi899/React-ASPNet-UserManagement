import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/login";
import Signup from "./pages/signup";
import Welcome from "./pages/welcome";
import Crud from "./pages/context/Crud";
import Users from "./pages/context/Users";

function ProtectedRoute({ children }) {
  const token = sessionStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function HomeRedirect() {
  const token = sessionStorage.getItem("token");

  return token ? (
    <Navigate to="/welcome" replace />
  ) : (
    <Navigate to="/login" replace />
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />

        <Route path="/login" element={<Login />} />

        <Route path="/signup" element={<Signup />} />

        <Route
          path="/welcome"
          element={
            <ProtectedRoute>
              <Welcome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/crud"
          element={
            <ProtectedRoute>
              <Crud />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
