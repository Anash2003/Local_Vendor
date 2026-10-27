import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../App.css";


function MyBookings() {
const navigate = useNavigate();


const API_BASE_URL = "./api";

const [bookings, setBookings] = useState([]);
const [loading, setLoading] = useState(true);

const [errorMessage, setErrorMessage] = useState("");
const [successMessage, setSuccessMessage] = useState("");

// --------------------------------
// Filter States
// --------------------------------

const [vendorFilter, setVendorFilter] = useState("all");
const [serviceFilter, setServiceFilter] = useState("all");
const [statusFilter, setStatusFilter] = useState("all");

// --------------------------------
// Cancel States
// --------------------------------

const [showCancelModal, setShowCancelModal] = useState(false);
const [selectedBooking, setSelectedBooking] = useState(null);
const [cancelLoading, setCancelLoading] = useState(false);

// --------------------------------
// Review States
// --------------------------------

const [showReviewModal, setShowReviewModal] = useState(false);
const [selectedReviewBooking, setSelectedReviewBooking] = useState(null);
const [reviewRating, setReviewRating] = useState(0);
const [reviewFeedback, setReviewFeedback] = useState("");
const [reviewLoading, setReviewLoading] = useState(false);

// --------------------------------
// Status Order
// --------------------------------

const statusOrder = {
    pending: 1,
    accepted: 2,
    ongoing: 3,
    completed: 4,
    cancelled: 6,
    rejected: 5
    
};

// --------------------------------
// Load Customer Bookings
// --------------------------------

const loadBookings = async () => {
    const customerId = localStorage.getItem("customer_id");

    if (!customerId) {
        setErrorMessage(
            "Please login as a customer to view your bookings."
        );
        setLoading(false);
        return;
    }

    try {
        setLoading(true);
        setErrorMessage("");

        const response = await axios.get(
            `${API_BASE_URL}/my-bookings/${customerId}/`
        );

        if (Array.isArray(response.data)) {
            setBookings(response.data);
        } else {
            setBookings([]);

            if (response.data?.message) {
                setErrorMessage(response.data.message);
            }
        }
    } catch (error) {
        console.log("Unable to load bookings:", error);

        setErrorMessage(
            error.response?.data?.message ||
            "Unable to load your bookings."
        );
    } finally {
        setLoading(false);
    }
};

// --------------------------------
// Load bookings when page opens
// --------------------------------

useEffect(() => {
    loadBookings();
}, []);

// --------------------------------
// Get Booking Status
// --------------------------------

const getBookingStatus = (booking) => {
    const status = (booking.status || "pending").toLowerCase();

    // Handle both spellings
    if (status === "canceled") {
        return "cancelled";
    }

    return status;
};

// --------------------------------
// Format Status
// --------------------------------

const formatStatus = (status) => {
    if (!status) {
        return "Pending";
    }

    return (
        status.charAt(0).toUpperCase() +
        status.slice(1).toLowerCase()
    );
};

// --------------------------------
// Get Unique Vendors
// --------------------------------

const uniqueVendors = [
    ...new Set(
        bookings
            .map((booking) => booking.vendor_name)
            .filter(Boolean)
    )
].sort((a, b) => a.localeCompare(b));

// --------------------------------
// Get Unique Services
// --------------------------------

const uniqueServices = [
    ...new Set(
        bookings
            .map((booking) => booking.service)
            .filter(Boolean)
    )
].sort((a, b) => a.localeCompare(b));

// --------------------------------
// Get Available Statuses
// --------------------------------

const availableStatuses = [
    "pending",
    "accepted",
    "ongoing",
    "completed",
    "cancelled",
    "rejected",
    "cancelled"
].filter((status) =>
    bookings.some(
        (booking) => getBookingStatus(booking) === status
    )
);

// --------------------------------
// Filter + Sort Bookings
// --------------------------------

const filteredBookings = [...bookings]
    .filter((booking) => {
        const status = getBookingStatus(booking);

        const vendorMatches =
            vendorFilter === "all" ||
            booking.vendor_name === vendorFilter;

        const serviceMatches =
            serviceFilter === "all" ||
            booking.service === serviceFilter;

        const statusMatches =
            statusFilter === "all" ||
            status === statusFilter;

        return (
            vendorMatches &&
            serviceMatches &&
            statusMatches
        );
    })
    .sort((a, b) => {
        const statusA = statusOrder[getBookingStatus(a)] || 99;
        const statusB = statusOrder[getBookingStatus(b)] || 99;

        // First sort by requested status order
        if (statusA !== statusB) {
            return statusA - statusB;
        }

        // Then sort newest date first
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);

        return dateB - dateA;
    });

