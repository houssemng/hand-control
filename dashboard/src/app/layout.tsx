import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hand Control Hub | Live Multi-Camera Surveillance & AI Dashboard",
  description: "Live multi-webcam monitoring dashboard with real-time hand gesture telemetry, multi-cam grid, FPS tracking, and hardware controls.",
  keywords: ["hand control", "webcam dashboard", "multi-camera", "mediapipe", "gesture recognition", "live streaming"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>{children}</body>
    </html>
  );
}
