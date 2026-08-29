import { ImageResponse } from "next/og";

export async function GET() {
  return new ImageResponse(
    (
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
          fontFamily: "sans-serif",
          padding: "40px",
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: "#34d399",
            padding: "8px 20px",
            borderRadius: "9999px",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            marginBottom: 30,
          }}
        >
          CueAI v1.0 • Undetectable Overlay Engine
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          Ace Virtual Interviews with <span style={{ color: "#34d399" }}>Real-Time AI</span>
        </div>
        <div style={{ fontSize: 24, color: "#94a3b8", textAlign: "center", maxWidth: "800px" }}>
          Screen-share safe, sub-second streaming answers on a transparent desktop overlay.
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}