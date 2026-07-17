import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import EmptyState from "../../components/ui/EmptyState";

function BrokerStudentRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("messages")
        .select("*, sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url, phone)")
        .eq("receiver_id", user.id)
        .order("created_at", { ascending: false });
      if (data) {
        const uniqueSenders = new Map();
        data.forEach((msg) => {
          if (msg.sender && !uniqueSenders.has(msg.sender_id)) {
            uniqueSenders.set(msg.sender_id, {
              id: msg.sender_id,
              name: msg.sender.full_name || "طالب",
              avatar: msg.sender.avatar_url,
              lastMessage: msg.content,
              time: new Date(msg.created_at).toLocaleDateString("ar-EG"),
            });
          }
        });
        setRequests(Array.from(uniqueSenders.values()));
      }
      setLoading(false);
    };
    fetchRequests();
  }, [user]);

  if (loading) {
    return (
      <div className="d-flex flex-column gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="placeholder-glow"><div className="placeholder col-12 rounded-4" style={{ height: 160 }} /></div>
        ))}
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h2 className="fw-bold mb-1" style={{ fontSize: "1.5rem" }}>طلبات الطلاب</h2>
        <p style={{ fontSize: "0.85rem", color: "var(--on-surface-variant)" }}>
          لديك <span className="fw-bold" style={{ color: "var(--primary)" }}>{requests.length}</span> طلب مسجل
        </p>
      </div>

      {requests.length === 0 ? (
        <EmptyState icon="group" title="لا توجد طلبات" message="لم يتم استلام أي طلبات من الطلاب بعد." />
      ) : (
        <div className="d-flex flex-column gap-3">
          {requests.map((req) => (
            <div key={req.id} className="d-flex align-items-center gap-3 p-3 rounded-4" style={{ background: "white", border: "1px solid var(--border)" }}>
              <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0" style={{ width: 52, height: 52, background: "var(--primary)", fontSize: 18 }}>
                {req.avatar ? <img src={req.avatar} alt="" className="w-100 h-100 rounded-circle" style={{ objectFit: "cover" }} /> : req.name.charAt(0)}
              </div>
              <div className="flex-grow-1 text-end">
                <h6 className="fw-bold mb-1" style={{ fontSize: "0.95rem" }}>{req.name}</h6>
                <p className="mb-0 text-muted" style={{ fontSize: "0.8rem" }}>{req.lastMessage}</p>
              </div>
              <div className="text-start">
                <span style={{ fontSize: "0.7rem", color: "var(--gray)" }}>{req.time}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BrokerStudentRequests;
