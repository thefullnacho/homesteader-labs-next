"use client";

import { Component, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
  label?: string;
}

interface State {
  hasError: boolean;
}

export default class DashboardErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-paper border-2 border-rust/60 p-8 text-center">
          <AlertCircle size={28} className="text-rust mx-auto mb-3 opacity-70" />
          <p className="font-mono uppercase tracking-widest text-rust text-sm mb-1">
            {this.props.label ?? "DASHBOARD"}{" // RENDER_FAULT"}
          </p>
          <p className="font-mono text-[10px] text-ink/50 uppercase mb-0">
            Malformed telemetry, reload to re-establish link
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
