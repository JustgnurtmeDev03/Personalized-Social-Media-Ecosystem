import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar/sidebar";
import Feed from "../../components/Feed/feed";
import { Loading } from "../../components/Loading/Loading";
import "../../styles/Main.css";
// import images from "../../assets/loadImage";

const Home = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer); // Dọn dẹp khi component unmount
  }, []);

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
