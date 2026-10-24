
import { useCallback, useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

function getCookie(name) {
  const cookies = document.cookie.split(";");

  for (const cookie of cookies) {
    const trimmedCookie = cookie.trim();

    if (trimmedCookie.startsWith(`${name}=`)) {
      return decodeURIComponent(trimmedCookie.substring(name.length + 1));
    }
  }

  return "";
}

async function getCsrfToken() {
  const cookieToken = getCookie("csrftoken");

  if (cookieToken) {
    return cookieToken;
  }

  try {
    const response = await api.get("/api/csrf-token/");
    return response.data.csrftoken || response.data.csrfToken || "";
  } catch {
    return "";
  }
}

async function sendRequest(method, url, data) {
  const config = {
    method,
    url,
  };

  if (["POST", "PATCH", "PUT", "DELETE"].includes(method.toUpperCase())) {
    const csrfToken = await getCsrfToken();

    config.headers = {
      "X-CSRFToken": csrfToken,
    };
  }

  if (data !== undefined) {
    if (method.toUpperCase() === "DELETE") {
      config.data = data;
    } else {
      config.data = data;
    }
  }

  return api(config);
}

function getErrorMessage(error) {
  const data = error?.response?.data;

  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.detail) return data.detail;

  if (data && typeof data === "object") {
    return Object.entries(data)
      .map(([key, value]) => {
        const message = Array.isArray(value) ? value.join(", ") : value;
        return `${key}: ${message}`;
      })
      .join(" | ");
  }

  return error?.message || "Something went wrong. Please try again.";
}

function getRows(data, ...keys) {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return [];
}

function getVendorId(item) {
  return (
    item?.vendor_id ??
    item?.vendor ??
    item?.vendor_details?.id ??
    item?.vendor_detail?.id ??
    item?.vendor_info?.id ??
    item?.vendor?.id
  );
}

