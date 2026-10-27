import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import "../../App.css";
import "../../css/VendorDashboard.css";

function VendorDashboard({ setVendorLoggedIn }) {
    const navigate = useNavigate();

    const API_BASE_URL = "./api";

    const [vendor, setVendor] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [services, setServices] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Logo logout confirmation modal
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Reviews popup
    const [showReviewsModal, setShowReviewsModal] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [totalRatings, setTotalRatings] = useState(0);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewsError, setReviewsError] = useState("");

    // ========================================
    // LOAD DASHBOARD
    // ========================================

    useEffect(() => {
        const vendorId = localStorage.getItem("vendor_id");

        console.log("Dashboard Vendor ID:", vendorId);

        if (!vendorId) {
            navigate("/vendor-login");
            return;
        }

        loadDashboard(vendorId);
    }, [navigate]);

    const loadDashboard = async (vendorId) => {
        setLoading(true);
        setError("");

        try {
            const [
                vendorResponse,
                servicesResponse,
                bookingsResponse
            ] = await Promise.all([
                axios.get(
                    `${API_BASE_URL}/vendor/profile/${vendorId}/`
                ),

                axios.get(
                    `${API_BASE_URL}/vendor/services/${vendorId}/`
                ),

                axios.get(
                    `${API_BASE_URL}/vendor/bookings/${vendorId}/`
                )
            ]);

            console.log("Vendor:", vendorResponse.data);
            console.log("Services:", servicesResponse.data);
            console.log("Bookings:", bookingsResponse.data);

            setVendor(vendorResponse.data || null);

            // Backend may return array directly
            // or { services: [] }
            if (Array.isArray(servicesResponse.data)) {
                setServices(servicesResponse.data);
            } else {
                setServices(
                    servicesResponse.data?.services || []
                );
            }

            // Backend may return array directly
            // or { bookings: [] }
            if (Array.isArray(bookingsResponse.data)) {
                setBookings(bookingsResponse.data);
            } else {
                setBookings(
                    bookingsResponse.data?.bookings || []
                );
            }
        } catch (error) {
            console.log("Dashboard error:", error);

            setError(
                "Unable to load dashboard data."
            );
        } finally {
            setLoading(false);
        }
    };

    // ========================================
    // LOAD REVIEWS
    // ========================================

    const loadReviews = async () => {
        const vendorId = localStorage.getItem("vendor_id");

        if (!vendorId) {
            setReviewsError(
                "Vendor login information not found."
            );
            return;
        }

        try {
            setReviewsLoading(true);
            setReviewsError("");

            const response = await axios.get(
                `${API_BASE_URL}/vendor/rating/${vendorId}/`
            );

            console.log(
                "Vendor reviews:",
                response.data
            );

            setReviews(
                response.data?.reviews || []
            );

            setAverageRating(
                Number(
                    response.data?.average_rating || 0
                )
            );

            setTotalRatings(
                Number(
                    response.data?.total_ratings || 0
                )
            );
        } catch (error) {
            console.log(
                "Unable to load vendor reviews:",
                error
            );

            setReviews([]);
            setAverageRating(0);
            setTotalRatings(0);

            setReviewsError(
                error.response?.data?.message ||
                "Unable to load reviews."
            );
        } finally {
            setReviewsLoading(false);
        }
    };

    // ========================================
    // OPEN REVIEWS POPUP
    // ========================================

    const handleReviewsClick = () => {
        setShowReviewsModal(true);
        loadReviews();
    };

    // ========================================
    // CLOSE REVIEWS POPUP
    // ========================================

    const handleReviewsClose = () => {
        if (reviewsLoading) {
            return;
        }

        setShowReviewsModal(false);
    };

    // ========================================
    // NORMAL DASHBOARD LOGOUT
    // ========================================

    const handleLogout = () => {
        localStorage.removeItem("vendor_id");
        localStorage.removeItem("vendor_status");

        setVendorLoggedIn(false);

        navigate("/");
    };

    // ========================================
    // LOGO / APP NAME CLICK
    // ========================================

    const handleLogoClick = () => {
        setShowLogoutModal(true);
    };

    // ========================================
    // CONFIRM LOGO LOGOUT
    // ========================================

    const handleConfirmLogout = () => {
        localStorage.removeItem("vendor_id");
        localStorage.removeItem("vendor_status");

        setVendorLoggedIn(false);

        setShowLogoutModal(false);

        navigate("/");
    };

    // ========================================
    // CANCEL LOGO LOGOUT
    // ========================================

    const handleCancelLogout = () => {
        setShowLogoutModal(false);
    };

    // ========================================
    // VENDOR NAME
    // ========================================

    const getVendorName = () => {
        if (!vendor) {
            return "Vendor";
        }

        return vendor.name || "Vendor";
    };

    // ========================================
    // BOOKING STATUS
    // ========================================

    const getBookingStatus = (booking) => {
        return (
            booking.status ||
            "pending"
        ).toLowerCase();
    };

    // ========================================
    // BOOKING STATUS DISPLAY
    // ========================================

    const getBookingStatusLabel = (booking) => {
        const status = getBookingStatus(booking);

        switch (status) {
            case "pending":
                return "Pending";

            case "accepted":
                return "Accepted";

            case "rejected":
                return "Rejected";

            case "ongoing":
                return "Ongoing";

            case "completed":
                return "Completed";

            case "cancelled":
                return "Cancelled";

            default:
                return status;
        }
    };

    // ========================================
    // UPDATE BOOKING STATUS
    // ========================================

    const handleBookingStatus = async (
        bookingId,
        status
    ) => {
        try {
            const vendorId =
                localStorage.getItem("vendor_id");

            await axios.patch(
                `${API_BASE_URL}/booking/status/${bookingId}/`,
                {
                    vendor: vendorId,
                    status: status
                }
            );

            // Reload only bookings
            const response = await axios.get(
                `${API_BASE_URL}/vendor/bookings/${vendorId}/`
            );

            if (Array.isArray(response.data)) {
                setBookings(response.data);
            } else {
                setBookings(
                    response.data?.bookings || []
                );
            }
        } catch (error) {
            console.log(
                "Unable to update booking status.",
                error
            );
        }
    };

    // ========================================
    // STAR DISPLAY
    // ========================================

    const renderStars = (rating) => {
        const numericRating = Number(rating) || 0;

        return [1, 2, 3, 4, 5].map(
            (star) => (
                <i
                    key={star}
                    className={
                        star <= numericRating
                            ? "fa-solid fa-star"
                            : "fa-regular fa-star"
                    }
                ></i>
            )
        );
    };

    // ========================================
    // FORMAT REVIEW DATE
    // ========================================

    const formatReviewDate = (date) => {
        if (!date) {
            return "";
        }

        const reviewDate = new Date(date);

        if (
            Number.isNaN(
                reviewDate.getTime()
            )
        ) {
            return "";
        }

        return reviewDate.toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );
    };

    // ========================================
    // LOADING SCREEN
    // ========================================

    if (loading) {
        return (
            <div className="vendor-dashboard">

                <nav className="navbar vendor-navbar">
                    <div className="container">

                        <div
                            className="dashboard-logo-area"
                            onClick={handleLogoClick}
                            role="button"
                            tabIndex="0"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleLogoClick();
                                }
                            }}
                        >
                            <div className="brand-logo">
                                <img
                                    className="img-thumbnail border-0 w-75"
                                    src="/logo.png"
                                    alt="ஊர்க்காரன்"
                                />
                            </div>

                            <span className="fw-bold fs-4">
                                ஊர்
                                <span
                                    style={{
                                        color:
                                            "var(--primary)"
                                    }}
                                >
                                    க்காரன்
                                </span>
                            </span>
                        </div>

                    </div>
                </nav>

                <main className="container vendor-dashboard-content">
                    <div className="loading-text">
                        Loading dashboard...
                    </div>
                </main>

            </div>
        );
    }

    return (
        <div className="vendor-dashboard">

            {/* ========================================
                NAVBAR
            ======================================== */}

            <nav className="navbar vendor-navbar">

                <div className="container">

                    {/* Logo */}

                    <div
                        className="dashboard-logo-area"
                        onClick={handleLogoClick}
                        role="button"
                        tabIndex="0"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleLogoClick();
                            }
                        }}
                    >
                        <div className="brand-logo">

                            <img
                                className="img-thumbnail border-0 w-75"
                                src="/logo.png"
                                alt="ஊர்க்காரன்"
                            />

                        </div>

                        <span className="fw-bold fs-4">

                            ஊர்

                            <span
                                style={{
                                    color:
                                        "var(--primary)"
                                }}
                            >
                                க்காரன்
                            </span>

                        </span>

                    </div>


                    {/* Navbar Buttons */}

                    <div className="vendor-navbar-actions">

                        {/* Feedback & Reviews */}

                        <button
                            type="button"
                            className="btn vendor-reviews-nav-btn"
                            onClick={
                                handleReviewsClick
                            }
                        >
                            <i className="fa-solid fa-star me-2"></i>

                            Feedback & Reviews
                        </button>


                        {/* Profile */}

                        <button
                            type="button"
                            className="btn btn-outline-dark"
                            onClick={() =>
                                navigate(
                                    "/vendor-profile"
                                )
                            }
                        >
                            <i className="fa-solid fa-user me-2"></i>

                            Profile
                        </button>


                        {/* Logout */}

                        <button
                            type="button"
                            className="btn vendor-logout-btn"
                            onClick={handleLogout}
                        >
                            <i className="fa-solid fa-right-from-bracket me-2"></i>

                            Logout
                        </button>

                    </div>

                </div>

            </nav>


            {/* ========================================
                MAIN CONTENT
            ======================================== */}

            <main className="container vendor-dashboard-content">

                {/* Error */}

                {error && (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                )}


                {/* Welcome */}

                <section className="vendor-welcome-card">

                    <div>

                        <p className="vendor-label">
                            VENDOR PROFILE DASHBOARD
                        </p>

                        <h1>
                            Welcome, {getVendorName()} 👋
                        </h1>

                        <p>
                            Manage your services and
                            customer bookings from one place.
                        </p>

                    </div>

                </section>


                {/* Quick Actions */}

                <section className="vendor-dashboard-section">

                    <div className="section-heading">
                        Quick Actions
                    </div>

                    <div className="row g-3">

                        {/* My Services */}

                        <div className="col-6">

                            <div
                                className="vendor-action-card"
                                onClick={() =>
                                    navigate(
                                        "/manage-services"
                                    )
                                }
                            >

                                <div className="vendor-action-icon">
                                    <i className="fa-solid fa-screwdriver-wrench"></i>
                                </div>

                                <h6>
                                    My Services
                                </h6>

                                <p>
                                    Manage services
                                </p>

                            </div>

                        </div>


                        {/* Availability */}

                        <div className="col-6">

                            <div
                                className="vendor-action-card"
                                onClick={() =>
                                    navigate(
                                        "/vendor-availability"
                                    )
                                }
                            >

                                <div className="vendor-action-icon">
                                    <i className="fa-solid fa-calendar-days"></i>
                                </div>

                                <h6>
                                    Availability
                                </h6>

                                <p>
                                    Manage your dates
                                </p>

                            </div>

                        </div>


                        {/* Bookings */}

                        <div className="col-6">

                            <div
                                className="vendor-action-card"
                                onClick={() =>
                                    navigate(
                                        "/vendor-bookings"
                                    )
                                }
                            >

                                <div className="vendor-action-icon">
                                    <i className="fa-solid fa-clipboard-list"></i>
                                </div>

                                <h6>
                                    Manage Bookings
                                </h6>

                                <p>
                                    View and manage bookings
                                </p>

                            </div>

                        </div>

                    </div>

                </section>


                {/* Services */}

                <section className="vendor-dashboard-section">

                    <div className="section-heading">
                        My Services
                    </div>

                    <div className="vendor-services-container">

                        {services.length === 0 ? (

                            <p className="no-services">
                                No services added yet.
                            </p>

                        ) : (

                            <div className="row g-3">

                                {services.map(
                                    (
                                        service,
                                        index
                                    ) => (

                                        <div
                                            className="col-12 col-sm-6"
                                            key={
                                                service.service_id ||
                                                index
                                            }
                                            onClick={() =>
                                                navigate(
                                                    "/manage-services"
                                                )
                                            }
                                        >

                                            <div className="vendor-service-card vendor-action-card">

                                                <div className="service-card-icon">
                                                    <i className="fa-solid fa-screwdriver-wrench"></i>
                                                </div>

                                                <div>

                                                    <h6>
                                                        {
                                                            service.service
                                                        }
                                                    </h6>

                                                    <p>
                                                        {
                                                            service.category
                                                        }
                                                    </p>

                                                </div>

                                            </div>

                                        </div>
                                    )
                                )}

                            </div>
                        )}

                    </div>

                </section>


                {/* Customer Bookings */}

                <section className="vendor-dashboard-section">

                    <div className="section-heading">
                        Customer Bookings
                    </div>

                    {bookings.length === 0 ? (

                        <div className="empty-bookings-card">

                            <div className="empty-bookings-icon">
                                📋
                            </div>

                            <h5>
                                No bookings yet
                            </h5>

                            <p>
                                Customer bookings will appear here.
                            </p>

                        </div>

                    ) : (

                        <>

                            <div className="booking-list">

                                {bookings
                                    .slice(0, 3)
                                    .map(
                                        (
                                            booking,
                                            index
                                        ) => {

                                            const status =
                                                getBookingStatus(
                                                    booking
                                                );

                                            return (
                                                <div
                                                    className="vendor-booking-card"
                                                    key={
                                                        booking.booking_id ||
                                                        index
                                                    }
                                                >

                                                    <div className="booking-top">

                                                        <div>

                                                            <p className="booking-label">
                                                                SERVICE
                                                            </p>

                                                            <h5>
                                                                {
                                                                    booking.service
                                                                }
                                                            </h5>

                                                        </div>

                                                        <span
                                                            className={`booking-status ${status}`}
                                                        >
                                                            {
                                                                getBookingStatusLabel(
                                                                    booking
                                                                )
                                                            }
                                                        </span>

                                                    </div>


                                                    <div className="booking-details">

                                                        <p>
                                                            📅{" "}
                                                            {
                                                                booking.date
                                                            }
                                                        </p>

                                                        <p>
                                                            👤 Customer Name:{" "}
                                                            {
                                                                booking.customer_name
                                                            }
                                                        </p>

                                                    </div>


                                                    {status === "pending" && (

                                                        <div className="booking-actions">

                                                            <button
                                                                type="button"
                                                                className="btn accept-booking-btn"
                                                                onClick={() =>
                                                                    handleBookingStatus(
                                                                        booking.booking_id,
                                                                        "accepted"
                                                                    )
                                                                }
                                                            >
                                                                Accept
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="btn reject-booking-btn"
                                                                onClick={() =>
                                                                    handleBookingStatus(
                                                                        booking.booking_id,
                                                                        "rejected"
                                                                    )
                                                                }
                                                            >
                                                                Reject
                                                            </button>

                                                        </div>

                                                    )}

                                                </div>
                                            );
                                        }
                                    )}

                            </div>


                            {bookings.length > 3 && (

                                <div className="text-center mt-4">

                                    <button
                                        type="button"
                                        className="btn btn-outline-dark"
                                        onClick={() =>
                                            navigate(
                                                "/vendor-bookings"
                                            )
                                        }
                                    >
                                        View All Bookings

                                        <i className="fa-solid fa-arrow-right ms-2"></i>

                                    </button>

                                </div>

                            )}

                        </>

                    )}

                </section>

            </main>


            {/* ========================================
                LOGOUT CONFIRMATION MODAL
            ======================================== */}

            {showLogoutModal && (
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
                                        Leave Vendor Dashboard?
                                    </h5>

                                    <button
                                        type="button"
                                        className="btn-close"
                                        aria-label="Close"
                                        onClick={
                                            handleCancelLogout
                                        }
                                    ></button>

                                </div>

                                <div className="modal-body">

                                    <p className="mb-0">
                                        Do you want to logout and go
                                        to the main page?
                                    </p>

                                </div>

                                <div className="modal-footer">

                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={
                                            handleCancelLogout
                                        }
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-warning"
                                        onClick={
                                            handleConfirmLogout
                                        }
                                    >
                                        Logout & Go Home
                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                    <div className="modal-backdrop fade show"></div>
                </>
            )}


            {/* ========================================
                FEEDBACK & REVIEWS MODAL
            ======================================== */}

            {showReviewsModal && (
                <>
                    <div
                        className="modal fade show d-block vendor-reviews-modal"
                        tabIndex="-1"
                        role="dialog"
                        aria-modal="true"
                    >

                        <div className="modal-dialog modal-dialog-centered modal-lg">

                            <div className="modal-content vendor-reviews-modal-content">

                                {/* Header */}

                                <div className="vendor-reviews-modal-header">

                                    <div>

                                        <p className="vendor-reviews-modal-label">
                                            CUSTOMER FEEDBACK
                                        </p>

                                        <h5 className="vendor-reviews-modal-title">
                                            Feedback & Reviews
                                        </h5>

                                        <p className="vendor-reviews-modal-subtitle">
                                            See what your customers say
                                            about your services.
                                        </p>

                                    </div>

                                    <button
                                        type="button"
                                        className="vendor-reviews-close-btn"
                                        onClick={
                                            handleReviewsClose
                                        }
                                        disabled={
                                            reviewsLoading
                                        }
                                    >
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>

                                </div>


                                {/* Body */}

                                <div className="vendor-reviews-modal-body">

                                    {reviewsLoading ? (

                                        <div className="vendor-reviews-loading">

                                            <div
                                                className="spinner-border"
                                                role="status"
                                            >
                                                <span className="visually-hidden">
                                                    Loading...
                                                </span>
                                            </div>

                                            <p>
                                                Loading customer reviews...
                                            </p>

                                        </div>

                                    ) : reviewsError ? (

                                        <div className="vendor-reviews-error">

                                            <i className="fa-solid fa-circle-exclamation"></i>

                                            <p>
                                                {reviewsError}
                                            </p>

                                            <button
                                                type="button"
                                                className="btn vendor-reviews-retry-btn"
                                                onClick={
                                                    loadReviews
                                                }
                                            >
                                                Try Again
                                            </button>

                                        </div>

                                    ) : (

                                        <>
                                            {/* Rating Summary */}

                                            <div className="vendor-review-summary">

                                                <div className="vendor-review-summary-score">

                                                    <span>
                                                        {
                                                            averageRating.toFixed(
                                                                1
                                                            )
                                                        }
                                                    </span>

                                                    <div className="vendor-review-summary-stars">

                                                        {renderStars(
                                                            Math.round(
                                                                averageRating
                                                            )
                                                        )}

                                                    </div>

                                                    <small>
                                                        {
                                                            totalRatings
                                                        }{" "}
                                                        {
                                                            totalRatings === 1
                                                                ? "review"
                                                                : "reviews"
                                                        }
                                                    </small>

                                                </div>


                                                <div className="vendor-review-summary-content">

                                                    <h6>
                                                        Your customer rating
                                                    </h6>

                                                    <p>
                                                        Ratings and feedback
                                                        from customers who
                                                        have completed
                                                        services with you.
                                                    </p>

                                                </div>

                                            </div>


                                            {/* Reviews */}

                                            {reviews.length === 0 ? (

                                                <div className="vendor-no-reviews">

                                                    <div className="vendor-no-reviews-icon">

                                                        <i className="fa-regular fa-comment-dots"></i>

                                                    </div>

                                                    <h6>
                                                        No reviews yet
                                                    </h6>

                                                    <p>
                                                        Customer reviews will
                                                        appear here after they
                                                        complete and review
                                                        your services.
                                                    </p>

                                                </div>

                                            ) : (

                                                <div className="vendor-review-list">

                                                    {reviews.map(
                                                        (
                                                            review,
                                                            index
                                                        ) => (

                                                            <div
                                                                className="vendor-review-card"
                                                                key={
                                                                    review.booking_id ||
                                                                    index
                                                                }
                                                            >

                                                                <div className="vendor-review-card-top">

                                                                    {/* Customer */}

                                                                    <div className="vendor-review-customer">

                                                                        <div className="vendor-review-avatar">

                                                                            {
                                                                                review.customer_name
                                                                                    ?.charAt(
                                                                                        0
                                                                                    )
                                                                                    ?.toUpperCase() ||
                                                                                "C"
                                                                            }

                                                                        </div>

                                                                        <div>

                                                                            <h6>
                                                                                {
                                                                                    review.customer_name ||
                                                                                    "Customer"
                                                                                }
                                                                            </h6>

                                                                            <span>
                                                                                {
                                                                                    formatReviewDate(
                                                                                        review.created_at
                                                                                    )
                                                                                }
                                                                            </span>

                                                                        </div>

                                                                    </div>


                                                                    {/* Stars */}

                                                                    <div className="vendor-review-stars">

                                                                        {renderStars(
                                                                            review.rating
                                                                        )}

                                                                    </div>

                                                                </div>


                                                                {/* Feedback */}

                                                                {review.feedback ? (

                                                                    <div className="vendor-review-feedback">

                                                                        <i className="fa-solid fa-quote-left"></i>

                                                                        <p>
                                                                            {
                                                                                review.feedback
                                                                            }
                                                                        </p>

                                                                    </div>

                                                                ) : (

                                                                    <p className="vendor-review-no-feedback">
                                                                        Customer did not
                                                                        leave written
                                                                        feedback.
                                                                    </p>

                                                                )}


                                                                {/* Booking */}

                                                                {review.booking_id && (

                                                                    <div className="vendor-review-booking">

                                                                        <i className="fa-solid fa-receipt"></i>

                                                                        Booking #
                                                                        {
                                                                            review.booking_id
                                                                        }

                                                                    </div>

                                                                )}

                                                            </div>

                                                        )
                                                    )}

                                                </div>

                                            )}

                                        </>
                                    )}

                                </div>


                                {/* Footer */}

                                {!reviewsLoading && (

                                    <div className="vendor-reviews-modal-footer">

                                        <button
                                            type="button"
                                            className="btn vendor-reviews-close-footer-btn"
                                            onClick={
                                                handleReviewsClose
                                            }
                                        >
                                            Close
                                        </button>

                                    </div>

                                )}

                            </div>

                        </div>

                    </div>


                    <div
                        className="modal-backdrop fade show vendor-reviews-backdrop"
                        onClick={
                            handleReviewsClose
                        }
                    ></div>
                </>
            )}

        </div>
    );
}

export default VendorDashboard;
