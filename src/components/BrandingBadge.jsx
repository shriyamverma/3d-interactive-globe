import React, { useState, useEffect } from "react";

const BrandingBadge = ({ setIsHQOpen, setIsPanelOpen }) => {
  const [views, setViews] = useState("...");

  useEffect(() => {
    async function trackPageView() {
      const endpoint = new URL(
        "https://view-counter-worker.shriyamverma.workers.dev/website/view",
      );

      endpoint.searchParams.set("page", window.location.pathname);

      try {
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        // Update the state with your actual live views
        if (data.views) {
          setViews(data.views.toLocaleString());
        }
      } catch (error) {
        console.error("View tracking failed:", error);
        setViews("offline");
      }
    }

    trackPageView();
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        bottom: "20px",
        right: "20px",
        background:
          "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.01) 100%)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        padding: "10px 20px",
        borderRadius: "30px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderTop: "1px solid rgba(255, 255, 255, 0.2)",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        gap: "15px",
        color: "rgba(255, 255, 255, 0.8)",
        fontSize: "13px",
        letterSpacing: "0.5px",
        fontWeight: "300",
      }}
    >
      {/* Live View Counter */}
      {/* {views !== "offline" && (
        <>
          <span
            title="Total Global Views"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              color: "#ccc",
            }}
          >
            <span style={{ fontSize: "14px" }}>👁</span> {views}
          </span>
          <div
            style={{
              width: "1px",
              height: "14px",
              background: "rgba(255,255,255,0.2)",
            }}
          ></div>
        </>
      )} */}

      <span
        onClick={() => {
          if (setIsPanelOpen) setIsPanelOpen(false);
          if (setIsHQOpen) setIsHQOpen(true);
        }}
        style={{ cursor: "pointer" }}
        title="Meet the Developer"
      >
        Built by{" "}
        <b
          style={{ color: "#fff", fontWeight: "600", transition: "color 0.2s" }}
          onMouseOver={(e) => (e.target.style.color = "#00ffff")}
          onMouseOut={(e) => (e.target.style.color = "#fff")}
        >
          Shriyam Verma
        </b>
      </span>

      <div
        style={{
          width: "1px",
          height: "14px",
          background: "rgba(255,255,255,0.2)",
        }}
      ></div>

      <a
        href="https://github.com/shriyamverma"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "rgba(255, 255, 255, 0.8)",
          textDecoration: "none",
          transition: "color 0.2s",
        }}
        onMouseOver={(e) => (e.target.style.color = "#fff")}
        onMouseOut={(e) => (e.target.style.color = "rgba(255, 255, 255, 0.8)")}
      >
        GitHub
      </a>

      <a
        href="https://linkedin.com/in/shriyamverma"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "rgba(255, 255, 255, 0.8)",
          textDecoration: "none",
          transition: "color 0.2s",
        }}
        onMouseOver={(e) => (e.target.style.color = "#fff")}
        onMouseOut={(e) => (e.target.style.color = "rgba(255, 255, 255, 0.8)")}
      >
        LinkedIn
      </a>
    </div>
  );
};

export default BrandingBadge;
