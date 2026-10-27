import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../App.css";

function Contact() {
    const API_BASE_URL = "./api";
    const navigate = useNavigate();

    // =================================================
    // LOGIN STATE
    // =================================================

    const [customerId, setCustomerId] = useState("");

    // =================================================
    // CUSTOMER DETAILS
    // =================================================

    const [customerName, setCustomerName] = useState("");
    const [customerUsername, setCustomerUsername] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");

    // =================================================
    // CUSTOMER BOOKINGS
    // =================================================

    const [bookings, setBookings] = useState([]);
    const [selectedBooking, setSelectedBooking] = useState("");

    // =================================================
    // FEEDBACK
    // =================================================

    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");

    // =================================================
    // LOADING / MESSAGES
    // =================================================

    const [loadingCustomer, setLoadingCustomer] = useState(false);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [loading, setLoading] = useState(false);

    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // =================================================
    // CHECK CUSTOMER LOGIN
    // =================================================

    const isLoggedIn = Boolean(
        localStorage.getItem("customer_id")
    );

    // =================================================
    // LOAD CUSTOMER DETAILS
    // =================================================

    useEffect(() => {
        const storedCustomerId =
            localStorage.getItem("customer_id");

        if (!storedCustomerId) {
            return;
        }

        setCustomerId(storedCustomerId);

        const fetchCustomerDetails = async () => {
            try {
                setLoadingCustomer(true);

                const response = await axios.get(
                    `${API_BASE_URL}/user/profile/${storedCustomerId}/`
                );

                setCustomerName(
                    response.data.name || ""
                );

                setCustomerUsername(
                    response.data.username || ""
                );

                setCustomerEmail(
                    response.data.email || ""
                );

                setCustomerPhone(
                    response.data.phone || ""
                );

            } catch (error) {
                console.error(
                    "Unable to load customer details:",
                    error
                );

                setErrorMessage(
                    "Unable to load your customer details."
                );

            } finally {
                setLoadingCustomer(false);
            }
        };

        fetchCustomerDetails();
    }, []);

    // =================================================
    // LOAD CUSTOMER BOOKINGS
    // =================================================

    useEffect(() => {
        if (!customerId) {
            return;
        }

        const fetchBookings = async () => {
            try {
                setLoadingBookings(true);

                const response = await axios.get(
                    `${API_BASE_URL}/my-bookings/${customerId}/`
                );

                let bookingData = [];

                if (Array.isArray(response.data)) {
                    bookingData = response.data;
                } else if (
                    Array.isArray(response.data.bookings)
                ) {
                    bookingData = response.data.bookings;
                }

                // Only completed bookings can be reviewed
                const completedBookings =
                    bookingData.filter(
                        (booking) =>
                            (booking.status || "").toLowerCase() ===
                            "completed"
                    );

                setBookings(completedBookings);

            } catch (error) {
                console.error(
                    "Unable to load bookings:",
                    error
                );

                setErrorMessage(
                    "Unable to load your hired services."
                );

            } finally {
                setLoadingBookings(false);
            }
        };

        fetchBookings();
    }, [customerId]);

    // =================================================
    // SELECTED BOOKING DETAILS
    // =================================================

    const selectedBookingDetails = bookings.find(
        (booking) =>
            String(booking.booking_id) ===
            String(selectedBooking)
    );

    // =================================================
    // HOME NAVBAR
    // =================================================

    const renderHomeNavbar = () => {
        return (
            <nav className="navbar navbar-expand-lg home-navbar contact-navbar">
                <div className="container">

                    <div
                        className="dashboard-logo-area"
                        onClick={() => navigate("/")}
                        role="button"
                        tabIndex="0"
                        onKeyDown={(event) => {
                            if (
                                event.key === "Enter" ||
                                event.key === " "
                            ) {
                                navigate("/");
                            }
                        }}
                    >
                        <div className="brand-logo">
                            <img
                                src="/logo.png"
                                alt="Oorkaran"
                            />
                        </div>

                        <span className="fw-bold fs-4">
                            ஊர்
                            <span
                                style={{
                                    color: "var(--primary)"
                                }}
                            >
                                க்காரன்
                            </span>
                        </span>
                    </div>

                    <div className="d-flex gap-2">

                        <button
                            type="button"
                            className="btn login-btn"
                            onClick={() =>
                                navigate("/customer-login")
                            }
                        >
                            Sign In
                        </button>

                        <button
                            type="button"
                            className="btn signup-btn"
                            onClick={() =>
                                navigate("/customer-reg")
                            }
                        >
                            Sign Up
                        </button>

                    </div>
                </div>
            </nav>
        );
    };

    // =================================================
    // CUSTOMER NAVBAR
    // =================================================

    const renderCustomerNavbar = () => {
        return (
            <nav className="dashboard-navbar contact-dashboard-navbar">
                <div className="container">

                    <div className="dashboard-navbar-inner">

                        {/* LOGO */}

                        <div
                            className="dashboard-logo-area"
                            onClick={() =>
                                navigate("/customer-dashboard")
                            }
                            role="button"
                            tabIndex="0"
                            onKeyDown={(event) => {
                                if (
                                    event.key === "Enter" ||
                                    event.key === " "
                                ) {
                                    navigate(
                                        "/customer-dashboard"
                                    );
                                }
                            }}
                        >
                            <div className="brand-logo">
                                <img
                                    src="/logo.png"
                                    alt="Oorkaran"
                                />
                            </div>

                            <span className="fw-bold fs-4">
                                ஊர்
                                <span
                                    style={{
                                        color: "var(--primary)"
                                    }}
                                >
                                    க்காரன்
                                </span>
                            </span>
                        </div>

                        {/* NAVIGATION */}

                        <div className="dashboard-nav-links">

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/customer-dashboard"
                                    )
                                }
                            >
                                Categories / Services
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/customer-dashboard"
                                    )
                                }
                            >
                                Vendors
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate("/my-bookings")
                                }
                            >
                                History
                            </button>

                        </div>

                        {/* ACTIONS */}

                        <div className="dashboard-nav-actions">

                            <button
                                type="button"
                                className="profile-nav-btn"
                                onClick={() =>
                                    navigate(
                                        "/customer-profile"
                                    )
                                }
                            >
                                <i className="fa-regular fa-user"></i>

                                <span>
                                    Profile
                                </span>
                            </button>

                            <button
                                type="button"
                                className="logout-btn"
                                onClick={() => {

                                    localStorage.removeItem(
                                        "customer_id"
                                    );

                                    localStorage.removeItem(
                                        "customer_name"
                                    );

                                    localStorage.removeItem(
                                        "customer_email"
                                    );

                                    localStorage.removeItem(
                                        "customer_username"
                                    );

                                    localStorage.removeItem(
                                        "customer_phone"
                                    );

                                    navigate("/");
                                }}
                            >
                                Logout
                            </button>

                        </div>

                    </div>
                </div>
            </nav>
        );
    };

    // =================================================
    // RATING
    // =================================================

    const handleRating = (value) => {
        setRating(value);
    };

    // =================================================
    // SUBMIT
    // =================================================

    const handleSubmit = async (event) => {
        event.preventDefault();

        setSuccessMessage("");
        setErrorMessage("");

        // -------------------------------------------------
        // NAME
        // -------------------------------------------------

        if (!customerName.trim()) {
            setErrorMessage(
                "Please enter your name."
            );
            return;
        }

        // -------------------------------------------------
        // EMAIL
        // -------------------------------------------------

        if (!customerEmail.trim()) {
            setErrorMessage(
                "Please enter your email address."
            );
            return;
        }

        // -------------------------------------------------
        // LOGGED-IN CUSTOMER VALIDATION
        // -------------------------------------------------

        if (isLoggedIn) {

            if (!selectedBooking) {
                setErrorMessage(
                    "Please select the service you want to give feedback on."
                );
                return;
            }

            if (rating === 0) {
                setErrorMessage(
                    "Please give a rating from 1 to 5 stars."
                );
                return;
            }
        }

        // -------------------------------------------------
        // SUBJECT
        // -------------------------------------------------

        if (!subject.trim()) {
            setErrorMessage(
                "Please enter a subject."
            );
            return;
        }

        // -------------------------------------------------
        // MESSAGE
        // -------------------------------------------------

        if (!message.trim()) {
            setErrorMessage(
                "Please enter your message."
            );
            return;
        }

        try {
            setLoading(true);

            // -------------------------------------------------
            // REQUEST DATA
            // -------------------------------------------------

            const requestData = {
                customer: customerId || null,

                // IMPORTANT:
                // selectedBooking is the existing state variable.
                booking_id: isLoggedIn
                    ? selectedBooking
                    : null,

                name: customerName.trim(),

                email: customerEmail.trim(),

                rating: isLoggedIn
                    ? rating
                    : null,

                subject: subject.trim(),

                message: message.trim()
            };

            console.log(
                "Contact request:",
                requestData
            );

            // -------------------------------------------------
            // SEND TO DJANGO
            // -------------------------------------------------

            const response = await axios.post(
                `${API_BASE_URL}/contact/`,
                requestData
            );

            // -------------------------------------------------
            // SUCCESS
            // -------------------------------------------------

            setSuccessMessage(
                response.data.message ||
                "Your message has been sent successfully."
            );

            // -------------------------------------------------
            // CLEAR FEEDBACK FIELDS
            // -------------------------------------------------

            setSelectedBooking("");
            setRating(0);
            setHoverRating(0);
            setSubject("");
            setMessage("");

        } catch (error) {

            console.error(
                "Unable to send contact message:",
                error
            );

            setErrorMessage(
                error.response?.data?.message ||
                "Unable to send your message. Please try again."
            );

        } finally {
            setLoading(false);
        }
    };

    // =================================================
    // PAGE
    // =================================================

    return (
        <div className="contact-page">

            {/* =================================================
                NAVBAR
            ================================================= */}

            {isLoggedIn
                ? renderCustomerNavbar()
                : renderHomeNavbar()}

            {/* =================================================
                HERO
            ================================================= */}

            <section className="contact-hero">

                <div className="container">

                    <div className="contact-header text-center">

                        <div className="contact-label">
                            <i className="fa-solid fa-heart me-2"></i>

                            {isLoggedIn
                                ? "YOUR VOICE MATTERS"
                                : "GET IN TOUCH"}
                        </div>

                        <h1>

                            {isLoggedIn
                                ? "How was your experience?"
                                : "Let's talk, "}

                            {!isLoggedIn && (
                                <span>
                                    ஊர்க்காரன்
                                </span>
                            )}

                        </h1>

                        <p>

                            {isLoggedIn
                                ? "Tell us about the service you received and help us make Oorkaran better."
                                : "Have a question, suggestion, or feedback? We're always happy to hear from you."}

                        </p>

                    </div>

                </div>

            </section>

            {/* =================================================
                MAIN CONTENT
            ================================================= */}

            <section className="contact-content">

                <div className="container">

                    <div className="row g-4 justify-content-center">

                        {/* =================================================
                            INFORMATION CARD
                        ================================================= */}

                        <div className="col-lg-4">

                            <div className="contact-info-card">

                                <div className="contact-big-icon">
                                    <i className="fa-solid fa-comments"></i>
                                </div>

                                <h3>
                                    We'd love to hear from you
                                </h3>

                                <p>

                                    {isLoggedIn
                                        ? "Your feedback helps us understand what we're doing well and where we can improve."
                                        : "Whether you have a question, suggestion, or need assistance, feel free to contact us."}

                                </p>

                                <div className="contact-info-list">

                                    {/* EMAIL */}

                                    <div className="contact-info-item">

                                        <div className="contact-info-icon">
                                            <i className="fa-solid fa-envelope"></i>
                                        </div>

                                        <div>

                                            <span>
                                                Email
                                            </span>

                                            <strong>
                                                oorkaran.app@gmail.com
                                            </strong>

                                        </div>

                                    </div>

                                    {/* PLATFORM */}

                                    <div className="contact-info-item">

                                        <div className="contact-info-icon">
                                            <i className="fa-solid fa-handshake"></i>
                                        </div>

                                        <div>

                                            <span>
                                                Platform
                                            </span>

                                            <strong>
                                                Local Services Platform
                                            </strong>

                                        </div>

                                    </div>

                                    {/* EXPERIENCE */}

                                    <div className="contact-info-item">

                                        <div className="contact-info-icon">
                                            <i className="fa-solid fa-heart"></i>
                                        </div>

                                        <div>

                                            <span>
                                                We value
                                            </span>

                                            <strong>
                                                Your experience
                                            </strong>

                                        </div>

                                    </div>

                                </div>

                                <div className="contact-info-decoration">

                                    <span>
                                        ஊர்
                                    </span>

                                    <span>
                                        க்காரன்
                                    </span>

                                </div>

                            </div>

                        </div>

                        {/* =================================================
                            FORM
                        ================================================= */}

                        <div className="col-lg-7">

                            <div className="contact-form-card">

                                <div className="contact-form-heading">

                                    <div>

                                        <span className="form-small-label">

                                            {isLoggedIn
                                                ? "SERVICE FEEDBACK"
                                                : "SEND A MESSAGE"}

                                        </span>

                                        <h3>

                                            {isLoggedIn
                                                ? "Share your experience"
                                                : "How can we help?"}

                                        </h3>

                                    </div>

                                    <div className="form-heading-icon">
                                        <i className="fa-solid fa-paper-plane"></i>
                                    </div>

                                </div>

                                <p className="contact-form-description">

                                    {isLoggedIn
                                        ? "Choose a completed service, rate your experience, and tell us what you think."
                                        : "Enter your details and send us your message."}

                                </p>

                                {/* =================================================
                                    SUCCESS MESSAGE
                                ================================================= */}

                                {successMessage && (

                                    <div
                                        className="alert contact-alert contact-alert-success"
                                        role="alert"
                                    >

                                        <i className="fa-solid fa-circle-check me-2"></i>

                                        {successMessage}

                                    </div>

                                )}

                                {/* =================================================
                                    ERROR MESSAGE
                                ================================================= */}

                                {errorMessage && (

                                    <div
                                        className="alert contact-alert contact-alert-danger"
                                        role="alert"
                                    >

                                        <i className="fa-solid fa-circle-exclamation me-2"></i>

                                        {errorMessage}

                                    </div>

                                )}

                                {/* =================================================
                                    FORM
                                ================================================= */}

                                <form onSubmit={handleSubmit}>

                                    <div className="row g-3">

                                        {/* =================================================
                                            NAME
                                        ================================================= */}

                                        <div className="col-md-6">

                                            <label
                                                htmlFor="contactName"
                                                className="form-label"
                                            >
                                                Name
                                            </label>

                                            <input
                                                type="text"
                                                id="contactName"
                                                className="form-control contact-input"
                                                value={customerName}
                                                onChange={(event) =>
                                                    setCustomerName(
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Your name"
                                                disabled={
                                                    isLoggedIn &&
                                                    loadingCustomer
                                                }
                                            />

                                        </div>

                                        {/* =================================================
                                            EMAIL
                                        ================================================= */}

                                        <div className="col-md-6">

                                            <label
                                                htmlFor="contactEmail"
                                                className="form-label"
                                            >
                                                Email
                                            </label>

                                            <input
                                                type="email"
                                                id="contactEmail"
                                                className="form-control contact-input"
                                                value={customerEmail}
                                                onChange={(event) =>
                                                    setCustomerEmail(
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Your email"
                                                disabled={
                                                    isLoggedIn &&
                                                    loadingCustomer
                                                }
                                            />

                                        </div>

                                        {/* =================================================
                                            LOGGED-IN CUSTOMER ONLY
                                        ================================================= */}

                                        {isLoggedIn && (
                                            <>

                                                {/* =================================================
                                                    SERVICE SELECTION
                                                ================================================= */}

                                                <div className="col-12">

                                                    <label
                                                        htmlFor="contactBooking"
                                                        className="form-label"
                                                    >
                                                        Service you want to review

                                                        <span className="required-star">
                                                            *
                                                        </span>

                                                    </label>

                                                    {loadingBookings ? (

                                                        <div className="contact-loading-box">

                                                            <span
                                                                className="spinner-border spinner-border-sm me-2"
                                                                role="status"
                                                            ></span>

                                                            Loading your completed services...

                                                        </div>

                                                    ) : bookings.length === 0 ? (

                                                        <div className="no-bookings-box">

                                                            <i className="fa-solid fa-calendar-xmark"></i>

                                                            <div>

                                                                <strong>
                                                                    No completed services yet
                                                                </strong>

                                                                <p>
                                                                    You can give feedback after completing a service booked through Oorkaran.
                                                                </p>

                                                            </div>

                                                        </div>

                                                    ) : (

                                                        <select
                                                            id="contactBooking"
                                                            className="form-select contact-input"
                                                            value={selectedBooking}
                                                            onChange={(event) =>
                                                                setSelectedBooking(
                                                                    event.target.value
                                                                )
                                                            }
                                                        >

                                                            <option value="">
                                                                Select a completed service
                                                            </option>

                                                            {bookings.map(
                                                                (booking) => (

                                                                    <option
                                                                        key={
                                                                            booking.booking_id
                                                                        }
                                                                        value={
                                                                            booking.booking_id
                                                                        }
                                                                    >

                                                                        {
                                                                            booking.service
                                                                        }

                                                                        {" — "}

                                                                        {
                                                                            booking.vendor_name
                                                                        }

                                                                        {" ("}

                                                                        {
                                                                            booking.date
                                                                        }

                                                                        {")"}

                                                                    </option>

                                                                )
                                                            )}

                                                        </select>

                                                    )}

                                                </div>

                                                {/* =================================================
                                                    SELECTED BOOKING
                                                ================================================= */}

                                                {selectedBookingDetails && (

                                                    <div className="col-12">

                                                        <div className="selected-service-card">

                                                            <div className="selected-service-icon">

                                                                <i className="fa-solid fa-user-tie"></i>

                                                            </div>

                                                            <div className="selected-service-details">

                                                                <span>
                                                                    SELECTED SERVICE
                                                                </span>

                                                                <strong>
                                                                    {
                                                                        selectedBookingDetails.service
                                                                    }
                                                                </strong>

                                                                <p>

                                                                    <i className="fa-solid fa-user me-1"></i>

                                                                    {
                                                                        selectedBookingDetails.vendor_name
                                                                    }

                                                                    <span className="service-divider">
                                                                        •
                                                                    </span>

                                                                    <i className="fa-solid fa-calendar me-1"></i>

                                                                    {
                                                                        selectedBookingDetails.date
                                                                    }

                                                                </p>

                                                            </div>

                                                            <div className="selected-service-check">

                                                                <i className="fa-solid fa-circle-check"></i>

                                                            </div>

                                                        </div>

                                                    </div>

                                                )}

                                                {/* =================================================
                                                    RATING
                                                ================================================= */}

                                                <div className="col-12">

                                                    <label className="form-label">

                                                        How would you rate this service?

                                                        <span className="required-star">
                                                            *
                                                        </span>

                                                    </label>

                                                    <div className="rating-container">

                                                        <div className="rating-stars">

                                                            {[1, 2, 3, 4, 5].map(
                                                                (star) => (

                                                                    <button
                                                                        type="button"
                                                                        key={star}
                                                                        className={`rating-star ${
                                                                            star <=
                                                                            (hoverRating ||
                                                                                rating)
                                                                                ? "active"
                                                                                : ""
                                                                        }`}
                                                                        onClick={() =>
                                                                            handleRating(
                                                                                star
                                                                            )
                                                                        }
                                                                        onMouseEnter={() =>
                                                                            setHoverRating(
                                                                                star
                                                                            )
                                                                        }
                                                                        onMouseLeave={() =>
                                                                            setHoverRating(
                                                                                0
                                                                            )
                                                                        }
                                                                        aria-label={`${star} star`}
                                                                    >

                                                                        <i className="fa-solid fa-star"></i>

                                                                    </button>

                                                                )
                                                            )}

                                                        </div>

                                                        <span className="rating-text">

                                                            {rating === 0
                                                                ? "Select your rating"
                                                                : `${rating} out of 5`}

                                                        </span>

                                                    </div>

                                                </div>

                                            </>
                                        )}

                                        {/* =================================================
                                            SUBJECT
                                        ================================================= */}

                                        <div className="col-12">

                                            <label
                                                htmlFor="contactSubject"
                                                className="form-label"
                                            >
                                                Subject
                                            </label>

                                            <input
                                                type="text"
                                                id="contactSubject"
                                                className="form-control contact-input"
                                                value={subject}
                                                onChange={(event) =>
                                                    setSubject(
                                                        event.target.value
                                                    )
                                                }
                                                placeholder={
                                                    isLoggedIn
                                                        ? "How was your experience?"
                                                        : "What would you like to contact us about?"
                                                }
                                            />

                                        </div>

                                        {/* =================================================
                                            MESSAGE
                                        ================================================= */}

                                        <div className="col-12">

                                            <label
                                                htmlFor="contactMessage"
                                                className="form-label"
                                            >
                                                Message
                                            </label>

                                            <textarea
                                                id="contactMessage"
                                                className="form-control contact-input contact-textarea"
                                                rows="6"
                                                value={message}
                                                onChange={(event) =>
                                                    setMessage(
                                                        event.target.value
                                                    )
                                                }
                                                placeholder={
                                                    isLoggedIn
                                                        ? "Tell us about your experience..."
                                                        : "Write your message here..."
                                                }
                                            ></textarea>

                                        </div>

                                        {/* =================================================
                                            SUBMIT
                                        ================================================= */}

                                        <div className="col-12">

                                            <button
                                                type="submit"
                                                className="btn contact-submit-button"
                                                disabled={
                                                    loading ||
                                                    (
                                                        isLoggedIn &&
                                                        bookings.length === 0
                                                    )
                                                }
                                            >

                                                {loading ? (

                                                    <>
                                                        <span
                                                            className="spinner-border spinner-border-sm me-2"
                                                            role="status"
                                                        ></span>

                                                        Sending...
                                                    </>

                                                ) : (

                                                    <>
                                                        <i className="fa-solid fa-paper-plane me-2"></i>

                                                        {isLoggedIn
                                                            ? "Send Feedback"
                                                            : "Send Message"}
                                                    </>

                                                )}

                                            </button>

                                        </div>

                                    </div>

                                </form>

                            </div>

                        </div>

                    </div>

                </div>

            </section>

        </div>
    );
}

export default Contact;