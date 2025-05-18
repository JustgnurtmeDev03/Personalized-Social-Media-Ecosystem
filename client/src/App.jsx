import React, { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import useAuthToken from "./services/useAuthToken";
import axios from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./providers/AuthContext";

const QueryClientInstance = new QueryClient();

function AuthenticationApp() {
  const { auth } = useAuth();
  useEffect(() => {
    // Gửi accessToken cùng với mỗi request
    if (auth.accessToken) {
      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${auth.accessToken}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [auth.accessToken]);

  return <AppRoutes />;
}
function App() {
  return (
    <QueryClientProvider client={QueryClientInstance}>
      <Router>
        <AuthProvider>
          <AuthenticationApp />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
