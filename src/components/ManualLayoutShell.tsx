import React from "react";

interface ManualLayoutShellProps {
  layoutMode: "vertical" | "horizontal";
  children: React.ReactNode;
}

export default function ManualLayoutShell({ layoutMode, children }: ManualLayoutShellProps) {
  if (layoutMode === "vertical") {
    return (
      <div className="app-shell vertical w-full h-full relative overflow-hidden bg-[#070011]">
        <div className="app-stage w-full h-full">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell manual-horizontal fixed inset-0 overflow-hidden bg-[#070011]">
      <div className="app-stage absolute left-1/2 top-1/2 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
