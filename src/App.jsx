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

function App() {
  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>

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

        <Route path="/login" element={<Login />} />

        <Route path="/signup" element={<Signup />} />

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

      </Routes>
    </BrowserRouter>
  );
}

export default App;