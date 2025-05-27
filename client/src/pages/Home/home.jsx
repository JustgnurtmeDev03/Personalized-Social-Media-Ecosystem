import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar/sidebar";
import Feed from "../../components/Feed/feed";
import { Loading } from "../../components/Loading/Loading";
import "../../styles/Main.css";
import { useAuth } from "../../providers/AuthContext";
import { Navigate } from "react-router-dom";
// import images from "../../assets/loadImage";

const Home = () => {
  const { auth } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.accessToken) return; // Ngăn gọi setTimeout nếu chưa đăng nhập
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [auth.accessToken]);

  if (!auth.accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return <Loading />;
  }
  return (
    <div className="App">
      <body>
        <div className="main-content">
          <Sidebar />
          <div className="new-feeds">
            <Feed />
          </div>
        </div>
      </body>
    </div>
  );
};

export default Home;
