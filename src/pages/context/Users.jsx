import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../api/api";

function Users() {
  const navigate = useNavigate();

  // ==========================================
  // USER DATA
  // ==========================================
  const [users, setUsers] = useState([]);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // ==========================================
  // SORTING
  // ==========================================
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState("desc");

  // ==========================================
  // LOADING / ERROR
  // ==========================================
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // CREATE USER
  // ==========================================
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState("User");

  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  // ==========================================
  // EDIT USER
  // ==========================================
  const [editingId, setEditingId] = useState(null);

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const [updateSuccess, setUpdateSuccess] = useState("");

  // ==========================================
  // STATUS
  // ==========================================
  const [statusLoadingId, setStatusLoadingId] = useState(null);

  // ==========================================
  // CURRENT LOGGED-IN USER
  // ==========================================
  const currentUser = JSON.parse(
    sessionStorage.getItem("user") || "{}"
  );

  const isAdmin = currentUser.role === "Admin";

  // ==========================================
  // GET USERS
  // ==========================================
  const getUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page: currentPage,
        pageSize,
        sortBy,
        sortOrder,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (roleFilter !== "All") {
        params.role = roleFilter;
      }

      if (statusFilter === "Active") {
        params.isActive = true;
      } else if (statusFilter === "Inactive") {
        params.isActive = false;
      }

      const response = await api.get("/Users", {
        params,
      });

      setUsers(response.data.data || []);
      setTotalUsers(response.data.totalUsers || 0);
      setTotalPages(response.data.totalPages || 0);
    } catch (error) {
      console.error(error);

      setError(
        error.userMessage || "Failed to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOAD USERS
  // ==========================================
  useEffect(() => {
    getUsers();
  }, [
    currentPage,
    search,
    roleFilter,
    statusFilter,
    sortBy,
    sortOrder,
  ]);

  // ==========================================
  // SORT HANDLER
  // ==========================================
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder((previousOrder) =>
        previousOrder === "asc" ? "desc" : "asc"
      );
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }

    setCurrentPage(1);
  };

  // ==========================================
  // SORT ICON
  // ==========================================
  const getSortIcon = (column) => {
    if (sortBy !== column) {
      return "↕";
    }

    return sortOrder === "asc" ? "↑" : "↓";
  };

  // ==========================================
  // SEARCH
  // ==========================================
  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  // ==========================================
  // ROLE FILTER
  // ==========================================
  const handleRoleFilter = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  };

  // ==========================================
  // STATUS FILTER
  // ==========================================
  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  // ==========================================
  // RESET FILTERS
  // ==========================================
  const resetFilters = () => {
    setSearch("");
    setRoleFilter("All");
    setStatusFilter("All");
    setCurrentPage(1);
    setError("");
  };

  // ==========================================
  // CREATE FORM
  // ==========================================
  const openCreateForm = () => {
    setShowCreateForm(true);

    setCreateName("");
    setCreateEmail("");
    setCreatePassword("");
    setCreateRole("User");

    setCreateError("");
    setCreateSuccess("");
  };

  const closeCreateForm = () => {
    setShowCreateForm(false);

    setCreateName("");
    setCreateEmail("");
    setCreatePassword("");
    setCreateRole("User");

    setCreateError("");
    setCreateSuccess("");
  };

  // ==========================================
  // CREATE USER
  // ==========================================
  const createUser = async (e) => {
    e.preventDefault();

    setCreateError("");
    setCreateSuccess("");

    if (!createName.trim()) {
      setCreateError("Name is required.");
      return;
    }

    if (!createEmail.trim()) {
      setCreateError("Email is required.");
      return;
    }

    if (!createPassword) {
      setCreateError("Password is required.");
      return;
    }

    if (createPassword.length < 6) {
      setCreateError("Password must be at least 6 characters.");
      return;
    }

    try {
      const response = await api.post("/Users", {
        name: createName,
        email: createEmail,
        password: createPassword,
        role: createRole,
      });

      setCreateSuccess(
        response.data?.message || "User created successfully."
      );

      setCreateName("");
      setCreateEmail("");
      setCreatePassword("");
      setCreateRole("User");

      await getUsers();

      setTimeout(() => {
        setShowCreateForm(false);
        setCreateSuccess("");
      }, 1000);
    } catch (error) {
      console.error(error);

      setCreateError(
        error.userMessage || "Failed to create user."
      );
    }
  };

  // ==========================================
  // EDIT USER
  // ==========================================
  const editUser = (user) => {
    setEditingId(user.id);
    setEditName(user.name);
    setEditEmail(user.email);

    setError("");
    setUpdateSuccess("");
  };

  // ==========================================
  // UPDATE USER
  // ==========================================
  const updateUser = async (id) => {
    setError("");
    setUpdateSuccess("");

    if (!editName.trim()) {
      setError("Name is required.");
      return;
    }

    if (!editEmail.trim()) {
      setError("Email is required.");
      return;
    }

    try {
      const response = await api.put(`/Users/${id}`, {
        name: editName,
        email: editEmail,
      });

      setUpdateSuccess(
        response.data?.message || "User updated successfully."
      );

      setEditingId(null);

      await getUsers();

      setTimeout(() => {
        setUpdateSuccess("");
      }, 2000);
    } catch (error) {
      console.error(error);

      setError(
        error.userMessage || "Failed to update user."
      );
    }
  };

  // ==========================================
  // CANCEL EDIT
  // ==========================================
  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditEmail("");
    setError("");
  };

  // ==========================================
  // ACTIVATE / DEACTIVATE
  // ==========================================
  const toggleUserStatus = async (user) => {
    try {
      setStatusLoadingId(user.id);
      setError("");
      setUpdateSuccess("");

      const newStatus = !user.isActive;

      const response = await api.put(
        `/Users/${user.id}/status`,
        null,
        {
          params: {
            isActive: newStatus,
          },
        }
      );

      setUpdateSuccess(
        response.data?.message ||
          "User status updated successfully."
      );

      await getUsers();

      setTimeout(() => {
        setUpdateSuccess("");
      }, 2000);
    } catch (error) {
      console.error(error);

      setError(
        error.userMessage ||
          "Failed to change user status."
      );
    } finally {
      setStatusLoadingId(null);
    }
  };

  // ==========================================
  // PAGE NUMBERS
  // ==========================================
  const getPageNumbers = () => {
    const pages = [];

    let startPage;

    if (currentPage <= 2) {
      startPage = 1;
    } else if (currentPage >= totalPages - 1) {
      startPage = Math.max(1, totalPages - 2);
    } else {
      startPage = currentPage - 1;
    }

    const endPage = Math.min(totalPages, startPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  // ==========================================
  // SORTABLE TABLE HEADER
  // ==========================================
  const SortHeader = ({ column, children }) => (
    <th>
      <button
        type="button"
        className="sort-button"
        onClick={() => handleSort(column)}
        aria-label={`Sort by ${children}`}
        title={`Sort by ${children}`}
      >
        {children}
        <span className="sort-icon">
          {getSortIcon(column)}
        </span>
      </button>
    </th>
  );

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="crud-page">
      <div className="crud-container">

        {/* HEADER */}
        <div className="crud-header">
          <h1>Manage Users</h1>

          <div>
            {isAdmin && (
              <button
                className="add-user-button"
                onClick={openCreateForm}
              >
                + Add User
              </button>
            )}

            <button
              className="back-button"
              onClick={() => navigate("/welcome")}
            >
              Back
            </button>
          </div>
        </div>

        {/* CREATE USER FORM */}
        {showCreateForm && isAdmin && (
          <form
            className="crud-form"
            onSubmit={createUser}
          >
            <h2>Create User</h2>

            <input
              type="text"
              placeholder="Name"
              value={createName}
              onChange={(e) =>
                setCreateName(e.target.value)
              }
            />

            <input
              type="email"
              placeholder="Email"
              value={createEmail}
              onChange={(e) =>
                setCreateEmail(e.target.value)
              }
            />

            <input
              type="password"
              placeholder="Password"
              value={createPassword}
              onChange={(e) =>
                setCreatePassword(e.target.value)
              }
            />

            <select
              value={createRole}
              onChange={(e) =>
                setCreateRole(e.target.value)
              }
            >
              <option value="User">User</option>
              <option value="Admin">Admin</option>
            </select>

            {createError && (
              <p className="error">
                {createError}
              </p>
            )}

            {createSuccess && (
              <p className="success">
                {createSuccess}
              </p>
            )}

            <button type="submit">
              Create User
            </button>

            <button
              type="button"
              className="cancel-button"
              onClick={closeCreateForm}
            >
              Cancel
            </button>
          </form>
        )}

        {/* ADVANCED FILTERS */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={handleSearch}
          />

          <select
            value={roleFilter}
            onChange={handleRoleFilter}
          >
            <option value="All">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="User">User</option>
          </select>

          <select
            value={statusFilter}
            onChange={handleStatusFilter}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <button
            type="button"
            className="cancel-button"
            onClick={resetFilters}
          >
            Reset Filters
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <p className="error">
            {error}
          </p>
        )}

        {/* SUCCESS */}
        {updateSuccess && (
          <p className="success">
            {updateSuccess}
          </p>
        )}

        {/* TOTAL USERS */}
        <p>
          Total Matching Users:{" "}
          <strong>{totalUsers}</strong>
        </p>

        {/* TABLE */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <SortHeader column="id">
                  ID
                </SortHeader>

                <SortHeader column="name">
                  Name
                </SortHeader>

                <SortHeader column="email">
                  Email
                </SortHeader>

                <SortHeader column="role">
                  Role
                </SortHeader>

                <SortHeader column="isActive">
                  Status
                </SortHeader>

                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 6 : 5}
                    className="table-message"
                  >
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 6 : 5}
                    className="table-message"
                  >
                    No users found. Try changing filters.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>

                    <td>{user.id}</td>

                    <td>
                      {editingId === user.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) =>
                            setEditName(e.target.value)
                          }
                        />
                      ) : (
                        user.name
                      )}
                    </td>

                    <td>
                      {editingId === user.id ? (
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) =>
                            setEditEmail(e.target.value)
                          }
                        />
                      ) : (
                        user.email
                      )}
                    </td>

                    <td>{user.role}</td>

                    <td>
                      <span
                        className={`status-badge ${
                          user.isActive
                            ? "status-active"
                            : "status-inactive"
                        }`}
                      >
                        {user.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    {isAdmin && (
                      <td>
                        {editingId === user.id ? (
                          <div className="action-buttons">

                            <button
                              onClick={() =>
                                updateUser(user.id)
                              }
                            >
                              Save
                            </button>

                            <button
                              className="cancel-button"
                              onClick={cancelEdit}
                            >
                              Cancel
                            </button>

                          </div>
                        ) : (
                          <div className="action-buttons">

                            <button
                              onClick={() =>
                                editUser(user)
                              }
                            >
                              Edit
                            </button>

                            <button
                              onClick={() =>
                                toggleUserStatus(user)
                              }
                              disabled={
                                statusLoadingId ===
                                user.id
                              }
                            >
                              {statusLoadingId === user.id
                                ? "Updating..."
                                : user.isActive
                                ? "Deactivate"
                                : "Activate"}
                            </button>

                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="pagination">

            <button
              className="pagination-button"
              disabled={currentPage === 1}
              onClick={() =>
                setCurrentPage(currentPage - 1)
              }
            >
              ← Previous
            </button>

            <div className="page-numbers">
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  className={`page-number ${
                    currentPage === page
                      ? "active-page"
                      : ""
                  }`}
                  onClick={() =>
                    setCurrentPage(page)
                  }
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              className="pagination-button"
              disabled={
                currentPage === totalPages
              }
              onClick={() =>
                setCurrentPage(currentPage + 1)
              }
            >
              Next →
            </button>

          </div>
        )}

        {/* INFO */}
        <p className="pagination-info">
          Page {currentPage} of {totalPages || 1}
        </p>

      </div>
    </div>
  );
}

export default Users;