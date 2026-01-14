"use client";

import { useState } from "react";
import { GITHUB_URL } from "@servo/shared";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-3 px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="group">
      {label && <p className="text-xs text-muted mb-1.5">{label}</p>}
      <div className="flex items-center justify-between rounded-lg bg-slate-900 px-4 py-3 font-mono text-sm">
        <code className="text-green-400">{code}</code>
        <CopyButton text={code} />
      </div>
    </div>
  );
}

const CONFIG_CODE = `{
  "mcpServers": {
    "servo": {
      "command": "npx",
      "args": ["servo-mcp"]
    }
  }
}`;

const tools = [
  { name: "screenshot", desc: "Capture screen" },
  { name: "click", desc: "Click at x,y" },
  { name: "type_text", desc: "Type text" },
  { name: "key_press", desc: "Press keys (Cmd+S)" },
  { name: "scroll", desc: "Scroll page" },
  { name: "move_mouse", desc: "Move cursor" },
  { name: "focus_app", desc: "Focus window" },
  { name: "open_app", desc: "Launch app" },
  { name: "list_windows", desc: "List windows" },
];

export default function Home() {
  const [configCopied, setConfigCopied] = useState(false);

  const handleCopyConfig = async () => {
    await navigator.clipboard.writeText(CONFIG_CODE);
    setConfigCopied(true);
    setTimeout(() => setConfigCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        <span className="font-semibold">servo-mcp</span>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          GitHub
        </a>
      </header>

      <main className="px-6 pb-16 max-w-4xl mx-auto">
        {/* Hero */}
        <section className="py-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Desktop MCP server for AI agents
          </h1>
          <p className="mt-3 text-muted max-w-xl mx-auto">
            Give Claude Code the ability to see your screen, click buttons, and verify its work.
            macOS & Windows. 100% local.
          </p>
        </section>

        {/* Install - Most prominent */}
        <section className="py-8">
          <div className="space-y-3 max-w-lg mx-auto">
            <CodeBlock code="npm install -g servo-mcp" label="1. Install" />
            <CodeBlock code="npx servo-mcp --setup" label="2. Setup Claude Code" />
          </div>
          <p className="text-center text-xs text-muted mt-4">
            Then restart Claude Code and try: &quot;take a screenshot&quot;
          </p>
        </section>

        {/* macOS Permissions */}
        <section className="py-8 border-t border-foreground/10">
          <h2 className="text-lg font-semibold mb-3">macOS Permissions</h2>
          <p className="text-sm text-muted mb-2">
            Grant your terminal app (Terminal, iTerm, VS Code) these permissions in{" "}
            <strong className="text-foreground">System Settings → Privacy & Security</strong>:
          </p>
          <ul className="text-sm text-muted space-y-1 ml-4">
            <li>• <strong className="text-foreground">Accessibility</strong> — clicking, typing</li>
            <li>• <strong className="text-foreground">Screen Recording</strong> — screenshots</li>
          </ul>
          <p className="text-xs text-muted mt-2">
            Child processes inherit permissions from the parent terminal.
          </p>
        </section>

        {/* Config */}
        <section className="py-8 border-t border-foreground/10">
          <h2 className="text-lg font-semibold mb-3">~/.claude.json</h2>
          <div className="rounded-lg border border-foreground/10 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-foreground/5 border-b border-foreground/10">
              <span className="text-xs text-muted font-mono">~/.claude.json</span>
              <button
                onClick={handleCopyConfig}
                className="text-xs text-muted hover:text-foreground transition-colors"
              >
                {configCopied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="p-4 text-sm font-mono overflow-x-auto">
              <code>{CONFIG_CODE}</code>
            </pre>
          </div>
        </section>

        {/* Tools */}
        <section className="py-8 border-t border-foreground/10">
          <h2 className="text-lg font-semibold mb-3">Available Tools</h2>
          <div className="grid grid-cols-3 gap-2 text-sm">
            {tools.map((tool) => (
              <div key={tool.name} className="flex items-baseline gap-2">
                <code className="text-xs bg-foreground/5 px-1.5 py-0.5 rounded">{tool.name}</code>
                <span className="text-muted text-xs">{tool.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <section className="py-8 border-t border-foreground/10 text-center text-sm text-muted">
          <p>
            Open source (MIT) •{" "}
            <a href={GITHUB_URL} className="underline hover:text-foreground">
              GitHub
            </a>{" "}
            •{" "}
            <a href="https://www.npmjs.com/package/servo-mcp" className="underline hover:text-foreground">
              npm
            </a>
          </p>
        </section>
      </main>
    </div>
  );
}
