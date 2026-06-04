import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useLanguage } from "../i18n/LanguageProvider";
import api from "/src/api.js";
import toast from "../utils/toastShim";
import socket from "../socket";

const MyProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const _langCtx = useLanguage() || {};
  const t = _langCtx.t || ((k) => (typeof k === "string" ? k : ""));

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/api/products");
        setProducts(data);
      } catch (err) {
        setError(t("errorFetchingProducts"));
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [t]);

  useEffect(() => {
    const handleFarmerProductAdded = (data) => {
      console.log("New product added:", data);
      setProducts((prevProducts) => [data.product, ...prevProducts]);
      toast.success(data.message || "New product added successfully!");
    };

    const handleProductApproved = (data) => {
      console.log("Product approved:", data);
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p._id === data.product._id ? { ...p, status: "approved" } : p,
        ),
      );
      toast.success(data.message || "Product approved!");
    };

    const handleProductRejected = (data) => {
      console.log("Product rejected:", data);
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p._id === data.product._id ? { ...p, status: "rejected" } : p,
        ),
      );
      toast.error(
        data.message || "Product rejected. Please check approval notes.",
      );
    };

    socket.on("farmer_product_added", handleFarmerProductAdded);
    socket.on("product_approved", handleProductApproved);
    socket.on("product_rejected", handleProductRejected);

    return () => {
      socket.off("farmer_product_added", handleFarmerProductAdded);
      socket.off("product_approved", handleProductApproved);
      socket.off("product_rejected", handleProductRejected);
    };
  }, []);

  const handleStatusChange = async (productId, newStatus) => {
    try {
      const { data: updatedProduct } = await api.put(
        `/api/products/${productId}/status`,
        { status: newStatus }
      );
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p._id === productId ? { ...p, status: updatedProduct.status } : p
        )
      );
      toast.success(t("statusUpdatedSuccess"));
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error(t("statusUpdatedError"));
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm(t("confirmDeleteProduct"))) {
      try {
        await api.delete(`/api/products/${productId}`);
        setProducts((prevProducts) =>
          prevProducts.filter((p) => p._id !== productId)
        );
        toast.success(t("productDeletedSuccess"));
      } catch (err) {
        console.error("Failed to delete product:", err);
        toast.error(t("productDeletedError"));
      }
    }
  };

  if (loading) return <div>{t("loading")}</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  const isAdmin = user?.role === "admin";

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>{isAdmin ? t("manageProducts") : t("myProducts")}</h1>
        {!isAdmin && (
          <Link to="/farmer/add-product" className="btn btn-primary">
            {t("addProduct")}
          </Link>
        )}
      </div>

      {products.length === 0 ? (
        <p>{t("noProductsFound")}</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>{t("productImage")}</th>
                <th>{t("productName")}</th>
                {isAdmin && <th>{t("farmerName")}</th>}
                <th>{t("priceLabel")}</th>
                <th>{t("category")}</th>
                <th>{t("stock")}</th>
                <th>{t("statusLabel")}</th>
                <th>{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id}>
                  <td>
                    <img
                      src={
                        product.image
                          ? `${api.defaults.baseURL}${product.image}`
                          : "https://via.placeholder.com/50"
                      }
                      alt={product.name}
                      style={{ width: "50px", height: "50px" }}
                    />
                  </td>
                  <td>{product.name}</td>
                  {isAdmin && (
                    <td>{product.farmerId?.farmName || t("notAvailable")}</td>
                  )}
                  <td>₹{product.price}</td>
                  <td>{product.category}</td>
                  <td>
                    {product.status === "rejected" ? (
                      <span className="text-danger">{t("outOfStock")}</span>
                    ) : (
                      `${product.quantity} ${product.unit || ""}`
                    )}
                  </td>
                  <td>
                    {isAdmin ? (
                      <select
                        className="form-select"
                        value={product.status}
                        onChange={(e) =>
                          handleStatusChange(product._id, e.target.value)
                        }
                      >
                        <option value="pending">{t("pending")}</option>
                        <option value="approved">{t("approved")}</option>
                        <option value="rejected">{t("rejected")}</option>
                      </select>
                    ) : (
                      <span
                        className={`badge bg-${
                          product.status === "approved"
                            ? "success"
                            : product.status === "pending"
                            ? "warning"
                            : "danger"
                        }`}
                      >
                        {t(product.status)}
                      </span>
                    )}
                  </td>
                  <td>
                    {isAdmin ? (
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="btn btn-sm btn-danger"
                      >
                        {t("delete")}
                      </button>
                    ) : (
                      <Link
                        to={`/farmer/edit-product/${product._id}`}
                        className="btn btn-sm btn-secondary"
                      >
                        {t("edit")}
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyProducts;
