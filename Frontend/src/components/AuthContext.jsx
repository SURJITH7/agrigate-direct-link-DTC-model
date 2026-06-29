import { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserStatus = async () => {
      // If we already have a user from login/logout, no need to check status again.
      if (user) {
        setLoading(false);
        return;
      }
      try {
        // Check local storage first to see if we should check for an admin profile
        const storedUser = user || JSON.parse(localStorage.getItem("user"));
        const profileUrl =
          storedUser && storedUser.role === "admin"
            ? "https://agrigate-backend-drsi.onrender.com/api/admin/profile"
            : "https://agrigate-backend-drsi.onrender.com/api/users/profile";
        const res = await fetch(profileUrl, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data);
          localStorage.setItem("user", JSON.stringify(data));
        } else if (res.status === 401) {
          // No token or invalid token - user is not logged in
          setUser(null);
          localStorage.removeItem("user");
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
        localStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    };

    // Re-check user status if the user object changes (e.g., on login)
    checkUserStatus();
  }, []); // Only run once on mount

  const login = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData)); // Persist user info
    setUser(userData);
  };

  const handleSessionExpired = () => {
    setUser(null);
    navigate("/login");
  };

  const privateFetch = async (url, options) => {
    const fetchOptions = { ...options, credentials: "include" };
    try {
      const response = await fetch(url, fetchOptions);
      if (response.status === 401) {
        handleSessionExpired();
        throw new Error("Session expired. Please log in again.");
      }
      return response;
    } catch (err) {
      // Network error (server down / connection refused). Recover gracefully.
      console.error("privateFetch network error:", err);
      // Optionally force logout if desired; here we return a rejected promise so callers can handle it.
      throw new Error(err.message || "Network error");
    }
  };

  const logout = async () => {
    try {
      await fetch("https://agrigate-backend-drsi.onrender.com/api/users/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.removeItem("user");
      setUser(null);
      navigate("/login");
    }
  };

  const value = { user, login, logout, loading, privateFetch };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : null /* Or a loading spinner */}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
