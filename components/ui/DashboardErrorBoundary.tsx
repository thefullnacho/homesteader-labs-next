"use client";

import { Component, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import BrutalistBlock from "./BrutalistBlock";
import Typography from "./Typography";

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
        <BrutalistBlock className="p-8 text-center border-red-500/40 bg-red-500/5">
          <AlertCircle size={28} className="text-red-500 mx-auto mb-3 opacity-50" />
          <Typography variant="small" className="font-mono uppercase tracking-widest text-red-400 mb-1">
            {this.props.label ?? "DASHBOARD"}{" // RENDER_FAULT"}
          </Typography>
          <Typography variant="small" className="font-mono text-[10px] opacity-40 uppercase mb-0">
            Malformed telemetry — reload to re-establish link
          </Typography>
        </BrutalistBlock>
      );
    }

    return this.props.children;
  }
}
