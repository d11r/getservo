import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { InstallCommands } from "@/components/InstallCommands";

export const metadata: Metadata = {
  title: "Install servo-mcp | npm install -g servo-mcp | macOS & Windows",
  description:
    "Install servo-mcp for macOS or Windows via npm. Give AI agents the ability to see and control your desktop. One command: npm install -g servo-mcp",
};

const GITHUB_REPO = "d11r/getservo";

export default function DownloadPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="flex min-h-[calc(100vh-160px)] flex-col items-center justify-center px-6 pt-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Install servo-mcp
          </h1>
          <p className="mt-4 text-base text-muted">
            One command to install. Works on macOS and Windows.
          </p>

          {/* npm install commands */}
          <div className="mt-8">
            <InstallCommands />
          </div>

          {/* Permission instructions for macOS */}
          <div className="mt-10 pt-8 border-t border-foreground/10">
            <h2 className="text-lg font-semibold mb-4">macOS Permissions</h2>
            <p className="text-sm text-muted mb-4">
              Grant permissions to your terminal app (Terminal, iTerm, VS Code)
              in{" "}
              <strong>System Settings &gt; Privacy & Security</strong>:
            </p>
            <ul className="text-sm text-muted text-left max-w-md mx-auto space-y-2">
              <li>
                <strong>Accessibility</strong> - enables clicking and typing
              </li>
              <li>
                <strong>Screen Recording</strong> - enables screenshots
              </li>
            </ul>
            <p className="mt-4 text-xs text-muted">
              Child processes like servo-mcp inherit permissions from the parent
              terminal app.
            </p>
          </div>

          <p className="mt-8 text-xs text-muted">
            <a
              href={`https://github.com/${GITHUB_REPO}`}
              className="underline hover:text-foreground"
            >
              View source on GitHub
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
