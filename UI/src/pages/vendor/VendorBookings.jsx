import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../App.css";
import "../../css/VendorBookings.css";

function VendorBookings() {
    const navigate = useNavigate();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [activeTab, setActiveTab] = useState("current");

    const [selectedBooking, setSelectedBooking] = useState(null);
    const [action, setAction] = useState("");
    const [vendorMessage, setVendorMessage] = useState("");
    const [appointmentTime, setAppointmentTime] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const API_BASE_URL = "http://127.0.0.1:8000";

    // =========================================
    // LOAD BOOKINGS
    // =========================================

    const loadBookings = async (vendorId) => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_BASE_URL}/vendor/bookings/${vendorId}/`
            );

            setBookings(response.data.bookings || []);
        } catch (error) {
            console.log("Unable to load bookings:", error);
            setError("Unable to load bookings. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // =========================================
    // INITIAL LOAD
    // =========================================

    useEffect(() => {
        const vendorId = localStorage.getItem("vendor_id");

        if (!vendorId) {
            navigate("/vendor-login");
            return;
        }

        loadBookings(vendorId);
    }, [navigate]);

    // =========================================
    // CURRENT / HISTORY
    // =========================================

    const currentBookings = bookings.filter((booking) =>
        ["pending", "accepted", "ongoing"].includes(
            booking.status?.toLowerCase()
        )
    );

    const bookingHistory = bookings.filter((booking) =>
        ["rejected", "completed"].includes(
            booking.status?.toLowerCase()
        )
    );

    const displayedBookings =
        activeTab === "current"
            ? currentBookings
            : bookingHistory;

    // =========================================
    // VIEW DETAILS
    // =========================================

    const handleViewDetails = (booking) => {
        setSelectedBooking(booking);
        setAction("");
        setVendorMessage("");
        setAppointmentTime("");
        setError("");
        setSuccess("");
    };

    // =========================================
    // OPEN ACTION MODAL
    // =========================================

    const handleAction = (type) => {
        setAction(type);
        setVendorMessage("");
        setAppointmentTime("");
        setError("");
    };

    // =========================================
    // CLOSE MODALS
    // =========================================

    const handleCloseModals = () => {
        if (submitting) return;

        setSelectedBooking(null);
        setAction("");
        setVendorMessage("");
        setAppointmentTime("");
        setError("");
    };

    // =========================================
    // CONFIRM STATUS CHANGE
    // =========================================

    const handleConfirmAction = async () => {
        if (!selectedBooking || !action || submitting) {
            return;
        }

        if (action === "accepted" && !appointmentTime) {
            setError("Please select an appointment time.");
            return;
        }

        const vendorId = localStorage.getItem("vendor_id");

        if (!vendorId) {
            navigate("/vendor-login");
            return;
        }

        try {
            setSubmitting(true);
            setError("");
            setSuccess("");

            const payload = {
                vendor: vendorId,
                status: action,
                vendor_message: vendorMessage,
            };

            if (action === "accepted") {
                payload.appointment_time = appointmentTime;
            }

            const response = await axios.patch(
                `${API_BASE_URL}/booking/status/${selectedBooking.booking_id}/`,
                payload
            );

            const successMessage =
                response.data.message ||
                "Booking updated successfully.";

            setSelectedBooking(null);
            setAction("");
            setVendorMessage("");
            setAppointmentTime("");

            await loadBookings(vendorId);

            setSuccess(successMessage);
        } catch (error) {
            console.log("Unable to update booking:", error);

            setError(
                error.response?.data?.message ||
                    "Unable to update booking. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    // =========================================
    // STATUS BADGE
    // =========================================

    const getStatusBadge = (status) => {
        const normalizedStatus = status?.toLowerCase();

        const statusClasses = {
            pending: "status-pending",
            accepted: "status-accepted",
            ongoing: "status-ongoing",
            rejected: "status-rejected",
            completed: "status-completed",
        };

        const className =
            statusClasses[normalizedStatus] || "status-pending";

        const displayStatus = normalizedStatus
            ? normalizedStatus.charAt(0).toUpperCase() +
              normalizedStatus.slice(1)
            : "Unknown";

        return (
            <span className={`booking-status ${className}`}>
                {displayStatus}
            </span>
        );
    };

    // =========================================
    // ACTION MODAL TEXT
    // =========================================

    const getActionTitle = () => {
        const titles = {
            accepted: "Accept Booking",
            rejected: "Reject Booking",
            ongoing: "Start Service",
            completed: "Complete Service",
        };

        return titles[action] || "Update Booking";
    };

    const getActionDescription = () => {
        const descriptions = {
            accepted:
                "Confirm this booking and set the appointment time.",
            rejected:
                "Confirm that you want to reject this booking.",
            ongoing:
                "Confirm that you are starting this service.",
            completed:
                "Confirm that the service has been completed.",
        };

        return descriptions[action] || "Confirm this action.";
    };

    const getConfirmButtonText = () => {
        const labels = {
            accepted: "Confirm Accept",
            rejected: "Confirm Reject",
            ongoing: "Start Service",
            completed: "Mark as Completed",
        };

        return labels[action] || "Confirm";
    };

    // =========================================
    // LOADING
    // =========================================

    if (loading) {
        return (
            <div className="vendor-bookings-page">
                <div className="container py-5 text-center">
                    <div
                        className="spinner-border text-warning mb-3"
                        role="status"
                    >
                        <span className="visually-hidden">
                            Loading...
                        </span>
                    </div>

                    <p className="text-muted">
                        Loading bookings...
                    </p>
                </div>
            </div>
        );
    }

    // =========================================
    // MAIN
    // =========================================

    return (
        <div className="vendor-bookings-page">
            <div className="container py-4">

                {/* BACK BUTTON */}
                <button
                    type="button"
                    className="btn btn-outline-secondary mb-4"
                    onClick={() =>
                        navigate("/vendor-dashboard")
                    }
                >
                    <i className="fa-solid fa-arrow-left me-2"></i>
                    Back to Dashboard
                </button>

                {/* PAGE HEADING */}
                <div className="booking-page-heading mb-4">
                    <div>
                        <h2 className="fw-bold mb-2">
                            Customer Bookings
                        </h2>

                        <p className="text-muted mb-0">
                            Manage your bookings and track completed
                            services.
                        </p>
                    </div>
                </div>

                {/* SUCCESS MESSAGE */}
                {success && (
                    <div
                        className="alert alert-success"
                        role="status"
                    >
                        <i className="fa-solid fa-circle-check me-2"></i>

                        {success}

                        <button
                            type="button"
                            className="btn-close float-end"
                            aria-label="Close"
                            onClick={() => setSuccess("")}
                        ></button>
                    </div>
                )}

                {/* ERROR MESSAGE */}
                {error && !selectedBooking && (
                    <div
                        className="alert alert-danger"
                        role="alert"
                    >
                        {error}

                        <button
                            type="button"
                            className="btn-close float-end"
                            aria-label="Close"
                            onClick={() => setError("")}
                        ></button>
                    </div>
                )}

                {/* TABS */}
                <div
                    className="booking-tabs mb-4"
                    role="tablist"
                    aria-label="Booking sections"
                >
                    <button
                        type="button"
                        role="tab"
                        aria-selected={
                            activeTab === "current"
                        }
                        className={`booking-tab ${
                            activeTab === "current"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setActiveTab("current")
                        }
                    >
                        <i className="fa-solid fa-calendar-check"></i>

                        <span>Current Bookings</span>

                        <span className="booking-tab-count">
                            {currentBookings.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        role="tab"
                        aria-selected={
                            activeTab === "history"
                        }
                        className={`booking-tab ${
                            activeTab === "history"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setActiveTab("history")
                        }
                    >
                        <i className="fa-solid fa-clock-rotate-left"></i>

                        <span>Booking History</span>

                        <span className="booking-tab-count">
                            {bookingHistory.length}
                        </span>
                    </button>
                </div>

                {/* SECTION HEADING */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold mb-0">
                        {activeTab === "current"
                            ? "Current Bookings"
                            : "Booking History"}
                    </h5>

                    <span className="text-muted small">
                        {displayedBookings.length} booking(s)
                    </span>
                </div>

                {/* EMPTY STATE */}
                {displayedBookings.length === 0 ? (
                    <div className="card border-0 shadow-sm booking-empty-state">
                        <div className="card-body text-center py-5">

                            <div className="booking-empty-icon mb-3">
                                <i
                                    className={`fa-solid ${
                                        activeTab === "current"
                                            ? "fa-calendar-plus"
                                            : "fa-clock-rotate-left"
                                    }`}
                                ></i>
                            </div>

                            <h5 className="fw-bold">
                                {activeTab === "current"
                                    ? "No current bookings"
                                    : "No booking history yet"}
                            </h5>

                            <p className="text-muted mb-0">
                                {activeTab === "current"
                                    ? "New customer bookings will appear here."
                                    : "Rejected and completed bookings will appear here."}
                            </p>
                        </div>
                    </div>
                ) : (
                    /* BOOKING CARDS */
                    <div className="row g-4">
                        {displayedBookings.map(
                            (booking, index) => {
                                return (
                                    <div
                                        className="col-12 col-md-6 col-xl-4"
                                        key={
                                            booking.booking_id ||
                                            index
                                        }
                                    >
                                        <div className="card border-0 shadow-sm h-100 booking-card">
                                            <div className="card-body p-4">

                                                {/* SERVICE / STATUS */}
                                                <div className="d-flex justify-content-between align-items-start gap-2 mb-3">

                                                    <div>
                                                        <small className="text-muted booking-label">
                                                            SERVICE
                                                        </small>

                                                        <h5 className="fw-bold mb-0 mt-1">
                                                            {
                                                                booking.service
                                                            }
                                                        </h5>
                                                    </div>

                                                    {getStatusBadge(
                                                        booking.status
                                                    )}
                                                </div>

                                                {/* CUSTOMER */}
                                                <p className="booking-info">
                                                    <i className="fa-solid fa-user"></i>

                                                    <span>
                                                        {
                                                            booking.customer_name
                                                        }
                                                    </span>
                                                </p>

                                                {/* CATEGORY */}
                                                <p className="booking-info">
                                                    <i className="fa-solid fa-layer-group"></i>

                                                    <span>
                                                        {
                                                            booking.category
                                                        }
                                                    </span>
                                                </p>

                                                {/* DATE */}
                                                <p className="booking-info">
                                                    <i className="fa-solid fa-calendar-days"></i>

                                                    <span>
                                                        {
                                                            booking.date
                                                        }
                                                    </span>
                                                </p>

                                                {/* APPOINTMENT TIME */}
                                                {booking.appointment_time && (
                                                    <p className="booking-info">
                                                        <i className="fa-solid fa-clock"></i>

                                                        <span>
                                                            {booking.appointment_time.slice(
                                                                0,
                                                                5
                                                            )}
                                                        </span>
                                                    </p>
                                                )}

                                                {/* VISITING CHARGE */}
                                                <p className="booking-info">
                                                    <i className="fa-solid fa-indian-rupee-sign"></i>

                                                    <span>
                                                        Visiting charge: ₹
                                                        {Number(
                                                            booking.visiting_charge ||
                                                                0
                                                        ).toFixed(2)}
                                                    </span>
                                                </p>

                                                {/* VIEW DETAILS */}
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-warning w-100 mt-2"
                                                    onClick={() =>
                                                        handleViewDetails(
                                                            booking
                                                        )
                                                    }
                                                >
                                                    <i className="fa-solid fa-eye me-2"></i>
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                        )}
                    </div>
                )}
            </div>

            {/* =====================================================
                BOOKING DETAILS MODAL
            ===================================================== */}

            {selectedBooking && !action && (
                <div
                    className="booking-modal-backdrop"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            handleCloseModals();
                        }
                    }}
                >
                    <div
                        className="booking-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="booking-details-title"
                    >

                        {/* MODAL HEADER */}
                        <div className="booking-modal-header">

                            <div className="booking-modal-heading">
                                <span className="booking-modal-eyebrow">
                                    BOOKING DETAILS
                                </span>

                                <h2 id="booking-details-title">
                                    {selectedBooking.service}
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="booking-modal-close"
                                aria-label="Close"
                                onClick={
                                    handleCloseModals
                                }
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        {/* MODAL BODY */}
                        <div className="booking-modal-body">

                            {/* STATUS */}
                            <div className="booking-modal-status">
                                {getStatusBadge(
                                    selectedBooking.status
                                )}
                            </div>

                            {/* DETAILS */}
                            <div className="booking-detail-list">

                                <div className="booking-detail-row">
                                    <span>Customer</span>
                                    <strong>
                                        {
                                            selectedBooking.customer_name
                                        }
                                    </strong>
                                </div>

                                <div className="booking-detail-row">
                                    <span>Category</span>
                                    <strong>
                                        {
                                            selectedBooking.category
                                        }
                                    </strong>
                                </div>

                                <div className="booking-detail-row">
                                    <span>Service</span>
                                    <strong>
                                        {
                                            selectedBooking.service
                                        }
                                    </strong>
                                </div>

                                <div className="booking-detail-row">
                                    <span>Date</span>
                                    <strong>
                                        {
                                            selectedBooking.date
                                        }
                                    </strong>
                                </div>

                                <div className="booking-detail-row">
                                    <span>
                                        Appointment time
                                    </span>

                                    <strong>
                                        {selectedBooking.appointment_time
                                            ? selectedBooking.appointment_time.slice(
                                                  0,
                                                  5
                                              )
                                            : "Not scheduled"}
                                    </strong>
                                </div>

                                <div className="booking-detail-row">
                                    <span>Phone</span>

                                    <strong>
                                        {
                                            selectedBooking.phone
                                        }
                                    </strong>
                                </div>

                                <div className="booking-detail-row">
                                    <span>
                                        Visiting charge
                                    </span>

                                    <strong>
                                        ₹
                                        {Number(
                                            selectedBooking.visiting_charge ||
                                                0
                                        ).toFixed(2)}
                                    </strong>
                                </div>

                            </div>

                            {/* CUSTOMER LOCATION */}
                            <div className="booking-detail-section">
                                <span className="booking-detail-label">
                                    CUSTOMER LOCATION
                                </span>

                                <p>
                                    {selectedBooking.address ||
                                        selectedBooking.location ||
                                        "Location not available"}
                                </p>
                            </div>

                            {/* CUSTOMER DESCRIPTION */}
                            <div className="booking-detail-section">
                                <span className="booking-detail-label">
                                    CUSTOMER'S DESCRIPTION
                                </span>

                                <div className="booking-description">
                                    {selectedBooking.customer_description ||
                                        "No description provided."}
                                </div>
                            </div>

                            {/* VENDOR MESSAGE */}
                            {selectedBooking.vendor_message && (
                                <div className="booking-detail-section">
                                    <span className="booking-detail-label">
                                        YOUR MESSAGE
                                    </span>

                                    <div className="booking-description">
                                        {
                                            selectedBooking.vendor_message
                                        }
                                    </div>
                                </div>
                            )}

                            {/* ACTIONS */}
                            {selectedBooking.status?.toLowerCase() ===
                                "pending" && (
                                <div className="booking-action-buttons">

                                    <button
                                        type="button"
                                        className="booking-action-btn booking-accept-btn"
                                        onClick={() =>
                                            handleAction(
                                                "accepted"
                                            )
                                        }
                                    >
                                        <i className="fa-solid fa-check"></i>
                                        Accept
                                    </button>

                                    <button
                                        type="button"
                                        className="booking-action-btn booking-reject-btn"
                                        onClick={() =>
                                            handleAction(
                                                "rejected"
                                            )
                                        }
                                    >
                                        <i className="fa-solid fa-xmark"></i>
                                        Reject
                                    </button>

                                </div>
                            )}

                            {selectedBooking.status?.toLowerCase() ===
                                "accepted" && (
                                <button
                                    type="button"
                                    className="booking-full-action booking-start-btn"
                                    onClick={() =>
                                        handleAction(
                                            "ongoing"
                                        )
                                    }
                                >
                                    <i className="fa-solid fa-play"></i>
                                    Start Service
                                </button>
                            )}

                            {selectedBooking.status?.toLowerCase() ===
                                "ongoing" && (
                                <button
                                    type="button"
                                    className="booking-full-action booking-complete-btn"
                                    onClick={() =>
                                        handleAction(
                                            "completed"
                                        )
                                    }
                                >
                                    <i className="fa-solid fa-circle-check"></i>
                                    Mark as Completed
                                </button>
                            )}

                            {/* CLOSE */}
                            <button
                                type="button"
                                className="booking-close-btn"
                                onClick={handleCloseModals}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =====================================================
                ACTION CONFIRMATION MODAL
            ===================================================== */}

            {selectedBooking && action && (
                <div
                    className="booking-modal-backdrop booking-action-backdrop"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget &&
                            !submitting
                        ) {
                            setAction("");
                            setError("");
                        }
                    }}
                >
                    <div
                        className="booking-action-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="booking-action-title"
                    >

                        {/* HEADER */}
                        <div className="booking-modal-header">

                            <div className="booking-modal-heading">
                                <span className="booking-modal-eyebrow">
                                    BOOKING ACTION
                                </span>

                                <h2 id="booking-action-title">
                                    {getActionTitle()}
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="booking-modal-close"
                                aria-label="Close"
                                disabled={submitting}
                                onClick={() => {
                                    setAction("");
                                    setError("");
                                }}
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>

                        </div>

                        {/* BODY */}
                        <div className="booking-modal-body">

                            <p className="booking-action-description">
                                {getActionDescription()}
                            </p>

                            {/* APPOINTMENT TIME */}
                            {action === "accepted" && (
                                <div className="booking-form-group">

                                    <label htmlFor="appointment-time">
                                        Appointment Time
                                        <span className="required">
                                            *
                                        </span>
                                    </label>

                                    <input
                                        id="appointment-time"
                                        type="time"
                                        value={
                                            appointmentTime
                                        }
                                        onChange={(event) =>
                                            setAppointmentTime(
                                                event.target
                                                    .value
                                            )
                                        }
                                        required
                                    />

                                    <small>
                                        Select the time agreed
                                        with the customer.
                                    </small>
                                </div>
                            )}

                            {/* MESSAGE */}
                            {(action === "accepted" ||
                                action === "rejected") && (
                                <div className="booking-form-group">

                                    <label htmlFor="vendor-message">
                                        {action === "accepted"
                                            ? "Message (Optional)"
                                            : "Reason for rejection (Optional)"}
                                    </label>

                                    <textarea
                                        id="vendor-message"
                                        rows="4"
                                        value={
                                            vendorMessage
                                        }
                                        onChange={(event) =>
                                            setVendorMessage(
                                                event.target
                                                    .value
                                            )
                                        }
                                        placeholder={
                                            action ===
                                            "accepted"
                                                ? "Example: I will arrive at the scheduled time."
                                                : "Example: Sorry, I am unavailable on this date."
                                        }
                                    ></textarea>
                                </div>
                            )}

                            {/* ERROR */}
                            {error && (
                                <div className="booking-modal-error">
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* FOOTER */}
                        <div className="booking-action-footer">

                            <button
                                type="button"
                                className="booking-cancel-btn"
                                disabled={submitting}
                                onClick={() => {
                                    setAction("");
                                    setError("");
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className={`booking-confirm-btn ${
                                    action === "accepted" ||
                                    action === "completed"
                                        ? "confirm-success"
                                        : action ===
                                          "rejected"
                                        ? "confirm-danger"
                                        : "confirm-primary"
                                }`}
                                disabled={submitting}
                                onClick={
                                    handleConfirmAction
                                }
                            >
                                {submitting ? (
                                    <>
                                        <span className="booking-spinner"></span>
                                        Please wait...
                                    </>
                                ) : (
                                    getConfirmButtonText()
                                )}
                            </button>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default VendorBookings;