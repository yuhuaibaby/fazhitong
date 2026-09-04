import { useNavigate, useParams } from "react-router";
import PageHeader from "../components/PageHeader";

export default function OrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-[#f8f6fc]">
      <PageHeader title="订单详情" />
      <div className="px-4 py-4 space-y-4 pb-6">
        {/* Status */}
        <div className="bg-[#5b21b6] rounded-2xl p-5 text-center">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-white font-semibold">咨询已完成</p>
          <p className="text-purple-200 text-xs mt-1">感谢您使用法智通律师服务</p>
        </div>

        {/* Info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-[#0f172a]">订单信息</h3>
          {[
            ["订单号", id],
            ["服务类型", "律师咨询 · 图文咨询"],
            ["咨询律师", "陈建国（高级合伙人）"],
            ["律所", "北京金杜律师事务所"],
            ["创建时间", "2024-01-15 10:00"],
            ["完成时间", "2024-01-15 12:35"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between items-center text-sm">
              <span className="text-[#64748b]">{k}</span>
              <span className="font-medium text-[#0f172a] text-right">{v}</span>
            </div>
          ))}
        </div>

        <button onClick={() => navigate("/law-firms")} className="w-full border border-[#5b21b6] text-[#5b21b6] text-sm font-medium py-3.5 rounded-2xl">再次预约</button>
      </div>
    </div>
  );
}
