
import { useCallback, useEffect, useState } from "react";

const API_BASE_URL = "./api";

const STATUS_OPTIONS = [
  "pending",
  "accepted",
  "rejected",
  "completed",
];

function getCookie(name) {
  const cookies = document.cookie.split(";");

  for (const cookie of cookies) {
    const trimmedCookie = cookie.trim();
    const separatorIndex = trimmedCookie.indexOf("=");

    if (
      separatorIndex !== -1 &&
      trimmedCookie.substring(0, separatorIndex) === name
    ) {
      return decodeURIComponent(
        trimmedCookie.substring(separatorIndex + 1)
      );
    }
  }

  return "";
}

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

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
        `Unable to obtain CSRF token (${response.status}).`
    );
  }

  // Prefer Django's masked token from the JSON response.
  const token =
    data.csrfToken ||
    data.csrf_token ||
    data.csrftoken ||
    getCookie("csrftoken");

  if (
    typeof token !== "string" ||
    !/^[a-zA-Z0-9]+$/.test(token) ||
    (token.length !== 32 && token.length !== 64)
  ) {
    throw new Error(
      "A valid CSRF token was not received from Django. Check the /api/csrf-token/ endpoint and its response."
    );
  }

  return token;
}

function getErrorMessage(data, fallback) {
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.detail === "string") return data.detail;
  if (typeof data?.error === "string") return data.error;

  return fallback;
}

