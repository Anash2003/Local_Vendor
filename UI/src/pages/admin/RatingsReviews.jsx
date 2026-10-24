import { useCallback, useEffect, useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8000";

function getCookie(name) {
  const cookies = document.cookie.split(";");

  for (const cookie of cookies) {
    const trimmedCookie = cookie.trim();

    if (trimmedCookie.startsWith(`${name}=`)) {
      return decodeURIComponent(
        trimmedCookie.substring(name.length + 1)
      );
    }
  }

  return "";
}

async function getCsrfToken() {
  const existingToken = getCookie("csrftoken");

  if (existingToken) {
    return existingToken;
  }

  const response = await fetch(
    `${API_BASE_URL}/api/csrf-token/`,
    { credentials: "include" }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Unable to get CSRF token.");
  }

  return data.csrfToken || getCookie("csrftoken");
}

async function apiRequest(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = { ...(options.headers || {}) };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrfToken = await getCsrfToken();

    if (!csrfToken) {
      throw new Error("CSRF token is missing. Refresh the page and try again.");
    }

    headers["X-CSRFToken"] = csrfToken;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    method,
    headers,
    credentials: "include",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let errorMessage =
      data.message ||
      data.detail ||
      "The request could not be completed.";

    if (typeof errorMessage !== "string") {
      errorMessage = JSON.stringify(errorMessage);
    }

    throw new Error(errorMessage);
  }

  return data;
}

