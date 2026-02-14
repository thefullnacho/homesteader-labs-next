"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Terminal, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Command {
  input: string;
  output: string[];
  isError?: boolean;
}

const COMMANDS: Record<string, (args: string[]) => string[]> = {
  help: () => [
    "AVAILABLE COMMANDS:",
    "  help          - Show this help message",
    "  clear         - Clear terminal history",
    "  shop          - Navigate to hardware shop",
    "  archive       - Navigate to field archive",
    "  tools         - List available tools",
    "  about         - About Homesteader Labs",
    "  status        - System status report",
    "  date          - Current date and time",
    "  whoami        - Current user identity",
    "  edit [file]   - Open editor mode",
    "  exit          - Close terminal",
    "",
    "SHORTCUTS:",
    "  ALT+T         - Toggle terminal",
    "  ESC           - Close terminal",
  ],
  clear: () => [],
  shop: () => [
    "Redirecting to hardware catalog...",
    "Use 'exit' to close terminal first, or click below:",
  ],
  archive: () => [
    "Accessing field archive...",
    "Use 'exit' to close terminal first, or click below:",
  ],
  tools: () => [
    "AVAILABLE TOOLS:",
    "  fabrication   - 3D STL viewer & print calculator",
    "  weather       - Field weather station data",
    "",
    "Usage: navigate to /tools/[name]",
  ],
  about: () => [
    "HOMESTEADER LABS v2.0",
    "Tools for those who build their own world.",
    "",
    "Off-grid hardware, fabrication tools, and survival",
    "tech for homesteaders and self-reliant builders.",
    "",
    "Built with Next.js 14 + React + Tailwind CSS",
    "Design: Brutalist / Weathered Field Manual",
  ],
  status: () => {
    const now = new Date();
    return [
      "SYSTEM STATUS REPORT",
      `  Timestamp: ${now.toISOString()}`,
      "  Status:    OPERATIONAL",
      "  Uptime:    99.9%",
      "  Security:  MAXIMUM",
      "  Tracking:  DISABLED",
      "",
      "All systems nominal.",
    ];
  },
  date: () => [new Date().toString()],
  whoami: () => [
    "visitor",
    "",
    "Permission level: GUEST",
    "Access: READ-ONLY",
  ],
};

const BOOT_SEQUENCE = [
  ">>> INITIALIZING TERMINAL v2.0...",
  ">>> LOADING COMMAND MODULES...",
  ">>> ESTABLISHING SECURE CONNECTION...",
  ">>> BYPASSING CORPORATE FIREWALLS...",
  ">>> ACCESS GRANTED",
  "",
  "Welcome to Homesteader Labs.",
  "Type 'help' for available commands.",
  "",
];

