
import { useCallback, useEffect, useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8000";

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
  let csrfToken = getCookie("csrftoken");

  if (csrfToken) {
    return csrfToken;
  }

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

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to get CSRF token."
    );
  }

  csrfToken =
    data.csrfToken ||
    data.csrf_token ||
    getCookie("csrftoken");

  if (!csrfToken) {
    throw new Error(
      "CSRF token is missing. Refresh the page and try again."
    );
  }

  return csrfToken;
}

async function apiRequest(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();

  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

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

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let errorMessage =
      data.message ||
      data.detail ||
      "The request could not be completed.";

    if (typeof errorMessage !== "string") {
      errorMessage = JSON.stringify(errorMessage);
    }

    throw new Error(errorMessage);
  }

  return data;
}

function CategoriesServices({
  canManageCategories = false,
  canManageServices = false,
}) {
  const [activeTab, setActiveTab] = useState("categories");

  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [categorySearch, setCategorySearch] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [serviceCategoryFilter, setServiceCategoryFilter] =
    useState("");

  const [categoryForm, setCategoryForm] = useState({
    id: null,
    category: "",
  });

  const [serviceForm, setServiceForm] = useState({
    id: null,
    service: "",
    category: "",
    description: "",
  });

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [message, setMessage] = useState(null);

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  // Load categories from Django.
  // Reading categories is also useful for service managers
  // because the service form needs a category dropdown.
  const loadCategories = useCallback(async () => {
    const data = await apiRequest("/api/admin/categories/");

    setCategories(
      Array.isArray(data.categories) ? data.categories : []
    );
  }, []);

  // Load services and apply the selected search/filter.
  const loadServices = useCallback(async () => {
    const params = new URLSearchParams();

    if (serviceSearch.trim()) {
      params.set("search", serviceSearch.trim());
    }

    if (serviceCategoryFilter) {
      params.set("category", serviceCategoryFilter);
    }

    const query = params.toString();

    const endpoint = query
      ? `/api/admin/services/?${query}`
      : "/api/admin/services/";

    const data = await apiRequest(endpoint);

    setServices(
      Array.isArray(data.services) ? data.services : []
    );
  }, [serviceSearch, serviceCategoryFilter]);

  // Refresh both lists.
  const loadAllData = useCallback(async () => {
    setLoading(true);

    try {
      await Promise.all([
        loadCategories(),
        loadServices(),
      ]);
    } catch (error) {
      showMessage("danger", error.message);
    } finally {
      setLoading(false);
    }
  }, [loadCategories, loadServices]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Refresh services when the search or category filter changes.
  useEffect(() => {
    if (activeTab !== "services") {
      return;
    }

    async function loadFilteredServices() {
      try {
        await loadServices();
      } catch (error) {
        showMessage("danger", error.message);
      }
    }

    loadFilteredServices();
  }, [activeTab, loadServices]);

  const resetCategoryForm = () => {
    setCategoryForm({
      id: null,
      category: "",
    });
  };

  const resetServiceForm = () => {
    setServiceForm({
      id: null,
      service: "",
      category: "",
      description: "",
    });
  };

  // Add or update a category.
  const saveCategory = async (event) => {
    event.preventDefault();

    if (!canManageCategories) {
      showMessage(
        "warning",
        "You do not have permission to manage categories."
      );
      return;
    }

    const categoryName = categoryForm.category.trim();

    if (!categoryName) {
      showMessage("warning", "Please enter a category name.");
      return;
    }

    setSaving(true);

    try {
      if (categoryForm.id !== null) {
        await apiRequest(
          `/api/admin/categories/${categoryForm.id}/update/`,
          {
            method: "PATCH",
            body: JSON.stringify({
              category: categoryName,
            }),
          }
        );

        showMessage("success", "Category updated successfully.");
      } else {
        await apiRequest("/api/admin/categories/add/", {
          method: "POST",
          body: JSON.stringify({
            category: categoryName,
          }),
        });

        showMessage("success", "Category added successfully.");
      }

      resetCategoryForm();
      setSelectedCategory(null);

      await Promise.all([
        loadCategories(),
        loadServices(),
      ]);
    } catch (error) {
      showMessage("danger", error.message);
    } finally {
      setSaving(false);
    }
  };

  // Add or update a service.
  const saveService = async (event) => {
    event.preventDefault();

    if (!canManageServices) {
      showMessage(
        "warning",
        "You do not have permission to manage services."
      );
      return;
    }

    const serviceName = serviceForm.service.trim();
    const description = serviceForm.description.trim();

    if (!serviceName || !serviceForm.category) {
      showMessage(
        "warning",
        "Please enter a service name and select a category."
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        service: serviceName,
        category: serviceForm.category,
        description,
      };

      if (serviceForm.id !== null) {
        await apiRequest(
          `/api/admin/services/${serviceForm.id}/update/`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          }
        );

        showMessage("success", "Service updated successfully.");
      } else {
        await apiRequest("/api/admin/services/add/", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        showMessage("success", "Service added successfully.");
      }

      resetServiceForm();

      await Promise.all([
        loadCategories(),
        loadServices(),
      ]);
    } catch (error) {
      showMessage("danger", error.message);
    } finally {
      setSaving(false);
    }
  };

  const editCategory = (category) => {
    if (!canManageCategories) {
      showMessage(
        "warning",
        "You do not have permission to edit categories."
      );
      return;
    }

    setCategoryForm({
      id: category.id,
      category: category.category || category.name || "",
    });

    setSelectedCategory(null);

    document.getElementById("category-name-input")?.focus();
  };

  const editService = (service) => {
    if (!canManageServices) {
      showMessage(
        "warning",
        "You do not have permission to edit services."
      );
      return;
    }

    setServiceForm({
      id: service.id,
      service: service.service || "",
      category: service.category || "",
      description: service.description || "",
    });

    setActiveTab("services");

    document.getElementById("service-name-input")?.focus();
  };

  const viewCategory = async (category) => {
    try {
      const data = await apiRequest(
        `/api/admin/categories/${category.id}/`
      );

      setSelectedCategory(data.category);
    } catch (error) {
      showMessage("danger", error.message);
    }
  };

  // Delete a category or service after confirmation.
  const deleteItem = async () => {
    if (!deleteTarget) {
      return;
    }

    const { type, item } = deleteTarget;

    // Check permissions again before sending the request.
    if (
      (type === "category" && !canManageCategories) ||
      (type === "service" && !canManageServices)
    ) {
      showMessage(
        "warning",
        `You do not have permission to delete this ${type}.`
      );
      setDeleteTarget(null);
      return;
    }

    setSaving(true);

    try {
      const endpoint =
        type === "category"
          ? `/api/admin/categories/${item.id}/delete/`
          : `/api/admin/services/${item.id}/delete/`;

      await apiRequest(endpoint, {
        method: "DELETE",
      });

      setDeleteTarget(null);

      if (type === "category") {
        showMessage("success", "Category deleted successfully.");
      } else {
        showMessage("success", "Service deleted successfully.");
      }

      await Promise.all([
        loadCategories(),
        loadServices(),
      ]);
    } catch (error) {
      showMessage("danger", error.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredCategories = categories.filter((category) =>
    (category.category || category.name || "")
      .toLowerCase()
      .includes(categorySearch.toLowerCase())
  );

  return (
    <div className="cs-page">
      <div className="cs-heading">
        <div>
          <h2>Categories &amp; Services</h2>
          <p>
            Manage the service categories and services available on
            Oorkaran.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={loadAllData}
          disabled={loading || saving}
        >
          <i className="bi bi-arrow-clockwise me-2" />
          Refresh
        </button>
      </div>

      {message && (
        <div
          className={`alert alert-${message.type} alert-dismissible fade show`}
          role="alert"
        >
          {message.text}

          <button
            type="button"
            className="btn-close"
            aria-label="Close message"
            onClick={() => setMessage(null)}
          />
        </div>
      )}

      {/* Permission explanation */}
      {!canManageCategories && !canManageServices && (
        <div className="alert alert-warning" role="status">
          You have read-only access to this section. You cannot add,
          edit, or delete categories or services.
        </div>
      )}

      <div className="cs-summary">
        <div className="cs-summary-card">
          <div className="cs-summary-icon">
            <i className="bi bi-grid" />
          </div>

          <div>
            <span>Total Categories</span>
            <h3>{categories.length}</h3>
          </div>
        </div>

        <div className="cs-summary-card">
          <div className="cs-summary-icon cs-service-icon">
            <i className="bi bi-tools" />
          </div>

          <div>
            <span>Total Services</span>
            <h3>{services.length}</h3>
          </div>
        </div>
      </div>

      {/* Both lists stay available for viewing.
          Write controls depend on the matching permission. */}
      <div className="cs-tabs">
        <button
          type="button"
          className={`cs-tab ${
            activeTab === "categories" ? "active" : ""
          }`}
          onClick={() => setActiveTab("categories")}
        >
          <i className="bi bi-grid me-2" />
          Categories
        </button>

        <button
          type="button"
          className={`cs-tab ${
            activeTab === "services" ? "active" : ""
          }`}
          onClick={() => setActiveTab("services")}
        >
          <i className="bi bi-tools me-2" />
          Services
        </button>
      </div>

      {loading ? (
        <div className="cs-loading">
          <div
            className="spinner-border text-warning"
            role="status"
          />
          <p>Loading categories and services...</p>
        </div>
      ) : (
        <>
          {/* Categories tab */}
          {activeTab === "categories" && (
            <div className="cs-content-grid">
              {canManageCategories && (
                <section className="cs-panel">
                  <div className="cs-panel-heading">
                    <div>
                      <h4>
                        {categoryForm.id !== null
                          ? "Edit Category"
                          : "Add Category"}
                      </h4>

                      <p>Create or update a service category.</p>
                    </div>

                    <i className="bi bi-folder-plus cs-heading-icon" />
                  </div>

                  <form onSubmit={saveCategory}>
                    <label
                      htmlFor="category-name-input"
                      className="form-label"
                    >
                      Category Name
                    </label>

                    <input
                      id="category-name-input"
                      type="text"
                      className="form-control"
                      placeholder="e.g. Home Services"
                      value={categoryForm.category}
                      onChange={(event) =>
                        setCategoryForm({
                          ...categoryForm,
                          category: event.target.value,
                        })
                      }
                      maxLength={100}
                      required
                    />

                    <div className="cs-form-actions">
                      <button
                        type="submit"
                        className="btn btn-warning"
                        disabled={saving}
                      >
                        {saving
                          ? "Saving..."
                          : categoryForm.id !== null
                          ? "Update Category"
                          : "Add Category"}
                      </button>

                      {categoryForm.id !== null && (
                        <button
                          type="button"
                          className="btn btn-light"
                          onClick={resetCategoryForm}
                          disabled={saving}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </section>
              )}

              <section className="cs-panel">
                <div className="cs-panel-heading">
                  <div>
                    <h4>Category List</h4>
                    <p>
                      {categories.length} categories registered
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <input
                    type="search"
                    className="form-control"
                    placeholder="Search categories..."
                    value={categorySearch}
                    onChange={(event) =>
                      setCategorySearch(event.target.value)
                    }
                  />
                </div>

                <div className="table-responsive">
                  <table className="table align-middle cs-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredCategories.map((category) => (
                        <tr key={category.id}>
                          <td>
                            <div className="cs-category-name">
                              <span className="cs-small-icon">
                                <i className="bi bi-folder2-open" />
                              </span>

                              {category.category || category.name}
                            </div>
                          </td>

                          <td>
                            <div className="cs-actions">
                              <button
                                type="button"
                                className="btn btn-sm btn-light"
                                title="View category services"
                                onClick={() => viewCategory(category)}
                              >
                                <i className="bi bi-eye" />
                              </button>

                              {canManageCategories && (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-light"
                                    title="Edit category"
                                    onClick={() =>
                                      editCategory(category)
                                    }
                                  >
                                    <i className="bi bi-pencil" />
                                  </button>

                                  <button
                                    type="button"
                                    className="btn btn-sm btn-light text-danger"
                                    title="Delete category"
                                    onClick={() =>
                                      setDeleteTarget({
                                        type: "category",
                                        item: category,
                                      })
                                    }
                                  >
                                    <i className="bi bi-trash" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}

                      {filteredCategories.length === 0 && (
                        <tr>
                          <td colSpan="2" className="cs-empty">
                            No categories found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* Services tab */}
          {activeTab === "services" && (
            <div className="cs-content-grid">
              {canManageServices && (
                <section className="cs-panel">
                  <div className="cs-panel-heading">
                    <div>
                      <h4>
                        {serviceForm.id !== null
                          ? "Edit Service"
                          : "Add Service"}
                      </h4>

                      <p>Add a service under a category.</p>
                    </div>

                    <i className="bi bi-wrench-adjustable cs-heading-icon" />
                  </div>

                  <form onSubmit={saveService}>
                    <div className="mb-3">
                      <label
                        htmlFor="service-name-input"
                        className="form-label"
                      >
                        Service Name
                      </label>

                      <input
                        id="service-name-input"
                        type="text"
                        className="form-control"
                        placeholder="e.g. AC Repair"
                        value={serviceForm.service}
                        onChange={(event) =>
                          setServiceForm({
                            ...serviceForm,
                            service: event.target.value,
                          })
                        }
                        maxLength={150}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label
                        htmlFor="service-category-input"
                        className="form-label"
                      >
                        Category
                      </label>

                      <select
                        id="service-category-input"
                        className="form-select"
                        value={serviceForm.category}
                        onChange={(event) =>
                          setServiceForm({
                            ...serviceForm,
                            category: event.target.value,
                          })
                        }
                        required
                      >
                        <option value="">Select a category</option>

                        {categories.map((category) => (
                          <option
                            key={category.id}
                            value={
                              category.category || category.name
                            }
                          >
                            {category.category || category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label
                        htmlFor="service-description-input"
                        className="form-label"
                      >
                        Description
                      </label>

                      <textarea
                        id="service-description-input"
                        className="form-control"
                        rows="4"
                        placeholder="Describe this service..."
                        value={serviceForm.description}
                        onChange={(event) =>
                          setServiceForm({
                            ...serviceForm,
                            description: event.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="cs-form-actions">
                      <button
                        type="submit"
                        className="btn btn-warning"
                        disabled={
                          saving || categories.length === 0
                        }
                      >
                        {saving
                          ? "Saving..."
                          : serviceForm.id !== null
                          ? "Update Service"
                          : "Add Service"}
                      </button>

                      {serviceForm.id !== null && (
                        <button
                          type="button"
                          className="btn btn-light"
                          onClick={resetServiceForm}
                          disabled={saving}
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    {categories.length === 0 && (
                      <p className="text-danger small mt-3 mb-0">
                        Add a category before creating a service.
                      </p>
                    )}
                  </form>
                </section>
              )}

              <section className="cs-panel">
                <div className="cs-panel-heading">
                  <div>
                    <h4>Service List</h4>
                    <p>Search and view existing services.</p>
                  </div>
                </div>

                <div className="cs-filter-row">
                  <input
                    type="search"
                    className="form-control"
                    placeholder="Search services..."
                    value={serviceSearch}
                    onChange={(event) =>
                      setServiceSearch(event.target.value)
                    }
                  />

                  <select
                    className="form-select"
                    value={serviceCategoryFilter}
                    onChange={(event) =>
                      setServiceCategoryFilter(event.target.value)
                    }
                  >
                    <option value="">All categories</option>

                    {categories.map((category) => (
                      <option
                        key={category.id}
                        value={
                          category.category || category.name
                        }
                      >
                        {category.category || category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="table-responsive">
                  <table className="table align-middle cs-table">
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {services.map((service) => (
                        <tr key={service.id}>
                          <td className="fw-semibold">
                            {service.service}
                          </td>

                          <td>
                            <span className="cs-category-badge">
                              {service.category}
                            </span>
                          </td>

                          <td className="cs-description">
                            {service.description || "—"}
                          </td>

                          <td>
                            <div className="cs-actions">
                              {canManageServices && (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-light"
                                    title="Edit service"
                                    onClick={() =>
                                      editService(service)
                                    }
                                  >
                                    <i className="bi bi-pencil" />
                                  </button>

                                  <button
                                    type="button"
                                    className="btn btn-sm btn-light text-danger"
                                    title="Delete service"
                                    onClick={() =>
                                      setDeleteTarget({
                                        type: "service",
                                        item: service,
                                      })
                                    }
                                  >
                                    <i className="bi bi-trash" />
                                  </button>
                                </>
                              )}

                              {!canManageServices && (
                                <span className="text-muted small">
                                  View only
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}

                      {services.length === 0 && (
                        <tr>
                          <td colSpan="4" className="cs-empty">
                            No services found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
        </>
      )}

      {/* Category details modal */}
      {selectedCategory && (
        <div
          className="cs-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedCategory(null);
            }
          }}
        >
          <div
            className="cs-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cs-category-modal-title"
          >
            <div className="cs-modal-header">
              <div>
                <h4 id="cs-category-modal-title">
                  {selectedCategory.name ||
                    selectedCategory.category}
                </h4>

                <p>
                  {selectedCategory.total_services ??
                    selectedCategory.services?.length ??
                    0}{" "}
                  services in this category
                </p>
              </div>

              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setSelectedCategory(null)}
              />
            </div>

            <div className="cs-modal-body">
              {selectedCategory.services?.length ? (
                selectedCategory.services.map((service) => (
                  <div
                    className="cs-detail-service"
                    key={service.id}
                  >
                    <div>
                      <strong>{service.service}</strong>
                      <p>
                        {service.description || "No description"}
                      </p>
                    </div>

                    {canManageServices && (
                      <button
                        type="button"
                        className="btn btn-sm btn-light"
                        onClick={() => {
                          setSelectedCategory(null);
                          setActiveTab("services");

                          editService({
                            ...service,
                            category:
                              selectedCategory.name ||
                              selectedCategory.category,
                          });
                        }}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="cs-empty">
                  No services are assigned to this category.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          className="cs-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              setDeleteTarget(null);
            }
          }}
        >
          <div
            className="cs-modal cs-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cs-delete-title"
          >
            <div className="cs-delete-icon">
              <i className="bi bi-exclamation-triangle" />
            </div>

            <h4 id="cs-delete-title">Confirm Deletion</h4>

            <p>
              Are you sure you want to delete{" "}
              <strong>
                {deleteTarget.item.category ||
                  deleteTarget.item.name ||
                  deleteTarget.item.service}
              </strong>
              ? This action cannot be undone.
            </p>

            <p className="small text-muted">
              Django may refuse deletion if this category or service
              is still being used.
            </p>

            <div className="cs-modal-actions">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => setDeleteTarget(null)}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={deleteItem}
                disabled={saving}
              >
                {saving ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoriesServices;
