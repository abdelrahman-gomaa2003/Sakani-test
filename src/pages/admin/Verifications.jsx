import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { serverAPI } from "../../services/serverAPI";
import toast from "react-hot-toast";

const statusConfig = {
  pending: { label: "بانتظار المراجعة", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  approved: { label: "تم الاعتماد", color: "#006d37", bg: "rgba(106,254,156,0.2)" },
  rejected: { label: "مرفوض", color: "#ba1a1a", bg: "rgba(255,218,214,0.5)" },
};

const roleLabels = { student: "طالب جامعي", owner: "مالك شقة", broker: "وسيط عقاري" };
const roleIcons = { student: "school", owner: "apartment", broker: "handshake" };

const universityLabels = {
  "Fayoum University": "جامعة الفيوم",
  "Egypt University of Technology": "جامعة مصر الدولية التكنولوجية",
  "Al-Ahliyya University": "الجامعة الأهلية",
  "Nile University": "جامعة النيل",
};

function AdminVerifications() {
  const [requests, setRequests] = useState([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [selected, setSelected] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => { loadRequests(); }, [filter]);

  async function loadRequests() {
    setLoading(true);

    let query = supabase
      .from("verification_requests")
      .select("*, profiles:user_id(full_name, email, phone, avatar_url, created_at)")
      .order("created_at", { ascending: false });

    if (filter !== "all") query = query.eq("status", filter);
    const { data: vrData } = await query;
    const vrRecords = vrData || [];

    let profilesQuery = supabase
      .from("profiles")
      .select("id, full_name, email, phone, avatar_url, created_at, verification_status, university, college, national_id, role")
      .in("verification_status", ["pending", "rejected"])
      .neq("role", "admin")
      .order("created_at", { ascending: false });

    const { data: profilesData } = await profilesQuery;
    const vrUserIds = new Set(vrRecords.map((r) => r.user_id));

    const orphanProfiles = (profilesData || [])
      .filter((p) => !vrUserIds.has(p.id))
      .map((p) => ({
        id: `profile-${p.id}`,
        user_id: p.id,
        role: p.role || "student",
        status: p.verification_status || "pending",
        national_id: p.national_id || null,
        university: p.university || null,
        college: p.college || null,
        student_card_image: null,
        national_id_front: null,
        national_id_back: null,
        ownership_document: null,
        personal_photo: null,
        created_at: p.created_at,
        _source: "profile",
        profiles: { full_name: p.full_name, email: p.email, phone: p.phone, avatar_url: p.avatar_url, created_at: p.created_at },
      }));

    let allRequests = [...vrRecords, ...orphanProfiles];
    if (filter !== "all") allRequests = allRequests.filter((r) => r.status === filter);
    allRequests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setRequests(allRequests);

    const pendingVr = vrRecords.filter((r) => r.status === "pending").length;
    const pendingOrphans = orphanProfiles.filter((r) => r.status === "pending").length;
    setPendingTotal(pendingVr + pendingOrphans);

    setLoading(false);
  }

  async function handleApprove(requestId, userId) {
    setProcessing(true);
    try {
      if (String(requestId).startsWith("profile-")) {
        await supabase.from("profiles").update({ verification_status: "approved" }).eq("id", userId);
      } else {
        try {
          const result = await serverAPI.approveVerification({
            request_id: requestId, status: "approved", admin_note: adminNote || "تم الاعتماد",
          });
          if (result.error) throw new Error(result.error);
        } catch {
          await supabase.from("verification_requests").update({
            status: "approved", admin_note: adminNote || "تم الاعتماد",
            reviewed_at: new Date().toISOString(),
          }).eq("id", requestId);
          await supabase.from("profiles").update({ verification_status: "approved" }).eq("id", userId);
        }
      }
      toast.success("تم اعتماد الحساب بنجاح");
    } catch (err) {
      console.error("Approve error:", err);
      toast.error("حدث خطأ أثناء الاعتماد");
    }
    setProcessing(false);
    setSelected(null);
    setAdminNote("");
    loadRequests();
  }

  async function handleReject() {
    if (!rejectReason.trim()) { toast.error("يرجى كتابة سبب الرفض"); return; }
    const target = rejectModal;
    if (!target) return;

    setProcessing(true);
    try {
      if (String(target.id).startsWith("profile-")) {
        await supabase.from("profiles").update({
          verification_status: "rejected", rejection_reason: rejectReason,
        }).eq("id", target.user_id);
      } else {
        try {
          const result = await serverAPI.approveVerification({
            request_id: target.id, status: "rejected", admin_note: rejectReason,
          });
          if (result.error) throw new Error(result.error);
        } catch {
          await supabase.from("verification_requests").update({
            status: "rejected", admin_note: rejectReason, rejection_reason: rejectReason,
            reviewed_at: new Date().toISOString(),
          }).eq("id", target.id);
          await supabase.from("profiles").update({
            verification_status: "rejected", rejection_reason: rejectReason,
          }).eq("id", target.user_id);
        }
      }
      toast.success("تم رفض الطلب");
    } catch (err) {
      console.error("Reject error:", err);
      toast.error("حدث خطأ أثناء الرفض");
    }
    setProcessing(false);
    setRejectModal(null);
    setRejectReason("");
    setSelected(null);
    loadRequests();
  }

  function handleDownloadImage(url, filename) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "image";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function openRejectModal(request, e) {
    if (e) e.stopPropagation();
    setRejectModal(request);
    setRejectReason("");
  }

  const filters = [
    { key: "pending", label: "بانتظار المراجعة", count: pendingTotal },
    { key: "approved", label: "تم الاعتماد" },
    { key: "rejected", label: "مرفوض" },
    { key: "all", label: "الكل" },
  ];

  return (
    <div className="d-flex flex-column gap-4">
      <style>{`
        .vr-action-btn { display: inline-flex; align-items: center; gap: 4px; padding: 6px 14px; border-radius: 8px; font-size: 0.82rem; font-weight: 700; border: none; cursor: pointer; transition: all 0.2s ease; white-space: nowrap; }
        .vr-action-btn:hover { transform: translateY(-1px); }
        .vr-action-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .vr-btn-approve { background: #006d37; color: #fff; }
        .vr-btn-approve:hover { background: #005a2e; box-shadow: 0 4px 12px rgba(0,109,55,0.3); }
        .vr-btn-reject { background: #ba1a1a; color: #fff; }
        .vr-btn-reject:hover { background: #a01515; box-shadow: 0 4px 12px rgba(186,26,26,0.3); }
        .vr-btn-view { background: rgba(107,144,128,0.1); color: #6B9080; }
        .vr-btn-view:hover { background: #6B9080; color: #fff; }
      `}</style>

      <div>
        <h4 className="fw-bold mb-1" style={{ fontSize: "1.5rem" }}>طلبات التوثيق</h4>
        <p className="mb-0" style={{ fontSize: "0.95rem", color: "var(--on-surface-variant, #464555)" }}>
          مراجعة طلبات التوثيق ومستندات المستخدمين
        </p>
      </div>

      <div className="d-flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.key}
            className="btn btn-sm px-4 py-2 rounded-3 fw-bold"
            style={{
              background: filter === f.key ? "var(--primary)" : "transparent",
              color: filter === f.key ? "#fff" : "var(--on-surface-variant)",
              border: filter === f.key ? "none" : "1px solid var(--outline-variant, #D0D0D0)",
              fontSize: "0.85rem",
            }}
            onClick={() => { setFilter(f.key); setSelected(null); }}
          >
            {f.label}{f.count !== undefined ? ` (${f.count})` : ""}
          </button>
        ))}
      </div>

      <div className="rounded-4 overflow-hidden" style={{ background: "var(--surface-card)", border: "1px solid rgba(208,208,208,0.3)" }}>
        {loading ? (
          <div className="p-5 text-center">
            <div className="spinner-border" style={{ color: "var(--primary)" }} role="status" />
            <p className="mt-2 small text-muted">جاري التحميل...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-5">
            <span className="material-symbols-outlined mb-2" style={{ fontSize: 56, color: "var(--outline, #767586)" }}>verified_user</span>
            <p className="fw-bold" style={{ color: "var(--on-surface-variant)", fontSize: "1.05rem" }}>لا توجد طلبات</p>
            <p className="small text-muted">لم يتم تسجيل أي طلبات توثيق بعد</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr style={{ background: "var(--surface-container-low, #f0f4f8)" }}>
                  {["المستخدم", "النوع", "الهاتف", "التاريخ", "الحالة", "الإجراء"].map((h) => (
                    <th key={h} className="px-4 py-3 fw-bold" style={{ fontSize: "0.8rem", color: "var(--on-surface-variant)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => {
                  const st = statusConfig[r.status] || statusConfig.pending;
                  const user = r.profiles;
                  const isPending = r.status === "pending";
                  return (
                    <tr key={r.id} style={{ borderBottom: "1px solid rgba(208,208,208,0.1)" }}>
                      <td className="px-4 py-3" style={{ cursor: "pointer" }} onClick={() => { setSelected(r); setAdminNote(r.admin_note || ""); }}>
                        <div className="d-flex align-items-center gap-3">
                          {user?.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="rounded-circle" style={{ width: 42, height: 42, objectFit: "cover" }} />
                          ) : (
                            <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: 42, height: 42, background: "var(--primary)", fontSize: 15 }}>
                              {user?.full_name?.[0] || "م"}
                            </div>
                          )}
                          <div>
                            <p className="fw-bold mb-0" style={{ fontSize: "0.9rem" }}>{user?.full_name || "—"}</p>
                            <small style={{ color: "var(--on-surface-variant)" }}>{user?.email || "—"}</small>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ cursor: "pointer" }} onClick={() => { setSelected(r); setAdminNote(r.admin_note || ""); }}>
                        <span className="fw-bold small d-flex align-items-center gap-1">
                          <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--primary)" }}>{roleIcons[r.role] || "person"}</span>
                          {roleLabels[r.role] || r.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 small" style={{ cursor: "pointer" }} onClick={() => { setSelected(r); setAdminNote(r.admin_note || ""); }}>{user?.phone || "—"}</td>
                      <td className="px-4 py-3 small" style={{ cursor: "pointer" }} onClick={() => { setSelected(r); setAdminNote(r.admin_note || ""); }}>{r.created_at ? new Date(r.created_at).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" }) : "—"}</td>
                      <td className="px-4 py-3" style={{ cursor: "pointer" }} onClick={() => { setSelected(r); setAdminNote(r.admin_note || ""); }}>
                        <span className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-full fw-bold" style={{ fontSize: "0.7rem", background: st.bg, color: st.color }}>
                          <span className="rounded-circle" style={{ width: 6, height: 6, background: st.color }} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-2">
                          {isPending ? (
                            <>
                              <button className="vr-action-btn vr-btn-approve" disabled={processing} onClick={(e) => { e.stopPropagation(); handleApprove(r.id, r.user_id); }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                                اعتماد
                              </button>
                              <button className="vr-action-btn vr-btn-reject" disabled={processing} onClick={(e) => openRejectModal(r, e)}>
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>cancel</span>
                                رفض
                              </button>
                            </>
                          ) : null}
                          <button className="vr-action-btn vr-btn-view" onClick={(e) => { e.stopPropagation(); setSelected(r); setAdminNote(r.admin_note || ""); }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <>
          <div className="position-fixed top-0 start-0 bottom-0 w-100" style={{ background: "rgba(0,0,0,0.5)", zIndex: 1050, backdropFilter: "blur(4px)" }} onClick={() => { setSelected(null); setAdminNote(""); }} />
          <div className="position-fixed top-50 start-50 translate-middle p-0 rounded-4 overflow-hidden" style={{ background: "var(--surface-card)", zIndex: 1051, width: "92%", maxWidth: 720, maxHeight: "92vh", overflowY: "auto" }}>

            <div className="d-flex justify-content-between align-items-center p-4 border-bottom" style={{ borderColor: "var(--border)" }}>
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, background: "var(--primary-container, rgba(107,144,128,0.12))" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 24, color: "var(--primary)" }}>{roleIcons[selected.role] || "person"}</span>
                </div>
                <div>
                  <h5 className="fw-bold mb-0" style={{ fontSize: "1.15rem" }}>طلب توثيق — {roleLabels[selected.role] || selected.role}</h5>
                  <p className="small mb-0" style={{ color: "var(--on-surface-variant)" }}>{selected.profiles?.full_name}</p>
                </div>
              </div>
              <button className="btn btn-sm p-2 rounded-circle" style={{ background: "var(--surface-container-low)" }} onClick={() => { setSelected(null); setAdminNote(""); }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-4">
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <div className="p-3 rounded-3" style={{ background: "var(--surface-container-low)" }}>
                    <p className="small mb-1" style={{ color: "var(--on-surface-variant)" }}>الاسم الكامل</p>
                    <p className="fw-bold mb-0">{selected.profiles?.full_name || "—"}</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="p-3 rounded-3" style={{ background: "var(--surface-container-low)" }}>
                    <p className="small mb-1" style={{ color: "var(--on-surface-variant)" }}>البريد الإلكتروني</p>
                    <p className="fw-bold mb-0" style={{ direction: "ltr", textAlign: "right" }}>{selected.profiles?.email || "—"}</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="p-3 rounded-3" style={{ background: "var(--surface-container-low)" }}>
                    <p className="small mb-1" style={{ color: "var(--on-surface-variant)" }}>رقم الهاتف</p>
                    <p className="fw-bold mb-0" style={{ direction: "ltr", textAlign: "right" }}>{selected.profiles?.phone || "غير محدد"}</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="p-3 rounded-3" style={{ background: "var(--surface-container-low)" }}>
                    <p className="small mb-1" style={{ color: "var(--on-surface-variant)" }}>تاريخ التسجيل</p>
                    <p className="fw-bold mb-0">{selected.profiles?.created_at ? new Date(selected.profiles.created_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }) : "—"}</p>
                  </div>
                </div>

                {selected.role === "student" && (
                  <>
                    {selected.national_id && (
                      <div className="col-md-6">
                        <div className="p-3 rounded-3" style={{ background: "var(--surface-container-low)" }}>
                          <p className="small mb-1" style={{ color: "var(--on-surface-variant)" }}>الرقم القومي</p>
                          <p className="fw-bold mb-0" style={{ direction: "ltr", textAlign: "right", fontFamily: "monospace", fontSize: "1.05rem" }}>{selected.national_id}</p>
                        </div>
                      </div>
                    )}
                    {selected.university && (
                      <div className="col-md-6">
                        <div className="p-3 rounded-3" style={{ background: "var(--surface-container-low)" }}>
                          <p className="small mb-1" style={{ color: "var(--on-surface-variant)" }}>الجامعة</p>
                          <p className="fw-bold mb-0">{universityLabels[selected.university] || selected.university}</p>
                        </div>
                      </div>
                    )}
                    {selected.college && (
                      <div className="col-md-6">
                        <div className="p-3 rounded-3" style={{ background: "var(--surface-container-low)" }}>
                          <p className="small mb-1" style={{ color: "var(--on-surface-variant)" }}>الكلية</p>
                          <p className="fw-bold mb-0">{selected.college}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <h6 className="fw-bold mb-3" style={{ fontSize: "1rem" }}>المستندات المرفوعة</h6>
              <div className="row g-3 mb-4">
                {selected.student_card_image && (
                  <div className="col-12">
                    <p className="small fw-bold mb-2" style={{ color: "var(--on-surface-variant)" }}>
                      <span className="material-symbols-outlined me-1" style={{ fontSize: 16 }}>credit_card</span>
                      صورة الكارنيه الجامعي
                    </p>
                    <div className="position-relative rounded-3 overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                      <img src={selected.student_card_image} alt="كارنيه الطالب" className="w-100" style={{ maxHeight: 300, objectFit: "contain", cursor: "zoom-in", background: "#f5f5f5" }} onClick={() => setZoomImage(selected.student_card_image)} />
                      <div className="position-absolute top-0 end-0 p-2 d-flex gap-1">
                        <button className="btn btn-sm btn-light shadow-sm rounded-circle" style={{ width: 36, height: 36 }} onClick={(e) => { e.stopPropagation(); setZoomImage(selected.student_card_image); }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>zoom_in</span>
                        </button>
                        <button className="btn btn-sm btn-light shadow-sm rounded-circle" style={{ width: 36, height: 36 }} onClick={(e) => { e.stopPropagation(); handleDownloadImage(selected.student_card_image, `student_card_${selected.user_id}`); }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {selected.national_id_front && (
                  <div className="col-md-6">
                    <p className="small fw-bold mb-2" style={{ color: "var(--on-surface-variant)" }}>
                      <span className="material-symbols-outlined me-1" style={{ fontSize: 16 }}>credit_card</span>
                      البطاقة (أمام)
                    </p>
                    <div className="position-relative rounded-3 overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                      <img src={selected.national_id_front} alt="بطاقة أمام" className="w-100" style={{ height: 180, objectFit: "cover", cursor: "zoom-in" }} onClick={() => setZoomImage(selected.national_id_front)} />
                      <div className="position-absolute top-0 end-0 p-2 d-flex gap-1">
                        <button className="btn btn-sm btn-light shadow-sm rounded-circle" style={{ width: 32, height: 32 }} onClick={(e) => { e.stopPropagation(); setZoomImage(selected.national_id_front); }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>zoom_in</span>
                        </button>
                        <button className="btn btn-sm btn-light shadow-sm rounded-circle" style={{ width: 32, height: 32 }} onClick={(e) => { e.stopPropagation(); handleDownloadImage(selected.national_id_front, `id_front_${selected.user_id}`); }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {selected.national_id_back && (
                  <div className="col-md-6">
                    <p className="small fw-bold mb-2" style={{ color: "var(--on-surface-variant)" }}>
                      <span className="material-symbols-outlined me-1" style={{ fontSize: 16 }}>credit_card</span>
                      البطاقة (خلف)
                    </p>
                    <div className="position-relative rounded-3 overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                      <img src={selected.national_id_back} alt="بطاقة خلف" className="w-100" style={{ height: 180, objectFit: "cover", cursor: "zoom-in" }} onClick={() => setZoomImage(selected.national_id_back)} />
                      <div className="position-absolute top-0 end-0 p-2 d-flex gap-1">
                        <button className="btn btn-sm btn-light shadow-sm rounded-circle" style={{ width: 32, height: 32 }} onClick={(e) => { e.stopPropagation(); setZoomImage(selected.national_id_back); }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>zoom_in</span>
                        </button>
                        <button className="btn btn-sm btn-light shadow-sm rounded-circle" style={{ width: 32, height: 32 }} onClick={(e) => { e.stopPropagation(); handleDownloadImage(selected.national_id_back, `id_back_${selected.user_id}`); }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {selected.ownership_document && (
                  <div className="col-md-6">
                    <p className="small fw-bold mb-2" style={{ color: "var(--on-surface-variant)" }}>
                      <span className="material-symbols-outlined me-1" style={{ fontSize: 16 }}>description</span>
                      إثبات الملكية
                    </p>
                    <div className="position-relative rounded-3 overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                      <img src={selected.ownership_document} alt="إثبات الملكية" className="w-100" style={{ height: 180, objectFit: "cover", cursor: "zoom-in" }} onClick={() => setZoomImage(selected.ownership_document)} />
                      <div className="position-absolute top-0 end-0 p-2 d-flex gap-1">
                        <button className="btn btn-sm btn-light shadow-sm rounded-circle" style={{ width: 32, height: 32 }} onClick={(e) => { e.stopPropagation(); setZoomImage(selected.ownership_document); }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>zoom_in</span>
                        </button>
                        <button className="btn btn-sm btn-light shadow-sm rounded-circle" style={{ width: 32, height: 32 }} onClick={(e) => { e.stopPropagation(); handleDownloadImage(selected.ownership_document, `ownership_${selected.user_id}`); }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {selected.personal_photo && (
                  <div className="col-md-6">
                    <p className="small fw-bold mb-2" style={{ color: "var(--on-surface-variant)" }}>
                      <span className="material-symbols-outlined me-1" style={{ fontSize: 16 }}>photo</span>
                      الصورة الشخصية
                    </p>
                    <div className="position-relative rounded-3 overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                      <img src={selected.personal_photo} alt="صورة شخصية" className="w-100" style={{ height: 180, objectFit: "cover", cursor: "zoom-in" }} onClick={() => setZoomImage(selected.personal_photo)} />
                      <div className="position-absolute top-0 end-0 p-2 d-flex gap-1">
                        <button className="btn btn-sm btn-light shadow-sm rounded-circle" style={{ width: 32, height: 32 }} onClick={(e) => { e.stopPropagation(); setZoomImage(selected.personal_photo); }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>zoom_in</span>
                        </button>
                        <button className="btn btn-sm btn-light shadow-sm rounded-circle" style={{ width: 32, height: 32 }} onClick={(e) => { e.stopPropagation(); handleDownloadImage(selected.personal_photo, `photo_${selected.user_id}`); }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {!selected.student_card_image && !selected.national_id_front && !selected.national_id_back && !selected.ownership_document && !selected.personal_photo && (
                  <div className="col-12">
                    <div className="text-center py-4 rounded-3" style={{ background: "var(--surface-container-low)" }}>
                      <span className="material-symbols-outlined mb-2" style={{ fontSize: 40, color: "var(--outline)" }}>folder_off</span>
                      <p className="text-muted small mb-0">لم يُرفق أي مستندات</p>
                    </div>
                  </div>
                )}
              </div>

              {selected.admin_note && selected.status !== "pending" && (
                <div className="p-3 rounded-3 mb-4" style={{ background: selected.status === "rejected" ? "rgba(186,26,26,0.06)" : "rgba(0,109,55,0.06)", border: `1px solid ${selected.status === "rejected" ? "rgba(186,26,26,0.15)" : "rgba(0,109,55,0.15)"}` }}>
                  <p className="small fw-bold mb-1" style={{ color: selected.status === "rejected" ? "var(--error, #ba1a1a)" : "var(--success, #006d37)" }}>
                    {selected.status === "rejected" ? "سبب الرفض:" : "ملاحظة المراجعة:"}
                  </p>
                  <p className="small mb-0">{selected.admin_note}</p>
                </div>
              )}

              {selected.status === "pending" && (
                <>
                  <div className="mb-4">
                    <label className="form-label fw-bold" style={{ fontSize: "0.95rem" }}>ملاحظة المراجعة</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="اكتب ملاحظة (مطلوبة عند الرفض)..."
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      style={{ borderRadius: 12, fontSize: "0.95rem" }}
                    />
                  </div>
                  <div className="d-flex gap-3">
                    <button
                      className="btn flex-grow-1 py-3 fw-bold d-flex align-items-center justify-content-center gap-2"
                      style={{ background: "#006d37", color: "white", borderRadius: 12, fontSize: "1rem" }}
                      disabled={processing}
                      onClick={() => handleApprove(selected.id, selected.user_id)}
                    >
                      {processing ? <span className="spinner-border spinner-border-sm" /> : <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span>}
                      اعتماد الحساب
                    </button>
                    <button
                      className="btn flex-grow-1 py-3 fw-bold d-flex align-items-center justify-content-center gap-2"
                      style={{ background: "#ba1a1a", color: "white", borderRadius: 12, fontSize: "1rem" }}
                      disabled={processing}
                      onClick={() => { setRejectModal(selected); setRejectReason(""); }}
                    >
                      {processing ? <span className="spinner-border spinner-border-sm" /> : <span className="material-symbols-outlined" style={{ fontSize: 20 }}>cancel</span>}
                      رفض الحساب
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Reject Reason Modal */}
      {rejectModal && (
        <>
          <div className="position-fixed top-0 start-0 w-100 h-100" style={{ background: "rgba(0,0,0,0.5)", zIndex: 1100, backdropFilter: "blur(4px)" }} onClick={() => { setRejectModal(null); setRejectReason(""); }} />
          <div className="position-fixed top-50 start-50 translate-middle p-0 rounded-4" style={{ background: "var(--surface-card)", zIndex: 1101, width: "90%", maxWidth: 480 }}>
            <div className="p-4 border-bottom d-flex justify-content-between align-items-center" style={{ borderColor: "var(--border)" }}>
              <h5 className="fw-bold mb-0" style={{ fontSize: "1.15rem", color: "#ba1a1a" }}>
                <span className="material-symbols-outlined me-2" style={{ fontSize: 22, verticalAlign: "middle" }}>cancel</span>
                رفض طلب التوثيق
              </h5>
              <button className="btn btn-sm p-2 rounded-circle" style={{ background: "var(--surface-container-low)" }} onClick={() => { setRejectModal(null); setRejectReason(""); }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-4">
              <p className="mb-3" style={{ fontSize: "0.95rem", color: "var(--on-surface-variant)" }}>
                أنت على رفض طلب توثيق <strong>{rejectModal.profiles?.full_name}</strong>. يرجى كتابة سبب الرفض:
              </p>
              <textarea
                className="form-control"
                rows="4"
                placeholder="اكتب سبب الرفض هنا (إلزامي)..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                autoFocus
                style={{ borderRadius: 12, fontSize: "0.95rem" }}
              />
              {!rejectReason.trim() && (
                <p className="small mt-2 mb-0" style={{ color: "#ba1a1a" }}>* سبب الرفض مطلوب</p>
              )}
            </div>
            <div className="p-4 border-top d-flex gap-3" style={{ borderColor: "var(--border)" }}>
              <button className="btn flex-grow-1 py-2 fw-bold rounded-3" style={{ background: "var(--surface-container-low)", color: "var(--on-surface-variant)" }} onClick={() => { setRejectModal(null); setRejectReason(""); }}>
                إلغاء
              </button>
              <button
                className="btn flex-grow-1 py-2 fw-bold rounded-3"
                style={{ background: "#ba1a1a", color: "white" }}
                disabled={processing || !rejectReason.trim()}
                onClick={handleReject}
              >
                {processing ? <span className="spinner-border spinner-border-sm" /> : "تأكيد الرفض"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Image Zoom Modal */}
      {zoomImage && (
        <>
          <div className="position-fixed top-0 start-0 w-100 h-100" style={{ background: "rgba(0,0,0,0.85)", zIndex: 2000, cursor: "zoom-out" }} onClick={() => setZoomImage(null)} />
          <div className="position-fixed top-50 start-50 translate-middle" style={{ zIndex: 2001, width: "90vw", maxWidth: 900, maxHeight: "90vh" }}>
            <img src={zoomImage} alt="معاينة" className="w-100 h-100" style={{ objectFit: "contain", borderRadius: 8 }} />
            <button className="position-absolute top-0 start-0 m-3 btn btn-light btn-sm rounded-circle shadow" style={{ width: 40, height: 40 }} onClick={() => setZoomImage(null)}>
              <span className="material-symbols-outlined">close</span>
            </button>
            <button className="position-absolute bottom-0 end-0 m-3 btn btn-light btn-sm rounded-pill shadow px-3" onClick={() => handleDownloadImage(zoomImage, "download")}>
              <span className="material-symbols-outlined me-1" style={{ fontSize: 18 }}>download</span>
              تحميل
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminVerifications;
