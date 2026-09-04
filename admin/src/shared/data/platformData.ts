import {
  LayoutDashboard,
  Settings,
  BarChart3,
  FileText,
  Users,
  Building2,
  UserCheck,
  MessageSquare,
  ShoppingCart,
} from "lucide-react";
import type {
  AgentCapability,
  Metric,
  NavigationItem,
  RoadmapPhase,
} from "../types/platform";

export const navigationItems: NavigationItem[] = [
  {
    key: "dashboard",
    label: "工作台",
    description: "数据概览与待办",
    icon: LayoutDashboard,
  },
  {
    key: "modelConfig",
    label: "模型配置",
    description: "AI 模型和 API 设置",
    icon: Settings,
  },
  {
    key: "tokenStats",
    label: "数据统计",
    description: "数据分析报表",
    icon: BarChart3,
  },
  {
    key: "docConfig",
    label: "内容管理",
    description: "知识库与模板",
    icon: FileText,
  },
  {
    key: "userManagement",
    label: "用户管理",
    description: "管理平台用户",
    icon: Users,
  },
  {
    key: "lawFirms",
    label: "律所管理",
    description: "管理入驻律所",
    icon: Building2,
  },
  {
    key: "lawyers",
    label: "律师管理",
    description: "管理执业律师",
    icon: UserCheck,
  },
  {
    key: "consultations",
    label: "咨询管理",
    description: "客服工作台",
    icon: MessageSquare,
  },
  {
    key: "orders",
    label: "订单管理",
    description: "订单与财务",
    icon: ShoppingCart,
  },
];

export const dashboardMetrics: Metric[] = [
  { label: "今日活跃用户", value: "1,234", trend: "较上周 +18", tone: "blue" },
  { label: "合同审查数", value: "89", trend: "较上周 +12", tone: "green" },
  { label: "咨询会话", value: "156", trend: "待处理 23 条", tone: "amber" },
  { label: "今日收入", value: "¥8,450", trend: "较昨日 -2.3%", tone: "red" },
];

export const agentCapabilities: AgentCapability[] = [];

export const roadmap: RoadmapPhase[] = [];

export const qualityWarnings = [];
