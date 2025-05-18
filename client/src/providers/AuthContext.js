import { jwtDecode } from "jwt-decode";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    userId: null,
    accessToken: null,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("accessToken");
      console.log("Token from localStorage:", token);

      if (!token) {
        setAuth({ userId: null, accessToken: null });
        setLoading(false);
        navigate("/login");
        return;
      }

      try {
        const decoded = jwtDecode(token);
        console.log("Decoded token payload:", decoded);

        if (!decoded.id) {
          console.warn("Token không chứa id, sẽ thử sử dụng token");
          setAuth({
            userId: null,
            accessToken: token,
          });
        } else {
          const currentTime = Date.now() / 1000;
          if (decoded.exp && decoded.exp < currentTime) {
            console.warn(
              "Token có thể đã hết hạn phía client, nhưng sẽ giữ lại để server kiểm tra"
            );
          }
          setAuth({
            userId: decoded.id,
            accessToken: token,
          });
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        localStorage.removeItem("accessToken");
        setAuth({ userId: null, accessToken: null });
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [navigate]);

  const updateAuth = (token) => {
    if (!token) {
      localStorage.removeItem("accessToken");
      setAuth({ userId: null, accessToken: null });
      navigate("/login");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      console.log("Updated token payload:", decoded);

      if (!decoded.id) {
        throw new Error("Token không chứa userId");
      }

      const currentTime = Date.now() / 1000;
      if (decoded.exp && decoded.exp < currentTime) {
        console.warn(
          "Token có thể đã hết hạn phía client, nhưng sẽ giữ lại để server kiểm tra"
        );
      }

      localStorage.setItem("accessToken", token);
      setAuth({
        userId: decoded.id,
        accessToken: token,
      });
    } catch (error) {
      console.error("Error updating auth:", error);
      localStorage.removeItem("accessToken");
      setAuth({ userId: null, accessToken: null });
      navigate("/login");
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setAuth({ userId: null, accessToken: null });
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{ auth, setAuth, updateAuth, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
