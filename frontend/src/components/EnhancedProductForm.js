import React, { useState } from "react";
import axios from "../services/axiosConfig";

const EnhancedProductForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    vendor_id: "TSONS",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await axios.post("/products", formData);
      setMessage("Product added successfully!");
      setFormData({ name: "", category: "", price: "", vendor_id: "TSONS" });
    } catch (err) {
      setMessage(
        `Error: ${err.response?.data?.error || err.message || "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-bold text-center">Add New Product</h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Product Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    placeholder="Enter product name"
                    className="input-field"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="category" className="form-label">
                    Category
                  </label>
                  <input
                    id="category"
                    type="text"
                    name="category"
                    placeholder="e.g., Cooking"
                    className="input-field"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="price" className="form-label">
                    Price
                  </label>
                  <input
                    id="price"
                    type="number"
                    name="price"
                    placeholder="Enter price"
                    className="input-field"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0.01"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="vendor_id" className="form-label">
                    Vendor ID
                  </label>
                  <input
                    id="vendor_id"
                    type="text"
                    name="vendor_id"
                    placeholder="Enter vendor ID"
                    className="input-field"
                    value={formData.vendor_id}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`btn-primary w-full ${
                      loading ? "opacity-75 cursor-not-allowed" : ""
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <svg
                          className="loading-spinner mr-2"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Adding Product...
                      </div>
                    ) : (
                      "Add Product"
                    )}
                  </button>
                </div>

                {message && (
                  <div
                    className={`mt-4 p-3 rounded ${
                      message.includes("Error")
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                    aria-live="polite"
                  >
                    <h3 className="text-sm font-medium">{message}</h3>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedProductForm;
