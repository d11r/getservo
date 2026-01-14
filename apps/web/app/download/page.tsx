import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DownloadButtons } from "@/components/DownloadButtons";

export const metadata: Metadata = {
  title: "Download Servo",
  description:
    "Download Servo for macOS or Windows. Give AI the ability to see and control your desktop.",
};

const GITHUB_REPO = "d11r/getservo";

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
          <div className="mt-8">
            <DownloadButtons />
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
