import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "../../App.css";

const API_BASE_URL = "./api";

function Booking() {
    const location = useLocation();
    const navigate = useNavigate();
    const { serviceId } = useParams();

    const customerId = localStorage.getItem("customer_id");

    // ================= STATES =================

    const [services, setServices] = useState([]);
    const [vendors, setVendors] = useState([]);

    const [selectedService, setSelectedService] = useState(null);
    const [selectedVendor, setSelectedVendor] = useState(null);

    const [vendorAvailability, setVendorAvailability] = useState(null);
    const [vendorServices, setVendorServices] = useState([]);

    const [selectedDate, setSelectedDate] = useState("");
    const [customerDescription, setCustomerDescription] = useState("");

    const [showAllVendors, setShowAllVendors] = useState(false);
    const [expandedVendorId, setExpandedVendorId] = useState(null);

    const [loadingServices, setLoadingServices] = useState(true);
    const [loadingVendors, setLoadingVendors] = useState(false);
    const [loadingVendorData, setLoadingVendorData] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);

    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // ================= SUCCESS POPUP =================

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [redirectCountdown, setRedirectCountdown] = useState(8);

    // ================= CALENDAR MONTH =================

    const [calendarMonth, setCalendarMonth] = useState(() => {
        const today = new Date();

        return new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );
    });

    const serviceFromState = location.state?.service;
    const vendorFromState = location.state?.vendor;

    // =========================================================
    // SUCCESS POPUP COUNTDOWN
    // =========================================================

    useEffect(() => {
        if (!showSuccessModal) {
            return;
        }

        setRedirectCountdown(8);

        const countdownTimer = setInterval(() => {
            setRedirectCountdown((previousCount) => {
                if (previousCount <= 1) {
                    clearInterval(countdownTimer);

                    navigate("/customer-dashboard");

                    return 0;
                }

                return previousCount - 1;
            });
        }, 1000);

        return () => {
            clearInterval(countdownTimer);
        };
    }, [showSuccessModal, navigate]);

    // =========================================================
    // LOAD SERVICES
    // =========================================================

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        try {
            setLoadingServices(true);
            setErrorMessage("");

            const categoryResponse = await axios.get(
                `${API_BASE_URL}/categories/`
            );

            const categories = categoryResponse.data;

            let allServices = [];

            for (const category of categories) {
                try {
                    const serviceResponse = await axios.get(
                        `${API_BASE_URL}/services/${category.category}/`
                    );

                    const categoryServices = serviceResponse.data.map(
                        (service) => ({
                            ...service,
                            category: category.category,
                        })
                    );

                    allServices = [
                        ...allServices,
                        ...categoryServices,
                    ];
                } catch (error) {
                    // Ignore categories that have no services
                }
            }

            setServices(allServices);

            let serviceToSelect = null;

            if (serviceFromState) {
                serviceToSelect = allServices.find(
                    (service) =>
                        service.id === serviceFromState.id
                );
            }

            if (!serviceToSelect && serviceId) {
                serviceToSelect = allServices.find(
                    (service) =>
                        service.id === Number(serviceId)
                );
            }

            if (serviceToSelect) {
                setSelectedService(serviceToSelect);
            }
        } catch (error) {
            setErrorMessage("Unable to load services.");
        } finally {
            setLoadingServices(false);
        }
    };

    // =========================================================
    // LOAD VENDORS
    // =========================================================

    useEffect(() => {
        if (selectedService) {
            loadVendors(selectedService.service);
        } else {
            setVendors([]);
            setSelectedVendor(null);
            setVendorAvailability(null);
            setVendorServices([]);
        }
    }, [selectedService]);

    const loadVendors = async (serviceName) => {
        try {
            setLoadingVendors(true);
            setErrorMessage("");

            const response = await axios.get(
                `${API_BASE_URL}/search-vendors/`,
                {
                    params: {
                        service: serviceName,
                    },
                }
            );

            const vendorList = response.data;

            setVendors(vendorList);

            if (vendorFromState) {
                const matchingVendor = vendorList.find(
                    (vendor) =>
                        vendor.vendor_id ===
                            vendorFromState.vendor_id ||
                        vendor.vendor_id ===
                            vendorFromState.id
                );

                if (matchingVendor) {
                    setSelectedVendor(matchingVendor);
                }
            }
        } catch (error) {
            setVendors([]);

            setErrorMessage(
                "Unable to load professionals."
            );
        } finally {
            setLoadingVendors(false);
        }
    };

    // =========================================================
    // LOAD SELECTED VENDOR DATA
    // =========================================================

    useEffect(() => {
        if (selectedVendor) {
            loadVendorData(selectedVendor.vendor_id);
        } else {
            setVendorAvailability(null);
            setVendorServices([]);
        }
    }, [selectedVendor]);

    const loadVendorData = async (vendorId) => {
        try {
            setLoadingVendorData(true);

            const [
                availabilityResponse,
                servicesResponse,
            ] = await Promise.all([
                axios.get(
                    `${API_BASE_URL}/vendor/availability/${vendorId}/`
                ),

                axios.get(
                    `${API_BASE_URL}/vendor/services/${vendorId}/`
                ),
            ]);

            setVendorAvailability(
                availabilityResponse.data
            );

            setVendorServices(
                servicesResponse.data.services || []
            );
        } catch (error) {
            setVendorAvailability(null);
            setVendorServices([]);
        } finally {
            setLoadingVendorData(false);
        }
    };

    // =========================================================
    // SERVICE CHANGE
    // =========================================================

    const handleServiceChange = (event) => {
        const serviceIdValue = Number(
            event.target.value
        );

        const service = services.find(
            (item) =>
                item.id === serviceIdValue
        );

        setSelectedService(service || null);
        setSelectedVendor(null);
        setSelectedDate("");
        setCustomerDescription("");

        setSuccessMessage("");
        setErrorMessage("");

        setExpandedVendorId(null);

        // Reset calendar to current month

        const today = new Date();

        setCalendarMonth(
            new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            )
        );
    };

    // =========================================================
    // VENDOR SELECT
    // =========================================================

    const handleVendorSelect = (vendor) => {
        setSelectedVendor(vendor);
        setSelectedDate("");

        setErrorMessage("");
        setSuccessMessage("");

        setShowAllVendors(false);
        setExpandedVendorId(null);

        // Start calendar from current month

        const today = new Date();

        setCalendarMonth(
            new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            )
        );
    };

    // =========================================================
    // DATE HELPERS
    // =========================================================

    const convertDateToString = (date) => {
        const year = date.getFullYear();

        const month = String(
            date.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            date.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const isPastDate = (date) => {
        const today = new Date();

        today.setHours(
            0,
            0,
            0,
            0
        );

        const checkDate = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );

        checkDate.setHours(
            0,
            0,
            0,
            0
        );

        return checkDate < today;
    };

    // =========================================================
    // UNAVAILABLE DATE
    // =========================================================

    const isUnavailableDate = (dateValue) => {
        if (!vendorAvailability) {
            return false;
        }

        const unavailableDates =
            vendorAvailability.unavailable_dates || [];

        return unavailableDates.some((item) => {
            if (typeof item === "string") {
                return item === dateValue;
            }

            return item?.date === dateValue;
        });
    };

    // =========================================================
    // WEEKLY OFF
    // =========================================================

    /*
        Project day numbering:

        0 = Sunday
        1 = Monday
        2 = Tuesday
        3 = Wednesday
        4 = Thursday
        5 = Friday
        6 = Saturday

        This matches JavaScript Date.getDay().
    */

    const getWeeklyOffDay = () => {
        const weeklyOff =
            vendorAvailability?.weekly_off;

        if (!weeklyOff) {
            return null;
        }

        const day = Number(
            weeklyOff.day
        );

        if (
            Number.isInteger(day) &&
            day >= 0 &&
            day <= 6
        ) {
            return day;
        }

        return null;
    };

    const isWeeklyOffDate = (date) => {
        const weeklyOffDay =
            getWeeklyOffDay();

        if (weeklyOffDay === null) {
            return false;
        }

        return (
            date.getDay() ===
            weeklyOffDay
        );
    };

    // =========================================================
    // WEEKLY OFF EXCEPTION
    // =========================================================

    const isWeeklyOffException = (dateValue) => {
        const exceptions =
            vendorAvailability?.weekly_off_exceptions || [];

        return exceptions.some((item) => {
            if (typeof item === "string") {
                return item === dateValue;
            }

            return item?.date === dateValue;
        });
    };

    // =========================================================
    // EXISTING BOOKING
    // =========================================================

    const isAlreadyBooked = (dateValue) => {
        const bookings =
            vendorAvailability?.bookings || [];

        return bookings.some((booking) => {
            if (
                booking.date !== dateValue
            ) {
                return false;
            }

            const status = String(
                booking.status || ""
            ).toLowerCase();

            return [
                "pending",
                "accepted",
                "ongoing",
            ].includes(status);
        });
    };

    // =========================================================
    // DATE STATUS
    // =========================================================

    const getDateStatus = (date) => {
        const dateValue =
            convertDateToString(date);

        // 1. Past date

        if (isPastDate(date)) {
            return "past";
        }

        // 2. Existing active booking

        if (
            isAlreadyBooked(dateValue)
        ) {
            return "booked";
        }

        // 3. Vendor specifically unavailable

        if (
            isUnavailableDate(dateValue)
        ) {
            return "unavailable";
        }

        // 4. Weekly-off exception
        // Exception has priority over weekly off.

        if (
            isWeeklyOffException(
                dateValue
            )
        ) {
            if (
                selectedDate === dateValue
            ) {
                return "selected";
            }

            return "available";
        }

        // 5. Normal weekly off

        if (
            isWeeklyOffDate(date)
        ) {
            return "weekoff";
        }

        // 6. Currently selected date

        if (
            selectedDate === dateValue
        ) {
            return "selected";
        }

        // 7. Normal available date

        return "available";
    };

    // =========================================================
    // CALENDAR
    // =========================================================

    const getCalendarDays = () => {
        const year =
            calendarMonth.getFullYear();

        const month =
            calendarMonth.getMonth();

        const firstDay = new Date(
            year,
            month,
            1
        );

        const lastDay = new Date(
            year,
            month + 1,
            0
        );

        const firstWeekDay =
            firstDay.getDay();

        const totalDays =
            lastDay.getDate();

        const days = [];

        // Empty cells before first day

        for (
            let i = 0;
            i < firstWeekDay;
            i++
        ) {
            days.push(null);
        }

        // Actual month dates

        for (
            let day = 1;
            day <= totalDays;
            day++
        ) {
            days.push(
                new Date(
                    year,
                    month,
                    day
                )
            );
        }

        return days;
    };

    const handleCalendarDateClick = (date) => {
        if (!date) {
            return;
        }

        // Vendor is not accepting bookings

        if (
            !vendorAvailability?.is_available
        ) {
            return;
        }

        const status =
            getDateStatus(date);

        // Only available dates can be selected

        if (status !== "available") {
            return;
        }

        const dateValue =
            convertDateToString(date);

        setSelectedDate(dateValue);

        setErrorMessage("");
        setSuccessMessage("");
    };

    const goToPreviousMonth = () => {
        const today = new Date();

        const currentMonthStart =
            new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            );

        const previousMonth =
            new Date(
                calendarMonth.getFullYear(),
                calendarMonth.getMonth() - 1,
                1
            );

        // Don't allow previous months

        if (
            previousMonth <
            currentMonthStart
        ) {
            return;
        }

        setCalendarMonth(
            previousMonth
        );
    };

    const goToNextMonth = () => {
        const nextMonth =
            new Date(
                calendarMonth.getFullYear(),
                calendarMonth.getMonth() + 1,
                1
            );

        setCalendarMonth(
            nextMonth
        );
    };

    const isPreviousMonthDisabled = () => {
        const today = new Date();

        const currentMonthStart =
            new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            );

        return (
            calendarMonth <=
            currentMonthStart
        );
    };

    const calendarMonthName =
        calendarMonth.toLocaleDateString(
            "en-US",
            {
                month: "long",
                year: "numeric",
            }
        );

    // =========================================================
    // VISITING CHARGE
    // =========================================================

    const getVisitingCharge = () => {
        if (
            !selectedService ||
            !selectedVendor
        ) {
            return null;
        }

        const matchingService =
            vendorServices.find(
                (item) =>
                    String(
                        item.service_id
                    ) ===
                    String(
                        selectedService.id
                    )
            );

        if (
            matchingService &&
            matchingService.visiting_charge !==
                undefined &&
            matchingService.visiting_charge !==
                null
        ) {
            return matchingService.visiting_charge;
        }

        return null;
    };

    // =========================================================
    // FORMAT DATE
    // =========================================================

    const formatDate = (dateValue) => {
        if (!dateValue) {
            return "Not selected";
        }

        const date = new Date(
            `${dateValue}T00:00:00`
        );

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "short",
                year: "numeric",
            }
        );
    };

    // =========================================================
    // BOOK
    // =========================================================

    const handleBooking = async () => {
        setErrorMessage("");
        setSuccessMessage("");

        if (!customerId) {
            setErrorMessage(
                "Please login as a customer before booking."
            );

            return;
        }

        if (!selectedService) {
            setErrorMessage(
                "Please select a service."
            );

            return;
        }

        if (!selectedVendor) {
            setErrorMessage(
                "Please select a professional."
            );

            return;
        }

        if (!selectedDate) {
            setErrorMessage(
                "Please select a date."
            );

            return;
        }

        /*
            Parse the selected date as a LOCAL date.
        */

        const selectedDateObject =
            new Date(
                `${selectedDate}T00:00:00`
            );

        const selectedDateStatus =
            getDateStatus(
                selectedDateObject
            );

        /*
            A selected date returns "selected"
            from getDateStatus().

            Therefore both "available" and
            "selected" are valid here.
        */

        if (
            selectedDateStatus !==
                "available" &&
            selectedDateStatus !==
                "selected"
        ) {
            setErrorMessage(
                "This date is no longer available."
            );

            return;
        }

        try {
            setBookingLoading(true);

            const response =
                await axios.post(
                    `${API_BASE_URL}/book-vendor/`,
                    {
                        customer: customerId,

                        vendor:
                            selectedVendor.vendor_id,

                        service:
                            selectedService.service,

                        date: selectedDate,

                        customer_description:
                            customerDescription,
                    }
                );

            // =================================================
            // BOOKING SUCCESS
            // =================================================

            const bookingSuccessMessage =
                response.data.message ||
                "Your booking has been successfully placed.";

            setSuccessMessage(
                bookingSuccessMessage
            );

            // Clear selected date

            setSelectedDate("");

            // Clear requirement

            setCustomerDescription("");

            // Reload vendor availability
            // so the calendar updates immediately

            await loadVendorData(
                selectedVendor.vendor_id
            );

            // Show success popup

            setShowSuccessModal(true);

        } catch (error) {
            setErrorMessage(
                error.response?.data?.message ||
                "Unable to complete booking."
            );
        } finally {
            setBookingLoading(false);
        }
    };

    // =========================================================
    // VENDOR CARD
    // =========================================================

    const VendorCard = ({
        vendor,
        modal = false,
    }) => {
        const isSelected =
            selectedVendor?.vendor_id ===
            vendor.vendor_id;

        const isExpanded =
            expandedVendorId ===
            vendor.vendor_id;

        const aboutText =
            vendor.about ||
            "No information available.";

        const shouldShowReadMore =
            aboutText.length > 120;

        return (
            <article
                className={`vendor-card ${
                    isSelected
                        ? "vendor-card-selected"
                        : ""
                } ${
                    modal
                        ? "vendor-card-modal"
                        : ""
                } ${
                    isExpanded
                        ? "vendor-card-expanded"
                        : ""
                }`}
            >
                <div className="vendor-card-content">

                    {/* PROFILE */}

                    <div className="vendor-card-profile">

                        <div className="vendor-image-wrapper">
                            {vendor.profile ? (
                                <img
                                    src={vendor.profile}
                                    alt={vendor.name}
                                    className="vendor-image"
                                />
                            ) : (
                                <div className="vendor-image-fallback">
                                    {vendor.name
                                        ?.charAt(0)
                                        ?.toUpperCase()}
                                </div>
                            )}
                        </div>

                        <div className="vendor-card-info">

                            <h5>
                                {vendor.name}
                            </h5>

                            <div className="vendor-rating">

                                <span>
                                    ★
                                </span>

                                <strong>
                                    {Number(
                                        vendor.average_rating ||
                                        0
                                    ).toFixed(1)}
                                </strong>

                                <small>
                                    (
                                    {
                                        vendor.total_ratings ||
                                        0
                                    }{" "}
                                    reviews)
                                </small>

                            </div>

                        </div>

                    </div>

                    {/* DESCRIPTION */}

                    <div
                        className={`vendor-description ${
                            isExpanded
                                ? "vendor-description-expanded"
                                : ""
                        }`}
                    >

                        <p className="vendor-about">
                            {aboutText}
                        </p>

                        {shouldShowReadMore && (
                            <button
                                type="button"
                                className="read-more-button"
                                onClick={() =>
                                    setExpandedVendorId(
                                        isExpanded
                                            ? null
                                            : vendor.vendor_id
                                    )
                                }
                            >
                                {isExpanded
                                    ? "Read less"
                                    : "Read more"}
                            </button>
                        )}

                    </div>

                    {/* BUTTON */}

                    <div className="vendor-card-action">

                        <button
                            type="button"
                            className={
                                isSelected
                                    ? "vendor-select-button selected"
                                    : "vendor-select-button"
                            }
                            onClick={() =>
                                handleVendorSelect(
                                    vendor
                                )
                            }
                        >
                            {isSelected
                                ? "Selected"
                                : "Select Vendor"}
                        </button>

                    </div>

                </div>
            </article>
        );
    };

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="booking-page">

            <div className="booking-container">

                {/* HEADER */}

                <div className="booking-header">

                    <button
                        type="button"
                        className="booking-back me-4 py-1 px-3 rounded"
                        onClick={() =>
                            navigate(-1)
                        }
                    >
                        ← Back
                    </button>

                    <span className="booking-eyebrow">
                        BOOK A SERVICE
                    </span>

                    <h1>
                        Find the right professional
                    </h1>

                    <p>
                        Choose a service, select a
                        professional, and book a
                        convenient date.
                    </p>

                </div>

                {/* MESSAGES */}

                {errorMessage && (
                    <div className="booking-message booking-error">
                        {errorMessage}
                    </div>
                )}

                {/* MAIN LAYOUT */}

                <div className="booking-layout">

                    {/* MAIN */}

                    <main className="booking-main">

                        {/* SERVICE */}

                        <section className="booking-section">

                            <div className="professional-heading">

                                <div className="section-heading">

                                    <span className="mb-4">
                                        01
                                    </span>

                                    <div>

                                        <h2>
                                            Service
                                        </h2>

                                        <p>
                                            What service do you need?
                                        </p>

                                    </div>

                                </div>

                            </div>

                            {loadingServices ? (
                                <div className="section-loading">
                                    Loading services...
                                </div>
                            ) : (
                                <select
                                    className="booking-select"
                                    value={
                                        selectedService?.id ||
                                        ""
                                    }
                                    onChange={
                                        handleServiceChange
                                    }
                                >
                                    <option value="">
                                        Choose a service
                                    </option>

                                    {services.map(
                                        (service) => (
                                            <option
                                                key={
                                                    service.id
                                                }
                                                value={
                                                    service.id
                                                }
                                            >
                                                {
                                                    service.service
                                                }
                                            </option>
                                        )
                                    )}

                                </select>
                            )}

                        </section>

                        {/* PROFESSIONAL */}

                        <section className="booking-section">

                            <div className="professional-heading">

                                <div className="section-heading">

                                    <span className="mb-4">
                                        02
                                    </span>

                                    <div>

                                        <h2>
                                            Professional
                                        </h2>

                                        <p>
                                            Who would you like to hire?
                                        </p>

                                    </div>

                                </div>

                                {selectedService &&
                                    vendors.length > 0 && (
                                        <button
                                            type="button"
                                            className="view-all-button"
                                            onClick={() =>
                                                setShowAllVendors(
                                                    true
                                                )
                                            }
                                        >
                                            View All
                                        </button>
                                    )}

                            </div>

                            {!selectedService ? (
                                <div className="section-empty">
                                    Select a service to see
                                    available professionals.
                                </div>
                            ) : loadingVendors ? (
                                <div className="section-loading">
                                    Finding professionals...
                                </div>
                            ) : vendors.length === 0 ? (
                                <div className="section-empty">
                                    No approved professionals
                                    are currently available
                                    for this service.
                                </div>
                            ) : (
                                <div className="vendor-list">

                                    {vendors
                                        .slice(0, 4)
                                        .map(
                                            (vendor) => (
                                                <VendorCard
                                                    key={
                                                        vendor.vendor_id
                                                    }
                                                    vendor={
                                                        vendor
                                                    }
                                                />
                                            )
                                        )}

                                </div>
                            )}

                        </section>

                        {/* APPOINTMENT */}

                        <section className="booking-section">

                            <div className="professional-heading">

                                <div className="section-heading">

                                    <span className="mb-4">
                                        03
                                    </span>

                                    <div>

                                        <h2>
                                            Appointment
                                        </h2>

                                        <p>
                                            Tell us when and what you need
                                        </p>

                                    </div>

                                </div>

                            </div>

                            {!selectedVendor ? (
                                <div className="section-empty">
                                    Select a professional first.
                                </div>
                            ) : loadingVendorData ? (
                                <div className="section-loading">
                                    Checking professional availability...
                                </div>
                            ) : (
                                <div className="appointment-fields">

                                    {!vendorAvailability?.is_available && (
                                        <div className="availability-warning">
                                            This professional is
                                            currently not accepting
                                            bookings.
                                        </div>
                                    )}

                                    {/* CUSTOM CALENDAR */}

                                    <div className="form-group">

                                        <label>
                                            Preferred date
                                        </label>

                                        <div className="booking-calendar">

                                            {/* CALENDAR HEADER */}

                                            <div className="calendar-header">

                                                <button
                                                    type="button"
                                                    className="calendar-nav-button"
                                                    onClick={
                                                        goToPreviousMonth
                                                    }
                                                    disabled={
                                                        isPreviousMonthDisabled()
                                                    }
                                                    aria-label="Previous month"
                                                >
                                                    ←
                                                </button>

                                                <h3 className="calendar-title">
                                                    {
                                                        calendarMonthName
                                                    }
                                                </h3>

                                                <button
                                                    type="button"
                                                    className="calendar-nav-button"
                                                    onClick={
                                                        goToNextMonth
                                                    }
                                                    aria-label="Next month"
                                                >
                                                    →
                                                </button>

                                            </div>

                                            {/* WEEK DAYS */}

                                            <div className="calendar-weekdays">

                                                {[
                                                    "Sun",
                                                    "Mon",
                                                    "Tue",
                                                    "Wed",
                                                    "Thu",
                                                    "Fri",
                                                    "Sat",
                                                ].map(
                                                    (day) => (
                                                        <div
                                                            key={day}
                                                            className="calendar-weekday"
                                                        >
                                                            {day}
                                                        </div>
                                                    )
                                                )}

                                            </div>

                                            {/* DAYS */}

                                            <div className="calendar-grid">

                                                {getCalendarDays().map(
                                                    (
                                                        date,
                                                        index
                                                    ) => {

                                                        if (!date) {
                                                            return (
                                                                <div
                                                                    key={`empty-${index}`}
                                                                    className="calendar-day-empty"
                                                                />
                                                            );
                                                        }

                                                        const status =
                                                            getDateStatus(
                                                                date
                                                            );

                                                        const dateValue =
                                                            convertDateToString(
                                                                date
                                                            );

                                                        let statusText = "";

                                                        if (
                                                            status ===
                                                            "selected"
                                                        ) {
                                                            statusText =
                                                                "Selected";
                                                        } else if (
                                                            status ===
                                                            "unavailable"
                                                        ) {
                                                            statusText =
                                                                "Unavailable";
                                                        } else if (
                                                            status ===
                                                            "weekoff"
                                                        ) {
                                                            statusText =
                                                                "Week Off";
                                                        } else if (
                                                            status ===
                                                            "booked"
                                                        ) {
                                                            statusText =
                                                                "Booked";
                                                        } else if (
                                                            status ===
                                                            "past"
                                                        ) {
                                                            statusText =
                                                                "Past";
                                                        } else if (
                                                            status ===
                                                            "available"
                                                        ) {
                                                            statusText =
                                                                "Available";
                                                        }

                                                        return (
                                                            <button
                                                                key={
                                                                    dateValue
                                                                }
                                                                type="button"
                                                                className={`calendar-day ${status}`}
                                                                disabled={
                                                                    status !==
                                                                        "available" ||
                                                                    !vendorAvailability?.is_available
                                                                }
                                                                onClick={() =>
                                                                    handleCalendarDateClick(
                                                                        date
                                                                    )
                                                                }
                                                                title={
                                                                    statusText
                                                                }
                                                            >

                                                                {status ===
                                                                "available" ? (
                                                                    <span className="calendar-day-number">
                                                                        {date.getDate()}
                                                                    </span>
                                                                ) : (
                                                                    <span className="calendar-day-status">
                                                                        {statusText}
                                                                    </span>
                                                                )}

                                                            </button>
                                                        );
                                                    }
                                                )}

                                            </div>

                                            {/* LEGEND */}

                                            <div className="calendar-legend">

                                                <div className="calendar-legend-item">
                                                    <span className="legend-dot legend-available"></span>
                                                    Available
                                                </div>

                                                <div className="calendar-legend-item">
                                                    <span className="legend-dot legend-selected"></span>
                                                    Selected
                                                </div>

                                                <div className="calendar-legend-item">
                                                    <span className="legend-dot legend-unavailable"></span>
                                                    Unavailable
                                                </div>

                                                <div className="calendar-legend-item">
                                                    <span className="legend-dot legend-weekoff"></span>
                                                    Week Off
                                                </div>

                                                <div className="calendar-legend-item">
                                                    <span className="legend-dot legend-booked"></span>
                                                    Booked
                                                </div>

                                                <div className="calendar-legend-item">
                                                    <span className="legend-dot legend-past"></span>
                                                    Past
                                                </div>

                                            </div>

                                        </div>

                                        {selectedDate && (
                                            <div className="selected-date-display">
                                                Selected date:{" "}
                                                <strong>
                                                    {formatDate(
                                                        selectedDate
                                                    )}
                                                </strong>
                                            </div>
                                        )}

                                    </div>

                                    {/* REQUIREMENT */}

                                    <div className="form-group">

                                        <label>
                                            Your requirement
                                        </label>

                                        <textarea
                                            className="booking-input booking-textarea"
                                            rows="4"
                                            placeholder="Tell the professional what you need..."
                                            value={
                                                customerDescription
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setCustomerDescription(
                                                    event.target.value
                                                )
                                            }
                                        />

                                    </div>

                                </div>
                            )}

                        </section>

                    </main>

                    {/* SUMMARY */}

                    <aside className="booking-summary">

                        <div className="summary-card">

                            <span className="summary-label">
                                YOUR BOOKING
                            </span>

                            <h2>
                                Booking Summary
                            </h2>

                            <div className="summary-list">

                                <div className="summary-row">

                                    <span>
                                        Service
                                    </span>

                                    <strong>
                                        {
                                            selectedService?.service ||
                                            "Not selected"
                                        }
                                    </strong>

                                </div>

                                <div className="summary-row">

                                    <span>
                                        Professional
                                    </span>

                                    <strong>
                                        {
                                            selectedVendor?.name ||
                                            "Not selected"
                                        }
                                    </strong>

                                </div>

                                <div className="summary-row">

                                    <span>
                                        Date
                                    </span>

                                    <strong>
                                        {formatDate(
                                            selectedDate
                                        )}
                                    </strong>

                                </div>

                                <div className="summary-row">

                                    <span>
                                        Visiting charge
                                    </span>

                                    <strong>
                                        {getVisitingCharge() !==
                                        null
                                            ? `₹${getVisitingCharge()}`
                                            : "—"}
                                    </strong>

                                </div>

                            </div>

                            <button
                                type="button"
                                className="booking-confirm"
                                disabled={
                                    bookingLoading ||
                                    !selectedService ||
                                    !selectedVendor ||
                                    !selectedDate ||
                                    !vendorAvailability?.is_available
                                }
                                onClick={
                                    handleBooking
                                }
                            >
                                {bookingLoading
                                    ? "Booking..."
                                    : "Confirm Booking →"}
                            </button>

                        </div>

                    </aside>

                </div>

            </div>

            {/* =====================================================
                VIEW ALL VENDORS MODAL
            ===================================================== */}

            {showAllVendors && (
                <div
                    className="vendor-modal-backdrop"
                    onClick={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            setShowAllVendors(
                                false
                            );
                        }
                    }}
                >

                    <div
                        className="vendor-modal"
                        role="dialog"
                        aria-modal="true"
                    >

                        <div className="vendor-modal-header">

                            <div>

                                <span className="booking-eyebrow">
                                    PROFESSIONALS
                                </span>

                                <h2>
                                    Choose your professional
                                </h2>

                                <p>
                                    Approved professionals
                                    available for{" "}
                                    <strong>
                                        {
                                            selectedService?.service
                                        }
                                    </strong>
                                </p>

                            </div>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={() =>
                                    setShowAllVendors(
                                        false
                                    )
                                }
                                aria-label="Close"
                            >
                                ×
                            </button>

                        </div>

                        <div className="vendor-modal-body">

                            {vendors.map(
                                (vendor) => (
                                    <VendorCard
                                        key={
                                            vendor.vendor_id
                                        }
                                        vendor={
                                            vendor
                                        }
                                        modal={true}
                                    />
                                )
                            )}

                        </div>

                    </div>

                </div>
            )}

            {/* =====================================================
                BOOKING SUCCESS MODAL
            ===================================================== */}

            {showSuccessModal && (
                <div
                    className="booking-success-backdrop"
                    role="presentation"
                >

                    <div
                        className="booking-success-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="booking-success-title"
                    >

                        <div className="booking-success-icon">
                            ✓
                        </div>

                        <h2 id="booking-success-title">
                            Booking Successful!
                        </h2>

                        <p className="booking-success-text">
                            {successMessage ||
                                "Your booking has been successfully placed."}
                        </p>

                        <p className="booking-success-countdown">
                            Redirecting to your dashboard in{" "}
                            <strong>
                                {redirectCountdown}
                            </strong>{" "}
                            seconds...
                        </p>

                        <div className="booking-success-actions">

                            <button
                                type="button"
                                className="booking-keep-button"
                                onClick={() => {
                                    setShowSuccessModal(
                                        false
                                    );

                                    setRedirectCountdown(
                                        8
                                    );

                                    setSuccessMessage(
                                        ""
                                    );

                                    setErrorMessage(
                                        ""
                                    );
                                }}
                            >
                                Keep Booking
                            </button>

                            <button
                                type="button"
                                className="booking-done-button"
                                onClick={() => {
                                    setShowSuccessModal(
                                        false
                                    );

                                    setRedirectCountdown(
                                        8
                                    );

                                    navigate(
                                        "/customer-dashboard"
                                    );
                                }}
                            >
                                Done
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}

export default Booking;