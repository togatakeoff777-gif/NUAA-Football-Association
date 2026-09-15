import { ImageResponse } from "next/og";

export const alt = "南京航空航天大学天目湖足球协会";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(135deg, #071a3f 0%, #0d4b8f 70%, #1689d2 100%)",
          color: "white",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          padding: "72px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: "980px" }}>
          <div style={{ color: "#9fd6ff", fontSize: 28, letterSpacing: "0.18em" }}>
            NUAA TIANMUHU FOOTBALL ASSOCIATION
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 68, fontWeight: 800, lineHeight: 1.18, marginTop: 28 }}>
            <span>NUAA TIANMUHU</span>
            <span>FOOTBALL ASSOCIATION</span>
          </div>
          <div style={{ fontSize: 30, marginTop: 34 }}>FOR THE LOVE OF FOOTBALL · EST. 2021</div>
        </div>
      </div>
    ),
    size,
  );
}
