
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

function Users() {
  const navigate = useNavigate();

  // USERS
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // SORTING
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState("desc");

  // LOADING / ERROR
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");

  // CREATE USER
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState("User");
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  // EDIT USER
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  // SINGLE USER STATUS
  const [statusLoadingId, setStatusLoadingId] = useState(null);

  // BULK OPERATIONS
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // CURRENT USER / ROLE
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

      if (search.trim()) params.search = search.trim();
      if (roleFilter !== "All") params.role = roleFilter;

      if (statusFilter === "Active") params.isActive = true;
      if (statusFilter === "Inactive") params.isActive = false;

      const response = await api.get("/Users", { params });

      const data = response.data.data || [];

      setUsers(data);
      setTotalUsers(response.data.totalUsers || 0);
      setTotalPages(response.data.totalPages || 0);

      return response.data;
    } catch (err) {
      console.error(err);
      setError(err.userMessage || "Failed to load users.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedIds([]);
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
  // SORTING
  // ==========================================
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder((previous) =>
        previous === "asc" ? "desc" : "asc"
      );
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }

    setCurrentPage(1);
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return "↕";
    return sortOrder === "asc" ? "↑" : "↓";
  };

  const SortHeader = ({ column, children }) => (
    <th>
      <button
        type="button"
        className="sort-button"
        onClick={() => handleSort(column)}
        aria-label={`Sort by ${children}`}
      >
        {children}
        <span className="sort-icon">{getSortIcon(column)}</span>
      </button>
    </th>
  );

  // ==========================================
  // FILTERS
  // ==========================================
  const resetFilters = () => {
    setSearch("");
    setRoleFilter("All");
    setStatusFilter("All");
    setCurrentPage(1);
    setError("");
  };

  // ==========================================
  // CREATE USER
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
    setCreateError("");
    setCreateSuccess("");
  };

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

    if (createPassword.length < 6) {
      setCreateError("Password must be at least 6 characters.");
      return;
    }

    try {
      const response = await api.post("/Users", {
        name: createName.trim(),
        email: createEmail.trim(),
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
    } catch (err) {
      console.error(err);
      setCreateError(
        err.userMessage || "Failed to create user."
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

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditEmail("");
    setError("");
  };

  const updateUser = async (id) => {
    setError("");
    setUpdateSuccess("");

    if (!editName.trim() || !editEmail.trim()) {
      setError("Name and email are required.");
      return;
    }

    try {
      const response = await api.put(`/Users/${id}`, {
        name: editName.trim(),
        email: editEmail.trim(),
      });

      setUpdateSuccess(
        response.data?.message || "User updated successfully."
      );

      setEditingId(null);
      await getUsers();
    } catch (err) {
      console.error(err);
      setError(err.userMessage || "Failed to update user.");
    }
  };

  // ==========================================
  // SINGLE USER ACTIVATE / DEACTIVATE
  // ==========================================
  const toggleUserStatus = async (user) => {
    try {
      setStatusLoadingId(user.id);
      setError("");
      setUpdateSuccess("");

      const response = await api.put(
        `/Users/${user.id}/status`,
        null,
        { params: { isActive: !user.isActive } }
      );

      setUpdateSuccess(
        response.data?.message || "User status updated."
      );

      await getUsers();
    } catch (err) {
      console.error(err);
      setError(
        err.userMessage || "Failed to change user status."
      );
    } finally {
      setStatusLoadingId(null);
    }
  };

  // ==========================================
  // SELECT CURRENT PAGE USERS
  // ==========================================
  const currentPageIds = users.map((user) => user.id);

  const allCurrentPageSelected =
    currentPageIds.length > 0 &&
    currentPageIds.every((id) => selectedIds.includes(id));

  const toggleUserSelection = (id) => {
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((selectedId) => selectedId !== id)
        : [...previous, id]
    );
  };

  const toggleSelectAll = () => {
    if (allCurrentPageSelected) {
      setSelectedIds((previous) =>
        previous.filter((id) => !currentPageIds.includes(id))
      );
    } else {
      setSelectedIds((previous) =>
        [...new Set([...previous, ...currentPageIds])]
      );
    }
  };

  // ==========================================
  // BULK ACTIVATE / DEACTIVATE
  // ==========================================
  const bulkChangeStatus = async (isActive) => {
    if (selectedIds.length === 0) {
      setError("Please select at least one user.");
      return;
    }

    const action = isActive ? "activate" : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${selectedIds.length} selected user(s)?`
    );

    if (!confirmed) return;

    try {
      setBulkLoading(true);
      setError("");
      setUpdateSuccess("");

      const response = await api.put("/Users/bulk/status", {
        ids: selectedIds,
        isActive,
      });

      const result = response.data;
      let message =
        `${result.changed} user(s) updated successfully.`;

      if (result.protectedIds?.length) {
        message +=
          ` ${result.protectedIds.length} user(s) protected from this operation.`;
      }

      if (result.notFoundIds?.length) {
        message +=
          ` ${result.notFoundIds.length} ID(s) were not found.`;
      }

      setUpdateSuccess(message);
      setSelectedIds([]);

      await getUsers();
    } catch (err) {
      console.error(err);
      setError(
        err.userMessage || "Bulk status update failed."
      );
    } finally {
      setBulkLoading(false);
    }
  };

  // ==========================================
  // BULK DELETE
  // ==========================================
  const bulkDeleteUsers = async () => {
    if (selectedIds.length === 0) {
      setError("Please select at least one user.");
      return;
    }

    const confirmed = window.confirm(
      `WARNING: Permanently delete ${selectedIds.length} selected user(s)? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setBulkLoading(true);
      setError("");
      setUpdateSuccess("");

      const response = await api.post("/Users/bulk-delete", {
        ids: selectedIds,
      });

      const result = response.data;

      let message = `${result.deleted} user(s) deleted.`;

      if (result.protectedIds?.length) {
        message +=
          ` ${result.protectedIds.length} Admin/current account(s) were protected.`;
      }

      if (result.notFoundIds?.length) {
        message +=
          ` ${result.notFoundIds.length} ID(s) were not found.`;
      }

      setUpdateSuccess(message);
      setSelectedIds([]);

      const refreshed = await getUsers();

      // If the last page became empty after deletion,
      // move back one page.
      if (
        refreshed &&
        refreshed.data?.length === 0 &&
        currentPage > 1
      ) {
        setCurrentPage((page) => Math.max(1, page - 1));
      }
    } catch (err) {
      console.error(err);
      setError(
        err.userMessage || "Bulk delete failed."
      );
    } finally {
      setBulkLoading(false);
    }
  };

  // ==========================================
  // PAGINATION
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

    for (let page = startPage; page <= endPage; page++) {
      pages.push(page);
    }

    return pages;
  };

  // ==========================================
  // UI
  // ==========================================
  return (
    <div className="crud-page">
      <div className="crud-container">
        <div className="crud-header">
          <h1>Manage Users</h1>

          <div>
            {isAdmin && (
              <button
                type="button"
                className="add-user-button"
                onClick={openCreateForm}
              >
                + Add User
              </button>
            )}

            <button
              type="button"
              className="back-button"
              onClick={() => navigate("/welcome")}
            >
              Back
            </button>
          </div>
        </div>

        {/* CREATE USER FORM */}
        {showCreateForm && isAdmin && (
          <form className="crud-form" onSubmit={createUser}>
            <h2>Create User</h2>

            <input
              type="text"
              placeholder="Name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              required
            />

            <input
              type="email"
              placeholder="Email"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password (minimum 6 characters)"
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
              minLength={6}
              required
            />

            <select
              value={createRole}
              onChange={(e) => setCreateRole(e.target.value)}
            >
              <option value="User">User</option>
              <option value="Admin">Admin</option>
            </select>

            {createError && <p className="error">{createError}</p>}
            {createSuccess && (
              <p className="success">{createSuccess}</p>
            )}

            <button type="submit">Create User</button>

            <button
              type="button"
              className="cancel-button"
              onClick={closeCreateForm}
            >
              Cancel
            </button>
          </form>
        )}

        {/* SEARCH / FILTERS */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="All">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="User">User</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
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

        {error && <p className="error">{error}</p>}
        {updateSuccess && (
          <p className="success">{updateSuccess}</p>
        )}

        <p>
          Total Matching Users: <strong>{totalUsers}</strong>
        </p>

        {/* BULK TOOLBAR - ADMIN ONLY */}
        {isAdmin && (
          <div className="bulk-toolbar">
            <span>
              Selected: <strong>{selectedIds.length}</strong>
            </span>

            <button
              type="button"
              className="bulk-action-button"
              disabled={selectedIds.length === 0 || bulkLoading}
              onClick={() => bulkChangeStatus(true)}
            >
              {bulkLoading ? "Processing..." : "Activate Selected"}
            </button>

            <button
              type="button"
              className="bulk-action-button"
              disabled={selectedIds.length === 0 || bulkLoading}
              onClick={() => bulkChangeStatus(false)}
            >
              {bulkLoading ? "Processing..." : "Deactivate Selected"}
            </button>

            <button
              type="button"
              className="bulk-delete-button"
              disabled={selectedIds.length === 0 || bulkLoading}
              onClick={bulkDeleteUsers}
            >
              {bulkLoading ? "Processing..." : "Delete Selected"}
            </button>

            <button
              type="button"
              className="cancel-button"
              disabled={selectedIds.length === 0 || bulkLoading}
              onClick={() => setSelectedIds([])}
            >
              Clear Selection
            </button>
          </div>
        )}

        {/* USERS TABLE */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                {isAdmin && (
                  <th>
                    <input
                      type="checkbox"
                      aria-label="Select all users on this page"
                      checked={allCurrentPageSelected}
                      onChange={toggleSelectAll}
                      disabled={loading || users.length === 0 || bulkLoading}
                    />
                  </th>
                )}

                <SortHeader column="id">ID</SortHeader>
                <SortHeader column="name">Name</SortHeader>
                <SortHeader column="email">Email</SortHeader>
                <SortHeader column="role">Role</SortHeader>
                <SortHeader column="isActive">Status</SortHeader>

                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 7 : 5}
                    className="table-message"
                  >
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 7 : 5}
                    className="table-message"
                  >
                    No users found. Try changing filters.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    {isAdmin && (
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Select ${user.name}`}
                          checked={selectedIds.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          disabled={bulkLoading}
                        />
                      </td>
                    )}

                    <td>{user.id}</td>

                    <td>
                      {editingId === user.id ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
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
                          onChange={(e) => setEditEmail(e.target.value)}
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
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {isAdmin && (
                      <td>
                        {editingId === user.id ? (
                          <div className="action-buttons">
                            <button
                              type="button"
                              onClick={() => updateUser(user.id)}
                            >
                              Save
                            </button>

                            <button
                              type="button"
                              className="cancel-button"
                              onClick={cancelEdit}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="action-buttons">
                            <button
                              type="button"
                              onClick={() => editUser(user)}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleUserStatus(user)}
                              disabled={
                                statusLoadingId === user.id ||
                                bulkLoading
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
              type="button"
              className="pagination-button"
              disabled={currentPage === 1}
              onClick={() =>
                setCurrentPage((page) => page - 1)
              }
            >
              ← Previous
            </button>

            <div className="page-numbers">
              {getPageNumbers().map((page) => (
                <button
                  type="button"
                  key={page}
                  className={`page-number ${
                    currentPage === page ? "active-page" : ""
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="pagination-button"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((page) => page + 1)
              }
            >
              Next →
            </button>
          </div>
        )}

        <p className="pagination-info">
          Page {currentPage} of {totalPages || 1}
        </p>
      </div>
    </div>
  );
}

export default Users;
