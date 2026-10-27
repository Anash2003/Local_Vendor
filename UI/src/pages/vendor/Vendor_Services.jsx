
import React, { useState, useEffect } from "react";

import axios from "axios";

import { useNavigate } from "react-router-dom";

import "../../App.css";

import "../../css/VendorServices.css";

function Vendor_Services() {

    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);

    const [services, setServices] = useState([]);

    const [selectedCategory, setSelectedCategory] = useState("");

    const [selectedService, setSelectedService] = useState("");

    const [description, setDescription] = useState("");

    const [visitingCharge, setVisitingCharge] = useState("");

    const [showAbout, setShowAbout] = useState(false);

    const [message, setMessage] = useState("");

    const [error, setError] = useState("");

    const API_BASE_URL = "./api";


    // Load categories when page opens

    useEffect(() => {
        fetchCategories();
    }, []);


    // Get categories

    const fetchCategories = async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/categories/`
            );

            console.log("Categories:", response.data);

            setCategories(response.data);

        } catch (error) {
            console.log("Unable to load categories.");

            setError("Unable to load categories.");
        }
    };


    // Get services based on selected category

    const handleCategoryChange = async (e) => {

        const category = e.target.value;

        setSelectedCategory(category);

        setSelectedService("");

        setDescription("");

        setVisitingCharge("");

        setShowAbout(false);

        setServices([]);

        setMessage("");

        setError("");

        if (!category) {
            return;
        }

        try {
            const response = await axios.get(
                `${API_BASE_URL}/services/${category}/`
            );

            console.log("Services:", response.data);

            setServices(response.data);

        } catch (error) {
            console.log("Unable to load services.");

            setError("Unable to load services.");
        }
    };


    // When service is selected

    const handleServiceChange = (e) => {

        const service = e.target.value;

        setSelectedService(service);

        setDescription("");

        setVisitingCharge("");

        setShowAbout(false);

        setMessage("");

        setError("");
    };


    // Add service

    const handleAddService = async (e) => {

        e.preventDefault();

        setMessage("");

        setError("");


        // Check category

        if (!selectedCategory) {

            setError("Please select a category.");

            return;
        }


        // Check service

        if (!selectedService) {

            setError("Please select a service.");

            return;
        }


        // Check visiting charge

        if (
            visitingCharge === "" ||
            Number(visitingCharge) < 0
        ) {

            setError(
                "Please enter a valid visiting charge."
            );

            return;
        }


        // Get logged-in vendor ID

        const vendorId =
            localStorage.getItem("vendor_id");


        // Check vendor login

        if (!vendorId) {

            navigate("/vendor-login");

            return;
        }


        try {

            const response = await axios.post(
                `${API_BASE_URL}/vendor-services/add/`,
                {
                    vendor: vendorId,
                    service: selectedService,
                    description: description,
                    visiting_charge: visitingCharge
                }
            );

            console.log(
                "Add Service:",
                response.data
            );


            setMessage(
                "Service added successfully."
            );


            // Reset form

            setSelectedCategory("");

            setSelectedService("");

            setDescription("");

            setVisitingCharge("");

            setShowAbout(false);

            setServices([]);


            // Go back to Manage Services after adding

            setTimeout(() => {
                navigate("/manage-services");
            }, 1000);

        } catch (error) {

            console.log(
                "Add service error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to add service."
            );
        }
    };


    return (
        <div className="vendor-services-page">

            <div className="container py-4">


                {/* BACK TO MANAGE SERVICES */}

                <button
                    type="button"
                    className="btn vendor-services-back-btn mb-4"
                    onClick={() =>
                        navigate("/manage-services")
                    }
                >
                    <i className="fa-solid fa-arrow-left"></i>
                    {" "}Back to Manage Services
                </button>


                {/* FORM CARD */}

                <div className="vendor-services-card">


                    {/* HEADER */}

                    <div className="text-center mb-4">

                        <div className="vendor-services-icon">

                            <i className="fa-solid fa-screwdriver-wrench"></i>

                        </div>


                        <h2>
                            Add Service
                        </h2>


                        <p>
                            Select a service you provide to customers.
                        </p>

                    </div>


                    {/* SUCCESS */}

                    {message && (

                        <div className="alert alert-success">

                            <i className="fa-solid fa-circle-check me-2"></i>

                            {message}

                        </div>

                    )}


                    {/* ERROR */}

                    {error && (

                        <div className="alert alert-danger">

                            <i className="fa-solid fa-circle-exclamation me-2"></i>

                            {error}

                        </div>

                    )}


                    <form onSubmit={handleAddService}>


                        {/* CATEGORY */}

                        <div className="mb-3">

                            <label className="form-label fw-semibold">
                                Category
                            </label>


                            <select
                                className="form-select"
                                value={selectedCategory}
                                onChange={handleCategoryChange}
                            >

                                <option value="">
                                    Select Category
                                </option>


                                {categories.map(
                                    (category) => (

                                        <option
                                            key={category.id}
                                            value={category.category}
                                        >
                                            {category.category}
                                        </option>

                                    )
                                )}

                            </select>

                        </div>


                        {/* SERVICE */}

                        <div className="mb-3">

                            <label className="form-label fw-semibold">
                                Service
                            </label>


                            <select
                                className="form-select"
                                value={selectedService}
                                onChange={handleServiceChange}
                                disabled={!selectedCategory}
                            >

                                <option value="">
                                    Select Service
                                </option>


                                {services.map(
                                    (service) => (

                                        <option
                                            key={service.id}
                                            value={service.service}
                                        >
                                            {service.service}
                                        </option>

                                    )
                                )}

                            </select>

                        </div>


                        {/* VISITING CHARGE */}

                        {selectedService && (

                            <div className="mb-4">

                                <label className="form-label fw-semibold">
                                    Visiting Charge
                                </label>


                                <div className="input-group">

                                    <span className="input-group-text">
                                        ₹
                                    </span>


                                    <input
                                        type="number"
                                        className="form-control"
                                        value={visitingCharge}
                                        onChange={(e) =>
                                            setVisitingCharge(
                                                e.target.value
                                            )
                                        }
                                        min="0"
                                        step="0.01"
                                        placeholder="Enter visiting charge"
                                    />

                                </div>


                                <small className="text-secondary">
                                    This is the amount customers will pay for your visit.
                                </small>

                            </div>

                        )}


                        {/* ABOUT SERVICE */}

                        {selectedService && (

                            <div className="mb-4">

                                {!showAbout ? (

                                    <div className="d-flex justify-content-between align-items-center border rounded-3 p-3">

                                        <div>

                                            <div className="fw-semibold">

                                                About this service

                                                <span className="text-secondary fw-normal ms-2">
                                                    (Optional)
                                                </span>

                                            </div>


                                            <small className="text-secondary">

                                                Add some information about
                                                the service for customers.

                                            </small>

                                        </div>


                                        <button
                                            type="button"
                                            className="btn btn-outline-warning"
                                            onClick={() =>
                                                setShowAbout(true)
                                            }
                                        >

                                            <i className="fa-solid fa-plus me-1"></i>

                                            Add

                                        </button>

                                    </div>

                                ) : (

                                    <div className="border rounded-3 p-3">

                                        <div className="d-flex justify-content-between align-items-center mb-2">

                                            <label className="form-label fw-semibold mb-0">

                                                About this service

                                                <span className="text-secondary fw-normal ms-2">
                                                    (Optional)
                                                </span>

                                            </label>


                                            <button
                                                type="button"
                                                className="btn btn-sm btn-link text-danger text-decoration-none"
                                                onClick={() => {

                                                    setShowAbout(false);

                                                    setDescription("");

                                                }}
                                            >

                                                <i className="fa-solid fa-xmark me-1"></i>

                                                Remove

                                            </button>

                                        </div>


                                        <textarea
                                            className="form-control"
                                            rows="5"
                                            value={description}
                                            onChange={(e) =>
                                                setDescription(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Tell customers about the service you provide..."
                                        ></textarea>


                                        <small className="text-secondary">

                                            This field is optional.

                                        </small>

                                    </div>

                                )}

                            </div>

                        )}


                        {/* ADD BUTTON */}

                        <button
                            type="submit"
                            className="btn vendor-add-service-btn w-100"
                            disabled={
                                !selectedCategory ||
                                !selectedService ||
                                visitingCharge === ""
                            }
                        >

                            <i className="fa-solid fa-plus"></i>

                            {" "}Add Service

                        </button>


                    </form>

                </div>

            </div>

        </div>
    );
}

export default Vendor_Services;
