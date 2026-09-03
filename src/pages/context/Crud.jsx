import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../api/api";
function Crud() {
  const navigate = useNavigate();

  const [emails, setEmails] = useState([]);

  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const getEmails = async () => {
    try {
      setError("");

      const response = await api.get(
        "/Values"
      );

      setEmails(response.data);

    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
        "Failed to load emails."
      );
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

      const data = {
        email: email.trim(),
        description: description.trim(),
      };

      if (editingId === null) {

        await api.post(
          "/Values",
          data
        );

      } else {

        await api.put(
          `/Values/${editingId}`,
          data
        );

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
  };

  const deleteEmail = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this?"
    );

    if (!confirmed) {
      return;
    }

    try {

      await api.delete(
        `/Values/${id}`
      );

      await getEmails();

    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
        "Delete failed."
      );
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

          <h1>
            Manage Emails
          </h1>

          <button
            onClick={() =>
              navigate("/welcome")
            }
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
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

          <input
            type="text"
            placeholder="Description"
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
              ? "Add"
              : "Update"}
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

              {emails.length === 0 ? (

                <tr>
                  <td colSpan="4">
                    No records found.
                  </td>
                </tr>

              ) : (

                emails.map((item) => (

                  <tr key={item.id}>

                    <td>
                      {item.id}
                    </td>

                    <td>
                      {item.email}
                    </td>

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