import type { IconName } from "../components/Icon"

export type ConsultationKind = "AI" | "人工" | "律师"

export type ConsultationRecord = {
  icon: IconName
  id: string
  path: string
  summary: string
  time: string
  title: string
  type: ConsultationKind
}

export const consultationTypes: Array<{
  desc: string
  icon: IconName
  label: string
  path: string
  title: string
  tone: string
}> = [
  {
    path: "/chat/ai",
    icon: "spark",
    title: "AI 智能咨询",
    label: "即时响应",
    desc: "快速梳理问题、提取关键信息与处理方向",
    tone: "bg-secondary text-primary",
  },
  {
    path: "/chat/human",
    icon: "message",
    title: "人工客服",
    label: "在线服务",
    desc: "结合 AI 整理的问题摘要协助准备材料",
    tone: "bg-[#fff5df] text-[#a56a00]",
  },
  {
    path: "/chat/lawyer",
    icon: "scale",
    title: "执业律师咨询",
    label: "专业律师",
    desc: "匹配对应领域律师开展深度咨询",
    tone: "bg-[#eef5ff] text-[#3266a8]",
  },
]

export const consultationRecords: ConsultationRecord[] = [
  {
    id: "C-240119-08",
    type: "AI",
    title: "劳动合同试用期最长多久？",
    summary: "已获得法律助手回复",
    time: "今天 10:24",
    path: "/chat/ai",
    icon: "spark",
  },
  {
    id: "C-240118-13",
    type: "律师",
    title: "供应商违约如何索赔？",
    summary: "陈建国律师已回复",
    time: "昨天 14:32",
    path: "/chat/lawyer",
    icon: "scale",
  },
  {
    id: "C-240116-05",
    type: "人工",
    title: "商铺租赁纠纷处理流程",
    summary: "客服已完成事项登记",
    time: "3 天前",
    path: "/chat/human",
    icon: "message",
  },
  {
    id: "C-240112-11",
    type: "AI",
    title: "员工旷工如何处理？",
    summary: "会话已结束，可继续提问",
    time: "2024-01-12",
    path: "/chat/ai",
    icon: "spark",
  },
  {
    id: "C-240108-04",
    type: "律师",
    title: "合作协议中的保密条款",
    summary: "建议已发送，等待您的确认",
    time: "2024-01-08",
    path: "/chat/lawyer",
    icon: "scale",
  },
]

export const recentConsultationRecords = consultationRecords.slice(0, 3)
