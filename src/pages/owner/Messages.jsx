import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { messageService } from "../../services/messageService";
import { realtimeService } from "../../services/realtimeService";

function OwnerMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const chatEndRef = useRef(null);

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
              lastMsg: msg.content,
              time: new Date(msg.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
              unread: msg.receiver_id === user.id && !msg.is_read ? 1 : 0,
            });
          }
        });
        const convList = Array.from(convMap.values());
        setConversations(convList);
        if (convList.length > 0 && !activeChat) setActiveChat(convList[0].id);
      }
      setLoading(false);
    };
    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (!user || !activeChat) return;
    const fetchMessages = async () => {
      const { data } = await messageService.getMessages(user.id, activeChat);
      setMessages(data || []);
      data?.forEach((msg) => {
        if (msg.receiver_id === user.id && !msg.is_read) messageService.markAsRead(msg.id);
      });
    };
    fetchMessages();

    const sub = realtimeService.subscribeToMessages(user.id, (newMsg) => {
      if ((newMsg.sender_id === activeChat && newMsg.receiver_id === user.id) ||
          (newMsg.sender_id === user.id && newMsg.receiver_id === activeChat)) {
        setMessages((prev) => [...prev, newMsg]);
      }
    });
    return () => { if (sub?.unsubscribe) sub.unsubscribe(); };
  }, [user, activeChat]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !user || !activeChat) return;
    const { data } = await messageService.sendMessage({ senderId: user.id, receiverId: activeChat, content: message });
    if (data) setMessages((prev) => [...prev, data]);
    setMessage("");
  };

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const activeChatData = conversations.find((c) => c.id === activeChat);
  const filteredChats = conversations.filter((c) => c.name.includes(searchQuery));

  if (loading) {
    return (
      <div className="d-flex" style={{ height: "calc(100vh - 68px)" }}>
        <div className="d-none d-lg-flex flex-column" style={{ width: 360, borderLeft: "1px solid var(--border, #DDD8D0)", background: "var(--white, #fff)" }}>
          <div className="p-3"><div className="placeholder-glow"><span className="placeholder col-6 rounded-2 mb-2" style={{ height: 24 }} /><span className="placeholder col-12 rounded-2" style={{ height: 36 }} /></div></div>
          <div className="p-3 flex-grow-1">{[1, 2, 3].map((i) => <div key={i} className="d-flex gap-3 mb-3"><div className="placeholder rounded-circle" style={{ width: 48, height: 48 }} /><div className="flex-grow-1"><span className="placeholder col-6 mb-1 d-block" style={{ height: 16 }} /><span className="placeholder col-8" style={{ height: 14 }} /></div></div>)}</div>
        </div>
        <div className="flex-grow-1 d-flex align-items-center justify-content-center"><span style={{ color: "var(--on-surface-variant, #5A6370)" }}>جاري تحميل المحادثات...</span></div>
      </div>
    );
  }

  return (
    <div className="d-flex" style={{ height: "calc(100vh - 68px)" }}>
      {/* Chat List */}
      <div className="d-none d-lg-flex flex-column" style={{ width: 360, borderLeft: "1px solid var(--border, #DDD8D0)", background: "var(--white, #fff)" }}>
        <div className="p-4 pb-2">
          <h4 className="fw-bold mb-3" style={{ fontSize: "1.15rem", color: "var(--on-surface, #1A1D23)" }}>الرسائل</h4>
          <div className="position-relative">
            <span className="position-absolute" style={{ right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--on-surface-variant, #5A6370)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>search</span>
            </span>
            <input type="text" className="form-control form-control-sm owner-input" placeholder="بحث في المحادثات..." style={{ borderRadius: "var(--radius-md, 12px)", paddingRight: 38, background: "var(--surface-container-low, #F5F3EE)", border: "1px solid transparent" }} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>
        <div className="flex-grow-1 overflow-auto px-2 d-flex flex-column gap-1" style={{ scrollbarWidth: "thin" }}>
          {filteredChats.length === 0 ? (
            <div className="text-center py-5">
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: "var(--on-surface-variant, #5A6370)" }}>chat</span>
              <p className="mt-2" style={{ fontSize: "0.85rem", color: "var(--on-surface-variant, #5A6370)" }}>لا توجد محادثات بعد</p>
            </div>
          ) : filteredChats.map((chat) => (
            <div
              key={chat.id}
              className="d-flex align-items-center gap-3 p-3 rounded-3"
              style={{
                background: chat.id === activeChat ? "rgba(107,144,128,0.08)" : "transparent",
                border: chat.id === activeChat ? "1px solid rgba(107,144,128,0.12)" : "1px solid transparent",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onClick={() => setActiveChat(chat.id)}
            >
              <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0" style={{ width: 48, height: 48, fontSize: 16, background: "var(--primary, #6B9080)" }}>
                {chat.avatar ? <img src={chat.avatar} alt="" className="w-100 h-100 rounded-circle" style={{ objectFit: "cover" }} /> : chat.name.charAt(0)}
              </div>
              <div className="flex-grow-1 overflow-hidden text-end">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span style={{ fontSize: "0.75rem", color: "var(--on-surface-variant, #5A6370)" }}>{chat.time}</span>
                  <p className="fw-bold mb-0" style={{ fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--on-surface, #1A1D23)" }}>{chat.name}</p>
                </div>
                <p className="mb-0" style={{ fontSize: "0.85rem", color: chat.id === activeChat ? "var(--primary)" : "var(--on-surface-variant, #5A6370)", fontWeight: chat.unread > 0 ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{chat.lastMsg}</p>
              </div>
              {chat.unread > 0 && <span className="d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0" style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--primary, #6B9080)", fontSize: 10 }}>{chat.unread}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Active Conversation */}
      <div className="flex-grow-1 d-flex flex-column" style={{ background: "var(--surface, #FAFAF7)" }}>
        {!activeChat ? (
          <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center">
            <span className="material-symbols-outlined mb-3" style={{ fontSize: 64, color: "var(--on-surface-variant, #5A6370)" }}>forum</span>
            <p style={{ color: "var(--on-surface-variant, #5A6370)" }}>اختر محادثة للبدء</p>
          </div>
        ) : (
          <>
            <header className="d-flex align-items-center justify-content-between px-4" style={{ height: 68, background: "var(--white, #fff)", borderBottom: "1px solid var(--border, #DDD8D0)" }}>
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0" style={{ width: 44, height: 44, background: "var(--primary, #6B9080)", fontSize: 16 }}>
                  {activeChatData?.avatar ? <img src={activeChatData.avatar} alt="" className="w-100 h-100 rounded-circle" style={{ objectFit: "cover" }} /> : activeChatData?.name?.charAt(0)}
                </div>
                <div className="text-end">
                  <h6 className="fw-bold mb-0" style={{ fontSize: "1rem", color: "var(--on-surface, #1A1D23)" }}>{activeChatData?.name}</h6>
                  <p className="mb-0" style={{ fontSize: "0.75rem", color: "var(--on-surface-variant, #5A6370)" }}>طالب جامعي</p>
                </div>
              </div>
            </header>

            <div className="flex-grow-1 overflow-auto p-4 d-flex flex-column gap-4" style={{ scrollbarWidth: "thin" }}>
              {messages.length === 0 ? (
                <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center">
                  <span className="material-symbols-outlined mb-2" style={{ fontSize: 48, color: "var(--on-surface-variant, #5A6370)" }}>chat</span>
                  <p style={{ color: "var(--on-surface-variant, #5A6370)" }}>ابدأ المحادثة</p>
                </div>
              ) : messages.map((msg) => (
                <div key={msg.id} className={`d-flex ${msg.sender_id === user?.id ? "justify-content-start" : "justify-content-end"}`} style={{ maxWidth: "70%", alignSelf: msg.sender_id === user?.id ? "flex-start" : "flex-end" }}>
                  <div
                    className="p-3"
                    style={{
                      borderRadius: msg.sender_id === user?.id ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      background: msg.sender_id === user?.id ? "var(--primary, #6B9080)" : "var(--white, #fff)",
                      color: msg.sender_id === user?.id ? "white" : "var(--on-surface, #1A1D23)",
                      border: msg.sender_id !== user?.id ? "1px solid var(--border, #DDD8D0)" : "none",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    }}
                  >
                    <p className="mb-0" style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>{msg.content}</p>
                    <span className="d-block mt-1" style={{ fontSize: 10, opacity: msg.sender_id === user?.id ? 0.7 : 0.5 }}>{new Date(msg.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <footer className="p-3 p-md-4" style={{ background: "var(--white, #fff)", borderTop: "1px solid var(--border, #DDD8D0)" }}>
              <div className="d-flex align-items-center gap-2">
                <div className="d-flex align-items-center flex-grow-1 rounded-3 px-2" style={{ border: "1px solid var(--border, #DDD8D0)", background: "var(--white, #fff)" }}>
                  <input type="text" className="form-control border-0 py-2" placeholder="اكتب رسالتك هنا..." style={{ background: "transparent", fontSize: "0.9rem" }} value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={handleKeyDown} />
                </div>
                <button className="d-flex align-items-center justify-content-center text-white border-0 owner-btn-lift" style={{ width: 52, height: 52, background: "var(--primary, #6B9080)", borderRadius: "var(--radius-md, 12px)", boxShadow: "0 4px 15px rgba(45,106,79,0.3)" }} onClick={handleSend}>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                </button>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

export default OwnerMessages;
