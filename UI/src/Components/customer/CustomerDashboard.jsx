import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import "../../App.css";


function CustomerDashboard({ setCustomerLoggedIn }) {

    const navigate = useNavigate();

    // =========================================================
    // STATES
    // =========================================================

    const [categories, setCategories] = useState([]);
    const [professionals, setProfessionals] = useState([]);
    const [allVendors, setAllVendors] = useState([]);

    const [categoryServices, setCategoryServices] = useState([]);

    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedVendor, setSelectedVendor] = useState(null);

    const [searchText, setSearchText] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);

    const [showAllCategories, setShowAllCategories] = useState(false);
    const [showAllVendors, setShowAllVendors] = useState(false);

    const [loadingCategories, setLoadingCategories] = useState(false);
    const [loadingServices, setLoadingServices] = useState(false);
    const [loadingVendors, setLoadingVendors] = useState(false);
    const [loadingVendorDetails, setLoadingVendorDetails] =
        useState(false);

    // =========================================================
    // REVIEW STATES
    // =========================================================

    const [selectedRating, setSelectedRating] = useState(0);
    const [feedback, setFeedback] = useState("");
    const [ratingMessage, setRatingMessage] = useState("");
    const [submittingRating, setSubmittingRating] = useState(false);

    const [vendorReviews, setVendorReviews] = useState([]);

    const [vendorRatingSummary, setVendorRatingSummary] = useState({
        average_rating: 0,
        total_ratings: 0
    });

    const [eligibleReviewBookings, setEligibleReviewBookings] =
        useState([]);

    const [selectedReviewBooking, setSelectedReviewBooking] =
        useState("");

    const [showAllReviews, setShowAllReviews] = useState(false);

    // =========================================================
    // LOGOUT STATE
    // =========================================================

    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // =========================================================
    // API
    // =========================================================

    const BASE_API = "./api";

    const CATEGORY_API =
        `${BASE_API}/categories/`;

    const SERVICES_API =
        `${BASE_API}/services/`;

    const TOP_RATED_API =
        `${BASE_API}/top-rated-vendors/`;

    const ALL_VENDORS_API =
        `${BASE_API}/all-approved-vendors/`;

    const SEARCH_API =
        `${BASE_API}/search-services/`;

    const RATING_API =
        `${BASE_API}/vendor/rating/`;

    const VENDOR_RATING_DETAILS_API =
        `${BASE_API}/vendor/rating/`;

    const CUSTOMER_BOOKINGS_API =
        `${BASE_API}/my-bookings/`;

    // =========================================================
    // POPULAR CATEGORIES
    // =========================================================

    const popularCategoryNames = [
        "Home Services",
        "Vehicle Services",
        "Tech Services",
        "Personal Care",
        "Moving & Delivery",
        "Pet Maintenance"
    ];

    // =========================================================
    // CATEGORY ICONS
    // =========================================================

    const categoryIcons = {
        "Home Services": "fa-solid fa-screwdriver-wrench",
        "Vehicle Services": "fa-solid fa-car",
        "Tech Services": "fa-solid fa-computer",
        "Personal Care": "fa-solid fa-spa",
        "Moving & Delivery": "fa-solid fa-truck",
        "Pet Maintenance": "fa-solid fa-paw"
    };

    // =========================================================
    // GET CATEGORIES
    // =========================================================

    useEffect(() => {

        const getCategories = async () => {

            try {

                setLoadingCategories(true);

                const response =
                    await axios.get(CATEGORY_API);

                setCategories(response.data);

            } catch (error) {

                console.log(
                    "Category error:",
                    error
                );

                setCategories([]);

            } finally {

                setLoadingCategories(false);
            }
        };

        getCategories();

    }, []);

    // =========================================================
    // GET TOP RATED VENDORS
    // =========================================================

    useEffect(() => {

        const getTopRatedVendors = async () => {

            try {

                setLoadingVendors(true);

                const response =
                    await axios.get(TOP_RATED_API);

                setProfessionals(response.data);

            } catch (error) {

                console.log(
                    "Top rated vendor error:",
                    error
                );

                setProfessionals([]);

            } finally {

                setLoadingVendors(false);
            }
        };

        getTopRatedVendors();

    }, []);

    // =========================================================
    // SEARCH SERVICES
    // =========================================================

    useEffect(() => {

        if (searchText.trim() === "") {

            setSearchResults([]);
            setShowSearchResults(false);

            return;
        }

        const timer = setTimeout(async () => {

            try {

                const response =
                    await axios.get(
                        SEARCH_API,
                        {
                            params: {
                                search:
                                    searchText.trim()
                            }
                        }
                    );

                setSearchResults(
                    response.data
                );

                setShowSearchResults(true);

            } catch (error) {

                console.log(
                    "Search error:",
                    error
                );

                setSearchResults([]);
                setShowSearchResults(false);
            }

        }, 400);

        return () =>
            clearTimeout(timer);

    }, [searchText]);

    // =========================================================
    // POPULAR CATEGORIES
    // =========================================================

    const popularCategories =
        categories.filter((category) =>
            popularCategoryNames.includes(
                category.category
            )
        );

    // =========================================================
    // OPEN CATEGORY
    // =========================================================

    const handleCategoryClick = async (category) => {

        try {

            setShowAllCategories(false);

            setSelectedCategory(category);
            setCategoryServices([]);

            setLoadingServices(true);

            const response =
                await axios.get(
                    `${SERVICES_API}${encodeURIComponent(
                        category.category
                    )}/`
                );

            setCategoryServices(
                response.data
            );

        } catch (error) {

            console.log(
                "Services error:",
                error
            );

            setCategoryServices([]);

        } finally {

            setLoadingServices(false);
        }
    };

    // =========================================================
    // CLOSE CATEGORY SERVICES
    // =========================================================

    const closeServices = () => {

        setSelectedCategory(null);
        setCategoryServices([]);
    };

    // =========================================================
    // SERVICE CLICK
    // =========================================================

    const handleServiceClick = (service) => {

        setSelectedCategory(null);
        setCategoryServices([]);

        setSearchText("");
        setSearchResults([]);
        setShowSearchResults(false);

        navigate(
            `/booking/${service.id}`
        );
    };

    // =========================================================
    // SEARCH RESULT CLICK
    // =========================================================

    const handleSearchResultClick = async (service) => {

        try {

            setSearchText("");
            setShowSearchResults(false);

            const category = {
                id: service.category_id,
                category: service.category_name
            };

            setSelectedCategory(category);
            setCategoryServices([]);

            setLoadingServices(true);

            const response =
                await axios.get(
                    `${SERVICES_API}${encodeURIComponent(
                        service.category_name
                    )}/`
                );

            setCategoryServices(
                response.data
            );

        } catch (error) {

            console.log(
                "Search result error:",
                error
            );

            setCategoryServices([]);

        } finally {

            setLoadingServices(false);
        }
    };

    // =========================================================
    // VIEW ALL VENDORS
    // =========================================================

    const handleViewAllVendors = async () => {

        try {

            setShowAllVendors(true);

            setLoadingVendors(true);

            const response =
                await axios.get(
                    ALL_VENDORS_API
                );

            setAllVendors(
                response.data
            );

        } catch (error) {

            console.log(
                "All vendors error:",
                error
            );

            setAllVendors([]);

        } finally {

            setLoadingVendors(false);
        }
    };

    // =========================================================
    // LOAD VENDOR REVIEWS
    // =========================================================

    const loadVendorReviews = async (vendorId) => {

        try {

            const response =
                await axios.get(
                    `${VENDOR_RATING_DETAILS_API}${vendorId}/`
                );

            console.log(
                "Vendor rating details:",
                response.data
            );

            setVendorReviews(
                response.data.reviews || []
            );

            setVendorRatingSummary({
                average_rating:
                    response.data.average_rating || 0,

                total_ratings:
                    response.data.total_ratings || 0
            });

        } catch (error) {

            console.log(
                "Vendor reviews error:",
                error
            );

            setVendorReviews([]);

            setVendorRatingSummary({
                average_rating: 0,
                total_ratings: 0
            });
        }
    };

    // =========================================================
    // LOAD CUSTOMER COMPLETED BOOKINGS
    // =========================================================

    const loadCustomerBookingsForReview =
        async (vendorId) => {

            try {

                const customerId =
                    localStorage.getItem(
                        "customer_id"
                    );

                if (!customerId) {

                    setEligibleReviewBookings([]);
                    setSelectedReviewBooking("");

                    return;
                }

                const response =
                    await axios.get(
                        `${CUSTOMER_BOOKINGS_API}${customerId}/`
                    );

                if (!Array.isArray(response.data)) {

                    setEligibleReviewBookings([]);
                    setSelectedReviewBooking("");

                    return;
                }

                const completedBookings =
                    response.data.filter(
                        (booking) =>
                            Number(
                                booking.vendor_id
                            ) === Number(vendorId) &&
                            booking.status ===
                                "completed" &&
                            booking.has_review !== true
                    );

                setEligibleReviewBookings(
                    completedBookings
                );

                if (
                    completedBookings.length > 0
                ) {

                    setSelectedReviewBooking(
                        String(
                            completedBookings[0]
                                .booking_id
                        )
                    );

                } else {

                    setSelectedReviewBooking("");
                }

            } catch (error) {

                console.log(
                    "Customer bookings review error:",
                    error
                );

                setEligibleReviewBookings([]);
                setSelectedReviewBooking("");
            }
        };

    // =========================================================
    // OPEN VENDOR DETAILS
    // =========================================================

    const handleVendorClick = async (vendorId) => {

        try {

            setSelectedVendor(null);

            setSelectedRating(0);
            setFeedback("");
            setRatingMessage("");

            setVendorReviews([]);

            setVendorRatingSummary({
                average_rating: 0,
                total_ratings: 0
            });

            setEligibleReviewBookings([]);
            setSelectedReviewBooking("");

            setShowAllReviews(false);

            setLoadingVendorDetails(true);

            const response =
                await axios.get(
                    `${BASE_API}/vendor/details/${vendorId}/`
                );

            setSelectedVendor(
                response.data
            );

            setShowAllVendors(false);

            await loadVendorReviews(
                vendorId
            );

            await loadCustomerBookingsForReview(
                vendorId
            );

        } catch (error) {

            console.log(
                "Vendor details error:",
                error
            );

        } finally {

            setLoadingVendorDetails(false);
        }
    };

    // =========================================================
    // SUBMIT REVIEW
    // =========================================================

    const handleSubmitRating = async () => {

        if (!selectedReviewBooking) {

            setRatingMessage(
                "Please select a completed booking to review."
            );

            return;
        }

        if (selectedRating === 0) {

            setRatingMessage(
                "Please select a star rating."
            );

            return;
        }

        const customerId =
            localStorage.getItem(
                "customer_id"
            );

        if (!customerId) {

            setRatingMessage(
                "Customer information not found."
            );

            return;
        }

        if (!selectedVendor?.vendor_id) {

            setRatingMessage(
                "Vendor information not found."
            );

            return;
        }

        try {

            setSubmittingRating(true);
            setRatingMessage("");

            const vendorId =
                selectedVendor.vendor_id;

            const ratingData = {

                customer:
                    Number(customerId),

                vendor:
                    Number(vendorId),

                booking:
                    Number(
                        selectedReviewBooking
                    ),

                rating:
                    Number(selectedRating),

                feedback:
                    feedback.trim()
            };

            console.log(
                "Sending review:",
                ratingData
            );

            const response =
                await axios.post(
                    RATING_API,
                    ratingData
                );

            console.log(
                "Review response:",
                response.data
            );

            setRatingMessage(
                response.data.message ||
                "Review submitted successfully."
            );

            setSelectedRating(0);
            setFeedback("");

            setEligibleReviewBookings(
                (previousBookings) =>
                    previousBookings.filter(
                        (booking) =>
                            String(
                                booking.booking_id
                            ) !==
                            String(
                                selectedReviewBooking
                            )
                    )
            );

            setSelectedReviewBooking("");

            await loadVendorReviews(
                vendorId
            );

            const updatedProfessionalsResponse =
                await axios.get(
                    TOP_RATED_API
                );

            setProfessionals(
                updatedProfessionalsResponse.data
            );

        } catch (error) {

            console.log(
                "Rating error:",
                error
            );

            console.log(
                "Backend response:",
                error.response?.data
            );

            setRatingMessage(
                error.response?.data?.message ||
                "Unable to submit review. Please try again."
            );

        } finally {

            setSubmittingRating(false);
        }
    };

    // =========================================================
    // LOGOUT
    // =========================================================

    const handleLogout = () => {

        setShowLogoutModal(true);
    };

    const handleConfirmLogout = () => {

        localStorage.removeItem(
            "customer_id"
        );

        localStorage.removeItem(
            "customer_status"
        );

        setCustomerLoggedIn(false);

        setShowLogoutModal(false);

        navigate("/");
    };

    const handleCancelLogout = () => {

        setShowLogoutModal(false);
    };

    // =========================================================
    // RATING DISPLAY
    // =========================================================

    const renderStars = (rating) => {

        const value =
            Number(rating) || 0;

        return (
            <div className="vendor-stars">

                {[1, 2, 3, 4, 5].map(
                    (star) => (

                        <i
                            key={star}
                            className={
                                star <=
                                Math.round(value)
                                    ? "fa-solid fa-star active"
                                    : "fa-regular fa-star"
                            }
                        ></i>

                    )
                )}

            </div>
        );
    };

    // =========================================================
    // RATING NUMBER
    // =========================================================

    const formatRating = (rating) => {

        return (
            Number(rating) || 0
        ).toFixed(1);
    };

    // =========================================================
    // CLOSE VENDOR DETAILS
    // =========================================================

    const closeVendorDetails = () => {

        setSelectedVendor(null);

        setSelectedRating(0);
        setFeedback("");
        setRatingMessage("");

        setVendorReviews([]);

        setVendorRatingSummary({
            average_rating: 0,
            total_ratings: 0
        });

        setEligibleReviewBookings([]);
        setSelectedReviewBooking("");

        setShowAllReviews(false);
    };

    // =========================================================
    // JSX
    // =========================================================

    return (

        <div className="customer-dashboard">

            {/* =================================================
                NAVBAR
            ================================================= */}

            <nav className="dashboard-navbar">

                <div className="container">

                    <div className="dashboard-navbar-inner">

                        <div
                            className="dashboard-logo-area"
                            onClick={handleLogout}
                            onKeyDown={(e) => {

                                if (
                                    e.key === "Enter" ||
                                    e.key === " "
                                ) {
                                    handleLogout();
                                }

                            }}
                            role="button"
                            tabIndex="0"
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
                                        color:
                                            "var(--primary)"
                                    }}
                                >
                                    க்காரன்
                                </span>

                            </span>

                        </div>

                        <div className="dashboard-nav-links">

                            <button
                                type="button"
                                onClick={() =>
                                    setShowAllCategories(
                                        true
                                    )
                                }
                            >
                                Categories / Services
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleViewAllVendors
                                }
                            >
                                Vendors
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/my-bookings"
                                    )
                                }
                            >
                                History
                            </button>

                        </div>

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
                                onClick={
                                    handleLogout
                                }
                            >
                                Logout
                            </button>

                        </div>

                    </div>

                </div>

            </nav>

            {/* =================================================
                HERO
            ================================================= */}

            <section className="hero-section">

                <div className="container">

                    <div className="row align-items-center">

                        <div className="col-lg-6">

                            <div className="hero-content">

                                <div className="hero-badge">

                                    <span></span>

                                    Trusted local services

                                </div>

                                <h1 className="hero-title">

                                    Find the right

                                    <br />

                                    <span>
                                        local professional
                                    </span>

                                    <br />

                                    for your needs.

                                </h1>

                                <p className="hero-description">

                                    Discover trusted
                                    professionals around
                                    you and book the service
                                    you need quickly and
                                    easily.

                                </p>

                                {/* SEARCH */}

                                <div className="search-wrapper">

                                    <div className="search-box">

                                        <i className="fa-solid fa-magnifying-glass search-icon"></i>

                                        <input
                                            type="text"
                                            value={
                                                searchText
                                            }
                                            onChange={(e) =>
                                                setSearchText(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="What service do you need?"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => {

                                                if (
                                                    searchText.trim()
                                                ) {

                                                    setShowSearchResults(
                                                        true
                                                    );

                                                }

                                            }}
                                        >
                                            Search
                                        </button>

                                    </div>

                                    {showSearchResults && (

                                        <div className="search-results">

                                            {searchResults.length ===
                                            0 ? (

                                                <div className="search-empty">

                                                    <i className="fa-solid fa-magnifying-glass"></i>

                                                    <div>

                                                        <strong>
                                                            No services
                                                            found
                                                        </strong>

                                                        <small>
                                                            Try another
                                                            service name
                                                            or category.
                                                        </small>

                                                    </div>

                                                </div>

                                            ) : (

                                                searchResults.map(
                                                    (service) => (

                                                        <button
                                                            type="button"
                                                            className="search-result-item"
                                                            key={
                                                                service.service_id
                                                            }
                                                            onClick={() =>
                                                                handleSearchResultClick(
                                                                    service
                                                                )
                                                            }
                                                        >

                                                            <div className="search-result-icon">

                                                                <i
                                                                    className={
                                                                        categoryIcons[
                                                                            service.category_name
                                                                        ] ||
                                                                        "fa-solid fa-toolbox"
                                                                    }
                                                                ></i>

                                                            </div>

                                                            <div className="search-result-content">

                                                                <strong>
                                                                    {
                                                                        service.service
                                                                    }
                                                                </strong>

                                                                <small>
                                                                    {
                                                                        service.category_name
                                                                    }
                                                                </small>

                                                            </div>

                                                            <i className="fa-solid fa-chevron-right search-arrow"></i>

                                                        </button>

                                                    )
                                                )

                                            )}

                                        </div>

                                    )}

                                </div>

                                <div className="trust-items">

                                    <div>

                                        <i className="fa-solid fa-shield-halved"></i>

                                        <span>
                                            Trusted Professionals
                                        </span>

                                    </div>

                                    <div>

                                        <i className="fa-solid fa-lock"></i>

                                        <span>
                                            Secure Booking
                                        </span>

                                    </div>

                                    <div>

                                        <i className="fa-solid fa-circle-check"></i>

                                        <span>
                                            Easy & Reliable
                                        </span>

                                    </div>

                                </div>

                            </div>

                        </div>

                        {/* SOFA */}

                        <div className="col-lg-6">

                            <div className="hero-image-area">

                                <img
                                    src="/hero-sofa.png"
                                    alt="Local services"
                                    className="hero-image"
                                />

                                <div className="hero-floating-card hero-card-one">

                                    <div className="floating-icon">

                                        <i className="fa-solid fa-user-check"></i>

                                    </div>

                                    <div>

                                        <strong>
                                            Trusted
                                        </strong>

                                        <span>
                                            Local Experts
                                        </span>

                                    </div>

                                </div>

                                <div className="hero-floating-card hero-card-two">

                                    <div className="floating-icon">

                                        <i className="fa-solid fa-star"></i>

                                    </div>

                                    <div>

                                        <strong>
                                            Top Rated
                                        </strong>

                                        <span>
                                            Professionals
                                        </span>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </section>

            {/* =================================================
                CATEGORIES
            ================================================= */}

            <section
                className="categories-section"
                id="categories"
            >

                <div className="container">

                    <div className="section-heading">

                        <div>

                            <span className="section-label">
                                EXPLORE SERVICES
                            </span>

                            <h2>
                                Categories / Services
                            </h2>

                            <p>
                                Choose a category and explore
                                available services.
                            </p>

                        </div>

                        <button
                            type="button"
                            className="view-all-btn"
                            onClick={() =>
                                setShowAllCategories(
                                    true
                                )
                            }
                        >

                            View All

                            <i className="fa-solid fa-arrow-right"></i>

                        </button>

                    </div>

                    {loadingCategories ? (

                        <div className="dashboard-loader">

                            <div className="spinner-border"></div>

                            <span>
                                Loading categories...
                            </span>

                        </div>

                    ) : popularCategories.length ===
                      0 ? (

                        <div className="empty-state">

                            <i className="fa-regular fa-folder-open"></i>

                            <h5>
                                No categories available
                            </h5>

                            <p>
                                Categories will appear here.
                            </p>

                        </div>

                    ) : (

                        <div className="row g-4">

                            {popularCategories.map(
                                (category) => (

                                    <div
                                        className="col-6 col-md-4 col-lg-2"
                                        key={
                                            category.id
                                        }
                                    >

                                        <button
                                            type="button"
                                            className="category-card"
                                            onClick={() =>
                                                handleCategoryClick(
                                                    category
                                                )
                                            }
                                        >

                                            <div className="category-icon">

                                                <i
                                                    className={
                                                        categoryIcons[
                                                            category.category
                                                        ] ||
                                                        "fa-solid fa-toolbox"
                                                    }
                                                ></i>

                                            </div>

                                            <h5>
                                                {
                                                    category.category
                                                }
                                            </h5>

                                            <span>
                                                Explore services
                                            </span>

                                        </button>

                                    </div>

                                )
                            )}

                        </div>

                    )}

                </div>

            </section>

            {/* =================================================
                TOP RATED VENDORS
            ================================================= */}

            <section
                className="professionals-section"
                id="vendors"
            >

                <div className="container">

                    <div className="section-heading">

                        <div>

                            <span className="section-label">
                                TRUSTED BY CUSTOMERS
                            </span>

                            <h2>
                                Top Rated Professionals
                            </h2>

                            <p>
                                Connect with approved local
                                professionals.
                            </p>

                        </div>

                        <button
                            type="button"
                            className="view-all-btn"
                            onClick={
                                handleViewAllVendors
                            }
                        >

                            View All

                            <i className="fa-solid fa-arrow-right"></i>

                        </button>

                    </div>

                    {loadingVendors ? (

                        <div className="dashboard-loader">

                            <div className="spinner-border"></div>

                            <span>
                                Loading professionals...
                            </span>

                        </div>

                    ) : professionals.length ===
                      0 ? (

                        <div className="empty-state">

                            <i className="fa-regular fa-user"></i>

                            <h5>
                                No professionals available
                            </h5>

                            <p>
                                Approved professionals will
                                appear here.
                            </p>

                        </div>

                    ) : (

                        <div className="row g-4">

                            {professionals
                                .slice(0, 8)
                                .map(
                                    (professional) => (

                                        <div
                                            className="col-12 col-sm-6 col-lg-3"
                                            key={
                                                professional.vendor_id
                                            }
                                        >

                                            <button
                                                type="button"
                                                className="professional-card"
                                                onClick={() =>
                                                    handleVendorClick(
                                                        professional.vendor_id
                                                    )
                                                }
                                            >

                                                <div className="professional-image">

                                                    <img
                                                        src={
                                                            professional.profile ||
                                                            "/images/default-profile.png"
                                                        }
                                                        alt={
                                                            professional.name
                                                        }
                                                    />

                                                    <span className="verified-badge">

                                                        <i className="fa-solid fa-check"></i>

                                                    </span>

                                                </div>

                                                <div className="professional-info">

                                                    <h5>
                                                        {
                                                            professional.name
                                                        }
                                                    </h5>

                                                    <p>
                                                        {
                                                            professional.about ||
                                                            "Local service professional"
                                                        }
                                                    </p>

                                                    <div className="professional-rating">

                                                        {renderStars(
                                                            professional.average_rating
                                                        )}

                                                        <strong>
                                                            {formatRating(
                                                                professional.average_rating
                                                            )}
                                                        </strong>

                                                        <span>
                                                            (
                                                            {
                                                                professional.total_ratings
                                                            }
                                                            )
                                                        </span>

                                                    </div>

                                                    <div className="vendor-view-link">

                                                        <span>
                                                            View Profile
                                                        </span>

                                                        <i className="fa-solid fa-arrow-right"></i>

                                                    </div>

                                                </div>

                                            </button>

                                        </div>

                                    )
                                )}

                        </div>

                    )}

                </div>

            </section>

            {/* =================================================
                CATEGORY SERVICES MODAL
            ================================================= */}

            {selectedCategory && (

                <div
                    className="dashboard-modal-overlay"
                    onClick={
                        closeServices
                    }
                >

                    <div
                        className="dashboard-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="modal-header">

                            <div>

                                <span>
                                    {
                                        selectedCategory.category?.toUpperCase()
                                    }
                                </span>

                                <h3>
                                    Available Services
                                </h3>

                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeServices
                                }
                            >

                                <i className="fa-solid fa-xmark"></i>

                            </button>

                        </div>

                        <div className="modal-body">

                            {loadingServices ? (

                                <div className="dashboard-loader">

                                    <div className="spinner-border"></div>

                                    <span>
                                        Loading services...
                                    </span>

                                </div>

                            ) : categoryServices.length ===
                              0 ? (

                                <div className="empty-state">

                                    <i className="fa-regular fa-folder-open"></i>

                                    <h5>
                                        No services available
                                    </h5>

                                    <p>
                                        There are no services in
                                        this category yet.
                                    </p>

                                </div>

                            ) : (

                                <div className="row g-3">

                                    {categoryServices.map(
                                        (service) => (

                                            <div
                                                className="col-12 col-md-6 col-lg-4"
                                                key={
                                                    service.id
                                                }
                                            >

                                                <button
                                                    type="button"
                                                    className="service-card"
                                                    onClick={() =>
                                                        handleServiceClick(
                                                            service
                                                        )
                                                    }
                                                >

                                                    <div className="service-card-icon">

                                                        <i
                                                            className={
                                                                categoryIcons[
                                                                    service.category_name
                                                                ] ||
                                                                "fa-solid fa-toolbox"
                                                            }
                                                        ></i>

                                                    </div>

                                                    <div className="service-card-content">

                                                        <h5>
                                                            {
                                                                service.service
                                                            }
                                                        </h5>

                                                        <p>
                                                            {
                                                                service.description ||
                                                                "Professional local service"
                                                            }
                                                        </p>

                                                        <span>

                                                            Book service

                                                            <i className="fa-solid fa-arrow-right"></i>

                                                        </span>

                                                    </div>

                                                </button>

                                            </div>

                                        )
                                    )}

                                </div>

                            )}

                        </div>

                    </div>

                </div>

            )}

            {/* =================================================
                ALL CATEGORIES MODAL
            ================================================= */}

            {showAllCategories && (

                <div
                    className="dashboard-modal-overlay"
                    onClick={() =>
                        setShowAllCategories(
                            false
                        )
                    }
                >

                    <div
                        className="dashboard-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="modal-header">

                            <div>

                                <span>
                                    EXPLORE
                                </span>

                                <h3>
                                    Categories / Services
                                </h3>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowAllCategories(
                                        false
                                    )
                                }
                            >

                                <i className="fa-solid fa-xmark"></i>

                            </button>

                        </div>

                        <div className="modal-body">

                            {categories.length ===
                            0 ? (

                                <div className="empty-state">

                                    <i className="fa-regular fa-folder-open"></i>

                                    <h5>
                                        No categories available
                                    </h5>

                                    <p>
                                        Categories will appear here.
                                    </p>

                                </div>

                            ) : (

                                <div className="row g-3">

                                    {categories.map(
                                        (category) => (

                                            <div
                                                className="col-12 col-sm-6 col-lg-4"
                                                key={
                                                    category.id
                                                }
                                            >

                                                <button
                                                    type="button"
                                                    className="modal-category-card"
                                                    onClick={() =>
                                                        handleCategoryClick(
                                                            category
                                                        )
                                                    }
                                                >

                                                    <div>

                                                        <i
                                                            className={
                                                                categoryIcons[
                                                                    category.category
                                                                ] ||
                                                                "fa-solid fa-toolbox"
                                                            }
                                                        ></i>

                                                    </div>

                                                    <span>
                                                        {
                                                            category.category
                                                        }
                                                    </span>

                                                    <i className="fa-solid fa-chevron-right"></i>

                                                </button>

                                            </div>

                                        )
                                    )}

                                </div>

                            )}

                        </div>

                    </div>

                </div>

            )}

            {/* =================================================
                ALL VENDORS MODAL
            ================================================= */}

            {showAllVendors && (

                <div
                    className="dashboard-modal-overlay"
                    onClick={() =>
                        setShowAllVendors(
                            false
                        )
                    }
                >

                    <div
                        className="dashboard-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="modal-header">

                            <div>

                                <span>
                                    DISCOVER
                                </span>

                                <h3>
                                    All Approved Vendors
                                </h3>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowAllVendors(
                                        false
                                    )
                                }
                            >

                                <i className="fa-solid fa-xmark"></i>

                            </button>

                        </div>

                        <div className="modal-body">

                            {loadingVendors ? (

                                <div className="dashboard-loader">

                                    <div className="spinner-border"></div>

                                    <span>
                                        Loading vendors...
                                    </span>

                                </div>

                            ) : allVendors.length ===
                              0 ? (

                                <div className="empty-state">

                                    <i className="fa-regular fa-user"></i>

                                    <h5>
                                        No approved vendors
                                    </h5>

                                    <p>
                                        Approved vendors will
                                        appear here.
                                    </p>

                                </div>

                            ) : (

                                <div className="row g-3">

                                    {allVendors.map(
                                        (vendor) => (

                                            <div
                                                className="col-12 col-md-6"
                                                key={
                                                    vendor.vendor_id
                                                }
                                            >

                                                <button
                                                    type="button"
                                                    className="modal-vendor-card"
                                                    onClick={() =>
                                                        handleVendorClick(
                                                            vendor.vendor_id
                                                        )
                                                    }
                                                >

                                                    <img
                                                        src={
                                                            vendor.profile ||
                                                            "/images/default-profile.png"
                                                        }
                                                        alt={
                                                            vendor.name
                                                        }
                                                    />

                                                    <div className="modal-vendor-info">

                                                        <h5>
                                                            {
                                                                vendor.name
                                                            }
                                                        </h5>

                                                        <div className="professional-rating">

                                                            {renderStars(
                                                                vendor.average_rating
                                                            )}

                                                            <strong>
                                                                {formatRating(
                                                                    vendor.average_rating
                                                                )}
                                                            </strong>

                                                            <span>
                                                                (
                                                                {
                                                                    vendor.total_ratings
                                                                }
                                                                )
                                                            </span>

                                                        </div>

                                                        <p>
                                                            {
                                                                vendor.about ||
                                                                "Local service professional"
                                                            }
                                                        </p>

                                                        {!vendor.is_available && (

                                                            <span className="unavailable-label">
                                                                Currently Unavailable
                                                            </span>

                                                        )}

                                                    </div>

                                                    <i className="fa-solid fa-chevron-right"></i>

                                                </button>

                                            </div>

                                        )
                                    )}

                                </div>

                            )}

                        </div>

                    </div>

                </div>

            )}

            {/* =================================================
                VENDOR DETAILS MODAL
            ================================================= */}

            {selectedVendor && (

                <div
                    className="dashboard-modal-overlay"
                    onClick={
                        closeVendorDetails
                    }
                >

                    <div
                        className="dashboard-modal vendor-details-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        {/* CLOSE */}

                        <button
                            type="button"
                            className="vendor-details-close"
                            onClick={
                                closeVendorDetails
                            }
                        >

                            <i className="fa-solid fa-xmark"></i>

                        </button>

                        {/* VENDOR HEADER */}

                        <div className="vendor-details-top">

                            <img
                                src={
                                    selectedVendor.profile ||
                                    "/images/default-profile.png"
                                }
                                alt={
                                    selectedVendor.name
                                }
                            />

                            <div>

                                <span className="vendor-approved">

                                    <i className="fa-solid fa-circle-check"></i>

                                    Approved Professional

                                </span>

                                <h2>
                                    {
                                        selectedVendor.name
                                    }
                                </h2>

                                <div className="professional-rating">

                                    {renderStars(
                                        vendorRatingSummary.average_rating
                                    )}

                                    <strong>
                                        {formatRating(
                                            vendorRatingSummary.average_rating
                                        )}
                                    </strong>

                                    <span>
                                        (
                                        {
                                            vendorRatingSummary.total_ratings
                                        }
                                        reviews)
                                    </span>

                                </div>

                                <span
                                    className={
                                        selectedVendor.is_available
                                            ? "availability available"
                                            : "availability unavailable"
                                    }
                                >

                                    <span></span>

                                    {selectedVendor.is_available
                                        ? "Currently Available"
                                        : "Currently Unavailable"}

                                </span>

                            </div>

                        </div>

                        {/* ABOUT */}

                        <div className="vendor-about">

                            <span className="details-label">
                                ABOUT
                            </span>

                            <h4>
                                About this professional
                            </h4>

                            <p>

                                {selectedVendor.about ||
                                    "This professional has not added an about section yet."}

                            </p>

                        </div>

                        {/* SERVICES */}

                        <div className="vendor-services-list">

                            <span className="details-label">
                                SERVICES
                            </span>

                            <h4>
                                Services offered
                            </h4>

                            {!selectedVendor.services ||
                            selectedVendor.services.length ===
                                0 ? (

                                <div className="empty-state">

                                    <i className="fa-regular fa-folder-open"></i>

                                    <h5>
                                        No services added
                                    </h5>

                                    <p>
                                        This professional has
                                        not added services yet.
                                    </p>

                                </div>

                            ) : (

                                <div className="row g-3">

                                    {selectedVendor.services.map(
                                        (service) => (

                                            <div
                                                className="col-12 col-md-6"
                                                key={
                                                    service.service_id
                                                }
                                            >

                                                <div className="vendor-service-item">

                                                    <div className="vendor-service-icon">

                                                        <i
                                                            className={
                                                                categoryIcons[
                                                                    service.category
                                                                ] ||
                                                                "fa-solid fa-toolbox"
                                                            }
                                                        ></i>

                                                    </div>

                                                    <div>

                                                        <strong>
                                                            {
                                                                service.service
                                                            }
                                                        </strong>

                                                        <small>
                                                            {
                                                                service.description ||
                                                                "Professional local service"
                                                            }
                                                        </small>

                                                        <span>
                                                            Visiting charge:
                                                            ₹
                                                            {
                                                                service.visiting_charge
                                                            }
                                                        </span>

                                                    </div>

                                                </div>

                                            </div>

                                        )
                                    )}

                                </div>

                            )}

                        </div>

                        {/* =================================================
                            CUSTOMER REVIEWS
                        ================================================= */}

                        <div className="vendor-reviews-section m-3 p-3 ">

                            <span className="details-label">
                                CUSTOMER REVIEWS
                            </span>

                            <div className="vendor-reviews-heading">

                                <div>

                                    <h4>
                                        Reviews & Feedback
                                    </h4>

                                    <p>
                                        See what customers say
                                        about this professional.
                                    </p>

                                </div>

                                <div className="vendor-review-summary">

                                    <strong>
                                        {formatRating(
                                            vendorRatingSummary.average_rating
                                        )}
                                    </strong>

                                    {renderStars(
                                        vendorRatingSummary.average_rating
                                    )}

                                    <span>
                                        {
                                            vendorRatingSummary.total_ratings
                                        }{" "}
                                        {
                                            vendorRatingSummary.total_ratings ===
                                            1
                                                ? "review"
                                                : "reviews"
                                        }
                                    </span>

                                </div>

                            </div>

                            {vendorReviews.length ===
                            0 ? (

                                <div className="vendor-no-reviews">

                                    <i className="fa-regular fa-comment"></i>

                                    <h5>
                                        No reviews yet
                                    </h5>

                                    <p>
                                        Be the first customer
                                        to share your experience.
                                    </p>

                                </div>

                            ) : (

                                <div className="vendor-review-list">

                                    {vendorReviews
                                        .slice(
                                            0,
                                            showAllReviews
                                                ? vendorReviews.length
                                                : 1
                                        )
                                        .map(
                                            (
                                                review,
                                                index
                                            ) => (

                                                <div
                                                    className="vendor-review-card"
                                                    key={
                                                        `${review.booking_id}-${index}`
                                                    }
                                                >

                                                    <div className="vendor-review-top d-flex gap-4 vendor-review-summary">

                                                        <div className="vendor-review-customer">

                                                            <div className="">

                                                                
                                                                 <div className="d-flex gap-2" >
                                                                    <i className="fa-regular fa-user"></i>
                                                                <strong>
                                                                    {
                                                                        review.customer_name 
                                                                    }
                                                                </strong>

                                                            </div>

                                                            </div>

                                                           

                                                        </div>

                                                        <div className="vendor-review-rating">

                                                            {renderStars(
                                                                review.rating
                                                            )}

                                                            <span>
                                                                {
                                                                    review.rating
                                                                }.0
                                                            </span>

                                                        </div>

                                                    </div>

                                                    {review.feedback && (

                                                        <p className="vendor-review-feedback">

                                                            "{review.feedback}"

                                                        </p>

                                                    )}

                                                    <small className="vendor-review-date">

                                                        {review.created_at
                                                            ? new Date(
                                                                review.created_at
                                                            ).toLocaleDateString()
                                                            : ""}

                                                    </small>

                                                </div>

                                            )
                                        )}

                                    {vendorReviews.length >
                                        1 && (

                                        <button
                                            type="button"
                                            className="vendor-read-reviews-btn"
                                            onClick={() =>
                                                setShowAllReviews(
                                                    !showAllReviews
                                                )
                                            }
                                        >

                                            {showAllReviews
                                                ? "Show Less"
                                                : `Read All ${vendorReviews.length} Reviews`}

                                            <i
                                                className={
                                                    showAllReviews
                                                        ? "fa-solid fa-chevron-up"
                                                        : "fa-solid fa-arrow-right"
                                                }
                                            ></i>

                                        </button>

                                    )}

                                </div>

                            )}

                        </div>

                        {/* =================================================
                            YOUR REVIEW
                        ================================================= */}

                        <div className="vendor-rating-section">

                            <span className="details-label">
                                YOUR REVIEW
                            </span>

                            <h4>
                                Rate this professional
                            </h4>

                            <p className="rating-description">

                                Share your experience with
                                this professional after
                                completing a booking.

                            </p>

                            {eligibleReviewBookings.length ===
                            0 ? (

                                <div className="review-not-available">

                                    <i className="fa-solid fa-circle-info"></i>

                                    <div>

                                        <strong>
                                            Review not available
                                        </strong>

                                        <p>
                                            You can review this
                                            professional after
                                            completing a booking
                                            with them.
                                        </p>

                                    </div>

                                </div>

                            ) : (

                                <>

                                    {/* BOOKING SELECTOR */}

                                    <div className="review-booking-selector">

                                        <label htmlFor="reviewBooking" className="mb-2">

                                            Select completed
                                            booking

                                        </label>

                                        <select
                                        className="booking-select"
                                            id="reviewBooking"
                                            value={
                                                selectedReviewBooking
                                            }
                                            onChange={(e) => {

                                                setSelectedReviewBooking(
                                                    e.target.value
                                                );

                                                setSelectedRating(
                                                    0
                                                );

                                                setFeedback(
                                                    ""
                                                );

                                                setRatingMessage(
                                                    ""
                                                );

                                            }}
                                        >

                                            <option value="">

                                                Select a booking

                                            </option>

                                            {eligibleReviewBookings.map(
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

                                                        {" - "}

                                                        {
                                                            booking.date
                                                        }

                                                    </option>

                                                )
                                            )}

                                        </select>

                                    </div>

                                    {/* STARS */}

                                    <div className="rating-stars-input">

                                        {[1, 2, 3, 4, 5].map(
                                            (star) => (

                                                <button
                                                    key={star}
                                                    type="button"
                                                    className={
                                                        star <=
                                                        selectedRating
                                                            ? "rating-star-btn selected"
                                                            : "rating-star-btn"
                                                    }
                                                    onClick={() => {

                                                        setSelectedRating(
                                                            star
                                                        );

                                                        setRatingMessage(
                                                            ""
                                                        );

                                                    }}
                                                    aria-label={
                                                        `Rate ${star} out of 5`
                                                    }
                                                >

                                                    <i className="fa-solid fa-star"></i>

                                                </button>

                                            )
                                        )}

                                    </div>

                                    {/* FEEDBACK */}

                                    <textarea
                                        className="rating-feedback-input"
                                        value={
                                            feedback
                                        }
                                        onChange={(e) =>
                                            setFeedback(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Write your feedback (optional)"
                                        rows="4"
                                    />

                                    {/* MESSAGE */}

                                    {ratingMessage && (

                                        <div className="rating-message">

                                            {ratingMessage}

                                        </div>

                                    )}

                                    {/* SUBMIT */}

                                    <button
                                        type="button"
                                        className="submit-rating-btn"
                                        onClick={
                                            handleSubmitRating
                                        }
                                        disabled={
                                            submittingRating ||
                                            !selectedReviewBooking
                                        }
                                    >

                                        {submittingRating ? (

                                            <>

                                                <span className="spinner-border spinner-border-sm"></span>

                                                Submitting...

                                            </>

                                        ) : (

                                            <>

                                                Submit Review

                                                <i className="fa-solid fa-arrow-right"></i>

                                            </>

                                        )}

                                    </button>

                                </>

                            )}

                        </div>

                        {/* BOOK */}

                        <div className="vendor-details-actions">

                            <button
                                type="button"
                                disabled={
                                    !selectedVendor.is_available ||
                                    !selectedVendor.services?.length
                                }
                                onClick={() => {

                                    if (
                                        selectedVendor.is_available &&
                                        selectedVendor.services?.length >
                                            0
                                    ) {

                                        const serviceId =
                                            selectedVendor
                                                .services[0]
                                                .service_id;

                                        setSelectedVendor(
                                            null
                                        );

                                        navigate(
                                            `/booking/${serviceId}`
                                        );
                                    }

                                }}
                            >

                                {selectedVendor.is_available
                                    ? "Book a Service"
                                    : "Currently Unavailable"}

                                {selectedVendor.is_available && (

                                    <i className="fa-solid fa-arrow-right"></i>

                                )}

                            </button>

                        </div>

                    </div>

                </div>

            )}

            {/* =================================================
                VENDOR DETAILS LOADING
            ================================================= */}

            {loadingVendorDetails &&
                !selectedVendor && (

                    <div className="dashboard-modal-overlay">

                        <div className="dashboard-loader">

                            <div className="spinner-border"></div>

                            <span>
                                Loading vendor details...
                            </span>

                        </div>

                    </div>

                )}

            {/* =================================================
                LOGOUT CONFIRMATION MODAL
            ================================================= */}

            {showLogoutModal && (

                <div
                    className="dashboard-modal-overlay"
                    onClick={
                        handleCancelLogout
                    }
                >

                    <div
                        className="dashboard-modal logout-confirm-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="modal-header">

                            <div>

                                <span>
                                    CONFIRM LOGOUT
                                </span>

                                <h3>
                                    Leave Oorkaran?
                                </h3>

                            </div>

                            <button
                                type="button"
                                onClick={
                                    handleCancelLogout
                                }
                                aria-label="Close"
                            >

                                <i className="fa-solid fa-xmark"></i>

                            </button>

                        </div>

                        <div className="modal-body">

                            <div className="text-center py-3">

                                <i
                                    className="fa-solid fa-right-from-bracket mb-3"
                                    style={{
                                        fontSize: "40px",
                                        color:
                                            "var(--primary)"
                                    }}
                                ></i>

                                <h5>
                                    Are you sure you want
                                    to logout?
                                </h5>

                                <p className="mb-0">

                                    Your customer session
                                    will be cleared and
                                    you will be redirected
                                    to the home page.

                                </p>

                            </div>

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

            )}

        </div>
    );
}

export default CustomerDashboard;