export default function TerminalOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [commands, setCommands] = useState<Command[]>([]);
  const [input, setInput] = useState("");
  const [isBooting, setIsBooting] = useState(false);
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [editorFile, setEditorFile] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const hasBooted = useRef(false);

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+T to toggle
      if (e.altKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        toggleTerminal();
      }
      // ESC to close
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus input when terminal opens
  useEffect(() => {
    if (isOpen && inputRef.current && !isEditorMode) {
      inputRef.current.focus();
    }
  }, [isOpen, isEditorMode]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commands]);

  const toggleTerminal = useCallback(() => {
    setIsOpen((prev) => !prev);
    if (!hasBooted.current && !isOpen) {
      hasBooted.current = true;
      setIsBooting(true);
      // Simulate boot sequence
      let delay = 0;
      BOOT_SEQUENCE.forEach((line, index) => {
        delay += Math.random() * 100 + 50;
        setTimeout(() => {
          setCommands((prev) => [
            ...prev,
            { input: "", output: [line], isError: false },
          ]);
          if (index === BOOT_SEQUENCE.length - 1) {
            setIsBooting(false);
          }
        }, delay);
      });
    }
  }, [isOpen]);

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    const [command, ...args] = trimmed.split(" ");

    if (trimmed === "") return;

    if (command === "clear") {
      setCommands([]);
      return;
    }

    if (command === "exit") {
      setIsOpen(false);
      return;
    }

    if (command === "edit") {
      setIsEditorMode(true);
      setEditorFile(args[0] || "untitled");
      setEditorContent("");
      return;
    }

    const handler = COMMANDS[command];
    let output: string[];
    let isError = false;

    if (handler) {
      output = handler(args);
    } else {
      output = [`Command not found: ${command}`, "Type 'help' for available commands."];
      isError = true;
    }

    setCommands((prev) => [...prev, { input: cmd, output, isError }]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCommand(input);
    setInput("");
  };

  const saveEditorContent = () => {
    setIsEditorMode(false);
    setCommands((prev) => [
      ...prev,
      {
        input: `edit ${editorFile}`,
        output: [`File saved: ${editorFile}`, `${editorContent.length} bytes written.`],
      },
    ]);
    setEditorContent("");
    setEditorFile("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      {/* Terminal Container */}
      <div className="w-full max-w-3xl h-[80vh] brutalist-block bg-theme-bg border-[var(--accent)] flex flex-col terminal-container">
        {/* Header */}
        <div className="flex justify-between items-center p-3 border-b-2 border-[var(--accent)] bg-theme-sub">
          <div className="flex items-center gap-2">
            <Terminal size={16} className="text-[var(--accent)]" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {isEditorMode ? `EDITOR: ${editorFile}` : "TERMINAL v2.0"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-theme-secondary font-mono">
              {isEditorMode ? "ESC to cancel" : "ALT+T to toggle"}
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-[var(--accent)] hover:text-white transition-colors"
              aria-label="Close terminal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        {isEditorMode ? (
          <div className="flex-grow flex flex-col">
            <textarea
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              className="flex-grow p-4 bg-theme-bg text-theme-main font-mono text-sm resize-none focus:outline-none"
              placeholder="Type your content here..."
              spellCheck={false}
            />
            <div className="p-3 border-t-2 border-[var(--accent)] bg-theme-sub flex justify-between items-center">
              <span className="text-xs text-theme-secondary font-mono">
                {editorContent.length} chars | {editorContent.split("\n").length} lines
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditorMode(false)}
                  className="px-4 py-1 border border-theme-main text-xs uppercase hover:bg-[var(--accent)] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEditorContent}
                  className="px-4 py-1 bg-[var(--accent)] text-white text-xs uppercase hover:brightness-110 transition-all"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Terminal Output */}
            <div
              ref={terminalRef}
              className="flex-grow p-4 overflow-y-auto font-mono text-sm space-y-1"
            >
              {commands.map((cmd, index) => (
                <div key={index}>
                  {cmd.input && (
                    <div className="flex items-start gap-2">
                      <ChevronRight size={14} className="mt-0.5 text-[var(--accent)] shrink-0" />
                      <span className="break-all">{cmd.input}</span>
                    </div>
                  )}
                  {cmd.output.map((line, lineIndex) => (
                    <div
                      key={lineIndex}
                      className={`pl-6 ${cmd.isError ? "text-[var(--accent)]" : ""}`}
                    >
                      {line}
                    </div>
                  ))}
                </div>
              ))}
              {isBooting && (
                <div className="flex items-center gap-2 text-[var(--accent)]">
                  <span className="animate-pulse">_</span>
                  <span>Booting...</span>
                </div>
              )}
            </div>

            {/* Command Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t-2 border-[var(--accent)] bg-theme-sub">
              <div className="flex items-center gap-2">
                <ChevronRight size={14} className="text-[var(--accent)]" />
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-grow bg-transparent border-none outline-none font-mono text-sm"
                  placeholder="Enter command..."
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>
            </form>

            {/* Quick Links */}
            <div className="px-3 py-2 border-t border-theme-main/30 bg-theme-sub/50 flex gap-4 text-[10px]">
              <Link href="/shop/" className="text-theme-secondary hover:text-[var(--accent)] transition-colors">
                /shop
              </Link>
              <Link href="/archive/" className="text-theme-secondary hover:text-[var(--accent)] transition-colors">
                /archive
              </Link>
              <Link href="/tools/fabrication/" className="text-theme-secondary hover:text-[var(--accent)] transition-colors">
                /tools/fabrication
              </Link>
              <Link href="/tools/weather/" className="text-theme-secondary hover:text-[var(--accent)] transition-colors">
                /tools/weather
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
