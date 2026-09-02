import { ImageResponse } from "next/og";
import { siteName, siteTagline } from "@/lib/site";

export const alt = `${siteName} — ${siteTagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ACCENT = "#5AB2FF";
const INK = "#0A0A0A";
const MUTED = "#6B7280";
const HAIRLINE = "#E5E7EB";

const STAGES = ["Request", "Design", "Development", "Launch"];

/**
 * The link preview card. Deliberately the same vocabulary as the marketing
 * site: white base, one soft blue accent, hairline rules, no gradients.
 */
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
          backgroundColor: "#FFFFFF",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "28px", height: "28px", backgroundColor: ACCENT, borderRadius: "6px" }} />
          <div style={{ fontSize: "30px", fontWeight: 600, color: INK, letterSpacing: "-0.02em" }}>{siteName}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: "76px",
              fontWeight: 600,
              color: INK,
              letterSpacing: "-0.035em",
              lineHeight: 1.05,
              maxWidth: "900px",
            }}
          >
            A clear path from request to launch.
          </div>
          <div style={{ marginTop: "28px", fontSize: "30px", color: MUTED, lineHeight: 1.4, maxWidth: "820px" }}>
            Client and project management for a web design studio — dashboard on the web, client app on mobile.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ width: "100%", height: "1px", backgroundColor: HAIRLINE }} />
          <div style={{ display: "flex", alignItems: "center", gap: "20px", marginTop: "28px" }}>
            {STAGES.map((stage, index) => (
              <div key={stage} style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <div style={{ fontSize: "26px", color: index === STAGES.length - 1 ? ACCENT : MUTED }}>{stage}</div>
                {index < STAGES.length - 1 ? <div style={{ fontSize: "26px", color: HAIRLINE }}>→</div> : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
