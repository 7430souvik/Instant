import { createContext, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext(null);

const client = axios.create({
  baseURL: "http://localhost:8000/api/v1/users",
});

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);

  // =========================
  // REGISTER
  // =========================
  const handleRegister = async (name, username, password) => {
    try {
      setLoading(true);

      const response = await client.post("/register", {
        name,
        username,
        password,
      });

      return response.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOGIN
  // =========================
  const handleLogin = async (username, password) => {
    try {
      setLoading(true);

      const response = await client.post("/login", {
        username,
        password,
      });

      if (response.status === 200) {
        const token = response.data.token;

        localStorage.setItem("token", token);

        if (response.data.user) {
          setUserData(response.data.user);
        }

        navigate("/");
      }

      return response.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = () => {
    localStorage.removeItem("token");
    setUserData(null);

    navigate("/signin");
  };

  const data = {
    userData,
    setUserData,

    loading,

    handleRegister,
    handleLogin,
    handleLogout,
  };

  return (
    <AuthContext.Provider value={data}>
      {children}
    </AuthContext.Provider>
  );
};