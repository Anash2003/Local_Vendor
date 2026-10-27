import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../App.css";
import "../css/Home.css";

const API_BASE_URL = "./api";

// Font Awesome icons for categories
const categoryIcons = {
    "home services": "fa-solid fa-screwdriver-wrench",
    "vehicle services": "fa-solid fa-car",
    "tech services": "fa-solid fa-computer",
    "personal care": "fa-solid fa-spa",
    "moving & delivery": "fa-solid fa-truck",
    "pet maintenance": "fa-solid fa-paw",
};

function Home() {
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [services, setServices] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedService, setSelectedService] = useState(null);

    const [loading, setLoading] = useState(true);
    const [servicesLoading, setServicesLoading] = useState(false);
    const [error, setError] = useState("");
    const [servicesError, setServicesError] = useState("");

    useEffect(() => {
        fetchCategories();
    }, []);

    // Fetch categories from Django
    const fetchCategories = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_BASE_URL}/categories/`
            );

            if (Array.isArray(response.data)) {
                setCategories(response.data);
            } else {
                setCategories([]);
                setError(
                    "The categories response has an unexpected format."
                );
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            setError("Unable to load categories. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Get category name from the API response
    const getCategoryName = (category) => {
        if (!category) {
            return "";
        }

        return (
            category.category ||
            category.category_name ||
            category.name ||
            ""
        );
    };

    // Normalize category names to match icons consistently
    const normalizeName = (name) => {
        return String(name || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ");
    };

    // Get the Font Awesome icon for a category
    const getCategoryIcon = (category) => {
        const categoryName = normalizeName(
            getCategoryName(category)
        );

        return (
            categoryIcons[categoryName] ||
            "fa-solid fa-toolbox"
        );
    };

    // Get category name from a service response
    const getServiceCategoryName = (service) => {
        if (!service) {
            return "";
        }

        if (typeof service.category_name === "string") {
            return service.category_name;
        }

        if (typeof service.category === "string") {
            return service.category;
        }

        if (
            service.category &&
            typeof service.category === "object"
        ) {
            return getCategoryName(service.category);
        }

        return getCategoryName(selectedCategory);
    };

    // Get the Font Awesome icon for a service card
    const getServiceIcon = (service) => {
        const categoryName = normalizeName(
            getServiceCategoryName(service)
        );

        return (
            categoryIcons[categoryName] ||
            "fa-solid fa-screwdriver-wrench"
        );
    };

    // Get service name from the API response
    const getServiceName = (service) => {
        if (!service) {
            return "";
        }

        return (
            service.service ||
            service.service_name ||
            service.name ||
            ""
        );
    };

    // Fetch services when a category is selected
    const handleCategoryClick = async (category) => {
        setSelectedCategory(category);
        setSelectedService(null);
        setServices([]);
        setServicesError("");

        const categoryName = getCategoryName(category);

        if (!categoryName) {
            setServicesError("The category name is missing.");
            return;
        }

        try {
            setServicesLoading(true);

            const response = await axios.get(
                `${API_BASE_URL}/services/${encodeURIComponent(
                    categoryName
                )}/`
            );

            if (Array.isArray(response.data)) {
                setServices(response.data);
            } else {
                setServices([]);
                setServicesError(
                    "The services response has an unexpected format."
                );
            }
        } catch (error) {
            console.error("Error fetching services:", error);
            setServicesError(
                "Unable to load services. Please try again."
            );
        } finally {
            setServicesLoading(false);
        }
    };

    // Select a service
    const handleServiceClick = (service) => {
        setSelectedService(service);
    };

    // Close the services section
    const closeServices = () => {
        setSelectedCategory(null);
        setSelectedService(null);
        setServices([]);
        setServicesError("");
    };

    return (
        <div className="home-page">
            {/* Navbar */}
            <nav className="navbar navbar-expand-lg home-navbar">
                <div className="container">
                    <div
                        className="dashboard-logo-area"
                        onClick={() => navigate("/")}
                    >
                        <div className="brand-logo w-100">
                            <img
                                className="img-thumbnail border-0 w-100"
                                src="/logo.png"
                                alt="Oorkaran logo"
                            />
                        </div>

                        <span className="fw-bold fs-4">
                            ஊர்
                            <span
                                style={{
                                    color: "var(--primary)",
                                }}
                            >
                                க்காரன்
                            </span>
                        </span>
                    </div>

                    <div className="d-flex gap-2">
                        <button
                            className="btn login-btn"
                            onClick={() =>
                                navigate("/customer-login")
                            }
                        >
                            Sign In
                        </button>

                        <button
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

            {/* Hero Section */}
            <section className="hero-section">
                <div className="container text-center">
                    <p className="hero-small-text">
                        LOCAL SERVICES • TRUSTED PROFESSIONALS
                    </p>

                    <h1 className="hero-title">
                        Find Your Perfect{" "}
                        <span>Home Service</span>
                        
                    </h1>
                    <p className="hero-small-text1">
                        Connecting you with trusted professionals
                        for all your home needs.
                    </p>

                    

                    {/* Search */}
                    <div className="search-box mx-auto">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search for a service..."
                        />

                        <button
                            type="button"
                            className="search-button d-flex justify-content-center align-items-center"
                            aria-label="Search services"
                        >
                            <i
                                className="fa-solid fa-magnifying-glass"
                                aria-hidden="true"
                            ></i>
                        </button>
                    </div>

                    {/* Categories */}
                    <div className="category-section">
                        <div className="section-heading">
                            What service do you need?
                        </div>

                        {loading && (
                            <div className="loading-text">
                                Loading categories...
                            </div>
                        )}

                        {error && (
                            <div className="alert alert-danger">
                                {error}

                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger ms-2"
                                    onClick={fetchCategories}
                                >
                                    Retry
                                </button>
                            </div>
                        )}

                        {!loading &&
                            !error &&
                            categories.length === 0 && (
                                <p className="loading-text">
                                    No categories available.
                                </p>
                            )}

                        <div className="row g-3 justify-content-center">
                            {categories.map((category, index) => {
                                const categoryName =
                                    getCategoryName(category);

                                const isSelected =
                                    selectedCategory &&
                                    normalizeName(
                                        getCategoryName(
                                            selectedCategory
                                        )
                                    ) ===
                                        normalizeName(categoryName);

                                return (
                                    <div
                                        className="col-6 col-md-4"
                                        key={
                                            category.id ??
                                            categoryName ??
                                            index
                                        }
                                    >
                                        <div
                                            className={`category-card ${
                                                isSelected
                                                    ? "active-category"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                handleCategoryClick(
                                                    category
                                                )
                                            }
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(event) => {
                                                if (
                                                    event.key ===
                                                        "Enter" ||
                                                    event.key === " "
                                                ) {
                                                    event.preventDefault();
                                                    handleCategoryClick(
                                                        category
                                                    );
                                                }
                                            }}
                                        >
                                            <div className="category-icon">
                                                <h2>
                                                    <i
                                                        className={getCategoryIcon(
                                                            category
                                                        )}
                                                        aria-hidden="true"
                                                    ></i>
                                                </h2>
                                            </div>

                                            <h6>{categoryName}</h6>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Services */}
                        {selectedCategory && (
                            <div className="services-container">
                                <div className="services-header">
                                    <div>
                                        <p className="services-label">
                                            SERVICES AVAILABLE
                                        </p>

                                        <h3>
                                            {getCategoryName(
                                                selectedCategory
                                            )}
                                        </h3>
                                    </div>

                                    <button
                                        type="button"
                                        className="close-services"
                                        onClick={closeServices}
                                        aria-label="Close services"
                                    >
                                        ×
                                    </button>
                                </div>

                                {servicesLoading && (
                                    <p className="loading-text">
                                        Loading services...
                                    </p>
                                )}

                                {servicesError && (
                                    <div className="alert alert-danger">
                                        {servicesError}

                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger ms-2"
                                            onClick={() =>
                                                handleCategoryClick(
                                                    selectedCategory
                                                )
                                            }
                                        >
                                            Retry
                                        </button>
                                    </div>
                                )}

                                {!servicesLoading &&
                                    !servicesError && (
                                        <div className="row g-3">
                                            {services.length === 0 ? (
                                                <div className="col-12">
                                                    <p className="no-services">
                                                        No services
                                                        available in
                                                        this category.
                                                    </p>
                                                </div>
                                            ) : (
                                                services.map(
                                                    (service, index) => (
                                                        <div
                                                            className="col-12 col-sm-6 col-md-4"
                                                            key={
                                                                service.id ??
                                                                getServiceName(
                                                                    service
                                                                ) ??
                                                                index
                                                            }
                                                        >
                                                            <div
                                                                className="service-card"
                                                                onClick={() =>
                                                                    handleServiceClick(
                                                                        service
                                                                    )
                                                                }
                                                                role="button"
                                                                tabIndex={0}
                                                                onKeyDown={(
                                                                    event
                                                                ) => {
                                                                    if (
                                                                        event.key ===
                                                                            "Enter" ||
                                                                        event.key ===
                                                                            " "
                                                                    ) {
                                                                        event.preventDefault();
                                                                        handleServiceClick(
                                                                            service
                                                                        );
                                                                    }
                                                                }}
                                                            >
                                                                <div className="service-card-icon">
                                                                    <h2>
                                                                        <i
                                                                            className={getServiceIcon(
                                                                                service
                                                                            )}
                                                                            aria-hidden="true"
                                                                        ></i>
                                                                    </h2>
                                                                </div>

                                                                <div>
                                                                    <h6>
                                                                        {getServiceName(
                                                                            service
                                                                        )}
                                                                    </h6>

                                                                    <p>
                                                                        View
                                                                        available
                                                                        vendors
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                )
                                            )}
                                        </div>
                                    )}
                            </div>
                        )}

                        {/* Login Message */}
                        {selectedService && (
                            <div className="login-message">
                                <div className="login-message-icon">
                                    <i
                                        className="fa-solid fa-lock"
                                        aria-hidden="true"
                                    ></i>
                                </div>

                                <div className="login-message-content">
                                    <h5>
                                        Please login to book a service
                                    </h5>

                                    <p>
                                        Login to find available vendors
                                        and book{" "}
                                        <strong>
                                            {getServiceName(
                                                selectedService
                                            )}
                                        </strong>
                                        .
                                    </p>

                                    <button
                                        className="btn continue-login-btn"
                                        onClick={() =>
                                            navigate(
                                                "/customer-login"
                                            )
                                        }
                                    >
                                        Login to Continue
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Vendor Section */}
            <section className="vendor-section">
                <div className="container">
                    <div className="vendor-card">
                        <div>
                            <p className="vendor-label">
                                FOR SERVICE PROVIDERS
                            </p>

                            <h2>
                                Are you looking to make money by
                                providing a service?
                            </h2>

                            <p>
                                Join our local vendor community and
                                connect with customers who need your
                                services.
                            </p>
                        </div>

                        <button
                            className="btn vendor-btn"
                            onClick={() =>
                                navigate("/vendor-reg")
                            }
                        >
                            Become a Vendor →
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Home;
