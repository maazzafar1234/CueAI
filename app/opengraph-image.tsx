import { ImageResponse } from "next/og";

// Route segment config
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
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#030712",
        color: "#f8fafc",
        padding: "40px 80px",
        textAlign: "center",
        fontFamily: "sans-serif",
      }}
    >
      {/* Badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "10px 24px",
          borderRadius: "9999px",
          border: "1px solid rgba(16, 185, 129, 0.4)",
          backgroundColor: "rgba(16, 185, 129, 0.12)",
          color: "#34d399",
          fontSize: 22,
          fontWeight: 600,
          marginBottom: 36,
        }}
      >
        CueAI v1.0 • Undetectable Overlay Engine
      </div>

      {/* Dynamic Title */}
      <div
        style={{
          fontSize: 60,
          fontWeight: 800,
          letterSpacing: "-0.025em",
          lineHeight: 1.15,
          marginBottom: 28,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <span>Ace Virtual Interviews with</span>
        <span
          style={{
            marginLeft: "14px",
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
          maxWidth: "880px",
          lineHeight: 1.45,
          display: "flex",
          justifyContent: "center",
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
