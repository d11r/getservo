"use client";

import { useState } from "react";

const configCode = `{
  "mcpServers": {
    "servo": {
      "command": "npx",
      "args": ["servo-mcp"]
    }
  }
}`;

export function QuickSetup() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(configCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
          Quick Setup
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-base text-muted">
          Add this to your <code className="font-mono">~/.claude.json</code>{" "}
          file to connect Claude Code to Servo.
        </p>
        <div className="mt-6 overflow-hidden rounded-lg border border-foreground/10 bg-foreground/5">
          <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-2">
            <span className="text-xs text-muted">~/.claude.json</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-muted transition-colors hover:bg-foreground/10 hover:text-foreground"
            >
              {copied ? (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
          <pre className="overflow-x-auto p-4 font-mono text-sm">
            <code>{configCode}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}
