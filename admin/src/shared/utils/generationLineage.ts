type GenerationTask = {
  type: string;
  status: string;
  createdAt: string;
  finishedAt?: string | null;
};

function taskTimestamp(task: GenerationTask): number {
  const timestamp = Date.parse(task.finishedAt || task.createdAt);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

/**
 * A failed downstream run can be continued only when its upstream has not
 * completed a newer generation.  Otherwise its progress cursor belongs to an
 * older lineage and the user must restart this stage.
 */
export function hasCompletedUpstreamRegeneration(
  tasks: GenerationTask[],
  upstreamTaskType: string,
  failedDownstreamTask: GenerationTask | undefined,
): boolean {
  if (!failedDownstreamTask) return false;
  const downstreamTime = taskTimestamp(failedDownstreamTask);
  return tasks.some((task) => (
    task.type === upstreamTaskType
    && task.status === "成功"
    && taskTimestamp(task) > downstreamTime
  ));
}
