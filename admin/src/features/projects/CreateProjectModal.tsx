import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "../../shared/components/Modal";
import { MenuSelect } from "../../shared/components/MenuSelect";
import { DatePicker } from "../../shared/components/DatePicker";
import { useAPISync } from "../../api/useAPISync";
import type { TestType } from "../../shared/types/platform";

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
}

const testTypeOptions: { value: TestType; label: string }[] = [
  { value: "首轮全量测试", label: "首轮全量测试" },
  { value: "回归测试", label: "回归测试" },
  { value: "增量测试", label: "增量测试" },
  { value: "专项测试", label: "专项测试" },
];

const CREATE_PROJECT_FORM_ID = "create-project-form";

export function CreateProjectModal({ open, onClose }: CreateProjectModalProps) {
  const { createProject } = useAPISync();

  const [name, setName] = useState("");
  const [testType, setTestType] = useState<TestType>("首轮全量测试");
  const [priority, setPriority] = useState<"高" | "中" | "低">("中");
  const [softwareCode, setSoftwareCode] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [userCompany, setUserCompany] = useState("");
  const [planStartDate, setPlanStartDate] = useState("");
  const [planEndDate, setPlanEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [tester, setTester] = useState("");
  const [reviewer, setReviewer] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("项目名称不能为空"); return; }
    if (!testType) { toast.error("测试类型不能为空"); return; }
    if (!softwareCode.trim()) { toast.error("软件标识不能为空"); return; }
    if (!clientCompany.trim()) { toast.error("需方不能为空"); return; }
    if (!userCompany.trim()) { toast.error("用户方不能为空"); return; }
    if (!tester.trim()) { toast.error("测试人不能为空"); return; }
    if (!reviewer.trim()) { toast.error("校对人不能为空"); return; }
    if (planStartDate && planEndDate && planEndDate < planStartDate) { toast.error("结束时间不能早于开始时间"); return; }
    createProject({ name, testType, description, softwareCode: softwareCode.trim(), clientCompany: clientCompany.trim(), userCompany: userCompany.trim(), planStartDate, planEndDate, priority, status: "待测试", tester, reviewer }).then(() => {
      toast.success("项目创建成功");
      setName("");
      setTestType("首轮全量测试");
      setPriority("中");
      setSoftwareCode("");
      setClientCompany("");
      setUserCompany("");
      setPlanStartDate("");
      setPlanEndDate("");
      setDescription("");
      setTester("");
      setReviewer("");
      onClose();
    }).catch((err) => {
      toast.error(err.message || "创建失败，请重试");
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="新建项目" width={640}
      footer={<>
        <button className="ghost-button" type="button" onClick={onClose}>取消</button>
        <button className="primary-button" type="submit" form={CREATE_PROJECT_FORM_ID}>创建</button>
      </>}
    >
      <form id={CREATE_PROJECT_FORM_ID} className="form-stack" onSubmit={handleSubmit}>
        <div className="form-row">
          <label className="form-label">
            项目名称 *
            <input className="form-input" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="输入项目名称" autoFocus />
          </label>
        </div>

        <div className="form-row">
          <label className="form-label">
            测试类型 *
            <MenuSelect value={testType} options={testTypeOptions} onChange={setTestType} />
          </label>
        </div>

        <div className="form-row">
          <label className="form-label">
            优先级
            <MenuSelect value={priority} options={[{ value: "高", label: "高" }, { value: "中", label: "中" }, { value: "低", label: "低" }]} onChange={setPriority} />
          </label>
        </div>

        <div className="form-row">
          <label className="form-label">
            软件标识 *
            <input className="form-input" type="text" value={softwareCode} onChange={(e) => setSoftwareCode(e.target.value)} placeholder="例如 EP_CRM" required />
          </label>
        </div>

        <div className="form-row form-row--inline">
          <label className="form-label" style={{ flex: 1 }}>
            测试人 *
            <input className="form-input" type="text" value={tester} onChange={(e) => setTester(e.target.value)} placeholder="测试执行人" />
          </label>
          <label className="form-label" style={{ flex: 1 }}>
            校对人 *
            <input className="form-input" type="text" value={reviewer} onChange={(e) => setReviewer(e.target.value)} placeholder="文档校对人" />
          </label>
        </div>

        <div className="form-row form-row--inline">
          <label className="form-label" style={{ flex: 1 }}>
            需方 *
            <input className="form-input" value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} placeholder="请输入需方名称" required />
          </label>
          <label className="form-label" style={{ flex: 1 }}>
            用户方 *
            <input className="form-input" value={userCompany} onChange={(e) => setUserCompany(e.target.value)} placeholder="请输入用户方名称" required />
          </label>
        </div>

        <div className="form-row form-row--inline">
          <label className="form-label" style={{ flex: 1 }}>
            开始时间
            <DatePicker value={planStartDate} onChange={setPlanStartDate} placeholder="请选择开始时间" />
          </label>
          <label className="form-label" style={{ flex: 1 }}>
            结束时间
            <DatePicker value={planEndDate} onChange={setPlanEndDate} placeholder="请选择结束时间" />
          </label>
        </div>

        <div className="form-row">
          <label className="form-label">
            项目说明
            <textarea className="form-textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="简要描述项目背景和测试目标" rows={3} />
          </label>
        </div>

      </form>
    </Modal>
  );
}
