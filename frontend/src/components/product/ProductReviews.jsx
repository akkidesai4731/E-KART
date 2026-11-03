import { useCallback, useEffect, useState } from "react";

const API_URL = "http://192.168.1.102:8000/api/reviews";

export default function ProductReviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);

  const [rating, setRating] = useState(5);
  const [customerName, setCustomerName] = useState("");
  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadReviews = useCallback(async () => {
    if (!productId) {
      setReviews([]);
      setAverage(0);
      setCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/${encodeURIComponent(productId)}`,
        { cache: "no-store" },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load reviews.");
      }

      const latestReviews = Array.isArray(data.reviews) ? data.reviews : [];

      setReviews(latestReviews);
      setCount(Number(data.count ?? latestReviews.length));
      setAverage(
        Number(
          data.averageRating ??
            (latestReviews.length
              ? latestReviews.reduce(
                  (total, review) => total + Number(review.rating || 0),
                  0,
                ) / latestReviews.length
              : 0),
        ),
      );
    } catch (err) {
      setError(err.message || "Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!productId) {
      setError("Product ID is missing. Please reopen the product page.");
      return;
    }

    if (!customerName.trim() || !comment.trim()) {
      setError("Please enter your name and review.");
      return;
    }

    if (rating < 1 || rating > 5) {
      setError("Please select a rating from 1 to 5 stars.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `${API_URL}/${encodeURIComponent(productId)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerName: customerName.trim(),
            rating,
            comment: comment.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not submit review.");
      }

      setCustomerName("");
      setComment("");
      setRating(5);
      setMessage("Thank you! Your review has been submitted.");

      // Reload the latest review list and rating from the backend.
      await loadReviews();
    } catch (err) {
      setError(err.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold">Customer Reviews</h2>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-2xl font-bold">{average.toFixed(1)}</span>

        <span className="text-xl text-amber-500">★</span>

        <span className="text-gray-500">
          ({count} {count === 1 ? "review" : "reviews"})
        </span>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <h3 className="text-lg font-semibold">Write a Review</h3>

        <div>
          <label className="mb-2 block font-medium">Your Rating</label>

          <div className="flex gap-2" role="group" aria-label="Select rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                aria-label={`${star} star${star > 1 ? "s" : ""}`}
                aria-pressed={rating === star}
                className={`text-3xl transition ${
                  star <= rating
                    ? "text-amber-400"
                    : "text-gray-300 hover:text-amber-300"
                }`}
              >
                ★
              </button>
            ))}
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Selected rating: {rating}/5
          </p>
        </div>

        <div>
          <label htmlFor="review-name" className="mb-1 block font-medium">
            Your Name
          </label>

          <input
            id="review-name"
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            maxLength={80}
            required
            className="w-full rounded-lg border p-3 outline-none focus:border-red-500"
            placeholder="Enter your name"
          />
        </div>

        <div>
          <label htmlFor="review-comment" className="mb-1 block font-medium">
            Your Review
          </label>

          <textarea
            id="review-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={1000}
            required
            rows={4}
            className="w-full rounded-lg border p-3 outline-none focus:border-red-500"
            placeholder="Share your experience with this product..."
          />
        </div>

        <button
          type="submit"
          disabled={submitting || loading}
          className="rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>

        {message && (
          <p role="status" className="text-sm text-green-700">
            {message}
          </p>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </form>

      <div className="mt-8 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">What customers say</h3>

          <button
            type="button"
            onClick={loadReviews}
            disabled={loading}
            className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh reviews"}
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading reviews...</p>
        ) : error && reviews.length === 0 ? (
          <p className="text-red-600">{error}</p>
        ) : reviews.length === 0 ? (
          <p className="text-gray-500">
            No reviews yet. Be the first to review this product!
          </p>
        ) : (
          reviews.map((review) => (
            <article key={review._id} className="border-t border-gray-100 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">
                  {review.customerName || "Customer"}
                </p>

                <span className="text-sm text-gray-500">
                  {review.createdAt
                    ? new Date(review.createdAt).toLocaleDateString("en-IN")
                    : ""}
                </span>
              </div>

              <p
                className="mt-1 text-amber-500"
                aria-label={`${review.rating} out of 5 stars`}
              >
                {"★".repeat(
                  Math.min(5, Math.max(0, Number(review.rating) || 0)),
                )}
                <span className="text-gray-300">
                  {"★".repeat(
                    5 - Math.min(5, Math.max(0, Number(review.rating) || 0)),
                  )}
                </span>
              </p>

              <p className="mt-2 whitespace-pre-wrap text-gray-700">
                {review.comment}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
