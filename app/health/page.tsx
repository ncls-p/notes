"use client";

import { useEffect, useState } from "react";

export default function HealthPage() {
  const [apiStatus, setApiStatus] = useState("checking...");

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        setApiStatus(data.status);
      })
      .catch((error) => {
        console.error("Error fetching health status:", error);
        setApiStatus("error");
      });
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Health Check</h1>
      <p>API Status: {apiStatus}</p>
    </div>
  );
}
