import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "servo-mcp | Desktop MCP Server for AI Agents | macOS & Windows",
  description:
    "servo-mcp is a desktop MCP server for Claude Code. Take screenshots, click buttons, type text, and verify AI work on macOS and Windows. Install via npm. Open source, 100% local, no telemetry.",
  keywords: [
    "servo-mcp",
    "MCP server",
    "desktop MCP server",
    "Model Context Protocol",
    "Claude Code",
    "desktop automation",
    "AI agent",
    "screen control",
    "MCP tools",
    "open source",
    "macOS",
    "Windows",
    "npm package",
    "cross-platform",
    "desktop control",
    "AI verification",
    "screenshot",
    "automation",
  ],
  authors: [{ name: "Dragos Strugar", url: "https://dragosstrugar.com" }],
  creator: "Dragos Strugar",
  metadataBase: new URL("https://servo-mcp.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://servo-mcp.com",
    siteName: "servo-mcp",
    title: "servo-mcp - Desktop MCP Server for AI Agents",
    description:
      "A desktop MCP server for Claude Code. Take screenshots, click buttons, and verify AI work on macOS and Windows. Install via npm. Open source, 100% local, no telemetry.",
  },
  twitter: {
    card: "summary_large_image",
    title: "servo-mcp - Desktop MCP Server for AI Agents",
    description:
      "A desktop MCP server for Claude Code. Take screenshots, click buttons, and verify AI work on macOS and Windows. Install via npm. Open source, 100% local, no telemetry.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
