import { useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");

  const [message, setMessage] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setResetToken("");
    setError("");

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/Auth/forgot-password", {
        email: email.trim(),
      });

      setMessage(response.data.message);

      // Get reset token from backend response
      if (response.data.resetToken) {
        setResetToken(response.data.resetToken);

        // Save token for Reset Password page
        sessionStorage.setItem(
          "resetToken",
          response.data.resetToken
        );

        sessionStorage.setItem(
          "resetEmail",
          email.trim().toLowerCase()
        );
      }
    } catch (error) {
      console.error("Forgot Password Error:", error);

      setError(
        error.userMessage ||
          error.response?.data?.message ||
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="auth-box">
        <h1>Forgot Password?</h1>

        <p>
          Enter your email address to reset your password.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />

          {error && (
            <p className="error">
              {error}
            </p>
          )}

          {message && (
            <div className="success">
              <p>{message}</p>

              {resetToken && (
                <p
                  style={{
                    marginTop: "10px",
                    wordBreak: "break-all",
                  }}
                >
                  <strong>Reset Token:</strong>
                  <br />
                  {resetToken}
                </p>
              )}
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p>
          <Link to="/reset-password">
            Go to Reset Password
          </Link>
        </p>

        <p>
          <Link to="/login">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;