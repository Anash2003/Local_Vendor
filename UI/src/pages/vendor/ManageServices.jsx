import React, { useEffect, useState } from "react";

import axios from "axios";

import { useNavigate } from "react-router-dom";

import "../../App.css";

import "../../css/ManageServices.css";

function ManageServices() {

    const navigate = useNavigate();

    const vendorId = localStorage.getItem("vendor_id");

    const API_BASE_URL = "http://127.0.0.1:8000";

    const [services, setServices] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [successMessage, setSuccessMessage] = useState("");

    // Selected service for details
    const [selectedService, setSelectedService] = useState(null);

    // Remove confirmation
    const [showRemoveModal, setShowRemoveModal] = useState(false);

    const [serviceToRemove, setServiceToRemove] = useState(null);

    // Edit service
    const [showEditModal, setShowEditModal] = useState(false);

    const [editedDescription, setEditedDescription] = useState("");

    const [editedVisitingCharge, setEditedVisitingCharge] = useState("");

    const [savingService, setSavingService] = useState(false);

    const [removing, setRemoving] = useState(false);


    // =========================
    // Get vendor services
    // =========================

    const fetchServices = async () => {

        try {

            setLoading(true);

            setError("");

            const response = await axios.get(
                `${API_BASE_URL}/vendor/services/${vendorId}/`
            );

            setServices(response.data.services || []);

        } catch (error) {

            console.log("Unable to load services:", error);

            setError(
                error.response?.data?.message ||
                "Unable to load your services."
            );

        } finally {

            setLoading(false);

        }

    };


    useEffect(() => {

    console.log("MANAGE SERVICES OPENED");
    console.log("Vendor ID:", vendorId);

    if (!vendorId) {
        navigate("/vendor-login");
        return;
    }

    fetchServices();

}, [vendorId]);


    // =========================
    // Open service details
    // =========================

    const handleServiceClick = (service) => {

        setSelectedService(service);

        setError("");

        setSuccessMessage("");

    };


    // =========================
    // Close details
    // =========================

    const closeDetails = () => {

        setSelectedService(null);

    };


    // =========================
    // Open edit service
    // =========================

    const handleEditService = () => {

        if (!selectedService) {

            return;

        }

        setEditedDescription(
            selectedService.description || ""
        );

        setEditedVisitingCharge(
            selectedService.visiting_charge ?? ""
        );

        setError("");

        setShowEditModal(true);

    };


    // =========================
    // Save service
    // =========================

    const handleSaveService = async () => {

        if (!selectedService) {

            return;

        }

        if (!editedDescription.trim()) {

            setError(
                "Please enter a description."
            );

            return;

        }

        if (
            editedVisitingCharge === "" ||
            Number(editedVisitingCharge) < 0
        ) {

            setError(
                "Please enter a valid visiting charge."
            );

            return;

        }

        try {

            setSavingService(true);

            setError("");

            setSuccessMessage("");

            const response = await axios.patch(
                `${API_BASE_URL}/vendor/service/update/`,
                {
                    vendor: vendorId,
                    service: selectedService.service_id,
                    description: editedDescription.trim(),
                    visiting_charge: editedVisitingCharge
                }
            );

            const updatedDescription =
                response.data.description;

            const updatedVisitingCharge =
                response.data.visiting_charge;

            // Update service in list
            setServices((previousServices) =>
                previousServices.map((service) =>
                    service.id === selectedService.id
                        ? {
                            ...service,
                            description: updatedDescription,
                            visiting_charge: updatedVisitingCharge
                        }
                        : service
                )
            );

            // Update currently opened service
            setSelectedService((previousService) => ({
                ...previousService,
                description: updatedDescription,
                visiting_charge: updatedVisitingCharge
            }));

            setShowEditModal(false);

            setSuccessMessage(
                "Service details updated successfully."
            );

        } catch (error) {

            console.log(
                "Update service error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to update service."
            );

        } finally {

            setSavingService(false);

        }

    };


    // =========================
    // Open remove confirmation
    // =========================

    const handleRemoveClick = (service) => {

        setServiceToRemove(service);

        setShowRemoveModal(true);

    };


    // =========================
    // Cancel remove
    // =========================

    const cancelRemove = () => {

        setServiceToRemove(null);

        setShowRemoveModal(false);

    };


    // =========================
    // Remove service
    // =========================

    const confirmRemove = async () => {

        if (!serviceToRemove) {

            return;

        }

        try {

            setRemoving(true);

            setError("");

            setSuccessMessage("");

            const response = await axios.delete(
                `${API_BASE_URL}/vendor/service/remove/`,
                {
                    data: {
                        vendor: vendorId,
                        service: serviceToRemove.service_id
                    }
                }
            );

            setServices((previousServices) =>
                previousServices.filter(
                    (service) =>
                        service.id !== serviceToRemove.id
                )
            );

            // If the removed service was open
            if (
                selectedService &&
                selectedService.id === serviceToRemove.id
            ) {

                setSelectedService(null);

            }

            setShowRemoveModal(false);

            setServiceToRemove(null);

            setSuccessMessage(
                response.data.message ||
                "Service removed successfully."
            );

        } catch (error) {

            console.log(
                "Remove service error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to remove service."
            );

        } finally {

            setRemoving(false);

        }

    };


    return (

        <div className="manage-service-page">

            {/* =========================
                HEADER
            ========================= */}

            <div className="container py-4">

                <button
                    className="btn btn-link text-decoration-none p-0 mb-4 manage-back-btn"
                    onClick={() =>
                        navigate("/vendor-dashboard")
                    }
                >
                    <i className="fa-solid fa-arrow-left me-2"></i>
                    Back to Dashboard
                </button>


                <div className="d-flex align-items-center gap-3 mb-4">

                    <div className="manage-header-icon">

                        <i className="fa-solid fa-list-check"></i>

                    </div>

                    <div>

                        <h1 className="h3 fw-bold mb-1">
                            Manage Services
                        </h1>

                        <p className="text-secondary mb-0">
                            Manage the services you currently offer
                            to your customers.
                        </p>

                    </div>

                </div>


                {/* Messages */}

                {successMessage && (

                    <div className="alert alert-success d-flex align-items-center">

                        <i className="fa-solid fa-circle-check me-2"></i>

                        {successMessage}

                    </div>

                )}


                {error && (

                    <div className="alert alert-danger d-flex align-items-center">

                        <i className="fa-solid fa-circle-exclamation me-2"></i>

                        {error}

                    </div>

                )}


                {/* =========================
                    SERVICES
                ========================= */}

                <div className="card border-0 shadow-sm rounded-4">

                    <div className="card-body p-4">

                        <div className="d-flex justify-content-between align-items-center mb-4">

                            <div>

                                <h2 className="h5 fw-bold mb-1">
                                    Your Services
                                </h2>

                                <p className="text-secondary small mb-0">
                                    Click a service to view its details.
                                </p>

                            </div>

                            <span className="badge rounded-pill service-count">

                                {services.length} Service
                                {services.length !== 1 ? "s" : ""}

                            </span>

                        </div>


                        {/* Loading */}

                        {loading && (

                            <div className="text-center py-5">

                                <div
                                    className="spinner-border"
                                    style={{
                                        color: "var(--primary)"
                                    }}
                                >
                                </div>

                                <p className="text-secondary mt-3 mb-0">
                                    Loading your services...
                                </p>

                            </div>

                        )}


                        {/* No services */}

                        {!loading &&
                            services.length === 0 && (

                                <div className="text-center py-5">

                                    <div className="no-services-icon mx-auto mb-3">

                                        <i className="fa-solid fa-toolbox"></i>

                                    </div>

                                    <h3 className="h5 fw-bold">
                                        No Services Added
                                    </h3>

                                    <p className="text-secondary small mx-auto mb-4 manage-empty-text">
                                        You haven't added any services yet.
                                    </p>

                                    <button
                                        className="btn add-service-btn"
                                        onClick={() =>
                                            navigate("/vendor-services")
                                        }
                                    >
                                        <i className="fa-solid fa-plus me-2"></i>
                                        Add Service
                                    </button>

                                </div>

                            )}


                        {/* Service cards */}

                        {!loading &&
                            services.length > 0 && (

                                <div className="row g-4">

                                    {services.map((item) => (

                                        <div
                                            className="col-12 col-md-6"
                                            key={item.id}
                                        >

                                            <div
                                                className="card h-100 manage-service-card"
                                                onClick={() =>
                                                    handleServiceClick(item)
                                                }
                                            >

                                                <div className="card-body p-4">

                                                    <div className="d-flex align-items-center gap-3">

                                                        <div className="service-card-icon">

                                                            <i className="fa-solid fa-screwdriver-wrench"></i>

                                                        </div>

                                                        <div>

                                                            <h3 className="h6 fw-bold mb-1">

                                                                {item.service}

                                                            </h3>

                                                            <span className="text-secondary small">

                                                                {item.category ||
                                                                    "Service"}

                                                            </span>

                                                        </div>

                                                    </div>


                                                    <div className="mt-4">

                                                        <p className="text-secondary small mb-2 service-preview">

                                                            {item.description ||
                                                                "No description added yet."}

                                                        </p>


                                                        {/* Visiting charge */}

                                                        <div className="mt-3">

                                                            <span className="text-secondary small d-block">

                                                                Visiting charge

                                                            </span>

                                                            <span className="fw-bold">

                                                                ₹{Number(
                                                                    item.visiting_charge || 0
                                                                ).toFixed(2)}

                                                            </span>

                                                        </div>


                                                        <span className="view-details-text d-block mt-3">

                                                            View Details

                                                            <i className="fa-solid fa-arrow-right ms-2"></i>

                                                        </span>

                                                    </div>


                                                    <button
                                                        className="btn remove-service-btn w-100 mt-4"
                                                        onClick={(e) => {

                                                            e.stopPropagation();

                                                            handleRemoveClick(item);

                                                        }}
                                                    >

                                                        <i className="fa-solid fa-trash me-2"></i>

                                                        Remove Service

                                                    </button>

                                                </div>

                                            </div>

                                        </div>

                                    ))}

                                </div>

                            )}

                    </div>

                </div>


                {/* =========================
                    ADD SERVICE
                ========================= */}

                {!loading && (

                    <div className="card border-0 shadow-sm rounded-4 mt-4">

                        <div className="card-body p-4">

                            <div className="row align-items-center g-3">

                                <div className="col">

                                    <div className="d-flex align-items-center gap-3">

                                        <div className="add-service-icon">

                                            <i className="fa-solid fa-plus"></i>

                                        </div>

                                        <div>

                                            <h3 className="h6 fw-bold mb-1">

                                                Want to add another service?

                                            </h3>

                                            <p className="text-secondary small mb-0">

                                                Add more services to reach
                                                more customers.

                                            </p>

                                        </div>

                                    </div>

                                </div>

                                <div className="col-12 col-md-auto">

                                    <button
                                        className="btn add-service-btn"
                                        onClick={() =>
                                            navigate("/vendor-services")
                                        }
                                    >

                                        <i className="fa-solid fa-plus me-2"></i>

                                        Add Service

                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                )}

            </div>


            {/* =========================
                SERVICE DETAILS MODAL
            ========================= */}

            {selectedService && (

                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    role="dialog"
                    style={{
                        backgroundColor:
                            "rgba(15, 23, 42, 0.55)"
                    }}
                    onClick={closeDetails}
                >

                    <div
                        className="modal-dialog modal-dialog-centered"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="modal-content border-0 rounded-4 shadow">

                            <div className="modal-header border-0 px-4 pt-4">

                                <div className="d-flex align-items-center gap-3">

                                    <div className="service-card-icon">

                                        <i className="fa-solid fa-screwdriver-wrench"></i>

                                    </div>

                                    <div>

                                        <h5 className="modal-title fw-bold mb-1">

                                            {selectedService.service}

                                        </h5>

                                        <small className="text-secondary">

                                            {selectedService.category ||
                                                "Service"}

                                        </small>

                                    </div>

                                </div>

                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={closeDetails}
                                >
                                </button>

                            </div>


                            <div className="modal-body px-4 pb-4">

                                <div className="service-detail-box">

                                    <h6 className="fw-bold mb-2">
                                        About this service
                                    </h6>

                                    <p className="text-secondary mb-0">

                                        {selectedService.description ||
                                            "No description has been added yet."}

                                    </p>

                                </div>


                                {/* Visiting charge */}

                                <div className="service-detail-box mt-3">

                                    <h6 className="fw-bold mb-2">

                                        Visiting charge

                                    </h6>

                                    <p className="mb-0 fw-bold">

                                        ₹{Number(
                                            selectedService.visiting_charge || 0
                                        ).toFixed(2)}

                                    </p>

                                </div>


                                <div className="d-flex justify-content-end gap-2 mt-4">

                                    <button
                                        className="btn btn-light"
                                        onClick={closeDetails}
                                    >
                                        Close
                                    </button>

                                    <button
                                        className="btn add-service-btn"
                                        onClick={handleEditService}
                                    >

                                        <i className="fa-solid fa-pen me-2"></i>

                                        Edit Service

                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            )}


            {/* =========================
                EDIT SERVICE MODAL
            ========================= */}

            {showEditModal && selectedService && (

                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{
                        backgroundColor:
                            "rgba(15, 23, 42, 0.65)",
                        zIndex: 1060
                    }}
                >

                    <div className="modal-dialog modal-dialog-centered">

                        <div className="modal-content border-0 rounded-4 shadow">

                            <div className="modal-header">

                                <div>

                                    <h5 className="modal-title fw-bold">
                                        Edit Service
                                    </h5>

                                    <small className="text-secondary">

                                        {selectedService.service}

                                    </small>

                                </div>

                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() =>
                                        setShowEditModal(false)
                                    }
                                >
                                </button>

                            </div>


                            <div className="modal-body">

                                {/* About */}

                                <label className="form-label fw-semibold">

                                    About this service

                                </label>

                                <textarea
                                    className="form-control"
                                    rows="5"
                                    value={editedDescription}
                                    onChange={(e) =>
                                        setEditedDescription(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Write a professional description about your service..."
                                >
                                </textarea>

                                <div className="form-text mb-3">

                                    Write a clear description that customers
                                    can read before booking.

                                </div>


                                {/* Visiting charge */}

                                <label className="form-label fw-semibold">

                                    Visiting charge

                                </label>

                                <div className="input-group">

                                    <span className="input-group-text">
                                        ₹
                                    </span>

                                    <input
                                        type="number"
                                        className="form-control"
                                        min="0"
                                        step="0.01"
                                        value={editedVisitingCharge}
                                        onChange={(e) =>
                                            setEditedVisitingCharge(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter visiting charge"
                                    />

                                </div>

                                <div className="form-text">

                                    This is the charge for visiting the
                                    customer's location.

                                </div>

                            </div>


                            <div className="modal-footer">

                                <button
                                    type="button"
                                    className="btn btn-light"
                                    onClick={() =>
                                        setShowEditModal(false)
                                    }
                                    disabled={savingService}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    className="btn add-service-btn"
                                    onClick={handleSaveService}
                                    disabled={savingService}
                                >

                                    {savingService ? (

                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Saving...
                                        </>

                                    ) : (

                                        <>
                                            <i className="fa-solid fa-check me-2"></i>
                                            Save Changes
                                        </>

                                    )}

                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}


            {/* =========================
                REMOVE MODAL
            ========================= */}

            {showRemoveModal && serviceToRemove && (

                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{
                        backgroundColor:
                            "rgba(15, 23, 42, 0.55)",
                        zIndex: 1070
                    }}
                >

                    <div className="modal-dialog modal-dialog-centered">

                        <div className="modal-content border-0 rounded-4 shadow text-center">

                            <div className="modal-body p-4 p-md-5">

                                <div className="remove-confirm-icon mx-auto mb-3">

                                    <i className="fa-solid fa-trash"></i>

                                </div>

                                <h5 className="fw-bold mb-2">

                                    Remove Service?

                                </h5>

                                <p className="text-secondary mb-2">

                                    Are you sure you want to remove

                                    <strong className="text-dark">

                                        {" "}

                                        {serviceToRemove.service}

                                    </strong>

                                    ?

                                </p>

                                <small className="text-secondary">

                                    This service will no longer appear
                                    on your vendor profile.

                                </small>


                                <div className="d-flex gap-2 mt-4">

                                    <button
                                        className="btn btn-light flex-fill"
                                        onClick={cancelRemove}
                                        disabled={removing}
                                    >

                                        No, Keep It

                                    </button>

                                    <button
                                        className="btn btn-danger flex-fill"
                                        onClick={confirmRemove}
                                        disabled={removing}
                                    >

                                        {removing ? (

                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Removing...
                                            </>

                                        ) : (

                                            <>
                                                <i className="fa-solid fa-trash me-2"></i>
                                                Yes, Remove
                                            </>

                                        )}

                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

}

export default ManageServices;