function formatDate(dateValue) {
  if (!dateValue) return "Not provided";

  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(timeValue) {
  if (!timeValue) return "Not provided";

  const parts = timeValue.split(":");

  if (parts.length < 2) return timeValue;

  const date = new Date();
  date.setHours(Number(parts[0]), Number(parts[1]), 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatus(status) {
  if (!status) return "Unknown";

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusClass(status) {
  switch ((status || "").toLowerCase()) {
    case "pending":
      return "booking-status-pending";
    case "accepted":
      return "booking-status-accepted";
    case "rejected":
      return "booking-status-rejected";
    case "completed":
      return "booking-status-completed";
    default:
      return "booking-status-default";
  }
}

function getBookingId(booking) {
  return booking?.id ?? booking?.booking_id;
}

function BookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [statusBooking, setStatusBooking] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);

  const [cancelBooking, setCancelBooking] = useState(null);
  const [cancelSaving, setCancelSaving] = useState(false);

  // Fetch bookings from Django.
  const fetchBookings = useCallback(
    async (showLoader = true) => {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      try {
        const params = new URLSearchParams();

        if (search.trim()) {
          params.append("search", search.trim());
        }

        if (statusFilter !== "all") {
          params.append("status", statusFilter);
        }

        const queryString = params.toString();

        const url = `${API_BASE_URL}/api/admin/bookings/${
          queryString ? `?${queryString}` : ""
        }`;

        const response = await fetch(url, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            getErrorMessage(data, "Unable to load bookings.")
          );
        }

        setBookings(
          Array.isArray(data.bookings) ? data.bookings : []
        );
      } catch (err) {
        setError(
          err.message ||
            "Unable to load bookings. Check your Django server and login session."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, statusFilter]
  );

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Open the booking details modal.
  const openBookingDetails = async (booking) => {
    const bookingId = getBookingId(booking);

    if (!bookingId) {
      setError("This booking does not have a valid booking ID.");
      return;
    }

    setSelectedBooking(null);
    setDetailLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/bookings/${bookingId}/`,
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
          getErrorMessage(data, "Unable to load booking details.")
        );
      }

      if (!data.booking) {
        throw new Error("The server did not return booking details.");
      }

      setSelectedBooking(data.booking);
    } catch (err) {
      setError(err.message || "Unable to load booking details.");
    } finally {
      setDetailLoading(false);
    }
  };

  // Open the update-status modal.
  const openStatusModal = (booking) => {
    setStatusBooking(booking);
    setNewStatus((booking.status || "pending").toLowerCase());
    setError("");
    setSuccess("");
  };

  // Update booking status using a fresh CSRF token.
  const updateBookingStatus = async () => {
    const bookingId = getBookingId(statusBooking);

    if (!bookingId || !STATUS_OPTIONS.includes(newStatus)) {
      setError("Please select a valid booking status.");
      return;
    }

    setStatusSaving(true);
    setError("");
    setSuccess("");

    try {
      // FIX: Get the token from Django before sending PATCH.
      const csrfToken = await getCsrfToken();

      const response = await fetch(
        `${API_BASE_URL}/api/admin/bookings/${bookingId}/status/`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to update booking status.")
        );
      }

      setStatusBooking(null);
      setSuccess(
        data.message || "Booking status updated successfully."
      );

      // Refresh the displayed bookings after a successful update.
      await fetchBookings(false);
    } catch (err) {
      setError(err.message || "Unable to update booking status.");
    } finally {
      setStatusSaving(false);
    }
  };

  // Cancel a booking using a fresh CSRF token.
  const cancelSelectedBooking = async () => {
    const bookingId = getBookingId(cancelBooking);

    if (!bookingId) {
      setError("This booking does not have a valid booking ID.");
      return;
    }

    setCancelSaving(true);
    setError("");
    setSuccess("");

    try {
      // FIX: Get the token from Django before sending PATCH.
      const csrfToken = await getCsrfToken();

      const response = await fetch(
        `${API_BASE_URL}/api/admin/bookings/${bookingId}/cancel/`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "X-CSRFToken": csrfToken,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to cancel this booking.")
        );
      }

      setCancelBooking(null);
      setSuccess(
        data.message || "Booking cancelled successfully."
      );

      // Refresh the displayed bookings after cancellation.
      await fetchBookings(false);
    } catch (err) {
      setError(err.message || "Unable to cancel this booking.");
    } finally {
      setCancelSaving(false);
    }
  };

  const closeAllModals = () => {
    if (statusSaving || cancelSaving) return;

    setSelectedBooking(null);
    setStatusBooking(null);
    setCancelBooking(null);
  };

  const totalBookings = bookings.length;

  const pendingBookings = bookings.filter(
    (booking) =>
      (booking.status || "").toLowerCase() === "pending"
  ).length;

  const acceptedBookings = bookings.filter(
    (booking) =>
      (booking.status || "").toLowerCase() === "accepted"
  ).length;

  const completedBookings = bookings.filter(
    (booking) =>
      (booking.status || "").toLowerCase() === "completed"
  ).length;

  const detailCustomer = selectedBooking?.customer;
  const detailVendor = selectedBooking?.vendor;
  const detailService = selectedBooking?.service;

  return (
    <div className="booking-management container-fluid py-3 py-md-4">
      <div className="booking-page-heading d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <p className="booking-eyebrow mb-1">ADMINISTRATION</p>
          <h2 className="mb-1">Booking Management</h2>
          <p className="text-muted mb-0">
            View, monitor and manage customer bookings.
          </p>
        </div>

        <button
          type="button"
          className="btn booking-refresh-btn"
          onClick={() => fetchBookings(false)}
          disabled={refreshing || loading}
        >
          <span className="me-2" aria-hidden="true">
            ↻
          </span>
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div
          className="alert alert-danger d-flex justify-content-between align-items-start gap-2"
          role="alert"
        >
          <span>{error}</span>
          <button
            type="button"
            className="btn-close"
            aria-label="Dismiss error"
            onClick={() => setError("")}
          />
        </div>
      )}

      {success && (
        <div
          className="alert alert-success d-flex justify-content-between align-items-start gap-2"
          role="status"
        >
          <span>{success}</span>
          <button
            type="button"
            className="btn-close"
            aria-label="Dismiss message"
            onClick={() => setSuccess("")}
          />
        </div>
      )}

      {/* Booking statistics */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="booking-stat-card">
            <div>
              <p>Total Bookings</p>
              <h3>{loading ? "—" : totalBookings}</h3>
            </div>
            <span className="booking-stat-icon booking-stat-total">
              <i className="bi bi-calendar2-check" aria-hidden="true" />
              <span className="visually-hidden">Total bookings</span>
            </span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="booking-stat-card">
            <div>
              <p>Pending</p>
              <h3>{loading ? "—" : pendingBookings}</h3>
            </div>
            <span className="booking-stat-icon booking-stat-pending">
              <i className="bi bi-clock-history" aria-hidden="true" />
              <span className="visually-hidden">Pending bookings</span>
            </span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="booking-stat-card">
            <div>
              <p>Accepted</p>
              <h3>{loading ? "—" : acceptedBookings}</h3>
            </div>
            <span className="booking-stat-icon booking-stat-accepted">
              <i className="bi bi-check-circle" aria-hidden="true" />
              <span className="visually-hidden">Accepted bookings</span>
            </span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="booking-stat-card">
            <div>
              <p>Completed</p>
              <h3>{loading ? "—" : completedBookings}</h3>
            </div>
            <span className="booking-stat-icon booking-stat-completed">
              <i className="bi bi-patch-check" aria-hidden="true" />
              <span className="visually-hidden">Completed bookings</span>
            </span>
          </div>
        </div>
      </div>

      {/* Booking table and filters */}
      <div className="booking-content-card">
        <div className="booking-toolbar d-flex flex-column flex-lg-row justify-content-between gap-3">
          <div>
            <h5 className="mb-1">All Bookings</h5>
            <p className="text-muted small mb-0">
              Showing {bookings.length} booking
              {bookings.length === 1 ? "" : "s"} for the selected filters.
            </p>
          </div>

          <div className="booking-filters d-flex flex-column flex-sm-row gap-2">
            <div className="booking-search-wrap">
              <i className="bi bi-search" aria-hidden="true" />
              <input
                type="search"
                className="form-control"
                placeholder="Search customer, vendor, service..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search bookings"
              />
            </div>

            <select
              className="form-select booking-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter bookings by status"
            >
              <option value="all">All statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="booking-loading">
            <div className="spinner-border text-warning" role="status">
              <span className="visually-hidden">Loading bookings...</span>
            </div>
            <p className="mb-0 mt-3">Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="booking-empty-state">
            <div className="booking-empty-icon">
              <i className="bi bi-calendar-x" aria-hidden="true" />
            </div>
            <h5>No bookings found</h5>
            <p className="text-muted mb-3">
              Try changing your search or status filter.
            </p>
            <button
              type="button"
              className="btn booking-outline-btn"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="table-responsive booking-table-wrap">
            <table className="table booking-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Customer</th>
                  <th>Vendor</th>
                  <th>Service</th>
                  <th>Appointment</th>
                  <th>Visiting Charge</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>

              <tbody>
                {bookings.map((booking) => {
                  const bookingId = getBookingId(booking);
                  const currentStatus = (
                    booking.status || ""
                  ).toLowerCase();

                  const canCancel = [
                    "pending",
                    "accepted",
                  ].includes(currentStatus);

                  return (
                    <tr key={bookingId}>
                      <td>
                        <span className="booking-id">
                          #{bookingId ?? "—"}
                        </span>
                      </td>

                      <td>
                        <span className="booking-person-name">
                          {booking.customer_name || "Unknown customer"}
                        </span>
                        <small className="d-block text-muted">
                          ID: {booking.customer_id ?? "—"}
                        </small>
                      </td>

                      <td>
                        <span className="booking-person-name">
                          {booking.vendor_name || "Unknown vendor"}
                        </span>
                        <small className="d-block text-muted">
                          ID: {booking.vendor_id ?? "—"}
                        </small>
                      </td>

                      <td>{booking.service_name || "—"}</td>

                      <td>
                        <span className="d-block">
                          {formatDate(booking.date)}
                        </span>
                        <small className="text-muted">
                          {formatTime(booking.appointment_time)}
                        </small>
                      </td>

                      <td className="booking-charge">
                        ₹{booking.visiting_charge ?? "0"}
                      </td>

                      <td>
                        <span
                          className={`booking-status-badge ${getStatusClass(
                            currentStatus
                          )}`}
                        >
                          {formatStatus(currentStatus)}
                        </span>
                      </td>

                      <td>
                        <div className="booking-action-buttons">
                          <button
                            type="button"
                            className="btn booking-icon-btn"
                            title="View booking details"
                            aria-label={`View booking ${bookingId}`}
                            onClick={() => openBookingDetails(booking)}
                          >
                            <i className="bi bi-eye" aria-hidden="true" />
                          </button>

                          <button
                            type="button"
                            className="btn booking-icon-btn"
                            title="Update booking status"
                            aria-label={`Update status for booking ${bookingId}`}
                            onClick={() => openStatusModal(booking)}
                          >
                            <i
                              className="bi bi-pencil-square"
                              aria-hidden="true"
                            />
                          </button>

                          {canCancel && (
                            <button
                              type="button"
                              className="btn booking-icon-btn booking-cancel-icon"
                              title="Cancel booking"
                              aria-label={`Cancel booking ${bookingId}`}
                              onClick={() => {
                                setError("");
                                setSuccess("");
                                setCancelBooking(booking);
                              }}
                            >
                              <i
                                className="bi bi-x-circle"
                                aria-hidden="true"
                              />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Loading booking details */}
      {detailLoading && (
        <div className="booking-modal-backdrop" role="presentation">
          <div className="booking-modal-card text-center" role="status">
            <div className="spinner-border text-warning" />
            <p className="mt-3 mb-0">Loading booking details...</p>
          </div>
        </div>
      )}

      {/* Booking details modal */}
      {selectedBooking && (
        <div
          className="booking-modal-backdrop"
          onClick={closeAllModals}
          role="presentation"
        >
          <div
            className="booking-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="booking-modal-header">
              <div>
                <p className="booking-eyebrow mb-1">BOOKING DETAILS</p>
                <h5 id="booking-detail-title" className="mb-0">
                  Booking #{selectedBooking.booking_id}
                </h5>
              </div>
              <button
                type="button"
                className="btn-close"
                aria-label="Close details"
                onClick={closeAllModals}
              />
            </div>

            <div className="booking-modal-body">
              <div className="booking-detail-status-row">
                <span className="text-muted">Current status</span>
                <span
                  className={`booking-status-badge ${getStatusClass(
                    selectedBooking.status
                  )}`}
                >
                  {formatStatus(selectedBooking.status)}
                </span>
              </div>

              <div className="booking-detail-grid">
                <div className="booking-detail-item">
                  <span>Customer</span>
                  <strong>{detailCustomer?.name || "—"}</strong>
                  <small>{detailCustomer?.username || ""}</small>
                </div>

                <div className="booking-detail-item">
                  <span>Vendor</span>
                  <strong>{detailVendor?.name || "—"}</strong>
                  <small>
                    {detailVendor?.username || ""}
                    {detailVendor?.status
                      ? ` · ${detailVendor.status}`
                      : ""}
                  </small>
                </div>

                <div className="booking-detail-item">
                  <span>Service</span>
                  <strong>{detailService?.name || "—"}</strong>
                  <small>{detailService?.category || ""}</small>
                </div>

                <div className="booking-detail-item">
                  <span>Appointment date</span>
                  <strong>{formatDate(selectedBooking.date)}</strong>
                </div>

                <div className="booking-detail-item">
                  <span>Appointment time</span>
                  <strong>
                    {formatTime(selectedBooking.appointment_time)}
                  </strong>
                </div>

                <div className="booking-detail-item">
                  <span>Visiting charge</span>
                  <strong>
                    ₹{selectedBooking.visiting_charge ?? "0"}
                  </strong>
                </div>
              </div>

              <div className="booking-detail-message">
                <span>Customer description</span>
                <p>
                  {selectedBooking.customer_description ||
                    "No description provided."}
                </p>
              </div>

              <div className="booking-detail-message">
                <span>Vendor message</span>
                <p>
                  {selectedBooking.vendor_message ||
                    "No vendor message."}
                </p>
              </div>
            </div>

            <div className="booking-modal-footer">
              <button
                type="button"
                className="btn booking-outline-btn"
                onClick={closeAllModals}
              >
                Close
              </button>

              <button
                type="button"
                className="btn booking-primary-btn"
                onClick={() => {
                  const booking = bookings.find(
                    (item) =>
                      String(getBookingId(item)) ===
                      String(selectedBooking.booking_id)
                  );

                  if (booking) {
                    setSelectedBooking(null);
                    openStatusModal(booking);
                  }
                }}
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update booking status modal */}
      {statusBooking && (
        <div
          className="booking-modal-backdrop"
          onClick={closeAllModals}
          role="presentation"
        >
          <div
            className="booking-modal-card booking-confirm-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-status-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="booking-modal-header">
              <div>
                <p className="booking-eyebrow mb-1">MANAGE BOOKING</p>
                <h5 id="booking-status-title" className="mb-0">
                  Update Booking #{getBookingId(statusBooking)}
                </h5>
              </div>

              <button
                type="button"
                className="btn-close"
                aria-label="Close status dialog"
                onClick={closeAllModals}
                disabled={statusSaving}
              />
            </div>

            <div className="booking-modal-body">
              <label
                className="form-label fw-semibold"
                htmlFor="new-booking-status"
              >
                Select new status
              </label>

              <select
                id="new-booking-status"
                className="form-select"
                value={newStatus}
                onChange={(event) => setNewStatus(event.target.value)}
                disabled={statusSaving}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {formatStatus(status)}
                  </option>
                ))}
              </select>

              <p className="small text-muted mt-3 mb-0">
                The server will validate this status change. Choose
                carefully before saving.
              </p>
            </div>

            <div className="booking-modal-footer">
              <button
                type="button"
                className="btn booking-outline-btn"
                onClick={closeAllModals}
                disabled={statusSaving}
              >
                Close
              </button>

              <button
                type="button"
                className="btn booking-primary-btn"
                onClick={updateBookingStatus}
                disabled={
                  statusSaving ||
                  newStatus ===
                    (statusBooking.status || "").toLowerCase()
                }
              >
                {statusSaving ? "Saving..." : "Save Status"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm booking cancellation modal */}
      {cancelBooking && (
        <div
          className="booking-modal-backdrop"
          onClick={closeAllModals}
          role="presentation"
        >
          <div
            className="booking-modal-card booking-confirm-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-cancel-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="booking-modal-header">
              <div>
                <p className="booking-eyebrow mb-1">CONFIRM ACTION</p>
                <h5 id="booking-cancel-title" className="mb-0">
                  Cancel Booking #{getBookingId(cancelBooking)}?
                </h5>
              </div>

              <button
                type="button"
                className="btn-close"
                aria-label="Close cancellation dialog"
                onClick={closeAllModals}
                disabled={cancelSaving}
              />
            </div>

            <div className="booking-modal-body">
              <div className="booking-warning-panel">
                <i
                  className="bi bi-exclamation-triangle"
                  aria-hidden="true"
                />
                <p className="mb-0">
                  This action will change the booking status to{" "}
                  <strong>Rejected</strong> and set the vendor message to{" "}
                  <strong>Cancelled by admin</strong>.
                </p>
              </div>

              <p className="text-muted small mt-3 mb-0">
                Only pending and accepted bookings can be cancelled.
              </p>
            </div>

            <div className="booking-modal-footer">
              <button
                type="button"
                className="btn booking-outline-btn"
                onClick={closeAllModals}
                disabled={cancelSaving}
              >
                Keep Booking
              </button>

              <button
                type="button"
                className="btn booking-danger-btn"
                onClick={cancelSelectedBooking}
                disabled={cancelSaving}
              >
                {cancelSaving
                  ? "Cancelling..."
                  : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingManagement;
