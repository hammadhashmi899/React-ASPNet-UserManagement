import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../api/api";

function Users() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);

  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const user = JSON.parse(
    sessionStorage.getItem("user") || "{}"
  );

  const role = user.role;

  // -----------------------------
  // Get Users
  // -----------------------------

  const getUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/Users", {
        params: {
          search,
          page,
          pageSize,
        },
      });

      setUsers(response.data.data);
      setTotalUsers(response.data.totalUsers);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Failed to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUsers();
  }, [page, search]);

  // -----------------------------
  // Search
  // -----------------------------

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  // -----------------------------
  // Edit User
  // -----------------------------

  const editUser = (item) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditEmail(item.email);
    setError("");
  };

  // -----------------------------
  // Update User
  // -----------------------------

  const updateUser = async (e) => {
    e.preventDefault();

    if (
      !editName.trim() ||
      !editEmail.trim()
    ) {
      setError(
        "Name and email are required."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.put(
        `/Users/${editingId}`,
        {
          name: editName.trim(),
          email: editEmail.trim(),
        }
      );

      setEditingId(null);
      setEditName("");
      setEditEmail("");

      await getUsers();
    } catch (error) {
      console.error(error);

      if (error.response?.status === 403) {
        setError(
          "Only Admin can update users."
        );
      } else {
        setError(
          error.response?.data?.message ||
            "Update failed."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Cancel Edit
  // -----------------------------

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditEmail("");
    setError("");
  };

  // -----------------------------
  // Previous Page
  // -----------------------------

  const previousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  // -----------------------------
  // Next Page
  // -----------------------------

  const nextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  // -----------------------------
  // Maximum 3 Page Numbers
  // -----------------------------

  const getPageNumbers = () => {
    const pages = [];

    let startPage;

    if (page <= 2) {
      startPage = 1;
    } else if (page >= totalPages - 1) {
      startPage = Math.max(
        1,
        totalPages - 2
      );
    } else {
      startPage = page - 1;
    }

    const endPage = Math.min(
      totalPages,
      startPage + 2
    );

    for (
      let i = startPage;
      i <= endPage;
      i++
    ) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div className="crud-page">
      <div className="crud-container">

        {/* Header */}

        <div className="crud-header">
          <h1>Manage Users</h1>

          <button
            className="back-button"
            onClick={() =>
              navigate("/welcome")
            }
          >
            ← Back
          </button>
        </div>

        {/* Search */}

        <div className="search-container">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={handleSearch}
          />
        </div>

        {/* Admin Edit Form */}

        {editingId !== null &&
          role === "Admin" && (
            <form
              className="crud-form"
              onSubmit={updateUser}
            >
              <input
                type="text"
                placeholder="Name"
                value={editName}
                onChange={(e) =>
                  setEditName(
                    e.target.value
                  )
                }
              />

              <input
                type="email"
                placeholder="Email"
                value={editEmail}
                onChange={(e) =>
                  setEditEmail(
                    e.target.value
                  )
                }
              />

              <button
                type="submit"
                disabled={loading}
              >
                Update
              </button>

              <button
                type="button"
                className="cancel-button"
                onClick={cancelEdit}
              >
                Cancel
              </button>
            </form>
          )}

        {/* Error */}

        {error && (
          <p className="error">
            {error}
          </p>
        )}

        {/* Total Users */}

        <p>
          Total Users: {totalUsers}
        </p>

        {/* Table */}

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>

                {role === "Admin" && (
                  <th>Actions</th>
                )}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={
                      role === "Admin"
                        ? 5
                        : 4
                    }
                    className="table-message"
                  >
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      role === "Admin"
                        ? 5
                        : 4
                    }
                    className="table-message"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((item) => (
                  <tr key={item.id}>

                    <td>
                      {item.id}
                    </td>

                    <td>
                      {item.name}
                    </td>

                    <td>
                      {item.email}
                    </td>

                    <td>
                      {item.role}
                    </td>

                    {role === "Admin" && (
                      <td className="action-buttons">
                        <button
                          onClick={() =>
                            editUser(item)
                          }
                        >
                          Edit
                        </button>
                      </td>
                    )}

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
              disabled={page === 1}
            >
              ← Previous
            </button>

            <div className="page-numbers">

              {getPageNumbers().map(
                (pageNumber) => (
                  <button
                    key={pageNumber}
                    className={`page-number ${
                      page === pageNumber
                        ? "active-page"
                        : ""
                    }`}
                    onClick={() =>
                      setPage(
                        pageNumber
                      )
                    }
                  >
                    {pageNumber}
                  </button>
                )
              )}

            </div>

            <button
              className="pagination-button"
              onClick={nextPage}
              disabled={
                page === totalPages
              }
            >
              Next →
            </button>

          </div>
        )}

        {/* Page Information */}

        {totalUsers > 0 && (
          <p className="pagination-info">
            Showing{" "}
            {(page - 1) * pageSize + 1}
            -
            {Math.min(
              page * pageSize,
              totalUsers
            )}{" "}
            of {totalUsers} users
          </p>
        )}

      </div>
    </div>
  );
}

export default Users;