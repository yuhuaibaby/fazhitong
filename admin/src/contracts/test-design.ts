// Test Design Types

import type { TargetPlatform } from "./document";

export type TestPointType = "正常流程" | "异常流程" | "边界值" | "权限控制" | "数据一致性" | "状态流转";
export type Priority = "P0" | "P1" | "P2" | "P3";
export type ReviewStatus = "待评审" | "评审中" | "已通过" | "需修改" | "已驳回" | "已作废";
export type AutomationFlag = "是" | "否";

export interface TestPoint {
  id: string;
  pointCode: string;
  projectId: string;
  requirementId: string | null;
  module: string;
  type: TestPointType;
  title: string;
  description: string;
  priority: Priority;
  targetPlatform: TargetPlatform;
  automatable: boolean;
  reviewStatus: ReviewStatus;
  validityStatus?: string;
  invalidReason?: string;
  invalidatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TestPointCreate {
  module: string;
  type: TestPointType;
  title: string;
  description?: string;
  priority?: Priority;
  targetPlatform?: TargetPlatform;
  automatable?: boolean;
}

export type TestPointUpdate = Partial<TestPointCreate> & {
  reviewStatus?: string;
};

export interface TestCase {
  id: string;
  projectId: string;
  testPointId: string | null;
  requirementId: string | null;
  caseCode: string;
  module: string;
  feature: string;
  title: string;
  priority: Priority;
  precondition: string;
  steps: string;
  testData: string;
  dataPreparation?: string;
  expectedResult: string;
  environmentId: string | null;
  targetPlatform: TargetPlatform;
  testUrl: string;
  requiredRole: string;
  testType: string;
  actualResult: string;
  passed: string;
  defectCode?: string;
  automation: AutomationFlag;
  reviewStatus: ReviewStatus;
  validityStatus?: string;
  invalidReason?: string;
  invalidatedAt?: string | null;
  remark: string;
  tester: string;
  testDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestCaseCreate {
  caseCode: string;
  module: string;
  feature?: string;
  title: string;
  priority?: Priority;
  precondition?: string;
  steps?: string;
  testData?: string;
  dataPreparation?: string;
  expectedResult?: string;
  environmentId?: string;
  targetPlatform?: TargetPlatform;
  testUrl?: string;
  requiredRole?: string;
  testType?: string;
  automation?: AutomationFlag;
  reviewStatus?: ReviewStatus;
  remark?: string;
  testPointId?: string;
  requirementId?: string;
}

export type TestCaseUpdate = Partial<Omit<TestCaseCreate, "caseCode">> & {
  actualResult?: string;
  passed?: string;
  tester?: string;
  testDate?: string;
};

export interface TestCoverage {
  totalRequirements: number;
  coveredRequirements: number;
  totalTestPoints: number;
  totalTestCases: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  automationRate: number;
}

export type ScenarioType = TestPointType;
export type TestPriority = Priority;
export type TestStatus = "未执行" | "通过" | "失败" | "阻塞" | "跳过";
