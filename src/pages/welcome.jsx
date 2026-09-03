import { useNavigate } from "react-router-dom";

function Welcome() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

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

        <button onClick={logout}>
          Logout
        </button>

      </div>

    </div>
  );
}

export default Welcome;