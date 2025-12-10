import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { AdminProvider } from "./context/AdminContext";   // ✅ ADD THIS

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AdminProvider>     {/* ✅ WRAP ADMIN APP */}
      <App />
    </AdminProvider>
  </BrowserRouter>
);
