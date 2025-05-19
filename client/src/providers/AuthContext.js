import { jwtDecode } from "jwt-decode";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    userId: null,
    roles: [],
    accessToken: null,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("accessToken");
      console.log("Token from localStorage:", token);

      if (!token) {
        setAuth({ userId: null, roles: [], accessToken: null });
        setLoading(false);
        navigate("/login");
        return;
      }

      try {
        const decoded = jwtDecode(token);
        console.log("Decoded token payload:", decoded);

        if (!decoded.id || !decoded.roles) {
          console.warn("Token không chứa id và roles");
          setAuth({
            userId: null,
            roles: [],
            accessToken: token,
          });
          localStorage.removeItem("accessToken");
          navigate("/login");
        } else {
          const currentTime = Date.now() / 1000;
          if (decoded.exp && decoded.exp < currentTime) {
            console.warn("Token có thể đã hết hạn phía client");
            setAuth({
              userId: decoded.id,
              roles: [],
              accessToken: token,
            });
            navigate("/login");
          } else {
            setAuth({
              userId: decoded.id,
              roles: decoded.roles,
              accessToken: token,
            });
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        localStorage.removeItem("accessToken");
        setAuth({ userId: null, roles: [], accessToken: null });
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
      setAuth({ userId: null, roles: [], accessToken: null });
      navigate("/login");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      console.log("Updated token payload:", decoded);
      console.log("Roles in updateAuth:", decoded.roles);

      if (!decoded.id || !decoded.roles) {
        throw new Error("Token không chứa userId hoặc roles");
      }

      const currentTime = Date.now() / 1000;
      if (decoded.exp && decoded.exp < currentTime) {
        console.warn("Token có thể đã hết hạn");
      }

      localStorage.setItem("accessToken", token);

      setAuth({
        userId: decoded.id,
        roles: decoded.roles,
        accessToken: token,
      });
    } catch (error) {
      console.error("Error updating auth:", error);
      localStorage.removeItem("accessToken");
      setAuth({ userId: null, roles: [], accessToken: null });
      navigate("/login");
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setAuth({ userId: null, roles: [], accessToken: null });
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
