import { useCallback, useEffect, useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8000";

const INITIAL_FORM = {
  name: "",
  username: "",
  email: "",
  password: "",
  role: "admin",
  manage_vendors: false,
  manage_customers: false,
  manage_bookings: false,
  manage_categories: false,
  manage_services: false,
  manage_reviews: false,
  can_manage_admins: false,
};

const PERMISSION_OPTIONS = [
  {
    key: "manage_vendors",
    label: "Vendor Management",
    description: "Review and manage vendor accounts.",
  },
  {
    key: "manage_customers",
    label: "Customer Management",
    description: "Manage customer accounts.",
  },
  {
    key: "manage_bookings",
    label: "Booking Management",
    description: "View and manage bookings.",
  },
  {
    key: "manage_categories",
    label: "Category Management",
    description: "Manage service categories.",
  },
  {
    key: "manage_services",
    label: "Service Management",
    description: "Manage services on the platform.",
  },
  {
    key: "manage_reviews",
    label: "Ratings & Reviews",
    description: "Review customer ratings and feedback.",
  },
  {
    key: "can_manage_admins",
    label: "Admin Account Management",
    description: "Allow this admin to manage other admin accounts.",
  },
];

function getCookie(name) {
  const cookies = document.cookie.split(";");

  for (const cookie of cookies) {
    const trimmedCookie = cookie.trim();

    if (trimmedCookie.startsWith(`${name}=`)) {
      return decodeURIComponent(
        trimmedCookie.substring(name.length + 1)
      );
    }
  }

  return "";
}

async function getCsrfToken() {
  // Use the CSRF endpoint that already exists in Django urls.py.
  const response = await fetch(
    `${API_BASE_URL}/api/csrf-token/`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    }
  );

  let data = {};

  try {
    data = await response.json();
  } catch {
    // The endpoint should normally return JSON.
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.detail ||
        `Unable to initialize CSRF protection (${response.status}).`
    );
  }

  // Prefer the token returned by Django.
  // Fall back to the CSRF cookie if available.
  const csrfToken =
    data.csrfToken ||
    data.csrf_token ||
    getCookie("csrftoken");

  if (!csrfToken) {
    throw new Error(
      "CSRF token is missing. Check the Django CSRF endpoint and cookie settings."
    );
  }

  return csrfToken;
}

async function apiRequest(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();

  const headers = {
    Accept: "application/json",
    ...(options.body
      ? { "Content-Type": "application/json" }
      : {}),
    ...options.headers,
  };

  // Django requires a CSRF token for write requests.
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrfToken = await getCsrfToken();
    headers["X-CSRFToken"] = csrfToken;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    method,
    headers,
    credentials: "include",
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    // Django may return an HTML error page for CSRF failures.
  }

  if (!response.ok) {
    let message =
      data.message ||
      data.detail ||
      `Request failed (${response.status}).`;

    if (
      response.status === 403 &&
      !data.message &&
      !data.detail
    ) {
      message =
        "Request blocked (403). Check Django CSRF settings, session login, and permissions.";
    }

    throw new Error(message);
  }

  return data;
}

