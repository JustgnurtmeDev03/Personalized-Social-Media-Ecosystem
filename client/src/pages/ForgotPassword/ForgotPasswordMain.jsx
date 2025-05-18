import React, { useState } from "react";
import ForgotPasswordModal from "./ForgotPassword";
import ForgotPasswordCode from "./ForgotPasswordCode";
import ResetPassword from "./ResetPassword";

const ForgotPassword = () => {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");

  const handleNextStep = (enteredEmail) => {
    setEmail(enteredEmail);
    setStep("code");
  };

  const handleNextStepReset = (enteredEmail) => {
    setEmail(enteredEmail);
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
          onNext={(enteredEmail) => handleNextStepReset(enteredEmail)}
          onClose={() => setStep("email")}
        />
      )}
      {step === "password" && <ResetPassword email={email} isOpen={true} />}
    </div>
  );
};

export default ForgotPassword;
