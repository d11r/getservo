import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Download Servo",
  description:
    "Download Servo for macOS or Windows. Give AI the ability to see and control your desktop.",
};

const GITHUB_REPO = "d11r/getservo";
const RELEASE_BASE = `https://github.com/${GITHUB_REPO}/releases/latest/download`;

const downloads = {
  macosArm64: `${RELEASE_BASE}/Servo-macos-arm64.zip`,
  macosX64: `${RELEASE_BASE}/Servo-macos-x64.zip`,
  windows: `${RELEASE_BASE}/Servo.exe`,
};

export default function DownloadPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="flex min-h-[calc(100vh-160px)] flex-col items-center justify-center px-6 pt-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Download Servo
          </h1>
          <p className="mt-4 text-base text-muted">
            Choose your platform to get started. Servo is free and open source.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={downloads.macosArm64}
              className="inline-flex h-12 w-56 items-center justify-center rounded-lg bg-accent px-6 text-sm font-medium text-white transition-colors hover:bg-accent/90"
            >
              <span className="flex flex-col items-start">
                <span className="text-xs opacity-80">Download for</span>
                <span>macOS (Apple Silicon)</span>
              </span>
            </a>
            <a
              href={downloads.macosX64}
              className="inline-flex h-12 w-56 items-center justify-center rounded-lg bg-accent px-6 text-sm font-medium text-white transition-colors hover:bg-accent/90"
            >
              <span className="flex flex-col items-start">
                <span className="text-xs opacity-80">Download for</span>
                <span>macOS (Intel)</span>
              </span>
            </a>
          </div>
          <div className="mt-3">
            <a
              href={downloads.windows}
              className="inline-flex h-12 w-56 items-center justify-center rounded-lg border border-foreground/20 px-6 text-sm font-medium transition-colors hover:bg-foreground/5"
            >
              <span className="flex flex-col items-start">
                <span className="text-xs opacity-80">Download for</span>
                <span>Windows</span>
              </span>
            </a>
          </div>
          <p className="mt-8 text-sm text-muted">
            After downloading, see the{" "}
            <a
              href="https://github.com/d11r/getservo#installation"
              className="underline hover:text-foreground"
            >
              installation guide
            </a>{" "}
            for setup instructions.
          </p>
          <p className="mt-2 text-xs text-muted">
            <a
              href={`https://github.com/${GITHUB_REPO}/releases`}
              className="underline hover:text-foreground"
            >
              View all releases on GitHub
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