function AddAdmin({ onBack }) {
  const [admins, setAdmins] = useState([]);
  const [totalAdmins, setTotalAdmins] = useState(0);

  const [form, setForm] = useState(INITIAL_FORM);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editPermissions, setEditPermissions] = useState({});

  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAdmins = useCallback(async (searchText = "") => {
    setLoading(true);
    setPageError("");

    try {
      const query = searchText.trim()
        ? `?search=${encodeURIComponent(searchText.trim())}`
        : "";

      const data = await apiRequest(
        `/api/admin/admins/${query}`
      );

      const adminList = Array.isArray(data.admins)
        ? data.admins
        : [];

      setAdmins(adminList);

      setTotalAdmins(
        Number.isFinite(Number(data.total))
          ? Number(data.total)
          : adminList.length
      );
    } catch (error) {
      console.error("Admin list error:", error);

      setPageError(
        error.message || "Unable to load admin accounts."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  function handleFormChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleEditFormChange(event) {
    const { name, value } = event.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handlePermissionChange(permissionName, checked) {
    setForm((previous) => ({
      ...previous,
      [permissionName]: checked,
    }));
  }

  function handleEditPermissionChange(permissionName, checked) {
    setEditPermissions((previous) => ({
      ...previous,
      [permissionName]: checked,
    }));
  }

  async function handleCreateAdmin(event) {
    event.preventDefault();

    setPageError("");
    setSuccessMessage("");

    if (form.password.length < 8) {
      setPageError("Password must contain at least 8 characters.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      };

      PERMISSION_OPTIONS.forEach(({ key }) => {
        payload[key] = form[key];
      });

      const data = await apiRequest(
        "/api/admin/admins/create/",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      setForm({ ...INITIAL_FORM });

      setSuccessMessage(
        data.message || "Admin account created successfully."
      );

      await fetchAdmins(search);
    } catch (error) {
      console.error("Create admin error:", error);

      setPageError(
        error.message || "Unable to create the admin account."
      );
    } finally {
      setSaving(false);
    }
  }

  async function openEditAdmin(admin) {
    setPageError("");
    setSuccessMessage("");

    try {
      const data = await apiRequest(
        `/api/admin/admins/${admin.id}/`
      );

      const account = data.admin;

      if (!account) {
        throw new Error("Admin account details were not returned.");
      }

      const currentPermissions = account.permissions || {};

      setEditingAdmin(account);

      setEditForm({
        name: account.name || "",
        username: account.username || "",
        email: account.email || "",
        role: account.role || "admin",
        is_active: Boolean(account.is_active),
      });

      setEditPermissions(
        Object.fromEntries(
          PERMISSION_OPTIONS.map(({ key }) => [
            key,
            Boolean(currentPermissions[key]),
          ])
        )
      );
    } catch (error) {
      console.error("Admin details error:", error);

      setPageError(
        error.message || "Unable to load admin details."
      );
    }
  }

  async function handleSaveAdmin(event) {
    event.preventDefault();

    if (!editingAdmin || savingEdit) return;

    setPageError("");
    setSuccessMessage("");
    setSavingEdit(true);

    try {
      // Update account information first.
      await apiRequest(
        `/api/admin/admins/${editingAdmin.id}/update/`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: editForm.name.trim(),
            username: editForm.username.trim(),
            email: editForm.email.trim(),
            role: editForm.role,
            is_active: editForm.is_active,
          }),
        }
      );

      // Update responsibilities through the separate permissions API.
      await apiRequest(
        `/api/admin/permissions/${editingAdmin.id}/update/`,
        {
          method: "PATCH",
          body: JSON.stringify(editPermissions),
        }
      );

      setEditingAdmin(null);

      setSuccessMessage(
        "Admin account and responsibilities updated successfully."
      );

      await fetchAdmins(search);
    } catch (error) {
      console.error("Update admin error:", error);

      setPageError(
        error.message ||
          "Unable to update the admin account and responsibilities. Refresh the list to verify saved changes."
      );

      // Refresh in case account details were saved but
      // the separate permission update failed.
      await fetchAdmins(search);
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleToggleStatus(admin) {
    const nextStatus = !admin.is_active;
    const action = nextStatus ? "activate" : "deactivate";

    setPageError("");
    setSuccessMessage("");

    try {
      const data = await apiRequest(
        `/api/admin/admins/${admin.id}/update/`,
        {
          method: "PATCH",
          body: JSON.stringify({
            is_active: nextStatus,
          }),
        }
      );

      setSuccessMessage(
        data.message ||
          `Admin account ${action}d successfully.`
      );

      await fetchAdmins(search);
    } catch (error) {
      console.error("Admin status error:", error);

      setPageError(
        error.message ||
          `Unable to ${action} this admin account.`
      );
    }
  }

  async function handleDeleteAdmin() {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    setPageError("");
    setSuccessMessage("");

    try {
      const data = await apiRequest(
        `/api/admin/admins/${deleteTarget.id}/delete/`,
        {
          method: "DELETE",
        }
      );

      setDeleteTarget(null);

      setSuccessMessage(
        data.message || "Admin account deleted successfully."
      );

      await fetchAdmins(search);
    } catch (error) {
      console.error("Delete admin error:", error);

      setPageError(
        error.message || "Unable to delete this admin account."
      );
    } finally {
      setDeleting(false);
    }
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    setSuccessMessage("");
    fetchAdmins(search);
  }

  return (
    <div className="add-admin-page">
      <div className="aa-page-heading">
        <div>
          <span className="aa-eyebrow">ADMINISTRATION</span>
          <h2>Admin Management</h2>
          <p>
            Create admin accounts and control their responsibilities.
          </p>
        </div>

        {onBack && (
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onBack}
          >
            ← Dashboard
          </button>
        )}
      </div>

      {pageError && (
        <div className="alert alert-danger" role="alert">
          <div>{pageError}</div>

          <button
            type="button"
            className="btn-close"
            aria-label="Dismiss error"
            onClick={() => setPageError("")}
          />
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success" role="status">
          <div>{successMessage}</div>

          <button
            type="button"
            className="btn-close"
            aria-label="Dismiss success message"
            onClick={() => setSuccessMessage("")}
          />
        </div>
      )}

      {/* Admin overview */}
      <section className="aa-summary-card">
        <div className="aa-summary-icon">♙</div>

        <div>
          <span>Total admin accounts</span>
          <h3>{loading ? "…" : totalAdmins}</h3>
          <small>Accounts matching the current search</small>
        </div>
      </section>

      {/* Create admin */}
      <section className="aa-panel">
        <div className="aa-panel-heading">
          <div>
            <h3>Create Admin Account</h3>
            <p>
              Enter account details and choose the responsibilities
              this admin should receive.
            </p>
          </div>

          <span className="aa-heading-icon">＋</span>
        </div>

        <form onSubmit={handleCreateAdmin}>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="aa-name">
                Full name
              </label>

              <input
                id="aa-name"
                className="form-control"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                autoComplete="name"
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="aa-username">
                Username
              </label>

              <input
                id="aa-username"
                className="form-control"
                name="username"
                value={form.username}
                onChange={handleFormChange}
                autoComplete="username"
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="aa-email">
                Email address
              </label>

              <input
                id="aa-email"
                type="email"
                className="form-control"
                name="email"
                value={form.email}
                onChange={handleFormChange}
                autoComplete="email"
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="aa-password">
                Initial password
              </label>

              <input
                id="aa-password"
                type="password"
                className="form-control"
                name="password"
                value={form.password}
                onChange={handleFormChange}
                autoComplete="new-password"
                minLength={8}
                required
              />

              <small className="form-text">
                Use at least 8 characters.
              </small>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="aa-role">
                Admin role
              </label>

              <select
                id="aa-role"
                className="form-select"
                name="role"
                value={form.role}
                onChange={handleFormChange}
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>

              <small className="form-text">
                Role labels are separate from the Django login account.
              </small>
            </div>
          </div>

          <div className="aa-permission-heading">
            <h4>Assign Responsibilities</h4>
            <p>
              Select only the areas this account needs to manage.
            </p>
          </div>

          <div className="row g-3">
            {PERMISSION_OPTIONS.map((permission) => (
              <div
                className="col-12 col-md-6 col-xl-4"
                key={permission.key}
              >
                <label
                  className={`aa-permission-option ${
                    form[permission.key] ? "selected" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    className="form-check-input"
                    name={permission.key}
                    checked={form[permission.key]}
                    onChange={(event) =>
                      handlePermissionChange(
                        permission.key,
                        event.target.checked
                      )
                    }
                  />

                  <span className="aa-permission-copy">
                    <strong>{permission.label}</strong>
                    <small>{permission.description}</small>
                  </span>
                </label>
              </div>
            ))}
          </div>

          <div className="aa-form-actions">
            <button
              type="button"
              className="btn btn-outline-secondary"
              disabled={saving}
              onClick={() => setForm({ ...INITIAL_FORM })}
            >
              Clear Form
            </button>

            <button
              type="submit"
              className="btn btn-warning"
              disabled={saving}
            >
              {saving ? "Creating account..." : "Create Admin"}
            </button>
          </div>
        </form>
      </section>

      {/* Manage existing admins */}
      <section className="aa-panel">
        <div className="aa-panel-heading">
          <div>
            <h3>Manage Existing Admins</h3>
            <p>
              Search accounts, update responsibilities, or change
              account status.
            </p>
          </div>
        </div>

        <form
          className="aa-search-form"
          onSubmit={handleSearchSubmit}
        >
          <input
            type="search"
            className="form-control"
            placeholder="Search by name, username, or email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <button
            type="submit"
            className="btn btn-warning"
            disabled={loading}
          >
            Search
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={loading}
            onClick={() => {
              setSearch("");
              fetchAdmins("");
            }}
          >
            Reset
          </button>
        </form>

        {loading ? (
          <div className="aa-loading">
            <div
              className="spinner-border text-warning"
              role="status"
            >
              <span className="visually-hidden">Loading...</span>
            </div>

            <p>Loading admin accounts...</p>
          </div>
        ) : admins.length === 0 ? (
          <div className="aa-empty-state">
            <span>♙</span>
            <h4>No admin accounts found</h4>
            <p>
              Try another search or create an admin account above.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table aa-admin-table align-middle">
              <thead>
                <tr>
                  <th>Admin</th>
                  <th>Role</th>
                  <th>Responsibilities</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {admins.map((admin) => {
                  const permissionCount = admin.permissions
                    ? PERMISSION_OPTIONS.filter(
                        ({ key }) => admin.permissions[key]
                      ).length
                    : 0;

                  return (
                    <tr key={admin.id}>
                      <td>
                        <strong>
                          {admin.name || admin.username}
                        </strong>

                        <small className="aa-table-subtext">
                          @{admin.username}
                        </small>

                        <small className="aa-table-subtext">
                          {admin.email}
                        </small>
                      </td>

                      <td>
                        <span className="aa-role-badge">
                          {admin.role === "super_admin"
                            ? "Super Admin"
                            : "Admin"}
                        </span>
                      </td>

                      <td>
                        {permissionCount} of{" "}
                        {PERMISSION_OPTIONS.length}

                        <small className="aa-table-subtext">
                          responsibilities assigned
                        </small>
                      </td>

                      <td>
                        <span
                          className={`aa-status-badge ${
                            admin.is_active ? "active" : "inactive"
                          }`}
                        >
                          {admin.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td>
                        {admin.created_at
                          ? new Date(
                              admin.created_at
                            ).toLocaleDateString()
                          : "—"}
                      </td>

                      <td>
                        <div className="aa-action-buttons">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-dark"
                            onClick={() => openEditAdmin(admin)}
                          >
                            Manage
                          </button>

                          <button
                            type="button"
                            className={`btn btn-sm ${
                              admin.is_active
                                ? "btn-outline-warning"
                                : "btn-outline-success"
                            }`}
                            onClick={() => handleToggleStatus(admin)}
                          >
                            {admin.is_active
                              ? "Deactivate"
                              : "Activate"}
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => setDeleteTarget(admin)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Edit admin modal */}
      {editingAdmin && (
        <div className="aa-modal-backdrop">
          <div
            className="aa-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="aa-edit-title"
          >
            <div className="aa-modal-heading">
              <div>
                <h3 id="aa-edit-title">Manage Admin</h3>
                <p>
                  Edit account details and assigned responsibilities.
                </p>
              </div>

              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                disabled={savingEdit}
                onClick={() => setEditingAdmin(null)}
              />
            </div>

            <form onSubmit={handleSaveAdmin}>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Full name</label>

                  <input
                    className="form-control"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">Username</label>

                  <input
                    className="form-control"
                    name="username"
                    value={editForm.username}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">Email</label>

                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={editForm.email}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">Role</label>

                  <select
                    className="form-select"
                    name="role"
                    value={editForm.role}
                    onChange={handleEditFormChange}
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">Account status</label>

                  <select
                    className="form-select"
                    value={editForm.is_active ? "active" : "inactive"}
                    onChange={(event) =>
                      setEditForm((previous) => ({
                        ...previous,
                        is_active: event.target.value === "active",
                      }))
                    }
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="aa-permission-heading">
                <h4>Responsibilities</h4>
              </div>

              <div className="aa-edit-permissions">
                {PERMISSION_OPTIONS.map((permission) => (
                  <label
                    className="aa-edit-permission"
                    key={permission.key}
                  >
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={Boolean(
                        editPermissions[permission.key]
                      )}
                      onChange={(event) =>
                        handleEditPermissionChange(
                          permission.key,
                          event.target.checked
                        )
                      }
                    />

                    <span>
                      <strong>{permission.label}</strong>
                      <small>{permission.description}</small>
                    </span>
                  </label>
                ))}
              </div>

              <div className="aa-form-actions">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  disabled={savingEdit}
                  onClick={() => setEditingAdmin(null)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-warning"
                  disabled={savingEdit}
                >
                  {savingEdit
                    ? "Saving changes..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="aa-modal-backdrop">
          <div
            className="aa-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="aa-delete-title"
          >
            <div className="aa-confirm-icon">!</div>

            <h3 id="aa-delete-title">Delete admin account?</h3>

            <p>
              This will permanently delete{" "}
              <strong>
                {deleteTarget.name || deleteTarget.username}
              </strong>{" "}
              and its associated admin permissions.
            </p>

            <div className="aa-form-actions">
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-danger"
                disabled={deleting}
                onClick={handleDeleteAdmin}
              >
                {deleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddAdmin;