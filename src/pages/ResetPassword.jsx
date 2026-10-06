import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../api/api";

function ResetPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState(
    sessionStorage.getItem("resetEmail") || ""
  );

  const [token, setToken] = useState(
    sessionStorage.getItem("resetToken") || ""
  );

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!token.trim()) {
      setError("Reset token is required.");
      return;
    }

    if (!newPassword) {
      setError("New password is required.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/Auth/reset-password", {
        email: email.trim(),
        token: token.trim(),
        newPassword,
      });

      setMessage(response.data.message);

      // Remove reset information after successful reset
      sessionStorage.removeItem("resetToken");
      sessionStorage.removeItem("resetEmail");

      setNewPassword("");
      setConfirmPassword("");

    } catch (error) {
      console.error("Reset Password Error:", error);

      setError(
        error.userMessage ||
          error.response?.data?.message ||
          "Password reset failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="auth-box">
        <h1>Reset Password</h1>

        <p>
          Enter your reset token and choose a new password.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />

          <input
            type="text"
            placeholder="Reset Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            disabled={loading}
          />

          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
          />

          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            disabled={loading}
          />

          {error && <p className="error">{error}</p>}

          {message && (
            <p className="success">{message}</p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        {message && (
          <button
            type="button"
            onClick={() => navigate("/login")}
          >
            Go to Login
          </button>
        )}

        <p>
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;