function RatingStars({ rating }) {
  const value = Number(rating) || 0;

  return (
    <span
      className="text-warning"
      aria-label={`${value} out of 5 stars`}
      title={`${value} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <i
          key={star}
          className={`bi ${
            star <= Math.round(value)
              ? "bi-star-fill"
              : "bi-star"
          } me-1`}
        />
      ))}
      <span className="text-dark ms-1">{value.toFixed(1)}</span>
    </span>
  );
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function RatingsReviews() {
  const [reviews, setReviews] = useState([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [vendors, setVendors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const [reviewSearch, setReviewSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");

  const [vendorSearch, setVendorSearch] = useState("");
  const [minVendorRating, setMinVendorRating] = useState("");

  const [selectedReview, setSelectedReview] = useState(null);

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  const loadReviews = useCallback(async () => {
    const params = new URLSearchParams();

    if (reviewSearch.trim()) {
      params.set("search", reviewSearch.trim());
    }

    if (ratingFilter) {
      params.set("rating", ratingFilter);
    }

    const query = params.toString();

    const endpoint = query
      ? `/api/admin/reviews/?${query}`
      : "/api/admin/reviews/";

    const data = await apiRequest(endpoint);

    setReviews(Array.isArray(data.reviews) ? data.reviews : []);
    setTotalReviews(
      Number(data.total ?? data.reviews?.length ?? 0)
    );
  }, [reviewSearch, ratingFilter]);

  const loadVendorSummaries = useCallback(async () => {
    const params = new URLSearchParams();

    if (vendorSearch.trim()) {
      params.set("search", vendorSearch.trim());
    }

    if (minVendorRating) {
      params.set("min_rating", minVendorRating);
    }

    const query = params.toString();

    const endpoint = query
      ? `/api/admin/vendor-ratings-summary/?${query}`
      : "/api/admin/vendor-ratings-summary/";

    const data = await apiRequest(endpoint);

    setVendors(Array.isArray(data.vendors) ? data.vendors : []);
  }, [vendorSearch, minVendorRating]);

  const loadAllData = useCallback(async () => {
    setLoading(true);

    try {
      await Promise.all([
        loadReviews(),
        loadVendorSummaries(),
      ]);
    } catch (error) {
      showMessage("danger", error.message);
    } finally {
      setLoading(false);
    }
  }, [loadReviews, loadVendorSummaries]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Re-fetch reviews when their search or rating filter changes.
  useEffect(() => {
    const refreshReviews = async () => {
      try {
        await loadReviews();
      } catch (error) {
        showMessage("danger", error.message);
      }
    };

    refreshReviews();
  }, [loadReviews]);

  // Re-fetch vendor summaries when their filters change.
  useEffect(() => {
    const refreshVendors = async () => {
      try {
        await loadVendorSummaries();
      } catch (error) {
        showMessage("danger", error.message);
      }
    };

    refreshVendors();
  }, [loadVendorSummaries]);

  const averageRating = reviews.length
    ? reviews.reduce(
        (total, review) => total + (Number(review.rating) || 0),
        0
      ) / reviews.length
    : 0;

  const lowRatedReviews = reviews.filter(
    (review) => Number(review.rating) <= 2
  ).length;

  return (
    <div className="cs-page">
      <div className="cs-heading">
        <div>
          <h2>Ratings &amp; Reviews</h2>
          <p>
            Monitor customer feedback and vendor ratings on Oorkaran.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={loadAllData}
          disabled={loading}
        >
          <i className="bi bi-arrow-clockwise me-2" />
          Refresh
        </button>
      </div>

      {message && (
        <div
          className={`alert alert-${message.type} alert-dismissible fade show`}
          role="alert"
        >
          {message.text}

          <button
            type="button"
            className="btn-close"
            aria-label="Close message"
            onClick={() => setMessage(null)}
          />
        </div>
      )}

      {/* Summary cards */}
      <div className="cs-summary">
        <div className="cs-summary-card">
          <div className="cs-summary-icon">
            <i className="bi bi-chat-square-text" />
          </div>

          <div>
            <span>Reviews Found</span>
            <h3>{totalReviews}</h3>
          </div>
        </div>

        <div className="cs-summary-card">
          <div className="cs-summary-icon cs-service-icon">
            <i className="bi bi-star-fill" />
          </div>

          <div>
            <span>Average Rating</span>
            <h3>{averageRating.toFixed(1)} / 5</h3>
          </div>
        </div>

        <div className="cs-summary-card">
          <div className="cs-summary-icon">
            <i className="bi bi-exclamation-circle" />
          </div>

          <div>
            <span>Reviews Rated 1–2</span>
            <h3>{lowRatedReviews}</h3>
          </div>
        </div>

        <div className="cs-summary-card">
          <div className="cs-summary-icon cs-service-icon">
            <i className="bi bi-people" />
          </div>

          <div>
            <span>Vendors Listed</span>
            <h3>{vendors.length}</h3>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="cs-loading">
          <div className="spinner-border text-warning" role="status" />
          <p>Loading ratings and reviews...</p>
        </div>
      ) : (
        <>
          {/* Customer reviews */}
          <section className="cs-panel mb-4">
            <div className="cs-panel-heading">
              <div>
                <h4>Customer Reviews</h4>
                <p>View customer feedback and submitted ratings.</p>
              </div>

              <i className="bi bi-chat-square-heart cs-heading-icon" />
            </div>

            <div className="cs-filter-row mb-3">
              <input
                type="search"
                className="form-control"
                placeholder="Search customer or vendor..."
                value={reviewSearch}
                onChange={(event) =>
                  setReviewSearch(event.target.value)
                }
              />

              <select
                className="form-select"
                value={ratingFilter}
                onChange={(event) =>
                  setRatingFilter(event.target.value)
                }
              >
                <option value="">All ratings</option>
                <option value="5">5 stars</option>
                <option value="4">4 stars</option>
                <option value="3">3 stars</option>
                <option value="2">2 stars</option>
                <option value="1">1 star</option>
              </select>
            </div>

            <div className="table-responsive">
              <table className="table align-middle cs-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Vendor</th>
                    <th>Rating</th>
                    <th>Feedback</th>
                    <th>Booking ID</th>
                    <th>Date</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {reviews.map((review) => (
                    <tr key={review.id}>
                      <td className="fw-semibold">
                        {review.customer_name || "Unknown customer"}
                      </td>

                      <td>
                        {review.vendor_name || "Unknown vendor"}
                      </td>

                      <td>
                        <RatingStars rating={review.rating} />
                      </td>

                      <td>
                        <span className="cs-description">
                          {review.feedback || "No feedback provided"}
                        </span>
                      </td>

                      <td>{review.booking_id ?? "—"}</td>

                      <td>{formatDate(review.created_at)}</td>

                      <td>
                        <div className="cs-actions">
                          <button
                            type="button"
                            className="btn btn-sm btn-light"
                            title="View full review"
                            onClick={() => setSelectedReview(review)}
                          >
                            <i className="bi bi-eye" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {reviews.length === 0 && (
                    <tr>
                      <td colSpan="7" className="cs-empty">
                        No reviews found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Vendor rating summaries */}
          <section className="cs-panel">
            <div className="cs-panel-heading">
              <div>
                <h4>Vendor Rating Summary</h4>
                <p>
                  Compare average ratings and review counts for vendors.
                </p>
              </div>

              <i className="bi bi-bar-chart cs-heading-icon" />
            </div>

            <div className="cs-filter-row mb-3">
              <input
                type="search"
                className="form-control"
                placeholder="Search vendors..."
                value={vendorSearch}
                onChange={(event) =>
                  setVendorSearch(event.target.value)
                }
              />

              <select
                className="form-select"
                value={minVendorRating}
                onChange={(event) =>
                  setMinVendorRating(event.target.value)
                }
              >
                <option value="">All average ratings</option>
                <option value="5">5 stars and above</option>
                <option value="4">4 stars and above</option>
                <option value="3">3 stars and above</option>
                <option value="2">2 stars and above</option>
                <option value="1">1 star and above</option>
              </select>
            </div>

            <div className="table-responsive">
              <table className="table align-middle cs-table">
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>Status</th>
                    <th>Average Rating</th>
                    <th>Total Reviews</th>
                  </tr>
                </thead>

                <tbody>
                  {vendors.map((vendor) => (
                    <tr key={vendor.vendor_id}>
                      <td className="fw-semibold">
                        {vendor.vendor_name}
                      </td>

                      <td>
                        <span className="cs-category-badge">
                          {vendor.vendor_status || "Unknown"}
                        </span>
                      </td>

                      <td>
                        {vendor.average_rating === null ||
                        vendor.average_rating === undefined ? (
                          <span className="text-muted">
                            Not rated
                          </span>
                        ) : (
                          <RatingStars
                            rating={vendor.average_rating}
                          />
                        )}
                      </td>

                      <td>{vendor.total_reviews ?? 0}</td>
                    </tr>
                  ))}

                  {vendors.length === 0 && (
                    <tr>
                      <td colSpan="4" className="cs-empty">
                        No vendor ratings found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Full review modal */}
      {selectedReview && (
        <div
          className="cs-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedReview(null);
            }
          }}
        >
          <div
            className="cs-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-modal-title"
          >
            <div className="cs-modal-header">
              <div>
                <h4 id="review-modal-title">Review Details</h4>
                <p>
                  Submitted on {formatDate(selectedReview.created_at)}
                </p>
              </div>

              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setSelectedReview(null)}
              />
            </div>

            <div className="cs-modal-body">
              <div className="mb-3">
                <strong>Customer</strong>
                <p className="mb-0">
                  {selectedReview.customer_name || "Unknown customer"}
                </p>
              </div>

              <div className="mb-3">
                <strong>Vendor</strong>
                <p className="mb-0">
                  {selectedReview.vendor_name || "Unknown vendor"}
                </p>
              </div>

              <div className="mb-3">
                <strong>Rating</strong>
                <p className="mb-0">
                  <RatingStars rating={selectedReview.rating} />
                </p>
              </div>

              <div className="mb-3">
                <strong>Booking ID</strong>
                <p className="mb-0">
                  {selectedReview.booking_id ?? "—"}
                </p>
              </div>

              <div>
                <strong>Customer Feedback</strong>
                <p className="mt-2 mb-0">
                  {selectedReview.feedback || "No feedback provided."}
                </p>
              </div>
            </div>

            <div className="cs-modal-actions">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => setSelectedReview(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RatingsReviews;
