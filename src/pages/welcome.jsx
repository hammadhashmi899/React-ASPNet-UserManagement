import { useNavigate } from "react-router-dom";

function Welcome() {
  const navigate = useNavigate();

  const user = JSON.parse(
    sessionStorage.getItem("user") || "{}"
  );

  const logout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    navigate("/login");
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

        <button onClick={logout}>
          Logout
        </button>

      </div>

    </div>
  );
}

export default Welcome;