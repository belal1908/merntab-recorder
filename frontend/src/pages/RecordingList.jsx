import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../api";

export default function RecordingList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/recording`);
        setItems(res.data);
      } catch (e) {
        setError("Failed to load recordings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p>Loading…</p>;
  if (error) return <p style={{ color: "#ef4444" }}>{error}</p>;

  return (
    <div>
      <h1>Uploaded Recordings</h1>
      {items.length === 0 && <p>No recordings yet.</p>}
      <div style={{ display: "grid", gap: 12 }}>
        {items.map((it) => (
          <div
            key={it.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{it.title || "Recording"}</div>
                <div style={{ color: "#6b7280", fontSize: 14 }}>
                  Size: {(it.size / (1024 * 1024)).toFixed(2)} MB •{" "}
                  {new Date(it.createdAt).toLocaleString()}
                </div>
              </div>
              <a
                href={it.url}
                target="_blank"
                rel="noreferrer"
                style={{ alignSelf: "center" }}
              >
                Open
              </a>
            </div>
            <video
              src={it.url}
              controls
              style={{ width: "100%", marginTop: 8, background: "#000" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
