import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Homesteader Labs — Off-grid hardware & fabrication tools";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#14110d",
          padding: "72px 88px",
          fontFamily: "monospace",
          color: "#E8D3BE",
          position: "relative",
        }}
      >
        {/* Top: brand label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 22,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#ff7300",
          }}
        >
          <div style={{ width: 14, height: 14, background: "#ff7300" }} />
          Homesteader Labs
        </div>

        {/* Middle: tagline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div
            style={{
              fontSize: 84,
              lineHeight: 1.05,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
            }}
          >
            Tools for those who build
            <br />
            <span style={{ color: "#ff7300" }}>their own world.</span>
          </div>
          <div
            style={{
              fontSize: 26,
              opacity: 0.55,
              letterSpacing: "0.04em",
            }}
          >
            Planting calendar · Weather index · Caloric security · Fabrication
          </div>
        </div>

        {/* Bottom: footer line */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 18,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            opacity: 0.4,
          }}
        >
          <span>Field Station // HL_CORP</span>
          <span>homesteaderlabs.com</span>
        </div>

        {/* Corner brackets */}
        {[
          { top: 24, left: 24, borderTop: 4, borderLeft: 4 },
          { top: 24, right: 24, borderTop: 4, borderRight: 4 },
          { bottom: 24, left: 24, borderBottom: 4, borderLeft: 4 },
          { bottom: 24, right: 24, borderBottom: 4, borderRight: 4 },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 40,
              height: 40,
              borderColor: "#ff7300",
              borderStyle: "solid",
              borderWidth: 0,
              ...pos,
            }}
          />
        ))}
      </div>
    ),
    { ...size }
  );
}
