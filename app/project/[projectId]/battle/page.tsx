"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import ProjectShell from "@/components/project/ProjectShell";
import BattleInterface from "@/components/battle/BattleInterface";
import BattleHistory from "@/components/battle/BattleHistory";

export default function BattlePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [showHistory, setShowHistory] = useState(false);

  return (
    <ProjectShell projectId={projectId}>
      <div className="space-y-4">
        <BattleInterface projectId={projectId} />

        {/* Toggle history */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full rounded-lg border border-border py-2 text-xs font-medium text-foreground-muted transition-colors hover:border-accent/40 hover:text-accent"
        >
          {showHistory ? "Hide battle history" : "Show battle history"}
        </button>

        {showHistory && <BattleHistory projectId={projectId} />}
      </div>
    </ProjectShell>
  );
}
