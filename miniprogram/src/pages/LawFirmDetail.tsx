import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageHeader from "../components/PageHeader";
import Icon from "../components/Icon";
import { approveStampRequest, getStampRequest, type StampRequest } from "../lib/stampRequests";

const firm = {
  name: "北京金杜律师事务所",
  logo: "⚖️",
  area: "北京·朝阳区建国门外大街1号国贸大厦A座",
  rating: 4.9,
  cases: 2841,
  lawyers: 320,
  founded: 1988,
  tags: ["综合型", "商务合同", "劳动法", "知识产权", "企业合规"],
  intro: "金杜律师事务所成立于1988年，是中国领先的综合性律师事务所之一。拥有320余名律师，业务涵盖公司并购、资本市场、银行金融、诉讼仲裁等多个领域，为国内外客户提供全方位法律服务。",
  lawyerList: [
    { id: "1", name: "陈建国", title: "高级合伙人", spec: "劳动纠纷", exp: 15, rating: 4.9 },
    { id: "5", name: "刘芳", title: "资深律师", spec: "商务合同", exp: 12, rating: 4.8 },
    { id: "6", name: "赵明", title: "合伙人", spec: "知识产权", exp: 18, rating: 4.9 },
  ],
};

export default function LawFirmDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [stampRequest, setStampRequest] = useState<StampRequest | null>(() => getStampRequest());
  const canProcessStamp = stampRequest?.firmId === (id ?? "1") && stampRequest.status === "pending";

  return (
    <div className="min-h-screen bg-[#f8f6fc]">
      <PageHeader title="律所详情" />

      <div className="px-4 py-4 space-y-4 pb-6">
        {/* Hero */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-4xl flex-none">{firm.logo}</div>
            <div>
              <h1 className="text-base font-bold text-[#0f172a]">{firm.name}</h1>
              <p className="text-xs text-[#64748b] mt-0.5">成立于{firm.founded}年</p>
              <div className="flex items-center gap-2 mt-1.5">
                {firm.tags.slice(0, 3).map((t) => (
                  <span key={t} className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center border-t border-[#f1f5f9] pt-4">
            <div><div className="text-lg font-bold text-[#5b21b6]">{firm.rating}</div><div className="text-[10px] text-[#94a3b8]">综合评分</div></div>
            <div><div className="text-lg font-bold text-[#5b21b6]">{firm.lawyers}</div><div className="text-[10px] text-[#94a3b8]">执业律师</div></div>
            <div><div className="text-lg font-bold text-[#5b21b6]">{firm.cases.toLocaleString()}</div><div className="text-[10px] text-[#94a3b8]">成功案例</div></div>
          </div>
        </div>

        {/* Intro */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[#0f172a] mb-2">律所简介</h2>
          <p className="text-xs text-[#64748b] leading-relaxed">{firm.intro}</p>
          <p className="text-xs text-[#64748b] mt-2">📍 {firm.area}</p>
        </div>

        {stampRequest?.firmId === (id ?? "1") && <section className="app-card rounded-2xl bg-white p-4"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-purple-50 text-[#5b21b6]"><Icon name="document" className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="text-[10px] font-bold tracking-wide text-[#5b21b6]">律所工作台</p><h2 className="mt-1 text-sm font-semibold text-[#0f172a]">企业文书盖章申请</h2><p className="mt-1 text-[11px] text-[#64748b]">{stampRequest.documentName} · {stampRequest.createdAt}</p></div></div>{canProcessStamp ? <button onClick={() => setStampRequest(approveStampRequest())} className="mt-3 w-full rounded-xl bg-[#5b21b6] py-2.5 text-xs font-semibold text-white">盖章并回传企业</button> : <div className="mt-3 rounded-xl bg-[#e9f8f0] px-3 py-2.5 text-xs text-[#16845b]">已盖章并回传企业</div>}</section>}

        {/* Lawyers */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-semibold text-[#0f172a]">律师团队</h2>
          </div>
          <div className="space-y-2">
            {firm.lawyerList.map((l) => (
              <article
                key={l.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/lawyer/${l.id}`)}
                onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && navigate(`/lawyer/${l.id}`)}
                className="pressable w-full bg-white rounded-2xl p-4 shadow-sm text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-none">{l.name[0]}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[#0f172a]">{l.name}</span>
                      <span className="text-xs text-[#64748b]">{l.title}</span>
                    </div>
                    <p className="text-xs text-[#64748b] mt-0.5">{l.spec} · {l.exp}年经验</p>
                    <div className="mt-1.5"><span className="text-xs text-[#f59e0b]">★ {l.rating}</span></div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/booking/${l.id}`); }} className="text-xs bg-[#5b21b6] text-white px-3 py-1.5 rounded-lg flex-none">预约</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
