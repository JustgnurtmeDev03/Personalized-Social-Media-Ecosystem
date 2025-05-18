import React, { useState, useEffect } from "react";
import images from "../../assets/loadImage";
import { useNavigate } from "react-router-dom";
import Register from "../Register/Register.jsx";
import ForgotPasswordModal from "../ForgotPassword/ForgotPassword";
import ForgotPasswordCode from "../ForgotPassword/ForgotPasswordCode";
import ResetPassword from "../ForgotPassword/ResetPassword";
import useAuthToken from "../../services/useAuthToken";
import {
  codeSchema,
  emailSchema,
  loginSchema,
  passwordSchema,
} from "../../utils/validationSchema";
import { loginUser, verifyResetCode } from "../../services/authService";

const Login = ({ setIsAuthenticated }) => {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [step, setStep] = useState("email");
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showForgotPasswordForm, setForgotPasswordOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loginAttempted, setLoginAttempted] = useState(false); // Added state for loginAttempted
  const { setAccessToken } = useAuthToken();
  const navigate = useNavigate();

  // ======================== LOGIC ===========================

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginAttempted(true); // Update state when clicking "Login"
    try {
      await loginSchema.validate({ password, email });

      const data = await loginUser(email, password);

      const accessToken = data.result.accessToken;
      setAccessToken(accessToken);

      // Lưu vào localStorage & cập nhật state
      localStorage.setItem("accessToken", accessToken);
      setAccessToken(accessToken);
      setIsAuthenticated(true);

      setSuccessMessage("Login successful");

      setErrorMessage("");

      navigate("/home");
    } catch (error) {
      console.error(error);
      setErrorMessage("Mật khẩu hoặc Email không đúng!");
      setSuccessMessage("");
    }
  };

  const handleRegisterClick = () => {
    setShowRegisterForm(true);
    setLoginAttempted(false); // Ensure no change in state when clicking "Create Account"
  };

  const handleForgotPasswordClick = () => {
    setForgotPasswordOpen(true);
  };

  const handleForgotPasswordNext = async (enteredEmail) => {
    setResetCode(resetCode);
    try {
      await emailSchema.validate({ email: enteredEmail });
      setEmail(enteredEmail);
      setStep("code");
      setForgotPasswordOpen(false);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleCodeVerification = async (enteredResetCode) => {
    setResetCode(enteredResetCode);
    try {
      await codeSchema.validate({ code: resetCode });
      const isValid = await verifyResetCode(email, resetCode);
      console.log("Is valid reset code:", isValid);
      if (isValid === true) {
        setStep("password");
        console.log("Code verified successfully.");
      } else {
        setErrorMessage("Invalid reset code. Please check and try again.");
      }
    } catch (err) {
      setErrorMessage("Invalid reset code. Please check and try again.");
    }
  };

  // ======================== EFFECTS ===========================

  useEffect(() => {
    console.log("Current step updated to:", step);
  }, [step]);

  // ======================== RENDER ===========================

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

            {loginAttempted &&
              errorMessage && ( // Show error message if login attempted
                <div
                  className="flex text-center justify-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-3 rounded relative"
                  role="alert"
                >
                  <span className="block">{errorMessage}</span>
                </div>
              )}
            {loginAttempted &&
              successMessage && ( // Show success message if login attempted
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
        <ForgotPasswordModal
          isOpen={showForgotPasswordForm}
          onClose={() => setForgotPasswordOpen(false)}
          onNext={(email) => handleForgotPasswordNext(email)}
        />
      )}

      {step === "code" && (
        <ForgotPasswordCode
          isOpen={step === "code"}
          email={email}
          onClose={() => setStep("email")}
          onNext={handleCodeVerification}
        />
      )}

      {step === "password" && (
        <ResetPassword
          isOpen={step === "password"}
          email={email}
          resetCode={resetCode}
          onClose={() => setStep("code")}
        />
      )}

      {showRegisterForm && (
        <Register onClose={() => setShowRegisterForm(false)} />
      )}
    </div>
  );
};

export default Login;