// --------------------------------
// Check if Filters Are Active
// --------------------------------

const filtersActive =
    vendorFilter !== "all" ||
    serviceFilter !== "all" ||
    statusFilter !== "all";

// --------------------------------
// Reset Filters
// --------------------------------

const handleResetFilters = () => {
    setVendorFilter("all");
    setServiceFilter("all");
    setStatusFilter("all");
};

// --------------------------------
// Check Cancellation
// --------------------------------

const canCancelBooking = (booking) => {
    return getBookingStatus(booking) === "pending";
};

// --------------------------------
// Open Cancel Modal
// --------------------------------

const handleCancelClick = (booking) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
    setErrorMessage("");
    setSuccessMessage("");
};

// --------------------------------
// Close Cancel Modal
// --------------------------------

const handleCancelModalClose = () => {
    if (cancelLoading) {
        return;
    }

    setShowCancelModal(false);
    setSelectedBooking(null);
};

// --------------------------------
// Confirm Cancellation
// --------------------------------

const handleConfirmCancel = async () => {
    if (!selectedBooking) {
        return;
    }

    if (!canCancelBooking(selectedBooking)) {
        setErrorMessage(
            "Only pending bookings can be cancelled."
        );

        setShowCancelModal(false);
        setSelectedBooking(null);
        return;
    }

    const customerId = localStorage.getItem("customer_id");

    if (!customerId) {
        setErrorMessage(
            "Customer login information not found. Please login again."
        );

        setShowCancelModal(false);
        setSelectedBooking(null);
        return;
    }

    try {
        setCancelLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

        const response = await axios.post(
            `${API_BASE_URL}/booking/cancel/${selectedBooking.booking_id}/`,
            {
                customer: Number(customerId)
            }
        );

        // Update booking immediately
        setBookings((currentBookings) =>
            currentBookings.map((booking) =>
                booking.booking_id ===
                selectedBooking.booking_id
                    ? {
                          ...booking,
                          status: "cancelled"
                      }
                    : booking
            )
        );

        setShowCancelModal(false);
        setSelectedBooking(null);

        setSuccessMessage(
            response.data.message ||
            "Booking cancelled successfully."
        );
    } catch (error) {
        console.log("Unable to cancel booking:", error);

        setErrorMessage(
            error.response?.data?.message ||
            "Unable to cancel booking."
        );
    } finally {
        setCancelLoading(false);
    }
};

// --------------------------------
// Open Review Modal
// --------------------------------

const handleReviewClick = (booking) => {
    setSelectedReviewBooking(booking);
    setReviewRating(0);
    setReviewFeedback("");
    setErrorMessage("");
    setSuccessMessage("");
    setShowReviewModal(true);
};

// --------------------------------
// Close Review Modal
// --------------------------------

const handleReviewModalClose = () => {
    if (reviewLoading) {
        return;
    }

    setShowReviewModal(false);
    setSelectedReviewBooking(null);
    setReviewRating(0);
    setReviewFeedback("");
};

// --------------------------------
// Select Rating
// --------------------------------

const handleRatingClick = (rating) => {
    setReviewRating(rating);
};

// --------------------------------
// Submit Review
// --------------------------------

const handleSubmitReview = async () => {
    if (!selectedReviewBooking) {
        return;
    }

    if (
        getBookingStatus(selectedReviewBooking) !==
        "completed"
    ) {
        setErrorMessage(
            "Only completed bookings can be reviewed."
        );
        return;
    }

    if (reviewRating < 1 || reviewRating > 5) {
        setErrorMessage(
            "Please select a rating between 1 and 5."
        );
        return;
    }

    const customerId = localStorage.getItem("customer_id");

    if (!customerId) {
        setErrorMessage(
            "Please login as a customer before submitting a review."
        );
        return;
    }

    try {
        setReviewLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

        const response = await axios.post(
            `${API_BASE_URL}/vendor/rating/`,
            {
                customer: Number(customerId),
                vendor: selectedReviewBooking.vendor_id,
                booking: selectedReviewBooking.booking_id,
                rating: reviewRating,
                feedback: reviewFeedback.trim()
            }
        );

        // Update review status immediately
        setBookings((currentBookings) =>
            currentBookings.map((booking) =>
                booking.booking_id ===
                selectedReviewBooking.booking_id
                    ? {
                          ...booking,
                          has_review: true
                      }
                    : booking
            )
        );

        setShowReviewModal(false);
        setSelectedReviewBooking(null);
        setReviewRating(0);
        setReviewFeedback("");

        setSuccessMessage(
            response.data.message ||
            "Review submitted successfully."
        );
    } catch (error) {
        console.log(
            "Unable to submit review:",
            error
        );

        setErrorMessage(
            error.response?.data?.message ||
            "Unable to submit your review."
        );
    } finally {
        setReviewLoading(false);
    }
};

