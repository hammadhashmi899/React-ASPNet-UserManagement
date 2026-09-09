import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/login";
import Signup from "./pages/Signup";
import Welcome from "./pages/welcome";
import Crud from "./pages/context/Crud";
import Users from "./pages/context/Users";

function App() {
  const token = sessionStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>

        {/* Default page */}
        <Route
          path="/"
          element={
            token ? (
              <Navigate to="/welcome" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Login */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* Signup */}
        <Route
          path="/signup"
          element={<Signup />}
        />

        {/* Welcome */}
        <Route
          path="/welcome"
          element={
            token ? (
              <Welcome />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Email CRUD */}
        <Route
          path="/crud"
          element={
            token ? (
              <Crud />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Users Management */}
        <Route
          path="/users"
          element={
            token ? (
              <Users />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;