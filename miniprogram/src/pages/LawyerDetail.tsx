import { useNavigate, useParams } from "react-router";
import PageHeader from "../components/PageHeader";

const lawyers: Record<string, { name: string; title: string; spec: string; exp: number; rating: number; firm: string; firmId: string; intro: string; reviews: { user: string; content: string; stars: number }[] }> = {
  "1": {
    name: "陈建国", title: "高级合伙人", spec: "劳动纠纷", exp: 15, rating: 4.9,
    firm: "北京金杜律师事务所", firmId: "1",
    intro: "陈建国律师执业15年，专注于劳动争议领域，代理劳动仲裁及诉讼案件逾千件，在集体合同纠纷、高管离职竞业限制等复杂劳动案件领域有深厚积累。北京律师协会劳动法专业委员会委员。",
    reviews: [
      { user: "张**", content: "陈律师专业能力很强，帮我们公司解决了复杂的劳动仲裁问题，非常满意！", stars: 5 },
      { user: "李**", content: "回复及时，分析透彻，值得信赖。", stars: 5 },
      { user: "王**", content: "专业、耐心，解答详细。", stars: 4 },
    ],
  },
  "2": {
    name: "李梦瑶", title: "资深律师", spec: "商业合同", exp: 10, rating: 4.8,
    firm: "上海锦天城律师事务所", firmId: "2",
    intro: "李梦瑶律师专注商业合同及公司法务领域，服务中小企业超500家，擅长合同风险防控与商业谈判。",
    reviews: [
      { user: "赵**", content: "合同审查很细致，帮我避免了很多潜在风险。", stars: 5 },
      { user: "孙**", content: "响应速度快，专业性强。", stars: 5 },
    ],
  },
};

const defaultLawyer = lawyers["1"];

export default function LawyerDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const lawyer = lawyers[id ?? ""] ?? defaultLawyer;

  return (
    <div className="min-h-screen bg-[#f8f6fc]">
      <PageHeader title="律师详情" />

      <div className="px-4 py-4 space-y-4 pb-24">
        {/* Profile card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl flex-none">
              {lawyer.name[0]}
            </div>
            <div className="flex-1">
              <h1 className="text-base font-bold text-[#0f172a]">{lawyer.name}</h1>
              <p className="text-xs text-[#64748b] mt-0.5">{lawyer.title} · {lawyer.spec}</p>
              <button onClick={() => navigate(`/law-firm/${lawyer.firmId}`)} className="text-xs text-[#5b21b6] mt-0.5 block">{lawyer.firm}</button>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm text-[#f59e0b]">★ {lawyer.rating}</span>
                <span className="text-xs text-[#94a3b8]">{lawyer.exp}年执业</span>
              </div>
            </div>
          </div>
        </div>

        {/* Consultation options */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[#0f172a] mb-3">咨询方式</h2>
          <div className="space-y-2">
            {[
              { icon: "💬", label: "图文咨询", desc: "48小时内回复" },
              { icon: "📞", label: "电话咨询", desc: "30分钟实时通话" },
              { icon: "📹", label: "视频咨询", desc: "60分钟面对面" },
            ].map((m) => (
              <div key={m.label} className="flex items-center gap-3 py-2 border-b border-[#f8fafc] last:border-0">
                <span className="text-xl">{m.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#0f172a]">{m.label}</p>
                  <p className="text-xs text-[#94a3b8]">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Intro */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[#0f172a] mb-2">执业简介</h2>
          <p className="text-xs text-[#64748b] leading-relaxed">{lawyer.intro}</p>
        </div>

        {/* Reviews */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[#0f172a] mb-3">用户评价</h2>
          <div className="space-y-3">
            {lawyer.reviews.map((r, i) => (
              <div key={i} className="pb-3 border-b border-[#f8fafc] last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-[#0f172a]">{r.user}</span>
                  <span className="text-xs text-[#f59e0b]">{"★".repeat(r.stars)}</span>
                </div>
                <p className="text-xs text-[#64748b]">{r.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white border-t border-[#f1f5f9] px-4 py-3" style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}>
        <button onClick={() => navigate(`/booking/${id ?? "1"}`)} className="w-full bg-[#5b21b6] text-white text-sm font-semibold py-4 rounded-2xl">
          立即预约咨询
        </button>
      </div>
    </div>
  );
}
