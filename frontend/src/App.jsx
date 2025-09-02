import React from "react";
import { Routes, Route, Link, NavLink } from "react-router-dom";
import Recorder from "./pages/Recorder.jsx";
import RecordingList from "./pages/RecordingList.jsx";

const navStyle = ({ isActive }) => ({
  padding: "8px 12px",
  borderRadius: 6,
  textDecoration: "none",
  color: isActive ? "white" : "#1f2937",
  background: isActive ? "#2563eb" : "transparent",
});

export default function App() {
  return (
    <div
      style={{
        fontFamily:
          "system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell",
        color: "#111827",
      }}
    >
      <header
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          padding: 16,
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <Link
          to="/"
          style={{
            fontWeight: 700,
            fontSize: 18,
            color: "#111827",
            textDecoration: "none",
          }}
        >
          Tab Recorder
        </Link>
        <nav style={{ display: "flex", gap: 8 }}>
          <NavLink to="/" style={navStyle} end>
            Record
          </NavLink>
          <NavLink to="/recording" style={navStyle}>
            Recording
          </NavLink>
        </nav>
      </header>
      <main style={{ maxWidth: 960, margin: "24px auto", padding: "0 16px" }}>
        <Routes>
          <Route path="/" element={<Recorder />} />
          <Route path="/recording" element={<RecordingList />} />
        </Routes>
      </main>
    </div>
  );
}
