import { ImageResponse } from "next/og";

// Route segment config (Optional: Edge runtime accelerates response generation)
export const runtime = "edge";

// Image Metadata Config
export const alt = "CueAI — Dynamic Social Preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    // Image Container (Only Flexbox layout is supported, no grid!)
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#030712",
        backgroundImage:
          "radial-gradient(circle at 25px 25px, rgba(31, 41, 55, 0.4) 2px, transparent 0)",
        backgroundSize: "48px 48px",
        color: "#f8fafc",
        padding: "40px 80px",
        textAlign: "center",
      }}
    >
      {/* Badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "8px 18px",
          borderRadius: "9999px",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          color: "#34d399",
          fontSize: 20,
          fontWeight: 600,
          marginBottom: 32,
        }}
      >
        CueAI v1.0 • Undetectable Overlay Engine
      </div>

      {/* Dynamic Title */}
      <div
        style={{
          fontSize: 64,
          fontWeight: 800,
          letterSpacing: "-0.025em",
          lineHeight: 1.1,
          marginBottom: 24,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        Ace Virtual Interviews with
        <span
          style={{
            marginLeft: "12px",
            color: "#34d399",
          }}
        >
          Real-Time AI Teleprompts
        </span>
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: 26,
          color: "#94a3b8",
          maxWidth: "900px",
          lineHeight: 1.4,
        }}
      >
        Screen-share safe, sub-second streaming answers on a transparent desktop
        overlay.
      </div>
    </div>,
    {
      ...size,
    },
  );
}