function getVendorName(item) {
  return (
    item?.name ??
    item?.vendor_name ??
    item?.vendor_details?.name ??
    item?.vendor_detail?.name ??
    item?.vendor?.name ??
    "Unnamed vendor"
  );
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(`${value}`.slice(0, 10) + "T00:00:00");

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusClass(status) {
  const normalized = String(status || "pending").toLowerCase();

  if (["approved", "accepted", "completed", "active"].includes(normalized)) {
    return "vv-status vv-status-approved";
  }

  if (["rejected", "cancelled", "canceled", "suspended"].includes(normalized)) {
    return "vv-status vv-status-rejected";
  }

  return "vv-status vv-status-pending";
}

function getStatus(item) {
  return item?.status ?? item?.booking_status ?? "pending";
}

function getRecordDate(item) {
  return (
    item?.date ??
    item?.unavailable_date ??
    item?.exception_date ??
    item?.day ??
    ""
  );
}

function getRecordId(item) {
  return item?.id ?? item?.pk;
}

function getServiceId(item) {
  return item?.id ?? item?.vendor_service_id ?? item?.service_id;
}

function getServiceName(item) {
  return (
    item?.service_name ??
    item?.service?.service ??
    item?.service?.name ??
    item?.service ??
    item?.name ??
    "Service"
  );
}

function getCharge(item) {
  return (
    item?.visiting_charge ??
    item?.charge ??
    item?.price ??
    ""
  );
}

function getBookingId(item) {
  return item?.id ?? item?.booking_id;
}

function getBookingDate(item) {
  return item?.booking_date ?? item?.date ?? item?.created_at ?? "";
}

function getReviewId(item) {
  return item?.id ?? item?.review_id;
}

function getReviewText(item) {
  return item?.feedback ?? item?.review ?? item?.comment ?? "";
}

function getReviewRating(item) {
  return item?.rating ?? item?.stars ?? "—";
}

function getReviewAuthor(item) {
  return (
    item?.customer_name ??
    item?.customer?.name ??
    item?.user_name ??
    item?.user?.username ??
    "Customer"
  );
}

function VendorVerification({ onBack, onStatsRefresh }) {
  const [vendors, setVendors] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [selectedVendor, setSelectedVendor] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const [relatedData, setRelatedData] = useState({
    services: [],
    bookings: [],
    availability: [],
    unavailableDates: [],
    weeklyOffs: [],
    exceptions: [],
    reviews: [],
  });

  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedError, setRelatedError] = useState("");

  const [confirmation, setConfirmation] = useState(null);
  const [updating, setUpdating] = useState(false);

  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    about: "",
  });

  const [chargeInputs, setChargeInputs] = useState({});
  const [availabilityValue, setAvailabilityValue] = useState(true);

  const [newUnavailableDate, setNewUnavailableDate] = useState("");
  const [unavailableReason, setUnavailableReason] = useState("");
  const [weeklyOffDay, setWeeklyOffDay] = useState("0");
  const [newExceptionDate, setNewExceptionDate] = useState("");

  const [busyAction, setBusyAction] = useState(false);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/admin/vendors/");
      const rows = getRows(response.data, "vendors", "results", "data");

      setVendors(rows);
      setTotal(response.data?.total ?? rows.length);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const clearMessages = () => {
    setError("");
    setNotice("");
    setRelatedError("");
  };

  const showNotice = (message) => {
    setNotice(message);
    setError("");
    setRelatedError("");
  };

  const showError = (message) => {
    setError(message);
    setNotice("");
  };

  const getVendorRelatedData = async (vendorId) => {
    setRelatedLoading(true);
    setRelatedError("");

    const nextData = {
      services: [],
      bookings: [],
      availability: [],
      unavailableDates: [],
      weeklyOffs: [],
      exceptions: [],
      reviews: [],
    };

    const requests = [
      {
        key: "services",
        url: "/api/admin/vendor-services/",
        keys: ["services", "vendor_services", "results", "data"],
      },
      {
        key: "bookings",
        url: `/api/admin/vendors/${vendorId}/bookings/`,
        keys: ["bookings", "results", "data"],
      },
      {
        key: "availability",
        url: "/api/admin/vendor-availability/",
        keys: ["availability", "weekly_offs", "results", "data"],
      },
      {
        key: "unavailableDates",
        url: "/api/admin/vendor-unavailable-dates/",
        keys: ["unavailable_dates", "dates", "results", "data"],
      },
      {
        key: "reviews",
        url: "/api/admin/reviews/",
        keys: ["reviews", "results", "data"],
      },
    ];

    const results = await Promise.allSettled(
      requests.map((request) => api.get(request.url))
    );

    const failedRequests = [];

    results.forEach((result, index) => {
      const request = requests[index];

      if (result.status === "rejected") {
        failedRequests.push(request.key);
        return;
      }

      let rows = getRows(result.value.data, ...request.keys);

      if (request.key === "services") {
        rows = rows.filter((item) => {
          const id = getVendorId(item);
          return String(id) === String(vendorId);
        });
      }

      if (request.key === "availability" || request.key === "unavailableDates") {
        rows = rows.filter((item) => {
          const id = getVendorId(item);
          return String(id) === String(vendorId);
        });
      }

      if (request.key === "reviews") {
        rows = rows.filter((item) => {
          const id = getVendorId(item);
          return id == null || String(id) === String(vendorId);
        });
      }

      nextData[request.key] = rows;
    });

    nextData.weeklyOffs = nextData.availability.filter(
      (item) =>
        item?.day_of_week !== undefined ||
        item?.weekday !== undefined ||
        item?.weekly_off !== undefined ||
        item?.is_weekly_off
    );

    nextData.exceptions = nextData.availability.filter(
      (item) =>
        item?.exception_date ||
        item?.is_weekly_off_exception
    );

    setRelatedData(nextData);

    if (failedRequests.length) {
      setRelatedError(
        `Some records could not be loaded: ${failedRequests.join(", ")}.`
      );
    }

    setRelatedLoading(false);
  };

  const viewVendor = async (vendor) => {
    clearMessages();
    setSelectedVendor(vendor);
    setActiveTab("profile");
    setEditingProfile(false);
    setDetailLoading(true);

    setProfileForm({
      name: vendor?.name ?? "",
      username: vendor?.username ?? "",
      email: vendor?.email ?? "",
      phone: vendor?.phone ?? "",
      about: vendor?.about ?? "",
    });

    setAvailabilityValue(Boolean(vendor?.is_available));

    try {
      const response = await api.get(`/api/admin/vendors/${vendor.id}/`);
      const detail = response.data?.vendor ?? response.data?.data ?? response.data;

      setSelectedVendor(detail);
      setProfileForm({
        name: detail?.name ?? "",
        username: detail?.username ?? "",
        email: detail?.email ?? "",
        phone: detail?.phone ?? "",
        about: detail?.about ?? "",
      });

      setAvailabilityValue(Boolean(detail?.is_available));

      await getVendorRelatedData(vendor.id);
    } catch (requestError) {
      showError(getErrorMessage(requestError));
      await getVendorRelatedData(vendor.id);
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshSelectedVendor = async () => {
    if (!selectedVendor?.id) return;

    await fetchVendors();

    try {
      const response = await api.get(
        `/api/admin/vendors/${selectedVendor.id}/`
      );

      const detail = response.data?.vendor ?? response.data?.data ?? response.data;

      setSelectedVendor(detail);

      setProfileForm({
        name: detail?.name ?? "",
        username: detail?.username ?? "",
        email: detail?.email ?? "",
        phone: detail?.phone ?? "",
        about: detail?.about ?? "",
      });

      setAvailabilityValue(Boolean(detail?.is_available));
    } catch {
      // Keep the current detail visible if refreshing it fails.
    }

    await getVendorRelatedData(selectedVendor.id);
  };

  const closeDetails = () => {
    setSelectedVendor(null);
    setEditingProfile(false);
    setConfirmation(null);
    setRelatedError("");
  };

  const requestStatusChange = (vendor, status) => {
    setConfirmation({
      type: "vendor-status",
      vendor,
      status,
      title: status === "approved" ? "Approve vendor?" : "Reject vendor?",
      message:
        status === "approved"
          ? "Approve this vendor? They will be marked as approved."
          : "Reject this vendor? They will be marked as rejected.",
    });
  };

  const updateVendorStatus = async (vendor, status) => {
    setUpdating(true);
    clearMessages();

    try {
      const response = await sendRequest(
        "PATCH",
        `/api/admin/vendors/${vendor.id}/status/`,
        { status }
      );

      showNotice(response.data?.message || `Vendor ${status} successfully.`);

      await fetchVendors();

      if (selectedVendor?.id === vendor.id) {
        await refreshSelectedVendor();
      }

      if (onStatsRefresh) await onStatsRefresh();
    } catch (requestError) {
      showError(getErrorMessage(requestError));
    } finally {
      setUpdating(false);
      setConfirmation(null);
    }
  };

  const startEditingProfile = () => {
    setEditingProfile(true);
    setProfileForm({
      name: selectedVendor?.name ?? "",
      username: selectedVendor?.username ?? "",
      email: selectedVendor?.email ?? "",
      phone: selectedVendor?.phone ?? "",
      about: selectedVendor?.about ?? "",
    });
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfileForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const saveVendorProfile = async (event) => {
    event.preventDefault();

    if (!selectedVendor?.id) return;

    setSavingProfile(true);
    clearMessages();

    try {
      const response = await sendRequest(
        "PATCH",
        `/api/admin/vendors/${selectedVendor.id}/update/`,
        {
          name: profileForm.name.trim(),
          username: profileForm.username.trim(),
          email: profileForm.email.trim(),
          phone: profileForm.phone.trim(),
          about: profileForm.about.trim(),
        }
      );

      showNotice(response.data?.message || "Vendor profile updated.");

      setEditingProfile(false);
      await refreshSelectedVendor();

      if (onStatsRefresh) await onStatsRefresh();
    } catch (requestError) {
      showError(getErrorMessage(requestError));
    } finally {
      setSavingProfile(false);
    }
  };

  const saveAvailability = async (event) => {
    event.preventDefault();

    if (!selectedVendor?.id) return;

    setBusyAction(true);
    clearMessages();

    try {
      const response = await sendRequest(
        "PATCH",
        `/api/admin/vendors/${selectedVendor.id}/availability/update/`,
        { is_available: availabilityValue }
      );

      showNotice(response.data?.message || "Availability updated.");
      await refreshSelectedVendor();
    } catch (requestError) {
      showError(getErrorMessage(requestError));
    } finally {
      setBusyAction(false);
    }
  };

  const saveServiceCharge = async (service) => {
    const serviceId = getServiceId(service);
    const charge = chargeInputs[serviceId] ?? getCharge(service);

    if (charge === "" || Number.isNaN(Number(charge)) || Number(charge) < 0) {
      showError("Enter a valid visiting charge.");
      return;
    }

    setBusyAction(true);
    clearMessages();

    try {
      const response = await sendRequest(
        "PATCH",
        `/api/admin/vendor-services/${serviceId}/charge/`,
        { visiting_charge: Number(charge) }
      );

      showNotice(response.data?.message || "Visiting charge updated.");
      await refreshSelectedVendor();
    } catch (requestError) {
      showError(getErrorMessage(requestError));
    } finally {
      setBusyAction(false);
    }
  };

  const deleteService = async (service) => {
    const serviceId = getServiceId(service);

    setBusyAction(true);
    clearMessages();

    try {
      const response = await sendRequest(
        "DELETE",
        `/api/admin/vendor-services/${serviceId}/delete/`
      );

      showNotice(response.data?.message || "Vendor service removed.");
      setConfirmation(null);
      await refreshSelectedVendor();
    } catch (requestError) {
      showError(getErrorMessage(requestError));
    } finally {
      setBusyAction(false);
    }
  };

  const updateBookingStatus = async (booking, status) => {
    const bookingId = getBookingId(booking);

    setBusyAction(true);
    clearMessages();

    try {
      const response = await sendRequest(
        "PATCH",
        `/api/admin/bookings/${bookingId}/status/`,
        { status }
      );

      showNotice(response.data?.message || `Booking ${status}.`);
      setConfirmation(null);
      await refreshSelectedVendor();

      if (onStatsRefresh) await onStatsRefresh();
    } catch (requestError) {
      showError(getErrorMessage(requestError));
    } finally {
      setBusyAction(false);
    }
  };

  const cancelBooking = async (booking) => {
    const bookingId = getBookingId(booking);

    setBusyAction(true);
    clearMessages();

    try {
      const response = await sendRequest(
        "POST",
        `/api/admin/bookings/${bookingId}/cancel/`,
        {}
      );

      showNotice(response.data?.message || "Booking cancelled.");
      setConfirmation(null);
      await refreshSelectedVendor();

      if (onStatsRefresh) await onStatsRefresh();
    } catch (requestError) {
      showError(getErrorMessage(requestError));
    } finally {
      setBusyAction(false);
    }
  };

  const deleteReview = async (review) => {
    const reviewId = getReviewId(review);

    setBusyAction(true);
    clearMessages();

    try {
      const response = await sendRequest(
        "DELETE",
        `/api/admin/reviews/${reviewId}/delete/`
      );

      showNotice(response.data?.message || "Review deleted.");
      setConfirmation(null);
      await refreshSelectedVendor();
    } catch (requestError) {
      showError(getErrorMessage(requestError));
    } finally {
      setBusyAction(false);
    }
  };

  const addUnavailableDate = async (event) => {
    event.preventDefault();

    if (!selectedVendor?.id || !newUnavailableDate) {
      showError("Please select an unavailable date.");
      return;
    }

    setBusyAction(true);
    clearMessages();

    try {
      const response = await sendRequest(
        "POST",
        "/api/vendor/unavailable/add/",
        {
          vendor: selectedVendor.id,
          date: newUnavailableDate,
          reason: unavailableReason.trim(),
        }
      );

      showNotice(response.data?.message || "Unavailable date added.");
      setNewUnavailableDate("");
      setUnavailableReason("");
      await refreshSelectedVendor();
    } catch (requestError) {
      showError(getErrorMessage(requestError));
    } finally {
      setBusyAction(false);
    }
  };

  const removeUnavailableDate = async (item) => {
    const date = getRecordDate(item);

    if (!selectedVendor?.id || !date) {
      showError("Unable to identify the unavailable date.");
      return;
    }

    setBusyAction(true);
    clearMessages();

    try {
      const response = await sendRequest(
        "DELETE",
        `/api/vendor/unavailable/${selectedVendor.id}/${encodeURIComponent(date)}/`
      );

      showNotice(response.data?.message || "Unavailable date removed.");
      setConfirmation(null);
      await refreshSelectedVendor();
    } catch (requestError) {
      showError(getErrorMessage(requestError));
    } finally {
      setBusyAction(false);
    }
  };

  const saveWeeklyOff = async (event) => {
    event.preventDefault();

    if (!selectedVendor?.id) return;

    setBusyAction(true);
    clearMessages();

    try {
      const response = await sendRequest(
        "POST",
        "/api/vendor/weekly-off/",
        {
          vendor: selectedVendor.id,
          day: Number(weeklyOffDay),
        }
      );

      showNotice(response.data?.message || "Weekly off saved.");
      await refreshSelectedVendor();
    } catch (requestError) {
      showError(getErrorMessage(requestError));
    } finally {
      setBusyAction(false);
    }
  };

  const addWeeklyOffException = async (event) => {
    event.preventDefault();

    if (!selectedVendor?.id || !newExceptionDate) {
      showError("Please select an exception date.");
      return;
    }

    setBusyAction(true);
    clearMessages();

    try {
      const response = await sendRequest(
        "POST",
        "/api/vendor/weekly-off-exception/add/",
        {
          vendor: selectedVendor.id,
          date: newExceptionDate,
        }
      );

      showNotice(response.data?.message || "Weekly-off exception added.");
      setNewExceptionDate("");
      await refreshSelectedVendor();
    } catch (requestError) {
      showError(getErrorMessage(requestError));
    } finally {
      setBusyAction(false);
    }
  };

  const removeWeeklyOffException = async (item) => {
    const date = item?.exception_date ?? item?.date;

    if (!selectedVendor?.id || !date) {
      showError("Unable to identify this weekly-off exception.");
      return;
    }

    setBusyAction(true);
    clearMessages();

    try {
      const response = await sendRequest(
        "DELETE",
        "/api/vendor/weekly-off-exception/remove/",
        {
          vendor: selectedVendor.id,
          date,
        }
      );

      showNotice(response.data?.message || "Weekly-off exception removed.");
      setConfirmation(null);
      await refreshSelectedVendor();
    } catch (requestError) {
      showError(getErrorMessage(requestError));
    } finally {
      setBusyAction(false);
    }
  };

  const submitConfirmation = async () => {
    if (!confirmation) return;

    const action = confirmation;

    if (action.type === "vendor-status") {
      await updateVendorStatus(action.vendor, action.status);
      return;
    }

    if (action.type === "delete-service") {
      await deleteService(action.item);
      return;
    }

    if (action.type === "reject-booking") {
      await updateBookingStatus(action.item, "rejected");
      return;
    }

    if (action.type === "cancel-booking") {
      await cancelBooking(action.item);
      return;
    }

    if (action.type === "delete-review") {
      await deleteReview(action.item);
      return;
    }

    if (action.type === "delete-unavailable-date") {
      await removeUnavailableDate(action.item);
      return;
    }

    if (action.type === "delete-weekly-exception") {
      await removeWeeklyOffException(action.item);
    }
  };

  const filteredVendors = vendors.filter((vendor) => {
    const term = search.trim().toLowerCase();

    const matchesSearch =
      !term ||
      [
        vendor.name,
        vendor.username,
        vendor.email,
        vendor.phone,
        vendor.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));

    const matchesStatus =
      statusFilter === "all" ||
      String(vendor.status || "").toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "services", label: "Services" },
    { id: "availability", label: "Availability" },
    { id: "bookings", label: "Bookings" },
    { id: "reviews", label: "Reviews" },
  ];

  if (selectedVendor) {
    return (
      <div className="vv-page">
        <div className="vv-header">
          <div>
            <button
              type="button"
              className="btn btn-outline-secondary mb-3"
              onClick={closeDetails}
            >
              ← Back to Vendor List
            </button>

            <h2 className="vv-title">
              Vendor Section
            </h2>

            <p className="vv-subtitle">
              Manage the profile, services, availability, bookings and reviews.
            </p>
          </div>

          <span className={statusClass(selectedVendor.status)}>
            {selectedVendor.status || "pending"}
          </span>
        </div>

        {notice && (
          <div className="alert alert-success" role="status">
            {notice}
          </div>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {relatedError && (
          <div className="alert alert-warning" role="status">
            {relatedError}
          </div>
        )}

        {detailLoading ? (
          <div className="vv-loading">Loading vendor details...</div>
        ) : (
          <>
            <div className="vv-vendor-summary">
              <div>
                <h3>{selectedVendor.name || "Vendor"}</h3>
                <p className="mb-1">
                  @{selectedVendor.username || "—"}
                </p>
                <p className="mb-0">
                  {selectedVendor.email || "No email"}
                </p>
              </div>

              <div className="vv-summary-actions">
                {String(selectedVendor.status).toLowerCase() !== "approved" && (
                  <button
                    type="button"
                    className="btn btn-success"
                    disabled={updating}
                    onClick={() =>
                      requestStatusChange(selectedVendor, "approved")
                    }
                  >
                    Approve
                  </button>
                )}

                {String(selectedVendor.status).toLowerCase() !== "rejected" && (
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    disabled={updating}
                    onClick={() =>
                      requestStatusChange(selectedVendor, "rejected")
                    }
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>

            <div className="vv-tabs">
              {tabs.map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  className={`vv-tab ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => {
                    clearMessages();
                    setActiveTab(tab.id);
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {relatedLoading && (
              <div className="vv-loading">Refreshing vendor records...</div>
            )}

            {activeTab === "profile" && (
              <div className="vv-card">
                <div className="vv-card-header">
                  <div>
                    <h3 className="vv-section-title">Vendor Profile</h3>
                    <p>View and edit this vendor's account details.</p>
                  </div>

                  {!editingProfile && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={startEditingProfile}
                    >
                      Edit Profile
                    </button>
                  )}
                </div>

                {editingProfile ? (
                  <form onSubmit={saveVendorProfile}>
                    <div className="vv-profile-grid">
                      <div className="vv-form-group">
                        <label htmlFor="vv-name">Name</label>
                        <input
                          id="vv-name"
                          name="name"
                          value={profileForm.name}
                          onChange={handleProfileChange}
                          required
                        />
                      </div>

                      <div className="vv-form-group">
                        <label htmlFor="vv-username">Username</label>
                        <input
                          id="vv-username"
                          name="username"
                          value={profileForm.username}
                          onChange={handleProfileChange}
                          required
                        />
                      </div>

                      <div className="vv-form-group">
                        <label htmlFor="vv-email">Email</label>
                        <input
                          id="vv-email"
                          name="email"
                          type="email"
                          value={profileForm.email}
                          onChange={handleProfileChange}
                          required
                        />
                      </div>

                      <div className="vv-form-group">
                        <label htmlFor="vv-phone">Phone</label>
                        <input
                          id="vv-phone"
                          name="phone"
                          value={profileForm.phone}
                          onChange={handleProfileChange}
                        />
                      </div>

                      <div className="vv-form-group vv-form-full">
                        <label htmlFor="vv-about">About</label>
                        <textarea
                          id="vv-about"
                          name="about"
                          rows="4"
                          value={profileForm.about}
                          onChange={handleProfileChange}
                        />
                      </div>
                    </div>

                    <div className="vv-form-actions">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setEditingProfile(false)}
                        disabled={savingProfile}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={savingProfile}
                      >
                        {savingProfile ? "Saving..." : "Save Profile"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="vv-profile-grid">
                    <div className="vv-detail-item">
                      <span>Name</span>
                      <strong>{selectedVendor.name || "—"}</strong>
                    </div>

                    <div className="vv-detail-item">
                      <span>Username</span>
                      <strong>{selectedVendor.username || "—"}</strong>
                    </div>

                    <div className="vv-detail-item">
                      <span>Email</span>
                      <strong>{selectedVendor.email || "—"}</strong>
                    </div>

                    <div className="vv-detail-item">
                      <span>Phone</span>
                      <strong>{selectedVendor.phone || "—"}</strong>
                    </div>

                    <div className="vv-detail-item vv-form-full">
                      <span>About</span>
                      <p>{selectedVendor.about || "No description provided."}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "services" && (
              <div className="vv-card">
                <h3 className="vv-section-title">Manage Vendor Services</h3>

                {relatedData.services.length === 0 ? (
                  <p className="vv-empty">No services found for this vendor.</p>
                ) : (
                  <div className="vv-record-list">
                    {relatedData.services.map((service, index) => {
                      const serviceId = getServiceId(service);

                      return (
                        <div
                          className="vv-record-card"
                          key={serviceId ?? index}
                        >
                          <div className="vv-record-heading">
                            <h4>{getServiceName(service)}</h4>
                            <span className="vv-muted">
                              Service ID: {serviceId ?? "—"}
                            </span>
                          </div>

                          <div className="vv-inline-form">
                            <div className="vv-form-group">
                              <label htmlFor={`vv-charge-${serviceId}`}>
                                Visiting Charge
                              </label>

                              <input
                                id={`vv-charge-${serviceId}`}
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                  chargeInputs[serviceId] ?? getCharge(service)
                                }
                                onChange={(event) =>
                                  setChargeInputs((current) => ({
                                    ...current,
                                    [serviceId]: event.target.value,
                                  }))
                                }
                              />
                            </div>

                            <button
                              type="button"
                              className="btn btn-primary"
                              disabled={busyAction}
                              onClick={() => saveServiceCharge(service)}
                            >
                              Save Charge
                            </button>

                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              disabled={busyAction}
                              onClick={() =>
                                setConfirmation({
                                  type: "delete-service",
                                  item: service,
                                  title: "Remove this service?",
                                  message:
                                    "This will remove this service from the vendor. Continue?",
                                })
                              }
                            >
                              Remove Service
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "availability" && (
              <div className="vv-card">
                <h3 className="vv-section-title">Vendor Availability</h3>

                <div className="vv-record-card">
                  <h4>Overall Availability</h4>

                  <form onSubmit={saveAvailability}>
                    <div className="vv-form-group">
                      <label htmlFor="vv-is-available">
                        Can this vendor accept bookings?
                      </label>

                      <select
                        id="vv-is-available"
                        value={availabilityValue ? "available" : "unavailable"}
                        onChange={(event) =>
                          setAvailabilityValue(event.target.value === "available")
                        }
                      >
                        <option value="available">Available</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary mt-3"
                      disabled={busyAction}
                    >
                      Save Availability
                    </button>
                  </form>
                </div>

                <hr />

                <div className="vv-record-card">
                  <h4>Set Weekly Off</h4>

                  <form onSubmit={saveWeeklyOff}>
                    <div className="vv-form-group">
                      <label htmlFor="vv-weekly-off-day">
                        Weekly off day
                      </label>

                      <select
                        id="vv-weekly-off-day"
                        value={weeklyOffDay}
                        onChange={(event) =>
                          setWeeklyOffDay(event.target.value)
                        }
                      >
                        <option value="0">Monday</option>
                        <option value="1">Tuesday</option>
                        <option value="2">Wednesday</option>
                        <option value="3">Thursday</option>
                        <option value="4">Friday</option>
                        <option value="5">Saturday</option>
                        <option value="6">Sunday</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary mt-3"
                      disabled={busyAction}
                    >
                      Save Weekly Off
                    </button>
                  </form>

                  {relatedData.weeklyOffs.length > 0 && (
                    <div className="vv-record-list mt-3">
                      {relatedData.weeklyOffs.map((item, index) => (
                        <div
                          className="vv-date-item"
                          key={getRecordId(item) ?? index}
                        >
                          {item.day_name ??
                            item.weekday_name ??
                            item.weekly_off ??
                            item.day_of_week ??
                            item.weekday}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <hr />

                <div className="vv-record-card">
                  <h4>Declare Unavailable Date</h4>

                  <form onSubmit={addUnavailableDate}>
                    <div className="vv-profile-grid">
                      <div className="vv-form-group">
                        <label htmlFor="vv-new-unavailable-date">Date</label>
                        <input
                          id="vv-new-unavailable-date"
                          type="date"
                          value={newUnavailableDate}
                          onChange={(event) =>
                            setNewUnavailableDate(event.target.value)
                          }
                          required
                        />
                      </div>

                      <div className="vv-form-group">
                        <label htmlFor="vv-unavailable-reason">Reason</label>
                        <input
                          id="vv-unavailable-reason"
                          value={unavailableReason}
                          onChange={(event) =>
                            setUnavailableReason(event.target.value)
                          }
                          placeholder="Optional reason"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary mt-3"
                      disabled={busyAction}
                    >
                      Add Unavailable Date
                    </button>
                  </form>
                </div>

                <div className="vv-record-card mt-3">
                  <h4>Unavailable Dates</h4>

                  {relatedData.unavailableDates.length === 0 ? (
                    <p className="vv-empty">
                      No unavailable dates found.
                    </p>
                  ) : (
                    <div className="vv-record-list">
                      {relatedData.unavailableDates.map((item, index) => (
                        <div
                          className="vv-date-item d-flex justify-content-between align-items-center gap-2 flex-wrap"
                          key={getRecordId(item) ?? index}
                        >
                          <span>
                            {formatDate(getRecordDate(item))}
                            {item.reason ? ` — ${item.reason}` : ""}
                          </span>

                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            disabled={busyAction}
                            onClick={() =>
                              setConfirmation({
                                type: "delete-unavailable-date",
                                item,
                                title: "Remove unavailable date?",
                                message:
                                  "Make this date available again for the vendor?",
                              })
                            }
                          >
                            Remove Date
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <hr />

                <div className="vv-record-card">
                  <h4>Weekly-Off Exceptions</h4>
                  <p>
                    Add an exception for a date when the vendor will work
                    despite their usual weekly off.
                  </p>

                  <form onSubmit={addWeeklyOffException}>
                    <div className="vv-form-group">
                      <label htmlFor="vv-new-exception-date">
                        Exception date
                      </label>
                      <input
                        id="vv-new-exception-date"
                        type="date"
                        value={newExceptionDate}
                        onChange={(event) =>
                          setNewExceptionDate(event.target.value)
                        }
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary mt-3"
                      disabled={busyAction}
                    >
                      Add Exception
                    </button>
                  </form>

                  {relatedData.exceptions.length === 0 ? (
                    <p className="vv-empty mt-3">
                      No weekly-off exceptions found in the loaded records.
                    </p>
                  ) : (
                    <div className="vv-record-list mt-3">
                      {relatedData.exceptions.map((item, index) => (
                        <div
                          className="vv-date-item d-flex justify-content-between align-items-center gap-2 flex-wrap"
                          key={getRecordId(item) ?? index}
                        >
                          <span>{formatDate(getRecordDate(item))}</span>

                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            disabled={busyAction}
                            onClick={() =>
                              setConfirmation({
                                type: "delete-weekly-exception",
                                item,
                                title: "Remove weekly-off exception?",
                                message:
                                  "Remove this exception for the selected date?",
                              })
                            }
                          >
                            Remove Exception
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "bookings" && (
              <div className="vv-card">
                <h3 className="vv-section-title">Manage Bookings</h3>

                {relatedData.bookings.length === 0 ? (
                  <p className="vv-empty">No bookings found for this vendor.</p>
                ) : (
                  <div className="vv-record-list">
                    {relatedData.bookings.map((booking, index) => {
                      const bookingId = getBookingId(booking);
                      const bookingStatus = String(
                        getStatus(booking)
                      ).toLowerCase();

                      return (
                        <div
                          className="vv-record-card"
                          key={bookingId ?? index}
                        >
                          <div className="vv-record-heading">
                            <h4>Booking #{bookingId ?? "—"}</h4>
                            <span className={statusClass(bookingStatus)}>
                              {bookingStatus}
                            </span>
                          </div>

                          <div className="vv-profile-grid">
                            <div className="vv-detail-item">
                              <span>Customer</span>
                              <strong>
                                {booking.customer_name ??
                                  booking.customer?.name ??
                                  booking.customer?.username ??
                                  "—"}
                              </strong>
                            </div>

                            <div className="vv-detail-item">
                              <span>Service</span>
                              <strong>
                                {booking.service_name ??
                                  booking.service?.service ??
                                  booking.service?.name ??
                                  "—"}
                              </strong>
                            </div>

                            <div className="vv-detail-item">
                              <span>Booking Date</span>
                              <strong>{formatDate(getBookingDate(booking))}</strong>
                            </div>

                            <div className="vv-detail-item">
                              <span>Visiting Charge</span>
                              <strong>
                                ₹
                                {booking.visiting_charge ??
                                  booking.charge ??
                                  booking.amount ??
                                  "—"}
                              </strong>
                            </div>
                          </div>

                          <div className="vv-form-actions">
                            {![
                              "rejected",
                              "cancelled",
                              "canceled",
                              "completed",
                            ].includes(bookingStatus) && (
                              <button
                                type="button"
                                className="btn btn-outline-danger"
                                disabled={busyAction}
                                onClick={() =>
                                  setConfirmation({
                                    type: "reject-booking",
                                    item: booking,
                                    title: "Reject booking?",
                                    message:
                                      "Reject this booking from the admin side?",
                                  })
                                }
                              >
                                Reject Booking
                              </button>
                            )}

                            {![
                              "cancelled",
                              "canceled",
                              "completed",
                            ].includes(bookingStatus) && (
                              <button
                                type="button"
                                className="btn btn-danger"
                                disabled={busyAction}
                                onClick={() =>
                                  setConfirmation({
                                    type: "cancel-booking",
                                    item: booking,
                                    title: "Cancel booking?",
                                    message:
                                      "Cancel this booking from the admin side?",
                                  })
                                }
                              >
                                Cancel Booking
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="vv-card">
                <h3 className="vv-section-title">Vendor Reviews</h3>

                {relatedData.reviews.length === 0 ? (
                  <p className="vv-empty">No reviews found for this vendor.</p>
                ) : (
                  <div className="vv-record-list">
                    {relatedData.reviews.map((review, index) => {
                      const reviewId = getReviewId(review);

                      return (
                        <div
                          className="vv-record-card"
                          key={reviewId ?? index}
                        >
                          <div className="vv-record-heading">
                            <h4>{getReviewAuthor(review)}</h4>
                            <span className="vv-review-rating">
                              ★ {getReviewRating(review)}
                            </span>
                          </div>

                          <p>
                            {getReviewText(review) || "No written feedback."}
                          </p>

                          <div className="vv-form-actions">
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              disabled={busyAction}
                              onClick={() =>
                                setConfirmation({
                                  type: "delete-review",
                                  item: review,
                                  title: "Delete this review?",
                                  message:
                                    "This will permanently delete the selected review.",
                                })
                              }
                            >
                              Delete Review
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {confirmation && (
          <div className="vv-modal-backdrop">
            <div
              className="vv-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="vv-confirm-title"
            >
              <h3 id="vv-confirm-title">
                {confirmation.title || "Confirm action"}
              </h3>

              <p>
                {confirmation.message || "Are you sure you want to continue?"}
              </p>

              <div className="vv-form-actions">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setConfirmation(null)}
                  disabled={updating || busyAction}
                >
                  Go Back
                </button>

                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={submitConfirmation}
                  disabled={updating || busyAction}
                >
                  {updating || busyAction ? "Processing..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="vv-page">
      <div className="vv-header">
        <div>
          {onBack && (
            <button
              type="button"
              className="btn btn-outline-secondary mb-3"
              onClick={onBack}
            >
              ← Dashboard
            </button>
          )}

          <h2 className="vv-title">Vendor Section</h2>
          <p className="vv-subtitle">
            Approve vendors and manage their profiles, services, availability,
            bookings and reviews.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={fetchVendors}
          disabled={loading}
        >
          Refresh Vendors
        </button>
      </div>

      {notice && (
        <div className="alert alert-success" role="status">
          {notice}
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="vv-stats-row">
        <div className="vv-stat-card">
          <span>Total Vendors</span>
          <strong>{total}</strong>
        </div>

        <div className="vv-stat-card">
          <span>Pending</span>
          <strong>
            {vendors.filter(
              (vendor) =>
                String(vendor.status).toLowerCase() === "pending"
            ).length}
          </strong>
        </div>

        <div className="vv-stat-card">
          <span>Approved</span>
          <strong>
            {vendors.filter(
              (vendor) =>
                String(vendor.status).toLowerCase() === "approved"
            ).length}
          </strong>
        </div>

        <div className="vv-stat-card">
          <span>Rejected</span>
          <strong>
            {vendors.filter(
              (vendor) =>
                String(vendor.status).toLowerCase() === "rejected"
            ).length}
          </strong>
        </div>
      </div>

      <div className="vv-card">
        <div className="vv-list-toolbar">
          <div>
            <h3 className="vv-section-title">All Vendors</h3>
            <p>Choose a vendor to manage their complete profile.</p>
          </div>

          <div className="vv-filter-controls">
            <input
              type="search"
              aria-label="Search vendors"
              placeholder="Search name, email, username..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              aria-label="Filter vendor status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="vv-loading">Loading vendors...</div>
        ) : filteredVendors.length === 0 ? (
          <div className="vv-empty">
            No vendors match your search or selected filter.
          </div>
        ) : (
          <div className="vv-table-wrapper">
            <table className="vv-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Availability</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.id}>
                    <td>
                      <strong>{vendor.name || "Unnamed vendor"}</strong>
                      <small className="d-block">
                        @{vendor.username || "—"}
                      </small>
                    </td>

                    <td>
                      <span className="d-block">{vendor.email || "—"}</span>
                      <small>{vendor.phone || "No phone"}</small>
                    </td>

                    <td>
                      <span className={statusClass(vendor.status)}>
                        {vendor.status || "pending"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          vendor.is_available
                            ? "vv-status vv-status-approved"
                            : "vv-status vv-status-rejected"
                        }
                      >
                        {vendor.is_available ? "Available" : "Unavailable"}
                      </span>
                    </td>

                    <td>
                      <div className="vv-table-actions">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => viewVendor(vendor)}
                        >
                          Manage
                        </button>

                        {String(vendor.status).toLowerCase() !== "approved" && (
                          <button
                            type="button"
                            className="btn btn-success btn-sm"
                            disabled={updating}
                            onClick={() =>
                              requestStatusChange(vendor, "approved")
                            }
                          >
                            Approve
                          </button>
                        )}

                        {String(vendor.status).toLowerCase() !== "rejected" && (
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            disabled={updating}
                            onClick={() =>
                              requestStatusChange(vendor, "rejected")
                            }
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmation && (
        <div className="vv-modal-backdrop">
          <div
            className="vv-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vv-confirm-title"
          >
            <h3 id="vv-confirm-title">{confirmation.title}</h3>
            <p>{confirmation.message}</p>

            <div className="vv-form-actions">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setConfirmation(null)}
                disabled={updating}
              >
                Go Back
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={submitConfirmation}
                disabled={updating}
              >
                {updating ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorVerification;
