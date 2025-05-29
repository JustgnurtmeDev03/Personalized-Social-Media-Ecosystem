import React, { useState } from "react";
import ForgotPasswordModal from "./ForgotPassword";
import ForgotPasswordCode from "./ForgotPasswordCode";
import ResetPassword from "./ResetPassword";

const ForgotPassword = () => {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState(""); // Thêm state cho resetCode

  console.log("Current step:", step); // Kiểm tra trạng thái

  const handleNextStep = (enteredEmail) => {
    setEmail(enteredEmail);
    setStep("code");
  };

  const handleNextStepReset = (code) => {
    setResetCode(code); // Lưu resetCode
    console.log("handleNextStepReset called, setting step to password");
    setStep("password");
  };

  return (
    <div>
      {step === "email" && (
        <ForgotPasswordModal
          isOpen={true}
          onNext={(enteredEmail) => handleNextStep(enteredEmail)}
        />
      )}
      {step === "code" && (
        <ForgotPasswordCode
          email={email}
          isOpen={true}
          onNext={handleNextStepReset}
          onClose={() => setStep("email")}
        />
      )}
      {step === "password" && (
        <ResetPassword
          email={email}
          resetCode={resetCode} // Truyền resetCode
          isOpen={true}
          onClose={() => setStep("email")} // Thêm onClose để quay về bước đầu
        />
      )}
    </div>
  );
};

export default ForgotPassword;
