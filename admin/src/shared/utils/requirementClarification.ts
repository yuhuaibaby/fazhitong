const CLARIFICATION_PENDING = "待确认";
const CLARIFICATION_CONFIRMED = "已确认";
const CLARIFICATION_NOT_REQUIRED = "无需确认";
const VAGUE_ANSWER_PATTERNS = ["待确认", "后续确认", "后续补充", "看情况", "按实际", "用户提供", "客户提供", "暂不明确", "不确定", "待定", "todo", "TODO"];
const EXPLICIT_CONCLUSION_MARKERS = ["按", "以", "仅", "不再", "不纳入", "不包含", "统一", "采用", "使用", "归属", "范围", "口径", "处理", "执行", "确认", "纳入", "排除", "开放", "关闭"];
const APPROVAL_ENTRY_QUESTION = "审批/待办数据在哪里查看？请分别说明 PC 端和 APP 端的入口菜单或页面路径";
const APPROVAL_DATA_TRIGGER_QUESTION = "如何触发或准备可测试的待审批数据？请说明由哪个角色提交哪类业务单据以及进入什么状态";
const APPROVAL_ROLE_QUESTION = "使用哪个发起人角色和审批/处理人角色查看该审批任务";
const APPROVAL_IDENTIFIER_QUESTION = "在待办/已办列表中用哪个字段唯一识别目标任务，以及需要哪些筛选条件";
const APPROVAL_CANONICAL_QUESTIONS = new Set([
  APPROVAL_ENTRY_QUESTION,
  APPROVAL_DATA_TRIGGER_QUESTION,
  APPROVAL_ROLE_QUESTION,
  APPROVAL_IDENTIFIER_QUESTION,
]);

function hasRealClarificationQuestion(question?: string) {
  const parts = questionParts(question);
  if (parts.length === 0) return false;
  const emptyValues = new Set(["无", "暂无", "无。", "暂无。", "无待确认问题", "无待确认问题。"]);
  return parts.some((part) => !emptyValues.has(part) && !part.startsWith("【辅助文档信息】") && !part.startsWith("辅助文档信息"));
}

function questionParts(question?: string) {
  return (question || "")
    .replace(/\r\n?/g, "\n")
    .replace(/\s+(?=(?:\d+|[一二三四五六七八九十]+)[、.．)]\s*)/g, "\n")
    .replace(/([？?])\s*(?=(?!(?:请分别说明|请说明|例如|比如|如|是否|以便|用于|并|且))[^\s])/g, "$1\n")
    .split(/[\n；;]+/)
    .flatMap((part) => part.split(/。+/))
    .map((part) => part.trim())
    .map((part) => part.replace(/^(?:[•\-*]\s*|(?:\d+|[一二三四五六七八九十]+)[、.．)]\s*)/, ""))
    .map((part) => part.replace(/^【审批\/待办测试信息】/, ""))
    .filter(Boolean);
}

