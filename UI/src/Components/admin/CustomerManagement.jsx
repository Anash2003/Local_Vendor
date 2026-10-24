import { useEffect, useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8000";

// Safely read a JSON response.
async function readResponse(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

// Get a fresh CSRF token from Django.
async function getCsrfToken() {
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

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      data.detail ||
        data.message ||
        "Unable to obtain CSRF token."
    );
  }

  const token = data.csrfToken;

  if (
    typeof token !== "string" ||
    !/^[a-zA-Z0-9]{64}$/.test(token)
  ) {
    throw new Error(
      "Invalid CSRF token returned by Django."
    );
  }

  return token;
}

// Show a customer's initials when a profile image is unavailable.
function getInitials(customer) {
  const name = customer.name || customer.username || "Customer";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [totalCustomers, setTotalCustomers] = useState(0);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [modalType, setModalType] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  // Load all customers or search for matching customers.
  async function loadCustomers(search = "") {
    setLoading(true);
    setError("");

    try {
      const query = search.trim()
        ? `?${new URLSearchParams({ search: search.trim() })}`
        : "";

      const response = await fetch(
        `${API_BASE_URL}/api/admin/customers/${query}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            "Unable to load customers."
        );
      }

      const customerList = Array.isArray(data.customers)
        ? data.customers
        : [];

      setCustomers(customerList);
      setTotalCustomers(
        typeof data.total === "number"
          ? data.total
          : customerList.length
      );
    } catch (err) {
      setError(err.message || "Unable to load customers.");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(event) {
    event.preventDefault();
    setMessage("");
    loadCustomers(searchTerm);
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // Fetch the latest customer details before opening View or Edit.
  async function openCustomer(customerId, type) {
    setError("");
    setMessage("");
    setSelectedCustomer(null);
    setModalType(type);
    setSaving(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/customers/${customerId}/`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            "Unable to load customer details."
        );
      }

      setSelectedCustomer(data);
      setFormData({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
      });
    } catch (err) {
      setError(err.message || "Unable to load customer details.");
      setModalType("");
    } finally {
      setSaving(false);
    }
  }

  // Update customer information.
  async function handleUpdateCustomer(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!formData.name.trim()) {
      setError("Customer name is required.");
      return;
    }

    if (!selectedCustomer?.id) {
      setError("Customer information is unavailable.");
      return;
    }

    setSaving(true);

    try {
      const csrfToken = await getCsrfToken();

      const response = await fetch(
        `${API_BASE_URL}/api/admin/customers/${selectedCustomer.id}/update/`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
          }),
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            "Unable to update customer."
        );
      }

      const updatedCustomer = data.customer;

      if (!updatedCustomer) {
        throw new Error(
          "Customer was updated, but the response did not contain customer details."
        );
      }

      setCustomers((previous) =>
        previous.map((customer) =>
          customer.id === updatedCustomer.id
            ? { ...customer, ...updatedCustomer }
            : customer
        )
      );

      setSelectedCustomer((previous) => ({
        ...previous,
        ...updatedCustomer,
      }));

      setModalType("");
      setMessage(
        data.message || "Customer updated successfully."
      );

      // Refresh the current search results from Django.
      await loadCustomers(searchTerm);
    } catch (err) {
      setError(err.message || "Unable to update customer.");
    } finally {
      setSaving(false);
    }
  }

  // Open the in-app delete confirmation.
  function confirmDelete(customer) {
    setSelectedCustomer(customer);
    setModalType("delete");
    setError("");
    setMessage("");
  }

  // Delete a customer through the existing Django endpoint.
  async function handleDeleteCustomer() {
    if (!selectedCustomer?.id) {
      setError("Customer information is unavailable.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const csrfToken = await getCsrfToken();

      const response = await fetch(
        `${API_BASE_URL}/api/admin/customers/${selectedCustomer.id}/`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "X-CSRFToken": csrfToken,
          },
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            "Unable to delete customer. The account may have related records."
        );
      }

      const deletedId = selectedCustomer.id;

      setCustomers((previous) =>
        previous.filter((customer) => customer.id !== deletedId)
      );

      setTotalCustomers((previous) => Math.max(0, previous - 1));
      setSelectedCustomer(null);
      setModalType("");
      setMessage(
        data.message || "Customer deleted successfully."
      );

      // Refresh to keep the displayed data in sync with Django.
      await loadCustomers(searchTerm);
    } catch (err) {
      setError(err.message || "Unable to delete customer.");
    } finally {
      setSaving(false);
    }
  }

  function closeModal() {
    if (saving) return;

    setSelectedCustomer(null);
    setModalType("");
    setError("");
  }

  return (
    <div className="customer-management">
      {/* Page heading */}
      <div className="customer-page-heading">
        <div>
          <h2>Customer Management</h2>
          <p>
            View and manage customers registered with Oorkaran.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary customer-refresh-btn"
          onClick={() => {
            setMessage("");
            loadCustomers(searchTerm);
          }}
          disabled={loading || saving}
        >
          <i className="bi bi-arrow-clockwise me-2"></i>
          Refresh
        </button>
      </div>

      {/* Success message */}
      {message && (
        <div className="alert alert-success" role="status">
          <i className="bi bi-check-circle-fill me-2"></i>
          {message}
          <button
            type="button"
            className="btn-close float-end"
            aria-label="Dismiss message"
            onClick={() => setMessage("")}
          ></button>
        </div>
      )}

      {/* Error message */}
      {error && !modalType && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button
            type="button"
            className="btn-close float-end"
            aria-label="Dismiss error"
            onClick={() => setError("")}
          ></button>
        </div>
      )}

      {/* Customer statistics */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6">
          <div className="customer-stat-card">
            <div className="customer-stat-icon">
              <i className="bi bi-people-fill"></i>
            </div>

            <div>
              <p>Total Customers</p>
              <h3>{totalCustomers}</h3>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="customer-stat-card">
            <div className="customer-stat-icon customer-stat-icon-alt">
              <i className="bi bi-person-check-fill"></i>
            </div>

            <div>
              <p>Customers Displayed</p>
              <h3>{customers.length}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="customer-search-card">
        <form
          className="row g-2 align-items-center"
          onSubmit={handleSearch}
        >
          <div className="col-12 col-md">
            <div className="customer-search-input">
              <i className="bi bi-search"></i>

              <input
                type="search"
                className="form-control"
                placeholder="Search by name, username, email or phone"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                aria-label="Search customers"
              />
            </div>
          </div>

          <div className="col-6 col-md-auto">
            <button
              type="submit"
              className="btn btn-warning w-100"
              disabled={loading}
            >
              Search
            </button>
          </div>

          <div className="col-6 col-md-auto">
            <button
              type="button"
              className="btn btn-outline-secondary w-100"
              disabled={loading}
              onClick={() => {
                setSearchTerm("");
                setMessage("");
                loadCustomers("");
              }}
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Customer table */}
      <div className="customer-table-card">
        <div className="customer-table-heading">
          <div>
            <h3>Registered Customers</h3>
            <p>Customer accounts retrieved from Django.</p>
          </div>

          <span className="customer-count-badge">
            {customers.length} shown
          </span>
        </div>

        {loading ? (
          <div className="customer-loading">
            <div
              className="spinner-border text-warning"
              role="status"
            >
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="customer-empty-state">
            <i className="bi bi-people"></i>
            <h4>No customers found</h4>
            <p>
              Try another search term or clear the search.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle customer-table mb-0">
              <thead>
                <tr>
                  <th scope="col">Customer</th>
                  <th scope="col">Username</th>
                  <th scope="col">Email</th>
                  <th scope="col">Phone</th>
                  <th scope="col" className="text-center">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="customer-name-cell">
                        <div className="customer-avatar">
                          {getInitials(customer)}
                        </div>

                        <div>
                          <strong>
                            {customer.name || "Unnamed customer"}
                          </strong>
                          <small>ID: {customer.id}</small>
                        </div>
                      </div>
                    </td>

                    <td>{customer.username || "—"}</td>
                    <td>{customer.email || "—"}</td>
                    <td>{customer.phone || "—"}</td>

                    <td>
                      <div className="customer-action-buttons">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          title="View customer"
                          aria-label={`View ${customer.name || customer.username}`}
                          disabled={saving}
                          onClick={() =>
                            openCustomer(customer.id, "view")
                          }
                        >
                          <i className="bi bi-eye"></i>
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-warning"
                          title="Edit customer"
                          aria-label={`Edit ${customer.name || customer.username}`}
                          disabled={saving}
                          onClick={() =>
                            openCustomer(customer.id, "edit")
                          }
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          title="Delete customer"
                          aria-label={`Delete ${customer.name || customer.username}`}
                          disabled={saving}
                          onClick={() => confirmDelete(customer)}
                        >
                          <i className="bi bi-trash3"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer details / edit / delete modal */}
      {modalType && (
        <div
          className="customer-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            className="customer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-modal-title"
          >
            <div className="customer-modal-header">
              <div>
                <h3 id="customer-modal-title">
                  {modalType === "view" && "Customer Details"}
                  {modalType === "edit" && "Edit Customer"}
                  {modalType === "delete" && "Delete Customer"}
                </h3>

                <p>
                  {modalType === "view" &&
                    "View registered customer information."}
                  {modalType === "edit" &&
                    "Update the customer's account information."}
                  {modalType === "delete" &&
                    "Review this action before continuing."}
                </p>
              </div>

              <button
                type="button"
                className="customer-modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <div className="customer-modal-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {saving && !selectedCustomer ? (
                <div className="customer-loading">
                  <div
                    className="spinner-border text-warning"
                    role="status"
                  >
                    <span className="visually-hidden">
                      Loading...
                    </span>
                  </div>
                  <p>Loading customer information...</p>
                </div>
              ) : modalType === "delete" ? (
                <>
                  <div className="customer-delete-icon">
                    <i className="bi bi-exclamation-triangle"></i>
                  </div>

                  <p className="customer-delete-text">
                    Are you sure you want to delete{" "}
                    <strong>
                      {selectedCustomer?.name ||
                        selectedCustomer?.username ||
                        "this customer"}
                    </strong>
                    ?
                  </p>

                  <p className="customer-delete-note">
                    Django may prevent deletion if this customer
                    has related bookings, ratings, or other
                    protected records.
                  </p>

                  <div className="customer-modal-actions">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={closeModal}
                      disabled={saving}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={handleDeleteCustomer}
                      disabled={saving}
                    >
                      {saving ? "Deleting..." : "Delete Customer"}
                    </button>
                  </div>
                </>
              ) : selectedCustomer ? (
                modalType === "view" ? (
                  <>
                    <div className="customer-detail-profile">
                      <div className="customer-avatar customer-avatar-large">
                        {getInitials(selectedCustomer)}
                      </div>

                      <h4>
                        {selectedCustomer.name || "Unnamed customer"}
                      </h4>

                      <p>
                        @{selectedCustomer.username || "unknown"}
                      </p>
                    </div>

                    <div className="customer-detail-list">
                      <div>
                        <span>Customer ID</span>
                        <strong>{selectedCustomer.id}</strong>
                      </div>

                      <div>
                        <span>Full Name</span>
                        <strong>
                          {selectedCustomer.name || "Not provided"}
                        </strong>
                      </div>

                      <div>
                        <span>Username</span>
                        <strong>
                          {selectedCustomer.username || "Not provided"}
                        </strong>
                      </div>

                      <div>
                        <span>Email</span>
                        <strong>
                          {selectedCustomer.email || "Not provided"}
                        </strong>
                      </div>

                      <div>
                        <span>Phone</span>
                        <strong>
                          {selectedCustomer.phone || "Not provided"}
                        </strong>
                      </div>
                    </div>

                    <div className="customer-modal-actions">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={closeModal}
                      >
                        Close
                      </button>

                      <button
                        type="button"
                        className="btn btn-warning"
                        onClick={() =>
                          openCustomer(selectedCustomer.id, "edit")
                        }
                      >
                        <i className="bi bi-pencil-square me-2"></i>
                        Edit Customer
                      </button>
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleUpdateCustomer}>
                    <div className="customer-form-note">
                      Username is displayed in the customer list but
                      is not editable through this endpoint.
                    </div>

                    <div className="mb-3">
                      <label
                        htmlFor="customer-edit-name"
                        className="form-label"
                      >
                        Customer Name
                      </label>

                      <input
                        id="customer-edit-name"
                        type="text"
                        name="name"
                        className="form-control"
                        value={formData.name}
                        onChange={handleFormChange}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label
                        htmlFor="customer-edit-email"
                        className="form-label"
                      >
                        Email Address
                      </label>

                      <input
                        id="customer-edit-email"
                        type="email"
                        name="email"
                        className="form-control"
                        value={formData.email}
                        onChange={handleFormChange}
                      />
                    </div>

                    <div className="mb-3">
                      <label
                        htmlFor="customer-edit-phone"
                        className="form-label"
                      >
                        Phone Number
                      </label>

                      <input
                        id="customer-edit-phone"
                        type="tel"
                        name="phone"
                        className="form-control"
                        value={formData.phone}
                        onChange={handleFormChange}
                      />
                    </div>

                    <div className="customer-modal-actions">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={closeModal}
                        disabled={saving}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="btn btn-warning"
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                )
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerManagement;