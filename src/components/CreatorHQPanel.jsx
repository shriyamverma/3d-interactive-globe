import React from "react";

const CreatorHQPanel = ({ isHQOpen, setIsHQOpen }) => {
  return (
    <div
      className={`info-panel ${isHQOpen ? "open" : ""}`}
      style={{
        border: "1px solid #ffaa00",
        boxShadow: "-5px 0 25px rgba(255, 170, 0, 0.2)",
      }}
    >
      <button className="info-panel-close" onClick={() => setIsHQOpen(false)}>
        ×
      </button>

      <div style={{ marginTop: "30px", textAlign: "center" }}>
        {/* Fetches your GitHub profile picture automatically! */}
        <div
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            margin: "0 auto 15px auto",
            border: "3px solid #ffaa00",
            backgroundImage: "url('https://github.com/shriyamverma.png')",
            backgroundSize: "cover",
          }}
        ></div>

        <h2 style={{ margin: "0 0 5px 0", color: "#ffaa00" }}>Shriyam Verma</h2>
        <h4
          style={{ margin: "0 0 20px 0", color: "#ccc", fontWeight: "normal" }}
        >
          Senior Software Engineer
        </h4>

        <p
          style={{
            fontSize: "14.5px",
            lineHeight: "1.6",
            textAlign: "left",
            marginBottom: "20px",
            color: "#eee",
          }}
        >
          Hi! I engineered this interactive globe using <b>React</b> and{" "}
          <b>Three.js</b> to demonstrate high-performance web architecture,
          optimized WebGL rendering, and seamless UX design.
        </p>
        <p
          style={{
            fontSize: "14.5px",
            lineHeight: "1.6",
            textAlign: "left",
            marginBottom: "30px",
            color: "#eee",
          }}
        >
          Based in <b>Bengaluru</b>, I specialize in architecting scalable
          systems that bridge the gap between complex technical challenges and
          core business objectives.
          <br></br> <br></br>I thrive on driving technical strategy, optimizing
          application performance, and leading cross-functional teams to deliver
          robust, high-impact software from concept to production.
        </p>

        <a
          href="mailto:xyz@gmail.com"
          style={{
            display: "block",
            padding: "12px",
            background: "#ffaa00",
            color: "#000",
            textDecoration: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          Get in Touch
        </a>
      </div>
    </div>
  );
};

export default CreatorHQPanel;
