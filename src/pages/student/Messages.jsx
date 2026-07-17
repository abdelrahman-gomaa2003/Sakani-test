import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { messageService } from "../../services/messageService";
import { realtimeService } from "../../services/realtimeService";
import { authService } from "../../services/authService";

function Messages() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [typedMessage, setTypedMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const fetchMessages = async () => {
      const { data } = await messageService.getConversations(user.id);
      const convMap = {};
      (data || []).forEach((msg) => {
        const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const otherName = msg.sender_id === user.id
          ? (msg.receiver?.full_name || "مستخدم")
          : (msg.sender?.full_name || "مستخدم");
        const otherAvatar = msg.sender_id === user.id
          ? msg.receiver?.avatar_url
          : msg.sender?.avatar_url;

        if (!convMap[otherId]) {
          convMap[otherId] = { contactId: otherId, contactName: otherName, avatar: otherAvatar, messages: [] };
        }
        convMap[otherId].messages.push({
          id: msg.id,
          senderId: msg.sender_id,
          text: msg.content,
          timestamp: msg.created_at,
          isRead: msg.is_read,
        });
      });
      const sortedConversations = Object.values(convMap).sort((a, b) => {
        const lastA = a.messages[a.messages.length - 1]?.timestamp || "";
        const lastB = b.messages[b.messages.length - 1]?.timestamp || "";
        return new Date(lastB) - new Date(lastA);
      });

      const ownerId = searchParams.get("ownerId");
      if (ownerId && ownerId !== user.id) {
        const existingIndex = sortedConversations.findIndex((c) => c.contactId === ownerId);
        if (existingIndex !== -1) {
          setSelectedId(ownerId);
        } else {
          // Prepend temporary conversation
          const { data: profile } = await authService.getProfile(ownerId);
          if (profile) {
            sortedConversations.unshift({
              contactId: profile.id,
              contactName: profile.full_name || "مالك العقار",
              avatar: profile.avatar_url,
              messages: [],
            });
            setSelectedId(ownerId);
          }
        }
      }

      setConversations(sortedConversations);
      setLoading(false);
    };
    fetchMessages();

    const cleanup = realtimeService.subscribeToMessages(user.id, (newMessage) => {
      const otherId = newMessage.sender_id === user.id ? newMessage.receiver_id : newMessage.sender_id;
      setConversations((prev) => {
        const existing = prev.find((c) => c.contactId === otherId);
        if (existing) {
          return prev.map((c) =>
            c.contactId === otherId
              ? { ...c, messages: [...c.messages, { id: newMessage.id, senderId: newMessage.sender_id, text: newMessage.content, timestamp: newMessage.created_at, isRead: false }] }
              : c
          );
        }
        return prev;
      });
    });

    return () => cleanup();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedId, conversations]);

  const handleSelectChat = (contactId) => {
    setSelectedId(contactId);
    const conv = conversations.find((c) => c.contactId === contactId);
    conv?.messages.filter((m) => m.senderId !== user?.id && !m.isRead).forEach((m) => messageService.markAsRead(m.id));
  };

  const filteredConversations = conversations.filter((c) =>
    c.contactName.toLowerCase().includes(search.toLowerCase())
  );

  const activeChat = conversations.find((c) => c.contactId === selectedId);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!typedMessage.trim() || !selectedId || !user) return;

    const apartmentId = searchParams.get("apartmentId");
    const { data } = await messageService.sendMessage({
      senderId: user.id,
      receiverId: selectedId,
      apartmentId: apartmentId || null,
      content: typedMessage,
    });

    if (data) {
      setConversations((prev) =>
        prev.map((c) =>
          c.contactId === selectedId
            ? { ...c, messages: [...c.messages, { id: data.id, senderId: user.id, text: typedMessage, timestamp: data.created_at, isRead: false }] }
            : c
        )
      );
    }
    setTypedMessage("");
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  if (!user) {
    return (
      <div className="container py-5 text-center">
        <span className="material-symbols-outlined text-muted mb-3" style={{ fontSize: 64 }}>lock</span>
        <h5 className="fw-bold">سجّل الدخول أولاً</h5>
        <p className="text-muted small">يجب تسجيل الدخول لعرض الرسائل</p>
      </div>
    );
  }

  return (
    <div className="container py-4 text-end" style={{ direction: "rtl", height: "calc(100vh - 120px)", minHeight: "550px" }}>
      <div className="row g-0 h-100 bg-white shadow-sm rounded-4 overflow-hidden border">
        <div className="col-lg-4 border-start h-100 d-flex flex-column bg-light-subtle">
          <div className="p-3 bg-white border-bottom">
            <h5 className="fw-bold text-dark mb-3">الرسائل</h5>
            <div className="input-group bg-light rounded-3 px-2 py-1 align-items-center">
              <span className="material-symbols-outlined text-muted fs-5">search</span>
              <input className="form-control border-0 bg-transparent shadow-none" placeholder="ابحث عن محادثة..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ fontSize: "14px" }} />
            </div>
          </div>
          <div className="flex-grow-1 overflow-y-auto p-2" style={{ maxHeight: "calc(100vh - 240px)" }}>
            {loading ? (
              <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /></div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-5 text-muted small">لا توجد محادثات بعد</div>
            ) : (
              filteredConversations.map((chat) => {
                const lastMsg = chat.messages[chat.messages.length - 1];
                return (
                  <div key={chat.contactId} className={`d-flex align-items-center gap-3 p-3 rounded-3 mb-1`} style={{ cursor: "pointer", background: selectedId === chat.contactId ? "var(--primary)" : "transparent", color: selectedId === chat.contactId ? "white" : "inherit" }} onClick={() => handleSelectChat(chat.contactId)}>
                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: 48, height: 48, background: selectedId === chat.contactId ? "white" : "var(--primary)", color: selectedId === chat.contactId ? "var(--primary)" : "white", fontSize: "18px" }}>
                      {chat.contactName[0]}
                    </div>
                    <div className="flex-grow-1 min-w-0 text-end">
                      <div className="d-flex justify-content-between align-items-baseline mb-1">
                        <h6 className={`fw-bold mb-0 text-truncate`} style={{ fontSize: "15px" }}>{chat.contactName}</h6>
                        <small style={{ fontSize: "11px", opacity: 0.7 }}>{lastMsg ? formatTime(lastMsg.timestamp) : ""}</small>
                      </div>
                      <p className="mb-0 text-truncate small" style={{ opacity: 0.7 }}>{lastMsg ? lastMsg.text : "لا توجد رسائل"}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="col-lg-8 h-100 d-flex flex-column bg-light-subtle">
          {activeChat ? (
            <>
              <div className="p-3 bg-white border-bottom d-flex align-items-center gap-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: 44, height: 44, background: "var(--primary)", color: "white", fontSize: "16px" }}>
                  {activeChat.contactName[0]}
                </div>
                <h5 className="h6 fw-bold text-dark mb-0">{activeChat.contactName}</h5>
              </div>

              <div className="flex-grow-1 overflow-y-auto p-4 bg-light d-flex flex-column gap-2" style={{ maxHeight: "calc(100vh - 300px)" }}>
                {activeChat.messages.map((msg) => {
                  const isMe = msg.senderId === user.id;
                  return (
                    <div key={msg.id} className={`d-flex ${isMe ? "justify-content-start" : "justify-content-end"} mb-2`}>
                      <div className="rounded-4 p-3 shadow-sm" style={{ maxWidth: "70%", backgroundColor: isMe ? "var(--primary)" : "#ffffff", color: isMe ? "#ffffff" : "var(--dark)", borderRadius: isMe ? "18px 18px 2px 18px" : "18px 18px 18px 2px" }}>
                        <p className="mb-1" style={{ fontSize: "14px", lineHeight: "1.5", wordBreak: "break-word" }}>{msg.text}</p>
                        <small className={`d-block text-start ${isMe ? "text-white-50" : "text-muted"}`} style={{ fontSize: "10px" }}>{formatTime(msg.timestamp)}</small>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-3 bg-white border-top">
                <div className="input-group">
                  <input className="form-control border-0 bg-light p-3 shadow-none" placeholder="اكتب رسالة هنا..." value={typedMessage} onChange={(e) => setTypedMessage(e.target.value)} />
                  <button type="submit" className="btn btn-primary px-4 d-flex align-items-center justify-content-center" style={{ borderRadius: "var(--radius-md) 0 0 var(--radius-md)" }}>
                    <span className="material-symbols-outlined fs-5">send</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="m-auto text-center p-5">
              <span className="material-symbols-outlined text-muted mb-3" style={{ fontSize: "80px" }}>chat_bubble_outline</span>
              <h5 className="fw-bold text-dark">بدء دردشة جديدة</h5>
              <p className="text-muted small">اختر محادثة من القائمة للبدء في التواصل.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Messages;
