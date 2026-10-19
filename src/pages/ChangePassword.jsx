
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "./ChangePassword.css";

export default function ChangePassword() {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (newPassword.length < 8) {
      setError("New password kam az kam 8 characters ka hona chahiye.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password aur confirm password match nahi karte.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password, current password se different hona chahiye.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.put("/Users/me/change-password", {
        currentPassword,
        newPassword,
      });

      setMessage(
        response.data?.message || "Password successfully change ho gaya."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Password change nahi ho saka. Apna current password aur login check karo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-page">
      <div className="change-password-card">
        <h1>Change Password</h1>
        <p className="password-subtitle">
          Apne account ka password securely update karo.
        </p>

        {message && (
          <div className="password-message success">{message}</div>
        )}

        {error && (
          <div className="password-message error">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="currentPassword">Current Password</label>
          <input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            autoComplete="current-password"
            required
          />

          <label htmlFor="newPassword">New Password</label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            autoComplete="new-password"
            minLength={8}
            maxLength={100}
            required
          />

          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
            minLength={8}
            maxLength={100}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/profile")}
        >
          Back to Profile
        </button>
      </div>
    </div>
  );
}
