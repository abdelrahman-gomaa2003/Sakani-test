import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { messageService } from "../../services/messageService";
import { realtimeService } from "../../services/realtimeService";

function BrokerMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const fetchConversations = async () => {
      const { data } = await messageService.getConversations(user.id);
      if (data) {
        const convMap = new Map();
        data.forEach((msg) => {
          const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
          const otherProfile = msg.sender_id === user.id ? msg.receiver : msg.sender;
          if (!convMap.has(otherId)) {
            convMap.set(otherId, {
              id: otherId,
              name: otherProfile?.full_name || "مستخدم",
              avatar: otherProfile?.avatar_url,
              lastMessage: msg.content,
              time: new Date(msg.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
              online: false,
            });
          }
        });
        const convList = Array.from(convMap.values());
        setConversations(convList);
        if (convList.length > 0 && !activeConv) setActiveConv(convList[0].id);
      }
      setLoading(false);
    };
    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (!user || !activeConv) return;
    const fetchMessages = async () => {
      const { data } = await messageService.getMessages(user.id, activeConv);
      setMessages(data || []);
      data?.forEach((msg) => {
        if (msg.receiver_id === user.id && !msg.is_read) messageService.markAsRead(msg.id);
      });
    };
    fetchMessages();
    const sub = realtimeService.subscribeToMessages(user.id, (newMsg) => {
      if ((newMsg.sender_id === activeConv && newMsg.receiver_id === user.id) ||
          (newMsg.sender_id === user.id && newMsg.receiver_id === activeConv)) {
        setMessages((prev) => [...prev, newMsg]);
      }
    });
    return () => { if (sub?.unsubscribe) sub.unsubscribe(); };
  }, [user, activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !user || !activeConv) return;
    const { data } = await messageService.sendMessage({ senderId: user.id, receiverId: activeConv, content: message });
    if (data) setMessages((prev) => [...prev, data]);
    setMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const activeConversation = conversations.find((c) => c.id === activeConv);

  if (loading) {
    return (
      <div className="d-flex overflow-hidden" style={{ height: "calc(100vh - 80px)", background: "white", borderRadius: 24, border: "1px solid var(--border)" }}>
        <div className="d-none d-lg-flex flex-column" style={{ width: 380, borderLeft: "1px solid var(--border)" }}>
          <div className="p-4"><span className="placeholder col-6 d-block mb-2" style={{ height: 24 }} /><span className="placeholder col-12 d-block" style={{ height: 36 }} /></div>
        </div>
        <div className="flex-grow-1 d-flex align-items-center justify-content-center"><span className="text-muted">جاري التحميل...</span></div>
      </div>
    );
  }

  return (
    <div className="d-flex overflow-hidden" style={{ height: "calc(100vh - 80px)", background: "white", borderRadius: 24, border: "1px solid var(--border)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
      {/* Conversation List */}
      <aside className="d-none d-lg-flex flex-column" style={{ width: 380, borderLeft: "1px solid var(--border)", background: "white" }}>
        <div className="p-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h5 className="fw-bold mb-3">الرسائل</h5>
        </div>
        <div className="flex-grow-1 overflow-auto" style={{ scrollbarWidth: "thin" }}>
          {conversations.length === 0 ? (
            <div className="text-center py-5">
              <span className="material-symbols-outlined text-muted" style={{ fontSize: 48 }}>forum</span>
              <p className="text-muted mt-2">لا توجد محادثات</p>
            </div>
          ) : conversations.map((conv) => (
            <div key={conv.id} className="d-flex align-items-center gap-3 p-3 cursor-pointer" style={{ background: conv.id === activeConv ? "rgba(45,106,79,0.03)" : "transparent", borderRight: conv.id === activeConv ? "4px solid var(--primary)" : "4px solid transparent", borderBottom: "1px solid rgba(0,0,0,0.04)", cursor: "pointer", transition: "background 0.2s" }} onClick={() => setActiveConv(conv.id)}>
              <div className="position-relative flex-shrink-0">
                <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: 52, height: 52, fontSize: 18, background: "var(--primary)" }}>
                  {conv.avatar ? <img src={conv.avatar} alt="" className="w-100 h-100 rounded-circle" style={{ objectFit: "cover" }} /> : conv.name.charAt(0)}
                </div>
              </div>
              <div className="flex-grow-1 overflow-hidden text-end">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span style={{ fontSize: "0.75rem", color: "var(--gray)" }}>{conv.time}</span>
                  <h6 className="fw-bold mb-0 truncate" style={{ fontSize: "0.85rem" }}>{conv.name}</h6>
                </div>
                <p className="mb-0 truncate" style={{ fontSize: "0.8rem", color: conv.id === activeConv ? "var(--primary)" : "var(--on-surface-variant)" }}>{conv.lastMessage}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Active Chat */}
      <section className="d-flex flex-column flex-grow-1" style={{ background: "var(--surface)" }}>
        {!activeConv ? (
          <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center">
            <span className="material-symbols-outlined text-muted mb-3" style={{ fontSize: 64 }}>forum</span>
            <p className="text-muted">اختر محادثة للبدء</p>
          </div>
        ) : (
          <>
            <header className="d-flex align-items-center justify-content-between p-3 bg-white" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: 48, height: 48, background: "var(--primary)", fontSize: 16 }}>
                  {activeConversation?.avatar ? <img src={activeConversation.avatar} alt="" className="w-100 h-100 rounded-circle" style={{ objectFit: "cover" }} /> : activeConversation?.name?.charAt(0)}
                </div>
                <div className="text-end">
                  <h6 className="fw-bold mb-0" style={{ fontSize: "0.95rem" }}>{activeConversation?.name}</h6>
                  <span style={{ fontSize: "0.75rem", color: "var(--success)" }}>متصل</span>
                </div>
              </div>
            </header>

            <div className="flex-grow-1 overflow-auto p-4 d-flex flex-column gap-4" style={{ scrollbarWidth: "thin" }}>
              {messages.length === 0 ? (
                <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center">
                  <span className="material-symbols-outlined text-muted mb-2" style={{ fontSize: 48 }}>chat</span>
                  <p className="text-muted">ابدأ المحادثة</p>
                </div>
              ) : messages.map((msg) => (
                <div key={msg.id} className={`d-flex gap-2 ${msg.sender_id === user?.id ? "justify-content-end" : "justify-content-start"}`} style={{ maxWidth: "80%", alignSelf: msg.sender_id === user?.id ? "flex-end" : "flex-start" }}>
                  <div className="p-3" style={{ background: msg.sender_id === user?.id ? "var(--primary)" : "white", color: msg.sender_id === user?.id ? "white" : "var(--on-surface)", borderRadius: msg.sender_id === user?.id ? "20px 20px 4px 20px" : "20px 20px 4px 20px", boxShadow: msg.sender_id !== user?.id ? "0 2px 8px rgba(0,0,0,0.04)" : "none", fontSize: "0.9rem" }}>
                    <p className="mb-0">{msg.content}</p>
                    <div className="d-flex align-items-center gap-1 mt-1">
                      <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>{new Date(msg.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</span>
                      {msg.sender_id === user?.id && msg.is_read && <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--primary-light)" }}>done_all</span>}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <footer className="p-3 bg-white" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="d-flex align-items-center gap-2" style={{ maxWidth: 900, margin: "0 auto" }}>
                <div className="flex-grow-1 d-flex align-items-center rounded-3 px-3 py-2" style={{ background: "var(--surface-container-low)", border: "1px solid transparent" }}>
                  <input type="text" className="form-control form-control-sm border-0 bg-transparent flex-grow-1" placeholder="اكتب رسالتك هنا..." value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={handleKeyDown} style={{ boxShadow: "none", fontSize: "0.9rem" }} />
                </div>
                <button className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: 48, height: 48, background: "var(--primary)", color: "white", boxShadow: "0 4px 12px rgba(45,106,79,0.2)" }} onClick={handleSend}>
                  <span className="material-symbols-outlined" style={{ transform: "rotate(-45deg)", fontVariationSettings: "'FILL' 1" }}>send</span>
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}

export default BrokerMessages;
