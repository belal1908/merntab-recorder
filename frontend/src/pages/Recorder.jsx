import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE } from "../api";
import Timer from "../components/Timer.jsx";

export default function Recorder() {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [blob, setBlob] = useState(null);
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("");
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startAtRef = useRef(0);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current)
        streamRef.current.getTracks().forEach((t) => t.stop());
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  const start = async () => {
    setStatus("");
    setBlob(null);
    setUrl("");

    try {
      // 1) Capture the current tab (user must select This Tab in chooser)
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: false, 
      });

      // 2) Capture microphone audio
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: false,
      });

      // 3) Combine: video track from display + audio track from mic
      const tracks = [];
      const vTrack = displayStream.getVideoTracks()[0];
      if (vTrack) tracks.push(vTrack);
      const aTrack = micStream.getAudioTracks()[0];
      if (aTrack) tracks.push(aTrack);
      const mixedStream = new MediaStream(tracks);

      streamRef.current = mixedStream;

      // 4) Prepare MediaRecorder
      const mimeTypes = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
      ];
      const mimeType =
        mimeTypes.find((t) => MediaRecorder.isTypeSupported(t)) || "";
      const mr = new MediaRecorder(mixedStream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || "video/webm",
        });
        chunksRef.current = [];
        setBlob(blob);
        const url = URL.createObjectURL(blob);
        setUrl(url);
        setRecording(false);
        // stop underlying streams
        displayStream.getTracks().forEach((t) => t.stop());
        micStream.getTracks().forEach((t) => t.stop());
      };

      // 5) Start
      mr.start(250); // timeslice for chunks
      setRecording(true);
      startAtRef.current = Date.now();
      setElapsed(0);
      timerRef.current = setInterval(() => {
        const ms = Date.now() - startAtRef.current;
        setElapsed(ms);
        if (ms >= 3 * 60 * 1000) stop(); // auto stop at 3 minutes
      }, 200);
    } catch (e) {
      console.error(e);
      setStatus(
        'Permission denied or capture failed. Use Chrome and select "This Tab".'
      );
    }
  };

  const stop = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const download = () => {
    if (!blob) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `recording-${new Date().toISOString()}.webm`;
    a.click();
  };

  const upload = async () => {
    if (!blob) return;
    try {
      setStatus("Uploading...");
      const form = new FormData();
      const filename = `recording-${Date.now()}.webm`;
      form.append("file", blob, filename);
      form.append("title", filename);
      form.append("durationMs", String(elapsed));
      const res = await axios.post(`${API_BASE}/api/recording`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStatus(`Uploaded ✓ → ${res.data.url}`);
    } catch (e) {
      console.error(e);
      setStatus("Upload failed");
    }
  };

  return (
    <div>
      <h1>Record current tab + mic</h1>
      <p style={{ color: "#6b7280" }}>
        Chrome required. Max 3 minutes per recording.
      </p>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          margin: "12px 0",
        }}
      >
        {!recording ? (
          <button onClick={start} style={btn}>
            Start
          </button>
        ) : (
          <button onClick={stop} style={{ ...btn, background: "#ef4444" }}>
            Stop
          </button>
        )}
        <div style={{ fontSize: 18 }}>
          <b>Timer:</b> <Timer ms={elapsed} /> / 03:00
        </div>
      </div>

      {status && (
        <div
          style={{
            marginTop: 8,
            color: status.includes("✓") ? "#16a34a" : "#ef4444",
          }}
        >
          {status}
        </div>
      )}

      {url && (
        <div style={{ marginTop: 16 }}>
          <h2>Preview</h2>
          <video
            src={url}
            controls
            playsInline
            style={{ width: "100%", maxWidth: 720, background: "#000" }}
          ></video>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={download} style={btn}>
              Download
            </button>
            <button onClick={upload} style={btn}>
              Upload
            </button>
          </div>
        </div>
      )}

      <details style={{ marginTop: 16 }}>
        <summary>Troubleshooting</summary>
        <ul>
          <li>
            Use Chrome on desktop. When prompted, choose <b>This Tab</b> and
            check <b>Share tab audio</b> if available.
          </li>
          <li>
            If mic not captured, allow microphone permission and try again.
          </li>
          <li>
            Safari/Firefox support is limited; stretch goal is adding feature
            detection.
          </li>
        </ul>
      </details>
    </div>
  );
}

const btn = {
  background: "#2563eb",
  color: "white",
  border: 0,
  padding: "8px 14px",
  borderRadius: 8,
  cursor: "pointer",
};
