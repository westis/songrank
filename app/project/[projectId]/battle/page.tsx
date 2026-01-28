"use client";

import { useParams } from "next/navigation";
import ProjectShell from "@/components/project/ProjectShell";
import BattleInterface from "@/components/battle/BattleInterface";

export default function BattlePage() {
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <ProjectShell projectId={projectId}>
      <BattleInterface projectId={projectId} />
    </ProjectShell>
  );
}
