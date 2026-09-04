import { createContext, useContext } from "react";
import type { ProjectActivityLock } from "../../../contracts/system";

export interface ProjectMutationLockValue {
  lock: ProjectActivityLock;
  mutationLocked: boolean;
  mutationLockMessage: string;
  refreshMutationLock: () => void;
}

const unlocked: ProjectActivityLock = { locked: false, message: "" };

const ProjectMutationLockContext = createContext<ProjectMutationLockValue>({
  lock: unlocked,
  mutationLocked: false,
  mutationLockMessage: "",
  refreshMutationLock: () => {},
});

export const ProjectMutationLockProvider = ProjectMutationLockContext.Provider;

export function useProjectMutationLock() {
  return useContext(ProjectMutationLockContext);
}
