
import { useEffect, useState } from "react";
import api from "../api/api";
import "./Profile.css";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/Users/me");
      const user = response.data;

      setProfile(user);
      setName(user.name ?? "");
      setEmail(user.email ?? "");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Profile load nahi ho saki."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setMessage("");
    setError("");

    if (name.trim().length < 2) {
      setError("Name kam az kam 2 characters ka hona chahiye.");
      return;
    }

    try {
      setSaving(true);

      const response = await api.put("/Users/me", {
        name: name.trim(),
        email: email.trim(),
      });

      const updatedUser = response.data.user;

      setProfile(updatedUser);
      setName(updatedUser.name);
      setEmail(updatedUser.email);
      setMessage(
        response.data.message || "Profile update ho gayi."
      );

      // Local user details update, agar stored user object maujood ho.
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);

          localStorage.setItem(
            "user",
            JSON.stringify({
              ...parsedUser,
              name: updatedUser.name,
              email: updatedUser.email,
              role: updatedUser.role,
            })
          );
        } catch {
          // Invalid stored user data ko yahan ignore kiya ja raha hai.
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Profile update nahi ho saki."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="profile-page">Profile load ho rahi hai...</div>;
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <p className="profile-error">{error}</p>
          <button onClick={loadProfile}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-heading">
          <div className="profile-avatar">
            {profile.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <h1>My Profile</h1>
          <p>Apni account details dekho aur update karo.</p>
        </div>

        {message && (
          <div className="profile-success">{message}</div>
        )}

        {error && (
          <div className="profile-error">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="profile-name">Full Name</label>
          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={2}
            maxLength={100}
            required
          />

          <label htmlFor="profile-email">Email Address</label>
          <input
            id="profile-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={256}
            required
          />

          <label>Role</label>
          <input
            type="text"
            value={profile.role || "User"}
            readOnly
          />

          <label>Account Status</label>
          <input
            type="text"
            value={profile.isActive ? "Active" : "Inactive"}
            readOnly
          />

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
