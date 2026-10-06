import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "./AuditLogs.css";

function AuditLogs() {
  const navigate = useNavigate();

  const [logs, setLogs] = useState([]);
  const [actions, setActions] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedAction, setSelectedAction] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [totalLogs, setTotalLogs] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, selectedAction, page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/AuditLogs", {
        params: {
          search: search.trim(),
          action: selectedAction,
          page,
          pageSize,
        },
      });

      setLogs(response.data.data || []);
      setActions(response.data.actions || []);
      setTotalLogs(response.data.totalLogs || 0);
      setTotalPages(response.data.totalPages || 0);
    } catch (error) {
      console.error("Audit Logs Error:", error);

      setError(
        error.userMessage || "Unable to load audit logs."
      );

      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Delete audit log
  const deleteAuditLog = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this audit log?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");

      await api.delete(`/AuditLogs/${id}`);

      // Remove deleted log from current UI
      setLogs((currentLogs) =>
        currentLogs.filter((log) => log.id !== id)
      );

      // Update total count
      setTotalLogs((currentTotal) =>
        Math.max(currentTotal - 1, 0)
      );
    } catch (error) {
      console.error("Delete Audit Log Error:", error);

      setError(
        error.userMessage || "Unable to delete audit log."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleActionChange = (value) => {
    setSelectedAction(value);
    setPage(1);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="audit-page">

      {/* Header */}
      <div className="audit-header">

        <div className="audit-title-section">

          <button
            className="audit-back-button"
            onClick={() => navigate("/welcome")}
          >
            ← Back
          </button>

          <div>
            <h1>Audit Logs</h1>

            <p>
              Monitor user activity and system events.
            </p>
          </div>

        </div>

        <div className="audit-total">
          <span>Total Logs</span>

          <strong>
            {totalLogs}
          </strong>
        </div>

      </div>

      {/* Filters */}
      <div className="audit-filters">

        <input
          type="text"
          placeholder="Search name, email or description..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />

        <select
          value={selectedAction}
          onChange={(e) =>
            handleActionChange(e.target.value)
          }
        >
          <option value="">
            All Actions
          </option>

          {actions.map((item) => (
            <option
              key={item}
              value={item}
            >
              {item}
            </option>
          ))}
        </select>

      </div>

      {/* Error */}
      {error && (
        <div className="audit-error">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="audit-table-wrapper">

        <table className="audit-table">

          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Email</th>
              <th>Action</th>
              <th>Description</th>
              <th>IP Address</th>
              <th>Date & Time</th>
              <th>Manage</th>
            </tr>
          </thead>

          <tbody>

            {loading ? (

              <tr>
                <td
                  colSpan="8"
                  className="audit-message"
                >
                  Loading audit logs...
                </td>
              </tr>

            ) : error ? (

              <tr>
                <td
                  colSpan="8"
                  className="audit-message"
                >
                  No data available.
                </td>
              </tr>

            ) : logs.length === 0 ? (

              <tr>
                <td
                  colSpan="8"
                  className="audit-message"
                >
                  No audit logs found.
                </td>
              </tr>

            ) : (

              logs.map((log) => (

                <tr key={log.id}>

                  <td>
                    {log.id}
                  </td>

                  <td>
                    {log.userName || "Unknown"}
                  </td>

                  <td>
                    {log.userEmail || "-"}
                  </td>

                  <td>
                    <span className="audit-action">
                      {log.action}
                    </span>
                  </td>

                  <td>
                    {log.description || "-"}
                  </td>

                  <td>
                    {log.ipAddress || "-"}
                  </td>

                  <td>
                    {formatDate(log.createdAtUtc)}
                  </td>

                  <td>

                    <button
                      className="audit-delete-button"
                      onClick={() =>
                        deleteAuditLog(log.id)
                      }
                      disabled={deletingId === log.id}
                    >
                      {deletingId === log.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

      {/* Pagination */}
      <div className="audit-pagination">

        <span>
          Page {page} of {totalPages || 1}
        </span>

        <div>

          <button
            disabled={page <= 1 || loading}
            onClick={() =>
              setPage((p) => p - 1)
            }
          >
            Previous
          </button>

          <button
            disabled={
              page >= totalPages ||
              totalPages === 0 ||
              loading
            }
            onClick={() =>
              setPage((p) => p + 1)
            }
          >
            Next
          </button>

        </div>

      </div>

    </div>
  );
}

export default AuditLogs;