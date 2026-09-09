
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../api/api";

function Crud() {
  const navigate = useNavigate();

  const [emails, setEmails] = useState([]);

  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getEmails = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/Values");

      setEmails(response.data);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
        "Failed to load emails."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getEmails();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    try {
      setLoading(true);

      if (editingId === null) {
        await api.post("/Values", {
          email: email.trim(),
          description: description.trim(),
        });
      } else {
        await api.put(`/Values/${editingId}`, {
          id: editingId,
          email: email.trim(),
          description: description.trim(),
        });
      }

      setEmail("");
      setDescription("");
      setEditingId(null);

      await getEmails();
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
        "Operation failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const editEmail = (item) => {
    setEditingId(item.id);
    setEmail(item.email);
    setDescription(item.description || "");
    setError("");
  };

  const deleteEmail = async (id) => {
    const confirmDelete = window.confirm(
      "Confirm this email to delete?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.delete(`/Values/${id}`);

      await getEmails();
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
        "Delete failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEmail("");
    setDescription("");
    setError("");
  };

  return (
    <div className="crud-page">
      <div className="crud-container">

        <div className="crud-header">
          <h1>Email Management</h1>

          <button
            onClick={() => navigate("/welcome")}
          >
            Back
          </button>
        </div>

        <form
          className="crud-form"
          onSubmit={handleSubmit}
        >
          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

          <input
            type="text"
            placeholder="Enter description"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
          />

          <button
            type="submit"
            disabled={loading}
          >
            {editingId === null
              ? "Add Email"
              : "Update Email"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              onClick={cancelEdit}
            >
              Cancel
            </button>
          )}
        </form>

        {error && (
          <p className="error">
            {error}
          </p>
        )}

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4">
                    Loading...
                  </td>
                </tr>
              ) : emails.length === 0 ? (
                <tr>
                  <td colSpan="4">
                    No emails found.
                  </td>
                </tr>
              ) : (
                emails.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>

                    <td>{item.email}</td>

                    <td>
                      {item.description}
                    </td>

                    <td>
                      <button
                        onClick={() =>
                          editEmail(item)
                        }
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          deleteEmail(item.id)
                        }
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

export default Crud;
