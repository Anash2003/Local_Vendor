import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import "../../App.css";
import "../../css/VendorAvailability.css";

function VendorAvailability() {

    const navigate = useNavigate();
    const vendorId = localStorage.getItem("vendor_id");

    // -----------------------------------------
    // STATES
    // -----------------------------------------

    const [currentDate, setCurrentDate] = useState(new Date());

    const [bookings, setBookings] = useState([]);

    const [unavailableDates, setUnavailableDates] = useState([]);

    const [weeklyOff, setWeeklyOff] = useState(null);

    const [weeklyOffExceptions, setWeeklyOffExceptions] = useState([]);

    const [vendorName, setVendorName] = useState("");

    const [isAvailable, setIsAvailable] = useState(true);

    const [availabilitySaving, setAvailabilitySaving] =
        useState(false);

    const [startDate, setStartDate] = useState(null);

    const [endDate, setEndDate] = useState(null);

    const [selectionMode, setSelectionMode] =
        useState("single");

    const [reason, setReason] = useState("");

    const [saving, setSaving] = useState(false);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [selectedWeekDay, setSelectedWeekDay] =
        useState("");

    const [weeklyOffSaving, setWeeklyOffSaving] =
        useState(false);


    // -----------------------------------------
    // START / STOP POPUP
    // -----------------------------------------

    const [showAvailabilityPopup, setShowAvailabilityPopup] =
        useState(false);

    const [availabilityAction, setAvailabilityAction] =
        useState(null);

    const [successMessage, setSuccessMessage] =
        useState("");


    // -----------------------------------------
    // SELECTED DATE MESSAGE
    // -----------------------------------------

    const [dateMessage, setDateMessage] =
        useState("");

    const [dateMessageType, setDateMessageType] =
        useState("success");


    // -----------------------------------------
    // WEEKLY OFF MESSAGE
    // -----------------------------------------

    const [weeklyOffMessage, setWeeklyOffMessage] =
        useState("");

    const [weeklyOffMessageType, setWeeklyOffMessageType] =
        useState("success");


    // -----------------------------------------
    // GET AVAILABILITY
    // -----------------------------------------

    const fetchAvailability = async (showLoading = true) => {

        try {

            if (showLoading) {
                setLoading(true);
            }

            setError("");

            console.log("Vendor ID:", vendorId);

            const response = await axios.get(
                `./api/vendor/availability/${vendorId}/`
            );

            console.log("FULL RESPONSE:", response.data);

            setVendorName(
                response.data.vendor_name
            );


            // -----------------------------------------
            // VENDOR AVAILABILITY
            // -----------------------------------------

            const currentAvailability =
                response.data.is_available === true ||
                response.data.is_available === "true";

            console.log(
                "is_available FROM BACKEND:",
                response.data.is_available
            );

            console.log(
                "SETTING REACT STATE TO:",
                currentAvailability
            );

            setIsAvailable(
                currentAvailability
            );


            // -----------------------------------------
            // BOOKINGS
            // -----------------------------------------

            setBookings(
                response.data.bookings || []
            );


            // -----------------------------------------
            // UNAVAILABLE DATES
            // -----------------------------------------

            setUnavailableDates(
                response.data.unavailable_dates || []
            );


            // -----------------------------------------
            // WEEKLY OFF
            // -----------------------------------------

            setWeeklyOff(
                response.data.weekly_off || null
            );


            // -----------------------------------------
            // WEEKLY OFF EXCEPTIONS
            // -----------------------------------------

            setWeeklyOffExceptions(
                response.data.weekly_off_exceptions || []
            );


            if (response.data.weekly_off) {

                setSelectedWeekDay(
                    response.data.weekly_off.day
                );

            } else {

                setSelectedWeekDay("");

            }

        } catch (err) {

            console.log(
                "AVAILABILITY ERROR:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to load availability"
            );

        } finally {

            if (showLoading) {
                setLoading(false);
            }
        }
    };


    // -----------------------------------------
    // LOAD AVAILABILITY
    // -----------------------------------------

    useEffect(() => {

        if (vendorId) {

            fetchAvailability();

        } else {

            setLoading(false);

            setError(
                "Vendor ID not found"
            );
        }

    }, [vendorId]);


    // -----------------------------------------
    // CHANGE MONTH
    // -----------------------------------------

    const changeMonth = (amount) => {

        setCurrentDate(
            new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() + amount,
                1
            )
        );

        resetSelection();
    };


    // -----------------------------------------
    // GO TO TODAY
    // -----------------------------------------

    const goToToday = () => {

        setCurrentDate(
            new Date()
        );

        resetSelection();
    };


    // -----------------------------------------
    // RESET SELECTION
    // -----------------------------------------

    const resetSelection = () => {

        setStartDate(null);

        setEndDate(null);

        setReason("");

        setDateMessage("");
    };


    // -----------------------------------------
    // FORMAT DATE
    // -----------------------------------------

    const formatDate = (date) => {

        if (!date) {
            return "";
        }

        const year =
            date.getFullYear();

        const month =
            String(
                date.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                date.getDate()
            ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };


    // -----------------------------------------
    // CHECK PAST DATE
    // -----------------------------------------

    const isPastDate = (date) => {

        const today = new Date();

        today.setHours(
            0,
            0,
            0,
            0
        );

        const checkDate =
            new Date(date);

        checkDate.setHours(
            0,
            0,
            0,
            0
        );

        return checkDate < today;
    };


    // -----------------------------------------
    // GET BOOKING
    // -----------------------------------------

    const getBooking = (date) => {

        const formattedDate =
            formatDate(date);

        return bookings.find(
            (booking) =>
                booking.date === formattedDate
        );
    };


    // -----------------------------------------
    // GET UNAVAILABLE DATE
    // -----------------------------------------

    const getUnavailableDate = (date) => {

        const formattedDate =
            formatDate(date);

        return unavailableDates.find(
            (item) =>
                item.date === formattedDate
        );
    };


    // -----------------------------------------
    // CHECK WEEKLY OFF
    // -----------------------------------------

    const isWeeklyOff = (date) => {

        if (!weeklyOff) {
            return false;
        }

        return (
            date.getDay() ===
            Number(weeklyOff.day)
        );
    };


    // -----------------------------------------
    // CHECK WEEKLY OFF EXCEPTION
    // -----------------------------------------

    const isWeeklyOffException = (date) => {

        const formattedDate =
            formatDate(date);

        return weeklyOffExceptions.some(
            (item) =>
                item.date === formattedDate
        );
    };


    // -----------------------------------------
    // CHECK UNAVAILABLE IN SELECTION
    // -----------------------------------------

    const hasUnavailableInSelection = () => {

        if (!startDate) {
            return false;
        }

        if (
            selectionMode === "single" ||
            !endDate
        ) {

            return Boolean(
                getUnavailableDate(
                    startDate
                )
            );
        }

        let checkDate =
            new Date(startDate);

        while (
            checkDate <= endDate
        ) {

            if (
                getUnavailableDate(
                    checkDate
                )
            ) {

                return true;
            }

            checkDate.setDate(
                checkDate.getDate() + 1
            );
        }

        return false;
    };


    // -----------------------------------------
    // DATE CLICK
    // -----------------------------------------

    const handleDateClick = (date) => {

        // Vendor stopped accepting bookings
        if (!isAvailable) {
            return;
        }


        // Past dates cannot be changed
        if (isPastDate(date)) {
            return;
        }


        // Booked dates cannot be changed
        if (getBooking(date)) {
            return;
        }


        // -----------------------------------------
        // WEEKLY OFF
        // -----------------------------------------

        // Normal weekly-off dates are now selectable
        // so that they can be made available.

        // Exception dates are also selectable.
        // They can be changed back to Week Off.


        // -----------------------------------------
        // SINGLE DATE
        // -----------------------------------------

        if (
            selectionMode === "single"
        ) {

            setStartDate(date);

            setEndDate(date);

            setDateMessage("");

            return;
        }


        // -----------------------------------------
        // RANGE
        // -----------------------------------------

        if (!startDate) {

            setStartDate(date);

            setEndDate(null);

            setDateMessage("");

            return;
        }


        if (!endDate) {

            if (date < startDate) {

                setEndDate(startDate);

                setStartDate(date);

            } else {

                setEndDate(date);
            }

            setDateMessage("");

            return;
        }


        // Third click starts a new range

        setStartDate(date);

        setEndDate(null);

        setDateMessage("");
    };


    // -----------------------------------------
    // MARK UNAVAILABLE
    // -----------------------------------------

    const markUnavailable = async () => {

        if (!startDate) {

            setDateMessageType("error");

            setDateMessage(
                "Please select a date first."
            );

            return;
        }

        const finalEndDate =
            endDate || startDate;


        try {

            setSaving(true);

            setDateMessage("");


            const response = await axios.post(
                "./api/vendor/unavailable/add/",
                {
                    vendor: vendorId,

                    start_date:
                        formatDate(startDate),

                    end_date:
                        formatDate(finalEndDate),

                    reason: reason
                }
            );


            resetSelection();


            setDateMessageType(
                "success"
            );

            setDateMessage(
                response.data.message
            );


            await fetchAvailability(
                false
            );

        } catch (err) {

            console.log(err);

            setDateMessageType(
                "error"
            );

            setDateMessage(
                err.response?.data?.message ||
                "Unable to mark dates unavailable"
            );

        } finally {

            setSaving(false);
        }
    };


    // -----------------------------------------
    // MAKE UNAVAILABLE DATE AVAILABLE
    // -----------------------------------------

    const makeAvailable = async () => {

        if (!startDate) {
            return;
        }

        const finalEndDate =
            endDate || startDate;


        try {

            setSaving(true);

            setDateMessage("");


            const response = await axios.delete(
                "./api/vendor/unavailable/remove-range/",
                {
                    data: {

                        vendor: vendorId,

                        start_date:
                            formatDate(startDate),

                        end_date:
                            formatDate(finalEndDate)
                    }
                }
            );


            console.log(
                "MAKE AVAILABLE RESPONSE:",
                response.data
            );


            resetSelection();


            setDateMessageType(
                "success"
            );

            setDateMessage(
                response.data.message
            );


            await fetchAvailability(
                false
            );

        } catch (err) {

            console.log(
                "MAKE AVAILABLE ERROR:",
                err
            );

            console.log(
                "STATUS:",
                err.response?.status
            );

            console.log(
                "DATA:",
                err.response?.data
            );


            setDateMessageType(
                "error"
            );

            setDateMessage(
                err.response?.data?.message ||
                "Unable to make dates available"
            );

        } finally {

            setSaving(false);
        }
    };


    // -----------------------------------------
    // MAKE WEEKLY OFF DATE AVAILABLE
    // -----------------------------------------

    const makeWeeklyOffAvailable = async () => {

        if (!startDate) {
            return;
        }


        try {

            setSaving(true);

            setDateMessage("");


            const response = await axios.post(
                "./api/vendor/weekly-off-exception/add/",
                {
                    vendor: vendorId,
                    date: formatDate(startDate)
                }
            );


            resetSelection();


            setDateMessageType(
                "success"
            );

            setDateMessage(
                response.data.message
            );


            await fetchAvailability(
                false
            );

        } catch (err) {

            console.log(
                "WEEKLY OFF EXCEPTION ERROR:",
                err
            );


            setDateMessageType(
                "error"
            );

            setDateMessage(
                err.response?.data?.message ||
                "Unable to make this date available"
            );

        } finally {

            setSaving(false);
        }
    };


    // -----------------------------------------
    // MAKE WEEKLY OFF AGAIN
    // -----------------------------------------

    const makeWeeklyOffAgain = async () => {

        if (!startDate) {
            return;
        }


        try {

            setSaving(true);

            setDateMessage("");


            const response = await axios.delete(
                "http://127.0.0.1:8000/vendor/weekly-off-exception/remove/",
                {
                    data: {
                        vendor: vendorId,
                        date: formatDate(startDate)
                    }
                }
            );


            resetSelection();


            setDateMessageType(
                "success"
            );

            setDateMessage(
                response.data.message
            );


            await fetchAvailability(
                false
            );

        } catch (err) {

            console.log(
                "REMOVE WEEKLY OFF EXCEPTION ERROR:",
                err
            );


            setDateMessageType(
                "error"
            );

            setDateMessage(
                err.response?.data?.message ||
                "Unable to make this date Week Off"
            );

        } finally {

            setSaving(false);
        }
    };


    // -----------------------------------------
    // OPEN START / STOP POPUP
    // -----------------------------------------

    const openAvailabilityPopup = (value) => {

        setAvailabilityAction(value);

        setShowAvailabilityPopup(true);

        setError("");

        setSuccessMessage("");
    };


    // -----------------------------------------
    // CLOSE START / STOP POPUP
    // -----------------------------------------

    const closeAvailabilityPopup = () => {

        if (availabilitySaving) {
            return;
        }

        setShowAvailabilityPopup(false);

        setAvailabilityAction(null);
    };


    // -----------------------------------------
    // CONFIRM START / STOP
    // -----------------------------------------

    const confirmAvailabilityChange = async () => {

        if (
            availabilityAction === null
        ) {
            return;
        }


        try {

            setAvailabilitySaving(true);

            setError("");

            setSuccessMessage("");


            const response = await axios.post(
                "http://127.0.0.1:8000/vendor/change-availability/",
                {
                    vendor: vendorId,

                    is_available:
                        availabilityAction
                }
            );


            console.log(
                "CHANGE RESPONSE:",
                response.data
            );


            const newAvailability =
                response.data.is_available === true ||
                response.data.is_available === "true";


            setIsAvailable(
                newAvailability
            );


            setShowAvailabilityPopup(
                false
            );

            setAvailabilityAction(
                null
            );


            resetSelection();


            setSuccessMessage(
                response.data.message
            );

        } catch (err) {

            console.log(err);


            setError(
                err.response?.data?.message ||
                "Unable to update availability"
            );

        } finally {

            setAvailabilitySaving(
                false
            );
        }
    };


    // -----------------------------------------
    // CHANGE WEEKLY OFF
    // -----------------------------------------

    const changeWeeklyOff = async () => {

        if (
            selectedWeekDay === ""
        ) {

            setWeeklyOffMessageType(
                "error"
            );

            setWeeklyOffMessage(
                "Please select a weekly off day."
            );

            return;
        }


        try {

            setWeeklyOffSaving(true);

            setWeeklyOffMessage("");


            const response = await axios.post(
                "http://127.0.0.1:8000/vendor/weekly-off/",
                {
                    vendor: vendorId,

                    day:
                        Number(selectedWeekDay)
                }
            );


            setWeeklyOffMessageType(
                "success"
            );

            setWeeklyOffMessage(
                response.data.message
            );


            await fetchAvailability(
                false
            );

        } catch (err) {

            console.log(err);


            setWeeklyOffMessageType(
                "error"
            );

            setWeeklyOffMessage(
                err.response?.data?.message ||
                "Unable to update weekly off"
            );

        } finally {

            setWeeklyOffSaving(
                false
            );
        }
    };


    // -----------------------------------------
    // CALENDAR DATA
    // -----------------------------------------

    const year =
        currentDate.getFullYear();

    const month =
        currentDate.getMonth();

    const firstDay =
        new Date(
            year,
            month,
            1
        );

    const lastDay =
        new Date(
            year,
            month + 1,
            0
        );

    const firstDayIndex =
        firstDay.getDay();

    const totalDays =
        lastDay.getDate();

    const calendarDays = [];


    for (
        let i = 0;
        i < firstDayIndex;
        i++
    ) {

        calendarDays.push(null);
    }


    for (
        let day = 1;
        day <= totalDays;
        day++
    ) {

        calendarDays.push(
            new Date(
                year,
                month,
                day
            )
        );
    }


    // -----------------------------------------
    // SELECTED DATE / RANGE
    // -----------------------------------------

    const isSelected = (date) => {

        if (
            !date ||
            !startDate
        ) {
            return false;
        }


        if (
            selectionMode === "single"
        ) {

            return (
                formatDate(date) ===
                formatDate(startDate)
            );
        }


        if (!endDate) {

            return (
                formatDate(date) ===
                formatDate(startDate)
            );
        }


        return (
            date >= startDate &&
            date <= endDate
        );
    };


    // -----------------------------------------
    // DATE CLASS
    // -----------------------------------------

    const getDateClass = (date) => {

        if (!date) {
            return "empty-day";
        }


        let classes =
            "calendar-day";


        if (!isAvailable) {

            classes +=
                " past-day stopped-day";

        } else {

            const booking =
                getBooking(date);

            const unavailable =
                getUnavailableDate(date);

            const exception =
                isWeeklyOffException(date);

            const weekOff =
                isWeeklyOff(date);


            // IMPORTANT:
            // Exception must come before weekly off

            if (booking) {

                classes +=
                    " booked-day";

            } else if (unavailable) {

                classes +=
                    " unavailable-day";

            } else if (exception) {

                classes +=
                    " available-day";

            } else if (weekOff) {

                classes +=
                    " weekoff-day";

            } else {

                classes +=
                    " available-day";
            }
        }


        if (isPastDate(date)) {

            classes +=
                " past-day";
        }


        const today =
            new Date();


        if (
            date.getDate() ===
                today.getDate() &&

            date.getMonth() ===
                today.getMonth() &&

            date.getFullYear() ===
                today.getFullYear()
        ) {

            classes +=
                " today-day";
        }


        if (isSelected(date)) {

            classes +=
                " selected-day";
        }


        return classes;
    };


    // -----------------------------------------
    // WEEK DAYS
    // -----------------------------------------

    const weekDays = [
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat"
    ];


    // -----------------------------------------
    // MONTH NAME
    // -----------------------------------------

    const monthName =
        currentDate.toLocaleString(
            "default",
            {
                month: "long",
                year: "numeric"
            }
        );


    // -----------------------------------------
    // LOADING
    // -----------------------------------------

    if (loading) {

        return (
            <div className="vendor-availability-page">

                <div className="availability-loading">

                    <i className="fa-solid fa-spinner fa-spin"></i>

                    <p>
                        Loading availability...
                    </p>

                </div>

            </div>
        );
    }


    // -----------------------------------------
    // MAIN UI
    // -----------------------------------------

    return (

        <div className="vendor-availability-page">


            {/* BACK BUTTON */}

            <button
                className="availability-back-btn"
                onClick={() =>
                    navigate(
                        "/vendor-dashboard"
                    )
                }
            >

                <i className="fa-solid fa-arrow-left"></i>

                Back to Dashboard

            </button>


            {/* HEADER */}

            <div className="availability-header">

                <div>

                    <h1>

                        <i className="fa-solid fa-calendar-days"></i>

                        Availability

                    </h1>

                    <p>
                        Manage your working days and bookings
                    </p>

                </div>


                <div className="vendor-name">

                    <i className="fa-solid fa-user"></i>

                    {vendorName}

                </div>

            </div>


            {/* GENERAL ERROR */}

            {error && (

                <div className="availability-error">

                    <i className="fa-solid fa-circle-exclamation"></i>

                    {error}

                </div>

            )}


            {/* GENERAL SUCCESS */}

            {successMessage && (

                <div className="availability-success">

                    <div className="success-icon">

                        <i className="fa-solid fa-check"></i>

                    </div>


                    <div>

                        <strong>
                            Availability Updated
                        </strong>

                        <p>
                            {successMessage}
                        </p>

                    </div>


                    <button
                        onClick={() =>
                            setSuccessMessage("")
                        }
                    >

                        <i className="fa-solid fa-xmark"></i>

                    </button>

                </div>

            )}


            {/* ACCEPTING BOOKINGS */}

            <div className="availability-card availability-status-card">

                <div className="availability-status-content">

                    <div>

                        <h3>
                            Accepting Bookings
                        </h3>

                        <p>

                            {isAvailable
                                ? "Customers can currently book your services."
                                : "You are currently not accepting any new bookings."
                            }

                        </p>

                    </div>


                    {/* STATUS */}

                    <div
                        className={
                            `availability-status ${
                                isAvailable
                                    ? "active"
                                    : "stopped"
                            }`
                        }
                    >

                        <span></span>

                        {isAvailable
                            ? "Available"
                            : "Not Accepting Bookings"
                        }

                    </div>


                    {/* START / STOP BUTTON */}

                    <div className="availability-control">

                        {isAvailable ? (

                            <button
                                className="stop-working-btn"
                                onClick={() =>
                                    openAvailabilityPopup(false)
                                }
                                disabled={
                                    availabilitySaving
                                }
                            >

                                <i className="fa-solid fa-pause"></i>

                                Stop Accepting Bookings

                            </button>

                        ) : (

                            <button
                                className="start-working-btn"
                                onClick={() =>
                                    openAvailabilityPopup(true)
                                }
                                disabled={
                                    availabilitySaving
                                }
                            >

                                <i className="fa-solid fa-play"></i>

                                Start Accepting Bookings

                            </button>

                        )}

                    </div>

                </div>

            </div>


            {/* START / STOP CONFIRMATION */}

            {/* -----------------------------------------
    START / STOP CONFIRMATION POPUP
----------------------------------------- */}

{showAvailabilityPopup && (
    <div className="availability-popup-overlay">

        <div className="availability-confirm-box">

            <div className="confirm-box-icon">
                <i
                    className={
                        availabilityAction
                            ? "fa-solid fa-play"
                            : "fa-solid fa-pause"
                    }
                ></i>
            </div>

            <div className="confirm-box-content">

                <h3>
                    {availabilityAction
                        ? "Start Accepting Bookings?"
                        : "Stop Accepting Bookings?"
                    }
                </h3>

                <p>
                    {availabilityAction
                        ? "You will start accepting new bookings again. Your previous availability settings will remain unchanged."
                        : "You will stop accepting new bookings. Your upcoming bookings will be rejected and your existing availability settings will remain unchanged."
                    }
                </p>

                <div className="confirm-box-buttons">

                    <button
                        type="button"
                        className="confirm-cancel-btn"
                        onClick={closeAvailabilityPopup}
                        disabled={availabilitySaving}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        className={
                            availabilityAction
                                ? "confirm-start-btn"
                                : "confirm-stop-btn"
                        }
                        onClick={confirmAvailabilityChange}
                        disabled={availabilitySaving}
                    >

                        {availabilitySaving ? (
                            <>
                                <i className="fa-solid fa-spinner fa-spin"></i>
                                Updating...
                            </>
                        ) : (
                            <>
                                <i
                                    className={
                                        availabilityAction
                                            ? "fa-solid fa-play"
                                            : "fa-solid fa-pause"
                                    }
                                ></i>

                                {availabilityAction
                                    ? "Yes, Start"
                                    : "Yes, Stop"
                                }
                            </>
                        )}

                    </button>

                </div>

            </div>

        </div>

    </div>
)}


            {/* STOPPED MESSAGE */}

            {!isAvailable && (

                <div className="availability-stopped-message">

                    <i className="fa-solid fa-circle-info"></i>


                    <div>

                        <strong>
                            You are currently not accepting bookings
                        </strong>

                        <p>

                            All dates are currently non-functional.
                            Your previous booked dates, unavailable dates
                            and weekly off settings are preserved.

                        </p>

                    </div>

                </div>

            )}


            {/* MARK UNAVAILABLE */}

            <div className="availability-card availability-mode-card">

                <h3>

                    <i className="fa-solid fa-calendar-plus"></i>

                    Mark Unavailable

                </h3>


                <p>

                    Select one date or a range of dates when you won't be available.

                </p>


                <div className="mode-buttons">

                    <button
                        className={
                            selectionMode === "single"
                                ? "mode-btn active"
                                : "mode-btn"
                        }
                        onClick={() => {

                            setSelectionMode(
                                "single"
                            );

                            resetSelection();

                        }}
                        disabled={
                            !isAvailable
                        }
                    >

                        <i className="fa-solid fa-calendar-day"></i>

                        Single Date

                    </button>


                    <button
                        className={
                            selectionMode === "range"
                                ? "mode-btn active"
                                : "mode-btn"
                        }
                        onClick={() => {

                            setSelectionMode(
                                "range"
                            );

                            resetSelection();

                        }}
                        disabled={
                            !isAvailable
                        }
                    >

                        <i className="fa-solid fa-calendar-week"></i>

                        Date Range

                    </button>

                </div>

            </div>


            {/* CALENDAR */}

            <div className="availability-card calendar-card">

                <div className="calendar-header">

                    <button
                        onClick={() =>
                            changeMonth(-1)
                        }
                        className="calendar-nav-btn"
                    >

                        <i className="fa-solid fa-chevron-left"></i>

                    </button>


                    <h2>
                        {monthName}
                    </h2>


                    <button
                        onClick={() =>
                            changeMonth(1)
                        }
                        className="calendar-nav-btn"
                    >

                        <i className="fa-solid fa-chevron-right"></i>

                    </button>

                </div>


                <button
                    className="today-btn"
                    onClick={
                        goToToday
                    }
                >
                    Today
                </button>


                <div className="calendar-weekdays">

                    {weekDays.map(
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


                <div className="calendar-grid">

                    {calendarDays.map(
                        (date, index) => (

                            <div
                                key={index}
                                className={
                                    getDateClass(date)
                                }
                                onClick={() =>
                                    date &&
                                    handleDateClick(
                                        date
                                    )
                                }
                            >

                                {date &&
                                    date.getDate()
                                }

                            </div>

                        )
                    )}

                </div>


                {/* LEGEND */}

                <div className="calendar-legend">

                    <div>

                        <span className="legend-color available"></span>

                        Available

                    </div>


                    <div>

                        <span className="legend-color booked"></span>

                        Booked

                    </div>


                    <div>

                        <span className="legend-color unavailable"></span>

                        Unavailable

                    </div>


                    <div>

                        <span className="legend-color weekoff"></span>

                        Week Off

                    </div>

                </div>

            </div>


            {/* SELECTED DATE / RANGE */}

            {startDate && (

                <div className="availability-card selected-date-card">

                    <h3>

                        <i className="fa-solid fa-calendar-check"></i>

                        Selected Date

                    </h3>


                    <p>

                        {formatDate(startDate)}

                        {selectionMode === "range" &&
                            endDate &&
                            ` → ${formatDate(endDate)}`
                        }

                    </p>


                    {/* REASON */}

                    <input
                        type="text"
                        placeholder="Reason (optional)"
                        value={reason}
                        onChange={(e) =>
                            setReason(
                                e.target.value
                            )
                        }
                        disabled={
                            !isAvailable
                        }
                    />


                    <div className="selected-date-buttons">


                        {/* -----------------------------------------
                            NORMAL DATE / UNAVAILABLE
                            ----------------------------------------- */}

                        {!isWeeklyOff(startDate) && (

                            <>

                                {/* MARK UNAVAILABLE */}

                                <button
                                    className="mark-unavailable-btn"
                                    onClick={
                                        markUnavailable
                                    }
                                    disabled={
                                        saving ||
                                        !isAvailable
                                    }
                                >

                                    <i className="fa-solid fa-ban"></i>

                                    {saving
                                        ? "Saving..."
                                        : "Mark Unavailable"
                                    }

                                </button>


                                {/* MAKE AVAILABLE */}

                                {hasUnavailableInSelection() &&
                                    isAvailable && (

                                        <button
                                            className="make-available-btn"
                                            onClick={
                                                makeAvailable
                                            }
                                            disabled={
                                                saving
                                            }
                                        >

                                            <i className="fa-solid fa-check"></i>

                                            {saving
                                                ? "Making Available..."
                                                : "Make Available"
                                            }

                                        </button>

                                    )
                                }

                            </>

                        )}


                        {/* -----------------------------------------
                            WEEKLY OFF DATE
                            ----------------------------------------- */}

                        {isWeeklyOff(startDate) &&
                            !isWeeklyOffException(startDate) && (

                                <button
                                    className="make-available-btn"
                                    onClick={
                                        makeWeeklyOffAvailable
                                    }
                                    disabled={
                                        saving ||
                                        !isAvailable
                                    }
                                >

                                    <i className="fa-solid fa-check"></i>

                                    {saving
                                        ? "Making Available..."
                                        : "Make Available"
                                    }

                                </button>

                            )
                        }


                        {/* -----------------------------------------
                            WEEKLY OFF EXCEPTION
                            ----------------------------------------- */}

                        {isWeeklyOffException(startDate) && (

                            <button
                                className="make-available-btn"
                                onClick={
                                    makeWeeklyOffAgain
                                }
                                disabled={
                                    saving ||
                                    !isAvailable
                                }
                            >

                                <i className="fa-solid fa-rotate-left"></i>

                                {saving
                                    ? "Updating..."
                                    : "Make Week Off"
                                }

                            </button>

                        )}


                        {/* CANCEL */}

                        <button
                            className="cancel-selection-btn"
                            onClick={
                                resetSelection
                            }
                        >
                            Cancel
                        </button>

                    </div>


                    {/* DATE MESSAGE */}

                    {dateMessage && (

                        <div
                            className={
                                dateMessageType === "success"
                                    ? "availability-inline-success"
                                    : "availability-inline-error"
                            }
                        >

                            <i
                                className={
                                    dateMessageType === "success"
                                        ? "fa-solid fa-circle-check"
                                        : "fa-solid fa-circle-exclamation"
                                }
                            ></i>


                            <span>
                                {dateMessage}
                            </span>


                            <button
                                onClick={() =>
                                    setDateMessage("")
                                }
                            >

                                <i className="fa-solid fa-xmark"></i>

                            </button>

                        </div>

                    )}

                </div>

            )}


            {/* WEEKLY OFF */}

            <div className="availability-card weekly-off-card">

                <div className="weekly-off-header">

                    <div>

                        <h3>

                            <i className="fa-solid fa-repeat"></i>

                            Weekly Off

                        </h3>


                        <p>

                            Choose one recurring day every week when you don't work.

                        </p>

                    </div>


                    {weeklyOff && (

                        <div className="current-weekoff">

                            <i className="fa-solid fa-calendar-xmark"></i>

                            Current:{" "}

                            <strong>

                                {
                                    weekDays[
                                        Number(
                                            weeklyOff.day
                                        )
                                    ]
                                }

                            </strong>

                        </div>

                    )}

                </div>


                <div className="weekly-off-control">

                    <select
                        value={
                            selectedWeekDay
                        }
                        onChange={(e) => {

                            setSelectedWeekDay(
                                e.target.value
                            );

                            setWeeklyOffMessage("");

                        }}
                        disabled={
                            !isAvailable
                        }
                    >

                        <option value="">
                            Select weekly off
                        </option>


                        {weekDays.map(
                            (day, index) => (

                                <option
                                    key={day}
                                    value={index}
                                >
                                    {day}
                                </option>

                            )
                        )}

                    </select>


                    <button
                        className="weekly-off-btn"
                        onClick={
                            changeWeeklyOff
                        }
                        disabled={
                            !isAvailable ||
                            weeklyOffSaving ||
                            selectedWeekDay === ""
                        }
                    >

                        <i className="fa-solid fa-floppy-disk"></i>


                        {weeklyOffSaving
                            ? "Saving..."
                            : weeklyOff
                                ? "Change Weekly Off"
                                : "Set Weekly Off"
                        }

                    </button>

                </div>


                {/* WEEKLY OFF MESSAGE */}

                {weeklyOffMessage && (

                    <div
                        className={
                            weeklyOffMessageType === "success"
                                ? "availability-inline-success"
                                : "availability-inline-error"
                        }
                    >

                        <i
                            className={
                                weeklyOffMessageType === "success"
                                    ? "fa-solid fa-circle-check"
                                    : "fa-solid fa-circle-exclamation"
                            }
                        ></i>


                        <span>
                            {weeklyOffMessage}
                        </span>


                        <button
                            onClick={() =>
                                setWeeklyOffMessage("")
                            }
                        >

                            <i className="fa-solid fa-xmark"></i>

                        </button>

                    </div>

                )}

            </div>


            {/* UPCOMING BOOKINGS */}

            <div className="availability-card bookings-card">

                <h3>

                    <i className="fa-solid fa-calendar-check"></i>

                    Upcoming Bookings

                </h3>


                {bookings.length === 0 ? (

                    <div className="empty-bookings">

                        <i className="fa-regular fa-calendar"></i>

                        <p>
                            No bookings yet
                        </p>

                    </div>

                ) : (

                    <div className="booking-list">

                        {bookings.map(
                            (booking) => (

                                <div
                                    className="availability-booking"
                                    key={
                                        booking.booking_id
                                    }
                                >

                                    <div>

                                        <strong>
                                            {booking.date}
                                        </strong>

                                        <span>
                                            {booking.service}
                                        </span>

                                    </div>


                                    <div>

                                        <span>
                                            {booking.customer_name}
                                        </span>

                                        <small>
                                            {booking.status}
                                        </small>

                                    </div>

                                </div>

                            )
                        )}

                    </div>

                )}

            </div>

        </div>
    );
}

export default VendorAvailability;