import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Modal } from "../../shared/components/Modal";
import { MenuSelect } from "../../shared/components/MenuSelect";
import { DatePicker } from "../../shared/components/DatePicker";
import { ConfirmDialog } from "../../shared/components/ConfirmDialog";
import { useAPISync } from "../../api/useAPISync";
import { useUnsavedChanges } from "../../shared/hooks/useUnsavedChanges";
import type { Project, ProjectStatus, TestType } from "../../shared/types/platform";

interface EditProjectModalProps {
  open: boolean;
  onClose: () => void;
  project: Project | null;
}

const testTypeOptions: { value: TestType; label: string }[] = [
  { value: "首轮全量测试", label: "首轮全量测试" },
  { value: "回归测试", label: "回归测试" },
  { value: "增量测试", label: "增量测试" },
  { value: "专项测试", label: "专项测试" },
];

const statusOptions: ProjectStatus[] = ["待测试", "测试中", "已完成"];

export function EditProjectModal({ open, onClose, project }: EditProjectModalProps) {
  const { updateProject } = useAPISync();
  const projDirty = useUnsavedChanges();

  const [name, setName] = useState("");
  const [testType, setTestType] = useState<TestType>("首轮全量测试");
  const [priority, setPriority] = useState<"高" | "中" | "低">("中");
  const [status, setStatus] = useState<ProjectStatus>("待测试");
  const [description, setDescription] = useState("");
  const [softwareCode, setSoftwareCode] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [userCompany, setUserCompany] = useState("");
  const [planStartDate, setPlanStartDate] = useState("");
  const [planEndDate, setPlanEndDate] = useState("");
  const [tester, setTester] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [regressionMessage, setRegressionMessage] = useState("");

  useEffect(() => {
    if (open && project) {
      setName(project.name);
      setTestType(project.testType);
      setPriority(project.priority);
      setStatus(project.status);
      setDescription(project.description);
      setSoftwareCode(project.softwareCode || "");
      setClientCompany(project.clientCompany || "");
      setUserCompany(project.userCompany || "");
      setPlanStartDate(project.planStartDate || "");
      setPlanEndDate(project.planEndDate || "");
      setTester(project.tester || "");
      setReviewer(project.reviewer || "");
    }
  }, [open, project]);

  // 检查是否为状态回退操作
  const isStatusRegression = (oldStatus: string, newStatus: string, statusOrder: string[]) => {
    const oldIndex = statusOrder.indexOf(oldStatus);
    const newIndex = statusOrder.indexOf(newStatus);
    return oldIndex > newIndex;
  };

  const statusOrder = ["待测试", "测试中", "已完成"];

  const saveProject = async () => {
    if (!project) return;
    try {
      await updateProject(project.id, { name, testType, description, softwareCode: softwareCode.trim(), clientCompany: clientCompany.trim(), userCompany: userCompany.trim(), planStartDate, planEndDate, priority, status, tester, reviewer });
      toast.success("项目更新成功");
      projDirty.markClean();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "更新失败");
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!project) return;

    // 必填项校验
    if (!name.trim()) { toast.error("项目名称不能为空"); return; }
    if (!testType) { toast.error("测试类型不能为空"); return; }
    if (!softwareCode.trim()) { toast.error("软件标识不能为空"); return; }
    if (!clientCompany.trim()) { toast.error("需方不能为空"); return; }
    if (!userCompany.trim()) { toast.error("用户方不能为空"); return; }
    if (planStartDate && planEndDate && planEndDate < planStartDate) { toast.error("结束时间不能早于开始时间"); return; }
    if (!tester.trim()) { toast.error("测试人不能为空"); return; }
    if (!reviewer.trim()) { toast.error("校对人不能为空"); return; }

    // 检查状态回退
    const isRegression = isStatusRegression(project.status, status, statusOrder);
    
    if (isRegression) {
      setRegressionMessage(`项目状态将从「${project.status}」回退到「${status}」`);
      return;
    }

    await saveProject();
  };

  return (
    <>
    <Modal open={open} onClose={() => projDirty.requestClose(onClose)} title="编辑项目" width={640}
      footer={<>
        <button className="ghost-button" type="button" onClick={() => projDirty.requestClose(onClose)}>取消</button>
        <button className="primary-button" type="button" onClick={() => handleSubmit()}>保存</button>
      </>}
    >
      <form className="form-stack" onSubmit={handleSubmit}>
        <div className="form-row">
          <label className="form-label">
            项目名称 *
            <input className="form-input" type="text" value={name} onChange={(e) => { setName(e.target.value); projDirty.markDirty(); }} />
          </label>
        </div>
        <div className="form-row">
          <label className="form-label">
            测试类型 *
            <MenuSelect value={testType} options={testTypeOptions} onChange={(value) => { setTestType(value); projDirty.markDirty(); }} />
          </label>
        </div>
        <div className="form-row">
          <label className="form-label">
            优先级
            <MenuSelect value={priority} options={[{ value: "高", label: "高" }, { value: "中", label: "中" }, { value: "低", label: "低" }]} onChange={(value) => { setPriority(value); projDirty.markDirty(); }} />
          </label>
        </div>
        <div className="form-row">
          <label className="form-label">
            状态
            <MenuSelect value={status} options={statusOptions.map((s) => ({ value: s, label: s }))} onChange={(value) => { setStatus(value); projDirty.markDirty(); }} />
          </label>
        </div>
        <div className="form-row">
          <label className="form-label">
            软件标识 *
            <input className="form-input" type="text" value={softwareCode} onChange={(e) => { setSoftwareCode(e.target.value); projDirty.markDirty(); }} placeholder="例如 EP_CRM" required />
          </label>
        </div>
        <div className="form-row form-row--inline">
          <label className="form-label" style={{ flex: 1 }}>
            测试人 *
            <input className="form-input" type="text" value={tester} onChange={(e) => { setTester(e.target.value); projDirty.markDirty(); }} placeholder="测试执行人" />
          </label>
          <label className="form-label" style={{ flex: 1 }}>
            校对人 *
            <input className="form-input" type="text" value={reviewer} onChange={(e) => { setReviewer(e.target.value); projDirty.markDirty(); }} placeholder="文档校对人" />
          </label>
        </div>
        <div className="form-row form-row--inline">
          <label className="form-label" style={{ flex: 1 }}>
            需方 *
            <input className="form-input" value={clientCompany} onChange={(e) => { setClientCompany(e.target.value); projDirty.markDirty(); }} placeholder="请输入需方名称" required />
          </label>
          <label className="form-label" style={{ flex: 1 }}>
            用户方 *
            <input className="form-input" value={userCompany} onChange={(e) => { setUserCompany(e.target.value); projDirty.markDirty(); }} placeholder="请输入用户方名称" required />
          </label>
        </div>

        <div className="form-row form-row--inline">
          <label className="form-label" style={{ flex: 1 }}>
            开始时间
            <DatePicker value={planStartDate} onChange={(value) => { setPlanStartDate(value); projDirty.markDirty(); }} placeholder="请选择开始时间" />
          </label>
          <label className="form-label" style={{ flex: 1 }}>
            结束时间
            <DatePicker value={planEndDate} onChange={(value) => { setPlanEndDate(value); projDirty.markDirty(); }} placeholder="请选择结束时间" />
          </label>
        </div>

        <div className="form-row">
          <label className="form-label">
            项目说明
            <textarea className="form-textarea" value={description} onChange={(e) => { setDescription(e.target.value); projDirty.markDirty(); }} rows={3} />
          </label>
        </div>

      </form>
    </Modal>
    <ConfirmDialog
      open={!!regressionMessage}
      title="确认状态回退"
      message={`检测到状态回退操作：${regressionMessage}。确定要继续吗？`}
      confirmLabel="继续保存"
      onConfirm={() => { setRegressionMessage(""); saveProject(); }}
      onCancel={() => setRegressionMessage("")}
    />
    {projDirty.confirmDialog}
    </>
  );
}
