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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const emailsPerPage = 5;

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

  // -----------------------------
  // Pagination calculations
  // -----------------------------

  const totalPages = Math.ceil(
    emails.length / emailsPerPage
  );

  const startIndex =
    (currentPage - 1) * emailsPerPage;

  const endIndex =
    startIndex + emailsPerPage;

  const currentEmails = emails.slice(
    startIndex,
    endIndex
  );

  // -----------------------------
  // Add / Update
  // -----------------------------

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

        // New email ke baad first page par
        setCurrentPage(1);
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

  // -----------------------------
  // Edit
  // -----------------------------

  const editEmail = (item) => {
    setEditingId(item.id);
    setEmail(item.email);
    setDescription(item.description || "");
    setError("");
  };

  // -----------------------------
  // Delete
  // -----------------------------

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

      // Emails dobara load karo
      await getEmails();

      // Agar current page delete ke baad empty ho jaye
      const newTotalPages = Math.ceil(
        (emails.length - 1) / emailsPerPage
      );

      if (
        currentPage > newTotalPages &&
        newTotalPages > 0
      ) {
        setCurrentPage(newTotalPages);
      }
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

  // -----------------------------
  // Cancel Edit
  // -----------------------------

  const cancelEdit = () => {
    setEditingId(null);
    setEmail("");
    setDescription("");
    setError("");
  };

  // -----------------------------
  // Previous Page
  // -----------------------------

  const previousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // -----------------------------
  // Next Page
  // -----------------------------

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // -----------------------------
  // Page Number
  // -----------------------------

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="crud-page">
      <div className="crud-container">

        {/* Header */}
        <div className="crud-header">
          <h1>Email Management</h1>

          <button
            className="back-button"
            onClick={() => navigate("/welcome")}
          >
            ← Back
          </button>
        </div>

        {/* Form */}
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
              className="cancel-button"
              onClick={cancelEdit}
            >
              Cancel
            </button>
          )}
        </form>

        {/* Error */}
        {error && (
          <p className="error">
            {error}
          </p>
        )}

        {/* Table */}
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
                  <td
                    colSpan="4"
                    className="table-message"
                  >
                    Loading...
                  </td>
                </tr>
              ) : currentEmails.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="table-message"
                  >
                    No emails found.
                  </td>
                </tr>
              ) : (
                currentEmails.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>

                    <td>{item.email}</td>

                    <td>
                      {item.description || "-"}
                    </td>

                    <td className="action-buttons">
                      <button
                        onClick={() =>
                          editEmail(item)
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="delete-button"
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

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="pagination">

            <button
              className="pagination-button"
              onClick={previousPage}
              disabled={currentPage === 1}
            >
              ← Previous
            </button>

            <div className="page-numbers">
              {Array.from(
                { length: totalPages },
                (_, index) => index + 1
              ).map((page) => (
                <button
                  key={page}
                  className={`page-number ${
                    currentPage === page
                      ? "active-page"
                      : ""
                  }`}
                  onClick={() =>
                    goToPage(page)
                  }
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              className="pagination-button"
              onClick={nextPage}
              disabled={
                currentPage === totalPages
              }
            >
              Next →
            </button>

          </div>
        )}

        {/* Page information */}
        {emails.length > 0 && (
          <p className="pagination-info">
            Showing{" "}
            {startIndex + 1}-
            {Math.min(
              endIndex,
              emails.length
            )}{" "}
            of {emails.length} emails
          </p>
        )}

      </div>
    </div>
  );
}

export default Crud;