function clarificationQuestionParts(question?: string) {
  const seen = new Set<string>();
  return questionParts(question)
    .filter((part) => hasRealClarificationQuestion(part))
    .filter((part) => {
      const key = normalizeClarificationQuestion(part);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function compactText(text: string) {
  return text.replace(/\s+/g, "");
}

function canonicalizeQuestionPart(part: string) {
  const stripped = part
    .replace(/^(?:[•\-*]\s*|(?:\d+|[一二三四五六七八九十]+)[、.．)]\s*)/, "")
    .replace(/^【审批\/待办测试信息】/, "")
    .trim();
  const compact = compactText(stripped);
  if (APPROVAL_CANONICAL_QUESTIONS.has(stripped)) return stripped;
  if (/(审批|审核|复核|待办|已办|任务).{0,24}(哪里|在哪|查看|入口|菜单|页面|路径|进入)|(哪里|在哪|入口|菜单|页面|路径|进入).{0,24}(审批|审核|复核|待办|已办|任务)/.test(compact)) {
    return APPROVAL_ENTRY_QUESTION;
  }
  if (/(审批|审核|复核|待办|任务).{0,24}(角色|账号|发起人|申请人|提交人|审批人|处理人|经办人)|(角色|账号|发起人|申请人|提交人|审批人|处理人|经办人).{0,24}(审批|审核|复核|待办|任务)/.test(compact)) {
    return APPROVAL_ROLE_QUESTION;
  }
  if (/(审批|审核|复核|待办|已办|任务).{0,24}(唯一|定位|识别|筛选|过滤|查询|单号|编号|标题|字段|状态)|(唯一|定位|识别|筛选|过滤|查询|单号|编号|标题|字段|状态).{0,24}(审批|审核|复核|待办|已办|任务)/.test(compact)) {
    return APPROVAL_IDENTIFIER_QUESTION;
  }
  if (/(审批|审核|复核|待办|任务).{0,24}(如何|怎么|怎样|触发|产生|生成|准备|创建|提交|发起|前置)|(如何|怎么|怎样|触发|产生|生成|准备|创建|提交|发起|前置).{0,24}(审批|审核|复核|待办|任务|数据|单据)/.test(compact)) {
    return APPROVAL_DATA_TRIGGER_QUESTION;
  }
  return stripped;
}

function normalizeClarificationQuestion(question?: string) {
  const seen = new Set<string>();
  return questionParts(question)
    .map(canonicalizeQuestionPart)
    .filter((part) => part && part !== "无" && part !== "暂无")
    .filter((part) => {
      const key = compactText(part);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join("；")
    .replace(/\s+/g, "")
    .trim();
}

function splitNumberedAnswer(answer?: string) {
  const text = (answer || "").replace(/\r\n?/g, "\n").trim();
  if (!text) return [];
  const pattern = /(?:^|[\n；;])\s*(?:\d+|[一二三四五六七八九十]+)[、.．)]\s*([\s\S]*?)(?=(?:[\n；;])\s*(?:\d+|[一二三四五六七八九十]+)[、.．)]\s*|$)/g;
  const matches = Array.from(text.matchAll(pattern)).map((match) => (match[1] || "").trim()).filter(Boolean);
  return matches;
}

function clarificationAnswerParts(question?: string, answer?: string) {
  const questions = clarificationQuestionParts(question);
  if (questions.length === 0) return [];

  const numbered = splitNumberedAnswer(answer);
  if (numbered.length > 0) {
    return questions.map((_, index) => numbered[index] || "");
  }

  const text = (answer || "").replace(/\r\n?/g, "\n").trim();
  if (!text) return questions.map(() => "");
  if (questions.length === 1) return [text];

  const plainParts = text.split(/[\n；;]+/).map((part) => part.trim()).filter(Boolean);
  if (plainParts.length === questions.length) return plainParts;

  return questions.map((_, index) => (index === 0 ? text : ""));
}

function composeClarificationAnswer(question?: string, answers?: string[]) {
  const questions = clarificationQuestionParts(question);
  if (questions.length === 0) return "";
  const normalizedAnswers = questions.map((_, index) => (answers?.[index] || "").trim());
  if (questions.length === 1) return normalizedAnswers[0] || "";
  return normalizedAnswers.map((answer, index) => `${index + 1}、${answer}`).join("\n");
}

function clarificationAnswerQualityIssues(question?: string, answer?: string) {
  const emptyValues = new Set(["无", "暂无", "无。", "暂无。", "无待确认问题", "无待确认问题。"]);
  const realQuestions = questionParts(question).filter((part) => !emptyValues.has(part) && !part.startsWith("【辅助文档信息】") && !part.startsWith("辅助文档信息"));
  if (realQuestions.length === 0) return [];
  const normalizedAnswer = (answer || "").trim();
  if (!normalizedAnswer) return ["确认结论为空，请逐条回答待确认问题"];
  const loweredAnswer = normalizedAnswer.toLowerCase();
  const vagueHits = VAGUE_ANSWER_PATTERNS.filter((token) => loweredAnswer.includes(token.toLowerCase()));
  if (vagueHits.length > 0) return [`确认结论仍包含不明确表述：${vagueHits.slice(0, 3).join("、")}`];
  const compactAnswer = normalizedAnswer.replace(/\s+/g, "");
  if (compactAnswer.length < Math.max(12, realQuestions.length * 8)) return ["确认结论过短，无法判断是否已回答清楚待确认问题"];
  const hasExplicitConclusion = EXPLICIT_CONCLUSION_MARKERS.some((marker) => normalizedAnswer.includes(marker));
  if (!hasExplicitConclusion && !/[。！？.!?；;\n]/.test(normalizedAnswer)) return ["确认结论缺少明确表述，请补充结论范围或判断口径"];
  const numberedAnswer = /(^|[\n；;])\s*(\d+|[一二三四五六七八九十]+)[、.．)]/.test(normalizedAnswer);
  if (realQuestions.length >= 2 && !numberedAnswer && compactAnswer.length < realQuestions.length * 16) return ["存在多条待确认问题，请在确认结论中逐条说明"];
  return [];
}

function isClarificationAnswerSufficient(question?: string, answer?: string) {
  return clarificationAnswerQualityIssues(question, answer).length === 0;
}

function getClarificationStatus(item: { question?: string; clarificationAnswer?: string; clarificationStatus?: string; confirmed?: boolean } | null | undefined) {
  if (!item) return CLARIFICATION_NOT_REQUIRED;
  const explicitStatus = (item.clarificationStatus || "").trim();
  if (explicitStatus === CLARIFICATION_CONFIRMED) {
    return isClarificationAnswerSufficient(item.question, item.clarificationAnswer) ? CLARIFICATION_CONFIRMED : CLARIFICATION_PENDING;
  }
  if (explicitStatus === CLARIFICATION_NOT_REQUIRED || explicitStatus === CLARIFICATION_PENDING) {
    return explicitStatus;
  }
  if (!hasRealClarificationQuestion(item.question)) return CLARIFICATION_NOT_REQUIRED;
  if (isClarificationAnswerSufficient(item.question, item.clarificationAnswer) || item.confirmed) return CLARIFICATION_CONFIRMED;
  return CLARIFICATION_PENDING;
}

function isClarificationResolved(item: { question?: string; clarificationAnswer?: string; clarificationStatus?: string; confirmed?: boolean } | null | undefined) {
  const status = getClarificationStatus(item);
  return status === CLARIFICATION_CONFIRMED || status === CLARIFICATION_NOT_REQUIRED;
}

export {
  CLARIFICATION_CONFIRMED,
  CLARIFICATION_NOT_REQUIRED,
  CLARIFICATION_PENDING,
  clarificationAnswerParts,
  clarificationAnswerQualityIssues,
  clarificationQuestionParts,
  composeClarificationAnswer,
  getClarificationStatus,
  hasRealClarificationQuestion,
  isClarificationAnswerSufficient,
  isClarificationResolved,
  normalizeClarificationQuestion,
};
