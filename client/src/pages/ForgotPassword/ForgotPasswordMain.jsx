import React, { useState, useEffect } from "react";
import ForgotPasswordModal from "./ForgotPassword";
import ForgotPasswordCode from "./ForgotPasswordCode";
import ResetPassword from "./ResetPassword";

const ForgotPassword = () => {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [isResetComplete, setIsResetComplete] = useState(false);

  // Log trạng thái để debug
  useEffect(() => {
    console.log("ForgotPassword rendered with state:", {
      step,
      isModalOpen,
      isResetComplete,
    });
  }, [step, isModalOpen, isResetComplete]);

  const handleNextStep = (enteredEmail) => {
    console.log("Moving to code step with email:", enteredEmail);
    setEmail(enteredEmail);
    setStep("code");
  };

  const handleNextStepReset = (code) => {
    console.log("Moving to password step with code:", code);
    setResetCode(code);
    setStep("password");
  };

  const handleCloseAll = () => {
    console.log("Closing all modals");
    setStep("email");
    setEmail("");
    setResetCode("");
    setIsModalOpen(false);
    setIsResetComplete(true);
    console.log("After close all:", {
      step,
      isModalOpen,
      isResetComplete,
    });
    // Timeout để kiểm tra trạng thái sau khi cập nhật
    setTimeout(() => {
      console.log("After close all (timeout):", {
        step,
        isModalOpen,
        isResetComplete,
      });
    }, 0);
  };

  const handleCloseCodeModal = () => {
    console.log("Closing code modal");
    setStep("email");
  };

  // Không render nếu reset hoàn tất
  if (isResetComplete) {
    console.log("Reset complete, no modals rendered");
    return null;
  }

  // Log để kiểm tra trước khi render modal
  console.log("Rendering modal with step:", step, "isModalOpen:", isModalOpen);

  return (
    <div className={`modal-overlay-fgp ${!isModalOpen ? "hidden" : ""}`}>
      {step === "email" && isModalOpen ? (
        <ForgotPasswordModal
          isOpen={isModalOpen}
          onNext={handleNextStep}
          onClose={() => setIsModalOpen(false)}
        />
      ) : step === "code" ? (
        <ForgotPasswordCode
          email={email}
          isOpen={isModalOpen}
          onNext={handleNextStepReset}
          onClose={handleCloseCodeModal}
        />
      ) : step === "password" ? (
        <ResetPassword
          email={email}
          resetCode={resetCode}
          isOpen={isModalOpen}
          onClose={() => setStep("email")}
          onCloseAll={handleCloseAll}
        />
      ) : null}
    </div>
  );
};

export default ForgotPassword;
