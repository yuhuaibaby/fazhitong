// Project Types

export type TestType = "首轮全量测试" | "回归测试" | "增量测试" | "专项测试";
export type ProjectPriority = "高" | "中" | "低";
export type ProjectStatus = "待测试" | "测试中" | "已完成";

export interface Project {
  id: string;
  name: string;
  testType: TestType;
  status: ProjectStatus;
  description: string;
  softwareCode: string;
  clientCompany: string;
  userCompany: string;
  planStartDate: string;
  planEndDate: string;
  tester: string;
  reviewer: string;
  caseCount: number;
  passRate: number;
  priority: ProjectPriority;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectCreate {
  name: string;
  testType: TestType;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  description?: string;
  softwareCode: string;
  clientCompany: string;
  userCompany: string;
  planStartDate?: string;
  planEndDate?: string;
  tester?: string;
  reviewer?: string;
}

export type ProjectUpdate = Partial<ProjectCreate>;