// --------------------------------
// Loading
// --------------------------------

if (loading) {
    return (
        <div className="my-bookings-page">
            <div className="container my-bookings-container">
                <div className="my-bookings-loading">
                    <div
                        className="spinner-border"
                        role="status"
                    >
                        <span className="visually-hidden">
                            Loading...
                        </span>
                    </div>

                    <p>
                        Loading your bookings...
                    </p>
                </div>
            </div>
        </div>
    );
}

// --------------------------------
// Main Page
// --------------------------------

return (
    <div className="my-bookings-page">
        <div className="container my-bookings-container">

            {/* PAGE HEADER */}

            <div className="my-bookings-header">
                <div>
                    <p className="my-bookings-label">
                        CUSTOMER BOOKINGS
                    </p>

                    <h1>
                        My Bookings
                    </h1>

                    <p>
                        View and manage your booking history.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn my-bookings-back-button"
                    onClick={() =>
                        navigate("/customer-dashboard")
                    }
                >
                    <i className="fa-solid fa-arrow-left"></i>
                    Dashboard
                </button>
            </div>

            {/* SUCCESS MESSAGE */}

            {successMessage && (
                <div
                    className="alert alert-success my-bookings-alert"
                    role="alert"
                >
                    <i className="fa-solid fa-circle-check me-2"></i>
                    {successMessage}
                </div>
            )}

            {/* ERROR MESSAGE */}

            {errorMessage && (
                <div
                    className="alert alert-danger my-bookings-alert"
                    role="alert"
                >
                    <i className="fa-solid fa-circle-exclamation me-2"></i>
                    {errorMessage}
                </div>
            )}

            {/* BOOKING HISTORY */}

            <section className="my-bookings-section">

                <div className="my-bookings-section-heading">
                    <div>
                        <h4>
                            Booking History
                        </h4>

                        <p>
                            Your bookings are grouped by status.
                        </p>
                    </div>

                    <span>
                        {filteredBookings.length}{" "}
                        {filteredBookings.length === 1
                            ? "Booking"
                            : "Bookings"}
                    </span>
                </div>

                {/* FILTER AREA */}

                {bookings.length > 0 && (
                    <div className="my-bookings-filters">

                        <div className="my-bookings-filter-header">
                            <div>
                                <p className="my-bookings-filter-label">
                                    FILTER BOOKINGS
                                </p>

                                <h5>
                                    Find a booking quickly
                                </h5>
                            </div>

                            {filtersActive && (
                                <button
                                    type="button"
                                    className="btn my-bookings-reset-button"
                                    onClick={handleResetFilters}
                                >
                                    <i className="fa-solid fa-rotate-left"></i>
                                    Reset Filters
                                </button>
                            )}
                        </div>

                        <div className="row g-3">

                            {/* VENDOR FILTER */}

                            <div className="col-12 col-md-4">
                                <label
                                    htmlFor="vendorFilter"
                                    className="form-label"
                                >
                                    Vendor
                                </label>

                                <select
                                    id="vendorFilter"
                                    className="form-select my-bookings-filter-select"
                                    value={vendorFilter}
                                    onChange={(event) =>
                                        setVendorFilter(
                                            event.target.value
                                        )
                                    }
                                >
                                    <option value="all">
                                        All Vendors
                                    </option>

                                    {uniqueVendors.map(
                                        (vendor) => (
                                            <option
                                                key={vendor}
                                                value={vendor}
                                            >
                                                {vendor}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            {/* SERVICE FILTER */}

                            <div className="col-12 col-md-4">
                                <label
                                    htmlFor="serviceFilter"
                                    className="form-label"
                                >
                                    Service
                                </label>

                                <select
                                    id="serviceFilter"
                                    className="form-select my-bookings-filter-select"
                                    value={serviceFilter}
                                    onChange={(event) =>
                                        setServiceFilter(
                                            event.target.value
                                        )
                                    }
                                >
                                    <option value="all">
                                        All Services
                                    </option>

                                    {uniqueServices.map(
                                        (service) => (
                                            <option
                                                key={service}
                                                value={service}
                                            >
                                                {service}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            {/* STATUS FILTER */}

                            <div className="col-12 col-md-4">
                                <label
                                    htmlFor="statusFilter"
                                    className="form-label"
                                >
                                    Status
                                </label>

                                <select
                                    id="statusFilter"
                                    className="form-select my-bookings-filter-select"
                                    value={statusFilter}
                                    onChange={(event) =>
                                        setStatusFilter(
                                            event.target.value
                                        )
                                    }
                                >
                                    <option value="all">
                                        All Statuses
                                    </option>

                                    {availableStatuses.map(
                                        (status) => (
                                            <option
                                                key={status}
                                                value={status}
                                            >
                                                {formatStatus(
                                                    status
                                                )}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                        </div>

                        {/* ACTIVE FILTER INFO */}

                        {filtersActive && (
                            <div className="my-bookings-filter-result">
                                <i className="fa-solid fa-filter"></i>

                                <span>
                                    Showing{" "}
                                    <strong>
                                        {filteredBookings.length}
                                    </strong>{" "}
                                    of{" "}
                                    <strong>
                                        {bookings.length}
                                    </strong>{" "}
                                    bookings
                                </span>
                            </div>
                        )}

                    </div>
                )}

                {/* NO BOOKINGS */}

                {bookings.length === 0 ? (
                    <div className="my-bookings-empty">

                        <div className="my-bookings-empty-icon">
                            <i className="fa-solid fa-calendar-xmark"></i>
                        </div>

                        <h5>
                            No bookings yet
                        </h5>

                        <p>
                            Your bookings will appear here
                            once you book a service.
                        </p>

                        <button
                            type="button"
                            className="btn my-bookings-browse-button"
                            onClick={() =>
                                navigate(
                                    "/customer-dashboard"
                                )
                            }
                        >
                            Browse Services
                        </button>

                    </div>
                ) : filteredBookings.length === 0 ? (

                    /* NO FILTER RESULTS */

                    <div className="my-bookings-no-results">

                        <div className="my-bookings-no-results-icon">
                            <i className="fa-solid fa-filter-circle-xmark"></i>
                        </div>

                        <h5>
                            No matching bookings
                        </h5>

                        <p>
                            No bookings match the selected
                            vendor, service, and status filters.
                        </p>

                        <button
                            type="button"
                            className="btn my-bookings-browse-button"
                            onClick={handleResetFilters}
                        >
                            Clear Filters
                        </button>

                    </div>
                ) : (

                    /* BOOKING LIST */

                    <div className="my-bookings-list">

                        {filteredBookings.map(
                            (booking, index) => {

                                const status =
                                    getBookingStatus(
                                        booking
                                    );

                                return (
                                    <div
                                        className="customer-booking-card"
                                        key={
                                            booking.booking_id ||
                                            index
                                        }
                                    >

                                        {/* CARD TOP */}

                                        <div className="customer-booking-top">

                                            <div className="customer-booking-heading">

                                                <p className="customer-booking-label">
                                                    SERVICE
                                                </p>

                                                <h5>
                                                    {booking.service}
                                                </h5>

                                                {booking.category && (
                                                    <p className="customer-booking-category">
                                                        {
                                                            booking.category
                                                        }
                                                    </p>
                                                )}

                                            </div>

                                            <span
                                                className={`customer-booking-status status-${status}`}
                                            >
                                                <span className="booking-status-dot"></span>

                                                {formatStatus(
                                                    status
                                                )}
                                            </span>

                                        </div>

                                        {/* DETAILS */}

                                        <div className="customer-booking-details">

                                            {/* VENDOR */}

                                            <div className="booking-detail-item">

                                                <i className="fa-solid fa-user"></i>

                                                <div>
                                                    <span>
                                                        Vendor
                                                    </span>

                                                    <strong>
                                                        {
                                                            booking.vendor_name ||
                                                            "Not available"
                                                        }
                                                    </strong>
                                                </div>

                                            </div>

                                            {/* DATE */}

                                            <div className="booking-detail-item">

                                                <i className="fa-solid fa-calendar-days"></i>

                                                <div>
                                                    <span>
                                                        Date
                                                    </span>

                                                    <strong>
                                                        {
                                                            booking.date
                                                        }
                                                    </strong>
                                                </div>

                                            </div>

                                            {/* APPOINTMENT */}

                                            <div className="booking-detail-item">

                                                <i className="fa-solid fa-clock"></i>

                                                <div>
                                                    <span>
                                                        Appointment
                                                    </span>

                                                    <strong>
                                                        {
                                                            booking.appointment_time ||
                                                            "Not assigned"
                                                        }
                                                    </strong>
                                                </div>

                                            </div>

                                            {/* VISITING CHARGE */}

                                            <div className="booking-detail-item">

                                                <i className="fa-solid fa-indian-rupee-sign"></i>

                                                <div>
                                                    <span>
                                                        Visiting Charge
                                                    </span>

                                                    <strong>
                                                        ₹
                                                        {
                                                            booking.visiting_charge ||
                                                            "0.00"
                                                        }
                                                    </strong>
                                                </div>

                                            </div>

                                        </div>

                                        {/* CUSTOMER DESCRIPTION */}

                                        {booking.customer_description && (
                                            <div className="customer-booking-message">

                                                <span>
                                                    Your Description
                                                </span>

                                                <p>
                                                    {
                                                        booking.customer_description
                                                    }
                                                </p>

                                            </div>
                                        )}

                                        {/* VENDOR MESSAGE */}

                                        {booking.vendor_message && (
                                            <div className="customer-booking-message vendor-message">

                                                <span>
                                                    Vendor Message
                                                </span>

                                                <p>
                                                    {
                                                        booking.vendor_message
                                                    }
                                                </p>

                                            </div>
                                        )}

                                        {/* COMPLETED BOOKING REVIEW */}

                                        {status === "completed" &&
                                            !booking.has_review && (
                                                <div className="customer-booking-review-action">

                                                    <button
                                                        type="button"
                                                        className="btn customer-review-button"
                                                        onClick={() =>
                                                            handleReviewClick(
                                                                booking
                                                            )
                                                        }
                                                    >
                                                        <i className="fa-solid fa-star me-2"></i>
                                                        Write Review
                                                    </button>

                                                </div>
                                            )}

                                        {/* REVIEW SUBMITTED */}

                                        {status === "completed" &&
                                            booking.has_review && (
                                                <div className="customer-booking-review-action">

                                                    <div className="customer-review-submitted">
                                                        <i className="fa-solid fa-circle-check"></i>
                                                        Review Submitted
                                                    </div>

                                                </div>
                                            )}

                                        {/* CANCEL BUTTON */}

                                        {canCancelBooking(
                                            booking
                                        ) && (
                                            <div className="customer-booking-action">

                                                <button
                                                    type="button"
                                                    className="btn customer-cancel-button"
                                                    onClick={() =>
                                                        handleCancelClick(
                                                            booking
                                                        )
                                                    }
                                                >
                                                    <i className="fa-solid fa-xmark me-2"></i>
                                                    Cancel Booking
                                                </button>

                                            </div>
                                        )}

                                    </div>
                                );
                            }
                        )}

                    </div>
                )}

            </section>
        </div>

        {/* CANCEL CONFIRMATION MODAL */}

        {showCancelModal &&
            selectedBooking && (
                <>
                    <div
                        className="modal fade show d-block"
                        tabIndex="-1"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">

                                <div className="modal-header">

                                    <h5 className="modal-title">
                                        Cancel Booking?
                                    </h5>

                                    <button
                                        type="button"
                                        className="btn-close"
                                        aria-label="Close"
                                        onClick={
                                            handleCancelModalClose
                                        }
                                        disabled={
                                            cancelLoading
                                        }
                                    ></button>

                                </div>

                                <div className="modal-body">

                                    <p className="mb-2">
                                        Are you sure you want
                                        to cancel this booking?
                                    </p>

                                    <strong>
                                        {
                                            selectedBooking.service
                                        }
                                    </strong>

                                    <p className="mb-0 mt-1 text-muted">
                                        Date:{" "}
                                        {
                                            selectedBooking.date
                                        }
                                    </p>

                                </div>

                                <div className="modal-footer">

                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={
                                            handleCancelModalClose
                                        }
                                        disabled={
                                            cancelLoading
                                        }
                                    >
                                        Keep Booking
                                    </button>

                                    <button
                                        type="button"
                                        className="btn customer-confirm-cancel-button"
                                        onClick={
                                            handleConfirmCancel
                                        }
                                        disabled={
                                            cancelLoading
                                        }
                                    >
                                        {cancelLoading
                                            ? "Cancelling..."
                                            : "Yes, Cancel Booking"}
                                    </button>

                                </div>

                            </div>
                        </div>
                    </div>

                    <div className="modal-backdrop fade show"></div>
                </>
            )}

        {/* REVIEW MODAL */}

        {showReviewModal &&
            selectedReviewBooking && (
                <>
                    <div
                        className="modal fade show d-block"
                        tabIndex="-1"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content customer-review-modal">

                                <div className="modal-header">

                                    <div>
                                        <p className="customer-review-modal-label">
                                            COMPLETED SERVICE
                                        </p>

                                        <h5 className="modal-title">
                                            Share Your Experience
                                        </h5>
                                    </div>

                                    <button
                                        type="button"
                                        className="btn-close"
                                        aria-label="Close"
                                        onClick={
                                            handleReviewModalClose
                                        }
                                        disabled={
                                            reviewLoading
                                        }
                                    ></button>

                                </div>

                                <div className="modal-body">

                                    <div className="customer-review-service">

                                        <span className="customer-review-service-label">
                                            Service
                                        </span>

                                        <strong className="customer-review-service-name">
                                            {
                                                selectedReviewBooking.service
                                            }
                                        </strong>

                                        <span className="customer-review-vendor-name">
                                            {
                                                selectedReviewBooking.vendor_name
                                            }
                                        </span>

                                    </div>

                                    {/* RATING */}

                                    <div className="customer-review-rating">

                                        <p className="customer-review-rating-title">
                                            How would you rate the work?
                                        </p>

                                        <div className="customer-review-stars">

                                            {[1, 2, 3, 4, 5].map(
                                                (star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        className={
                                                            star <=
                                                            reviewRating
                                                                ? "customer-review-star active"
                                                                : "customer-review-star"
                                                        }
                                                        onClick={() =>
                                                            handleRatingClick(
                                                                star
                                                            )
                                                        }
                                                        aria-label={`Give ${star} star rating`}
                                                        disabled={
                                                            reviewLoading
                                                        }
                                                    >
                                                        <i className="fa-solid fa-star"></i>
                                                    </button>
                                                )
                                            )}

                                        </div>

                                        <span className="customer-review-rating-text">
                                            {reviewRating === 0
                                                ? "Select a rating"
                                                : `${reviewRating} out of 5 stars`}
                                        </span>

                                    </div>

                                    {/* FEEDBACK */}

                                    <div className="customer-review-feedback-section">

                                        <label
                                            htmlFor="reviewFeedback"
                                            className="customer-review-feedback-label"
                                        >
                                            Your Feedback
                                        </label>

                                        <textarea
                                            id="reviewFeedback"
                                            className="form-control customer-review-feedback"
                                            rows="5"
                                            value={
                                                reviewFeedback
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setReviewFeedback(
                                                    event.target
                                                        .value
                                                )
                                            }
                                            placeholder="Tell others about your experience with this vendor..."
                                            disabled={
                                                reviewLoading
                                            }
                                        ></textarea>

                                    </div>

                                </div>

                                <div className="modal-footer">

                                    <button
                                        type="button"
                                        className="btn customer-review-cancel-button"
                                        onClick={
                                            handleReviewModalClose
                                        }
                                        disabled={
                                            reviewLoading
                                        }
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        className="btn customer-review-submit-button"
                                        onClick={
                                            handleSubmitReview
                                        }
                                        disabled={
                                            reviewLoading ||
                                            reviewRating === 0
                                        }
                                    >
                                        {reviewLoading
                                            ? "Submitting..."
                                            : "Submit Review"}
                                    </button>

                                </div>

                            </div>
                        </div>
                    </div>

                    <div className="modal-backdrop fade show"></div>
                </>
            )}

    </div>
);


}

export default MyBookings;
