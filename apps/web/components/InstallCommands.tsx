"use client";

import { useState } from "react";

function CopyButton({
  text,
  copied,
  onCopy,
}: {
  text: string;
  copied: boolean;
  onCopy: () => void;
}) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    onCopy();
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-2 flex-shrink-0 text-slate-400 hover:text-white transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-green-400"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

const INSTALL_COMMAND = "npm install -g servo-mcp";
const SETUP_COMMAND = "npx servo-mcp --setup";

export function InstallCommands() {
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [copiedSetup, setCopiedSetup] = useState(false);

  const handleCopyInstall = () => {
    setCopiedInstall(true);
    setTimeout(() => setCopiedInstall(false), 2000);
  };

  const handleCopySetup = () => {
    setCopiedSetup(true);
    setTimeout(() => setCopiedSetup(false), 2000);
  };

  return (
    <div className="space-y-4 w-full max-w-xl mx-auto">
      {/* Step 1: Install */}
      <div className="text-left">
        <p className="text-sm text-muted mb-2">1. Install globally via npm</p>
        <div className="flex items-center justify-between rounded-lg bg-slate-900 px-4 py-3 font-mono text-sm">
          <code className="text-green-400 overflow-x-auto whitespace-nowrap">
            {INSTALL_COMMAND}
          </code>
          <CopyButton
            text={INSTALL_COMMAND}
            copied={copiedInstall}
            onCopy={handleCopyInstall}
          />
        </div>
      </div>

      {/* Step 2: Setup */}
      <div className="text-left">
        <p className="text-sm text-muted mb-2">2. Configure Claude Code</p>
        <div className="flex items-center justify-between rounded-lg bg-slate-900 px-4 py-3 font-mono text-sm">
          <code className="text-green-400 overflow-x-auto whitespace-nowrap">
            {SETUP_COMMAND}
          </code>
          <CopyButton
            text={SETUP_COMMAND}
            copied={copiedSetup}
            onCopy={handleCopySetup}
          />
        </div>
      </div>

      {/* Alternative: npx */}
      <div className="text-center pt-4">
        <p className="text-xs text-muted">
          Or use npx without installing:{" "}
          <code className="bg-foreground/10 px-1.5 py-0.5 rounded">
            npx servo-mcp --setup
          </code>
        </p>
      </div>
    </div>
  );
}
