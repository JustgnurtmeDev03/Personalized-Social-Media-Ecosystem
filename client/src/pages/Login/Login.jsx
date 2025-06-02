import React, { useState, useEffect } from "react";
import images from "../../assets/loadImage";
import { useNavigate } from "react-router-dom";
import Register from "../Register/Register.jsx";
import ForgotPassword from "../ForgotPassword/ForgotPasswordMain";
import useAuthToken from "../../services/useAuthToken";
import { loginSchema } from "../../utils/validationSchema";
import { loginUser } from "../../services/authService";
import { useAuth } from "../../providers/AuthContext";
import { jwtDecode } from "jwt-decode";

const Login = ({ setIsAuthenticated }) => {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showForgotPasswordForm, setForgotPasswordOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loginAttempted, setLoginAttempted] = useState(false);
  const { setAccessToken } = useAuthToken();
  const { updateAuth } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginAttempted(true);
    try {
      await loginSchema.validate({ password, email });
      const data = await loginUser(email, password);
      const accessToken = data.result.accessToken;
      localStorage.setItem("accessToken", accessToken);

      updateAuth(accessToken);

      const decoded = jwtDecode(accessToken);
      const roles = decoded.roles || [];
      const adminRoles = ["admin", "Top admin", "moderator"];

      if (adminRoles.some((role) => roles.includes(role))) {
        navigate("/admin/dashboard");
      } else {
        navigate("/home");
      }

      setIsAuthenticated(true);
      setSuccessMessage("Login successful");
      setErrorMessage("");
    } catch (error) {
      console.error(error);
      setErrorMessage("Mật khẩu hoặc Email không đúng!");
      setSuccessMessage("");
    }
  };

  const handleRegisterClick = () => {
    setShowRegisterForm(true);
    setLoginAttempted(false);
  };

  const handleForgotPasswordClick = () => {
    console.log("Opening forgot password modal");
    setForgotPasswordOpen(true);
  };

  return (
    <div className="login-main">
      <div className="login-container">
        <div className="background-login">
          <img
            src={images["background.jpg"]}
            alt="background-login"
            width="1785px"
            height="510px"
          />
        </div>
        <div className="form-login">
          <form onSubmit={handleLogin}>
            <div className="txt-login txt-align">
              Đăng nhập với tài khoản Gens của bạn
            </div>
            <div className="form-input">
              <input
                className="input-styled"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-input">
              <input
                className="input-styled"
                type="password"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="mg-b">
              <button type="submit" className="login-btn">
                <div className="login-btn-styled">Đăng nhập</div>
              </button>
            </div>

            {loginAttempted && errorMessage && (
              <div
                className="flex text-center justify-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-3 rounded relative"
                role="alert"
              >
                <span className="block">{errorMessage}</span>
              </div>
            )}
            {loginAttempted && successMessage && (
              <div
                className="flex text-center justify-center bg-green-100 border border-green-400 text-green-700 px-4 py-3 mb-3 rounded relative"
                role="alert"
              >
                <span className="block">{successMessage}</span>
              </div>
            )}

            <div className="txt-align">
              <span className="forgot-pw">
                <button type="button" onClick={handleForgotPasswordClick}>
                  Quên mật khẩu
                </button>
              </span>
            </div>

            <div className="other-method">
              <div className="txt-or">or</div>
              <hr />
            </div>
            <div className="other-method">
              <div className="other-login">
                <div className="content-method">
                  <button
                    type="button"
                    className="register"
                    onClick={handleRegisterClick}
                  >
                    Tạo tài khoản
                  </button>
                </div>
              </div>
            </div>
            <div className="other-login">
              <div className="logo-method">
                <img
                  src={images["google.jpg"]}
                  alt="Google"
                  width="45"
                  height="45"
                />
              </div>
              <div className="content-method">
                <span>Tiếp tục với Google</span>
              </div>
              <i
                className="fa-solid fa-angle-right"
                style={{ color: "rgb(153, 153, 153)" }}
              ></i>
            </div>
          </form>
        </div>
      </div>
      {showForgotPasswordForm && (
        <ForgotPassword onClose={() => setForgotPasswordOpen(false)} />
      )}
      {showRegisterForm && (
        <Register onClose={() => setShowRegisterForm(false)} />
      )}
    </div>
  );
};

export default Login;
