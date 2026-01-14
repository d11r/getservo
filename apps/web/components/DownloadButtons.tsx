"use client";

import { useEffect, useState } from "react";

const GITHUB_REPO = "d11r/getservo";
const RELEASE_BASE = `https://github.com/${GITHUB_REPO}/releases/latest/download`;

const downloads = {
  macosArm64: {
    url: `${RELEASE_BASE}/Servo-macos-arm64.zip`,
    label: "macOS (Apple Silicon)",
  },
  macosX64: {
    url: `${RELEASE_BASE}/Servo-macos-x64.zip`,
    label: "macOS (Intel)",
  },
  windows: {
    url: `${RELEASE_BASE}/Servo.exe`,
    label: "Windows",
  },
};

type Platform = "macosArm64" | "macosX64" | "windows" | null;

function detectPlatform(): Platform {
  if (typeof window === "undefined") return null;

  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || "";

  // Check for Windows
  if (ua.includes("win") || platform.includes("win")) {
    return "windows";
  }

  // Check for macOS
  if (ua.includes("mac") || platform.includes("mac")) {
    // Try to detect Apple Silicon
    // Check for ARM indicators in userAgent or use GPU detection
    const isArm =
      ua.includes("arm") ||
      // Safari on Apple Silicon sometimes includes this
      /mac.*arm/i.test(ua) ||
      // Check platform for arm64
      platform.includes("arm") ||
      // Modern approach: check if running on Apple Silicon via GPU
      (typeof navigator !== "undefined" &&
        // @ts-expect-error - userAgentData is experimental
        navigator.userAgentData?.platform === "macOS" &&
        // @ts-expect-error - userAgentData is experimental
        navigator.userAgentData?.architecture === "arm");

    // Default to ARM for newer Macs (post-2020), Intel for older detection
    // Since we can't reliably detect, we'll check screen/memory hints
    // Apple Silicon Macs generally have devicePixelRatio >= 2
    const likelyArm =
      isArm ||
      (window.devicePixelRatio >= 2 &&
        // @ts-expect-error - deviceMemory is experimental
        (navigator.deviceMemory === undefined || navigator.deviceMemory >= 8));

    return likelyArm ? "macosArm64" : "macosX64";
  }

  return null;
}

export function DownloadButtons() {
  const [detectedPlatform, setDetectedPlatform] = useState<Platform>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDetectedPlatform(detectPlatform());
  }, []);

  const allPlatforms: Platform[] = ["macosArm64", "macosX64", "windows"];
  const otherPlatforms = allPlatforms.filter((p) => p !== detectedPlatform);

  // Show loading state or default layout before hydration
  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          {allPlatforms.map((platform) => (
            <a
              key={platform}
              href={downloads[platform!].url}
              className="inline-flex h-12 w-56 items-center justify-center rounded-lg border border-foreground/20 px-6 text-sm font-medium transition-colors hover:bg-foreground/5"
            >
              <span className="flex flex-col items-start">
                <span className="text-xs opacity-80">Download for</span>
                <span>{downloads[platform!].label}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Primary download button for detected platform */}
      {detectedPlatform && (
        <div className="flex justify-center">
          <a
            href={downloads[detectedPlatform].url}
            className="inline-flex h-14 w-72 items-center justify-center rounded-lg bg-accent px-8 text-base font-medium text-white shadow-lg transition-all hover:bg-accent/90 hover:shadow-xl"
          >
            <span className="flex flex-col items-start">
              <span className="text-xs opacity-80">
                Recommended for your system
              </span>
              <span>{downloads[detectedPlatform].label}</span>
            </span>
          </a>
        </div>
      )}

      {/* Other platforms */}
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        {(detectedPlatform ? otherPlatforms : allPlatforms).map((platform) => (
          <a
            key={platform}
            href={downloads[platform!].url}
            className="inline-flex h-12 w-56 items-center justify-center rounded-lg border border-foreground/20 px-6 text-sm font-medium transition-colors hover:bg-foreground/5"
          >
            <span className="flex flex-col items-start">
              <span className="text-xs opacity-80">Download for</span>
              <span>{downloads[platform!].label}</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
