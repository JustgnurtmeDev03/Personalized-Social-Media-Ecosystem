import React from "react";
import Footer from "../components/Footer/Footer";
import "../styles/authentication.css";

export default function LoginLayout({ children }) {
  return (
    <div>
      {children}
      <Footer />
    </div>
  );
}
