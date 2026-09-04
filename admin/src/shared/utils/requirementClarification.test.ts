import { describe, expect, it } from "vitest";
import {
  CLARIFICATION_CONFIRMED,
  clarificationAnswerParts,
  clarificationAnswerQualityIssues,
  clarificationQuestionParts,
  composeClarificationAnswer,
  getClarificationStatus,
  isClarificationAnswerSufficient,
  normalizeClarificationQuestion,
} from "./requirementClarification";

describe("requirement clarification", () => {
  it("accepts a clear answer even when it does not repeat question keywords", () => {
    const question = "请确认业务对象的范围和判断口径";
    const answer = "本次只测已登录销售主管能看到自己负责的记录，其他人员不纳入本轮。";

    expect(clarificationAnswerQualityIssues(question, answer)).toEqual([]);
    expect(isClarificationAnswerSufficient(question, answer)).toBe(true);
    expect(getClarificationStatus({ question, clarificationAnswer: answer })).toBe(CLARIFICATION_CONFIRMED);
  });

  it("still rejects vague placeholder answers", () => {
    const question = "请确认部门需求是否只覆盖销售部";

    expect(clarificationAnswerQualityIssues(question, "后续确认")[0]).toContain("不明确表述");
  });

  it("normalizes numbered duplicate questions", () => {
    expect(normalizeClarificationQuestion("1、审批/待办数据在哪里查看？\n2、使用哪个审批角色"))
      .toBe(normalizeClarificationQuestion("审批/待办数据在哪里查看？；使用哪个审批角色"));
  });

  it("canonicalizes equivalent approval questions for answer sync", () => {
    const first = "待办任务在哪里查看？请说明菜单路径；需要哪个审批人角色处理待办";
    const second = "请确认从哪个入口进入审批数据页面；请说明审批任务的处理人账号";

    expect(normalizeClarificationQuestion(first)).toBe(normalizeClarificationQuestion(second));
  });

  it("keeps unrelated non-approval questions distinct", () => {
    expect(normalizeClarificationQuestion("请确认手机号长度上限"))
      .not.toBe(normalizeClarificationQuestion("请确认手机号格式错误提示"));
  });

  it("splits questions and numbered answers into aligned items", () => {
    const question = "请确认角色范围；请确认数据口径";
    const answer = "1、仅覆盖销售主管\n2、按所属部门过滤客户数据";

    expect(clarificationQuestionParts(question)).toEqual(["请确认角色范围", "请确认数据口径"]);
    expect(clarificationAnswerParts(question, answer)).toEqual(["仅覆盖销售主管", "按所属部门过滤客户数据"]);
  });

  it("splits consecutive question-mark clarification questions", () => {
    const question = "归属部门和梯度规则字段在新增时如何自动确定值（例如，是否从上下文带出或默认值）？操作值字段的具体计算规则是什么（例如，是固定金额还是基于基础价的百分比）？货量梯度重叠校验的具体判定标准是什么（例如，区间[a,b]与[c,d]重叠的数学定义）？系统错误提示的具体内容是什么？";

    expect(clarificationQuestionParts(question)).toEqual([
      "归属部门和梯度规则字段在新增时如何自动确定值（例如，是否从上下文带出或默认值）？",
      "操作值字段的具体计算规则是什么（例如，是固定金额还是基于基础价的百分比）？",
      "货量梯度重叠校验的具体判定标准是什么（例如，区间[a,b]与[c,d]重叠的数学定义）？",
      "系统错误提示的具体内容是什么？",
    ]);
  });

  it("hides internal approval section prefixes when splitting questions", () => {
    expect(clarificationQuestionParts("【审批/待办测试信息】审批/待办数据在哪里查看？请分别说明 PC 端和 APP 端的入口菜单或页面路径")).toEqual([
      "审批/待办数据在哪里查看？请分别说明 PC 端和 APP 端的入口菜单或页面路径",
    ]);
  });

  it("composes per-question answers with stable numbering", () => {
    const question = "请确认角色范围；请确认数据口径";

    expect(composeClarificationAnswer(question, ["仅覆盖销售主管", "按所属部门过滤客户数据"])).toBe(
      "1、仅覆盖销售主管\n2、按所属部门过滤客户数据",
    );
  });
});
