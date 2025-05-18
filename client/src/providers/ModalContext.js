import React, { createContext, useContext, useState } from "react";

// Tạo Context
const ModalContext = createContext();

// Provider chứa toàn bộ state của modal
export const ModalProvider = ({ children }) => {
  const accessToken = localStorage.getItem("accessToken");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);

  return (
    <ModalContext.Provider
      value={{
        accessToken,
        isProfileModalOpen,
        setIsProfileModalOpen,
        isBioModalOpen,
        setIsBioModalOpen,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);
