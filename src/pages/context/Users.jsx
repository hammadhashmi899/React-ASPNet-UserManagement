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

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  const role = user.role;

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

      setError(error.response?.data?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUsers();
  }, [page, search]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const editUser = (item) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditEmail(item.email);
    setError("");
  };

  const updateUser = async (e) => {
    e.preventDefault();

    if (!editName.trim() || !editEmail.trim()) {
      setError("Name and email are required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.put(`/Users/${editingId}`, {
        name: editName.trim(),
        email: editEmail.trim(),
      });

      setEditingId(null);
      setEditName("");
      setEditEmail("");

      await getUsers();
    } catch (error) {
      console.error(error);

      if (error.response?.status === 403) {
        setError("Only Admin can update users.");
      } else {
        setError(error.response?.data?.message || "Update failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditEmail("");
    setError("");
  };

  const previousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const nextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  return (
    <div className="crud-page">
      <div className="crud-container">
        <div className="crud-header">
          <h1>Manage Users</h1>

          <button onClick={() => navigate("/welcome")}>Back</button>
        </div>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={handleSearch}
          />
        </div>

        {editingId !== null && role === "Admin" && (
          <form className="crud-form" onSubmit={updateUser}>
            <input
              type="text"
              placeholder="Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <input
              type="email"
              placeholder="Email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
            />

            <button type="submit" disabled={loading}>
              Update
            </button>

            <button type="button" onClick={cancelEdit}>
              Cancel
            </button>
          </form>
        )}

        {error && <p className="error">{error}</p>}

        <p>Total Users: {totalUsers}</p>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>

                {role === "Admin" && <th>Actions</th>}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={role === "Admin" ? 5 : 4}>Loading...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={role === "Admin" ? 5 : 4}>No users found.</td>
                </tr>
              ) : (
                users.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.email}</td>
                    <td>{item.role}</td>

                    {role === "Admin" && (
                      <td>
                        <button onClick={() => editUser(item)}>Edit</button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button onClick={previousPage} disabled={page === 1}>
            Previous
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button onClick={nextPage} disabled={page === totalPages}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default Users;
