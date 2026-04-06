"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, Plus, X, Send, Users, ArrowLeft, Crown,
  UserMinus, Settings, Loader2, MessageCircle, Lock, Globe,
} from "lucide-react";

// ─── Firebase helpers (dynamic import → client-only) ──────────────────────────
async function getFirebase() {
  const { initializeApp, getApps }           = await import("firebase/app");
  const { getFirestore }                      = await import("firebase/firestore");
  const { getAuth }                           = await import("firebase/auth");

  const config = {
    apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const app  = getApps().length ? getApps()[0] : initializeApp(config);
  const db   = getFirestore(app);
  const auth = getAuth(app);
  return { db, auth };
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface GroupMember {
  uid:         string;
  displayName: string;
  role:        "admin" | "member";
  joinedAt:    number; // unix ms
}

interface Group {
  id:          string;
  name:        string;
  subject:     string;
  level:       string;
  description: string;
  icon:        string;
  color:       string;
  isPrivate:   boolean;
  adminUid:    string;
  members:     GroupMember[];
  memberCount: number;
  createdAt:   number;
}

interface ChatMessage {
  id:          string;
  text:        string;
  senderUid:   string;
  senderName:  string;
  sentAt:      number;
}

// ─── Color map ────────────────────────────────────────────────────────────────
const COLOR_MAP: Record<string, { bg: string; border: string; text: string; iconBg: string; btn: string }> = {
  orange: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", iconBg: "bg-orange-100", btn: "bg-orange-500 hover:bg-orange-600" },
  teal:   { bg: "bg-teal-50",   border: "border-teal-300",   text: "text-teal-700",   iconBg: "bg-teal-100",   btn: "bg-teal-600 hover:bg-teal-700"   },
  violet: { bg: "bg-violet-50", border: "border-violet-300", text: "text-violet-700", iconBg: "bg-violet-100", btn: "bg-violet-600 hover:bg-violet-700" },
  rose:   { bg: "bg-rose-50",   border: "border-rose-300",   text: "text-rose-700",   iconBg: "bg-rose-100",   btn: "bg-rose-500 hover:bg-rose-600"   },
  amber:  { bg: "bg-amber-50",  border: "border-amber-300",  text: "text-amber-700",  iconBg: "bg-amber-100",  btn: "bg-amber-500 hover:bg-amber-600"  },
};

const SUBJECT_OPTIONS = ["Mathematics", "Biology", "Chemistry", "Physics", "English", "Economics", "Further Maths", "Government", "Literature", "Mixed / WAEC", "Mixed / JAMB"];
const ICON_OPTIONS    = ["📐", "🔬", "⚗️", "📖", "⚡", "🎯", "🔢", "📚", "🌍", "🧮", "📊", "🏆"];
const COLOR_OPTIONS   = Object.keys(COLOR_MAP);

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ─── Timestamp formatter ──────────────────────────────────────────────────────
function fmtTime(ms: number) {
  const d   = new Date(ms);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE GROUP MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function CreateGroupModal({ currentUid, displayName, onClose, onCreated }: {
  currentUid: string; displayName: string;
  onClose: () => void; onCreated: (g: Group) => void;
}) {
  const [form, setForm] = useState({
    name: "", subject: "Mathematics", level: "", description: "",
    icon: "📐", color: "orange", isPrivate: false,
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  const handleCreate = async () => {
    if (!form.name.trim())    { setError("Group name is required."); return; }
    if (!form.level.trim())   { setError("Level / description is required."); return; }
    setSaving(true); setError("");

    try {
      const { db, auth }                        = await getFirebase();
      const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");

      const now = Date.now();
      const newGroup = {
        name:        form.name.trim(),
        subject:     form.subject,
        level:       form.level.trim(),
        description: form.description.trim(),
        icon:        form.icon,
        color:       form.color,
        isPrivate:   form.isPrivate,
        adminUid:    currentUid,
        memberCount: 1,
        createdAt:   now,
        members: [{
          uid:         currentUid,
          displayName: displayName,
          role:        "admin",
          joinedAt:    now,
        }],
      };

      const ref  = await addDoc(collection(db, "groups"), newGroup);
      const full = { id: ref.id, ...newGroup } as Group;
      onCreated(full);
      onClose();
    } catch (e) {
      console.error(e);
      setError("Failed to create group. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-orange-400 text-xs font-black uppercase tracking-widest mb-0.5">New Group</p>
            <h3 className="font-display font-black text-white text-lg">Create a Study Group</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">{error}</div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Group Name *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. SS3 Mathematics"
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 font-body" />
          </div>

          {/* Subject + Level row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Subject *</label>
              <select value={form.subject} onChange={(e) => set("subject", e.target.value)}
                className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 bg-white focus:outline-none focus:border-orange-400 font-body">
                {SUBJECT_OPTIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Level *</label>
              <input value={form.level} onChange={(e) => set("level", e.target.value)} placeholder="e.g. WAEC Prep"
                className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-400 font-body" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
              placeholder="What is this group for?" rows={2}
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 resize-none focus:outline-none focus:border-orange-400 font-body" />
          </div>

          {/* Icon picker */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((ic) => (
                <button key={ic} onClick={() => set("icon", ic)}
                  className={`w-10 h-10 text-xl rounded-xl flex items-center justify-center transition-all ${form.icon === ic ? "bg-orange-100 ring-2 ring-orange-400 scale-110" : "bg-slate-100 hover:bg-slate-200"}`}>
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Color</label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((co) => {
                const c = COLOR_MAP[co];
                return (
                  <button key={co} onClick={() => set("color", co)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${c.btn.split(" ")[0].replace("bg-", "bg-").replace("hover:", "")} ${form.color === co ? "ring-2 ring-offset-2 ring-slate-600 scale-110" : ""}`} />
                );
              })}
            </div>
          </div>

          {/* Private toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`w-11 h-6 rounded-full transition-colors relative ${form.isPrivate ? "bg-orange-500" : "bg-slate-200"}`}
              onClick={() => set("isPrivate", !form.isPrivate)}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isPrivate ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">{form.isPrivate ? "Private group" : "Public group"}</p>
              <p className="text-xs text-slate-400 font-medium">{form.isPrivate ? "Invite-only — members need approval" : "Anyone can find and join"}</p>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t-2 border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 border-2 border-slate-200 rounded-xl py-3 text-sm font-black text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleCreate} disabled={saving}
            className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl py-3 text-sm font-black transition-all hover:-translate-y-0.5 shadow-md shadow-orange-200 flex items-center justify-center gap-2">
            {saving ? <><Spinner />Creating…</> : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GROUP CHAT PANEL
// ═══════════════════════════════════════════════════════════════════════════════
function GroupChatPanel({ group, currentUid, displayName, onBack }: {
  group: Group; currentUid: string; displayName: string; onBack: () => void;
}) {
  const [messages, setMessages]   = useState<ChatMessage[]>([]);
  const [input, setInput]         = useState("");
  const [sending, setSending]     = useState(false);
  const [chatLoading, setChatLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const [removingUid, setRemovingUid] = useState<string | null>(null);
  const bottomRef                 = useRef<HTMLDivElement>(null);
  const isAdmin = group.adminUid === currentUid;
  const c = COLOR_MAP[group.color] ?? COLOR_MAP.orange;

  // Real-time chat listener
  useEffect(() => {
    let unsub: (() => void) | undefined;

    (async () => {
      const { db }                                               = await getFirebase();
      const { collection, query, orderBy, limit, onSnapshot }   = await import("firebase/firestore");

      const q = query(
        collection(db, "groups", group.id, "messages"),
        orderBy("sentAt", "asc"),
        limit(200),
      );

      unsub = onSnapshot(q, (snap) => {
        const msgs: ChatMessage[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage));
        setMessages(msgs);
        setChatLoading(false);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }, (err) => {
        console.error("Chat listener error:", err);
        setChatLoading(false);
      });
    })();

    return () => unsub?.();
  }, [group.id]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput(""); setSending(true);

    try {
      const { db }                         = await getFirebase();
      const { collection, addDoc }         = await import("firebase/firestore");

      await addDoc(collection(db, "groups", group.id, "messages"), {
        text,
        senderUid:   currentUid,
        senderName:  displayName,
        sentAt:      Date.now(),
      });
    } catch (e) {
      console.error("Send failed:", e);
      setInput(text); // restore on failure
    } finally {
      setSending(false);
    }
  };

  const removeMember = async (uid: string) => {
    if (!isAdmin || uid === currentUid) return;
    setRemovingUid(uid);
    try {
      const { db }                           = await getFirebase();
      const { doc, updateDoc, arrayRemove }  = await import("firebase/firestore");

      const member = group.members.find((m) => m.uid === uid);
      if (!member) return;

      await updateDoc(doc(db, "groups", group.id), {
        members:     arrayRemove(member),
        memberCount: Math.max(0, group.memberCount - 1),
      });

      // Reflect locally
      group.members    = group.members.filter((m) => m.uid !== uid);
      group.memberCount = group.members.length;
    } catch (e) {
      console.error("Remove failed:", e);
    } finally {
      setRemovingUid(null);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-full">

      {/* ── Chat column ── */}
      <div className="flex-1 bg-white border-2 border-slate-200 rounded-2xl overflow-hidden flex flex-col" style={{ minHeight: "600px" }}>

        {/* Chat header */}
        <div className={`px-5 py-4 flex items-center gap-3 flex-shrink-0 ${c.bg} border-b-2 ${c.border}`}>
          <button onClick={onBack} className="p-1.5 rounded-xl hover:bg-white/60 transition-colors text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className={`w-10 h-10 ${c.iconBg} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>{group.icon}</div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-slate-900 text-sm truncate">{group.name}</p>
            <p className={`text-xs font-semibold ${c.text}`}>{group.members.length} members</p>
          </div>
          <button onClick={() => setShowMembers((p) => !p)}
            className={`p-2 rounded-xl transition-colors ${showMembers ? `${c.iconBg} ${c.text}` : "hover:bg-white/60 text-slate-500"}`}>
            <Users className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-amber-50/20">
          {chatLoading && (
            <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
              <Spinner className="w-5 h-5" /><span className="text-sm font-semibold">Loading messages…</span>
            </div>
          )}

          {!chatLoading && messages.length === 0 && (
            <div className="text-center py-10">
              <p className="text-2xl mb-2">💬</p>
              <p className="font-display font-bold text-slate-400 text-sm">No messages yet</p>
              <p className="text-slate-400 text-xs mt-1 font-medium">Be the first to say hello!</p>
            </div>
          )}

          {!chatLoading && messages.map((m) => {
            const isMe = m.senderUid === currentUid;
            return (
              <div key={m.id} className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5 ${isMe ? "bg-orange-500 text-white" : "bg-slate-200 text-slate-600"}`}>
                  {m.senderName.slice(0, 2).toUpperCase()}
                </div>
                <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  {!isMe && <p className="text-[10px] font-black text-slate-400 px-1">{m.senderName}</p>}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed ${isMe ? "bg-slate-900 text-white rounded-tr-sm" : "bg-white border-2 border-slate-200 text-slate-700 rounded-tl-sm"}`}>
                    {m.text}
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold px-1">{fmtTime(m.sentAt)}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="border-t-2 border-slate-200 bg-white px-4 py-3 flex gap-3 items-end flex-shrink-0">
          <textarea value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Type a message… (Enter to send)"
            rows={1}
            className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 resize-none focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-slate-50 font-body" />
          <button onClick={sendMessage} disabled={!input.trim() || sending}
            className="h-10 w-10 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
            {sending ? <Spinner className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Members panel ── */}
      {showMembers && (
        <div className="lg:w-72 bg-white border-2 border-slate-200 rounded-2xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b-2 border-slate-100 flex items-center justify-between">
            <div>
              <p className="font-display font-bold text-slate-900 text-sm">Members</p>
              <p className="text-slate-400 text-xs font-semibold">{group.members.length} in this group</p>
            </div>
            {isAdmin && (
              <span className="flex items-center gap-1 text-orange-700 bg-orange-100 text-xs font-black px-2.5 py-1 rounded-full">
                <Crown className="w-3 h-3" /> Admin
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {group.members.map((m) => (
              <div key={m.uid} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${m.role === "admin" ? "bg-orange-500 text-white" : "bg-slate-200 text-slate-600"}`}>
                  {m.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700 truncate">{m.displayName}</p>
                  <p className="text-xs text-slate-400 font-semibold capitalize">{m.role}</p>
                </div>
                {m.role === "admin" && <Crown className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />}
                {/* Admin can remove non-admin members */}
                {isAdmin && m.uid !== currentUid && m.role !== "admin" && (
                  <button onClick={() => removeMember(m.uid)} disabled={removingUid === m.uid}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                    {removingUid === m.uid ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserMinus className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="px-4 py-3 border-t-2 border-slate-100">
            <p className="text-[10px] text-slate-400 font-semibold text-center">
              {isAdmin ? "Hover a member to remove them" : "Only admins can manage members"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function GroupsPage() {
  // ── Auth state ──────────────────────────────────────────────────────────────
  const [currentUid,   setCurrentUid]   = useState("demo-user-uid");
  const [displayName,  setDisplayName]  = useState("Amara Tunde");
  const [authLoading,  setAuthLoading]  = useState(true);

  // ── Groups state ────────────────────────────────────────────────────────────
  const [groups,        setGroups]       = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [joiningId,     setJoiningId]    = useState<string | null>(null);
  const [leavingId,     setLeavingId]    = useState<string | null>(null);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [search,          setSearch]          = useState("");
  const [showCreate,      setShowCreate]      = useState(false);
  const [activeChat,      setActiveChat]      = useState<Group | null>(null);
  const [filterTab,       setFilterTab]       = useState<"all" | "mine">("all");

  // ── Load current user from Firebase Auth ─────────────────────────────────
  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      try {
        const { auth } = await getFirebase();
        const { onAuthStateChanged } = await import("firebase/auth");
        unsub = onAuthStateChanged(auth, (user) => {
          if (user) {
            setCurrentUid(user.uid);
            setDisplayName(user.displayName ?? user.email?.split("@")[0] ?? "Student");
          }
          setAuthLoading(false);
        });
      } catch { setAuthLoading(false); }
    })();
    return () => unsub?.();
  }, []);

  // ── Load groups from Firestore in real-time ───────────────────────────────
  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      try {
        const { db }                                      = await getFirebase();
        const { collection, query, orderBy, onSnapshot } = await import("firebase/firestore");

        const q = query(collection(db, "groups"), orderBy("createdAt", "desc"));
        unsub = onSnapshot(q, (snap) => {
          const data: Group[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Group));
          setGroups(data);
          setGroupsLoading(false);
        }, (err) => {
          console.error("Groups listener:", err);
          setGroupsLoading(false);
        });
      } catch { setGroupsLoading(false); }
    })();
    return () => unsub?.();
  }, []);

  // ── Join a group ─────────────────────────────────────────────────────────
  const joinGroup = async (group: Group) => {
    if (joiningId) return;
    setJoiningId(group.id);
    try {
      const { db }                          = await getFirebase();
      const { doc, updateDoc, arrayUnion }  = await import("firebase/firestore");

      const newMember: GroupMember = {
        uid:         currentUid,
        displayName: displayName,
        role:        "member",
        joinedAt:    Date.now(),
      };

      await updateDoc(doc(db, "groups", group.id), {
        members:     arrayUnion(newMember),
        memberCount: (group.memberCount ?? 0) + 1,
      });
    } catch (e) { console.error("Join failed:", e); }
    finally { setJoiningId(null); }
  };

  // ── Leave a group ────────────────────────────────────────────────────────
  const leaveGroup = async (group: Group) => {
    if (leavingId) return;
    setLeavingId(group.id);
    try {
      const { db }                          = await getFirebase();
      const { doc, updateDoc, arrayRemove } = await import("firebase/firestore");

      const member = group.members?.find((m) => m.uid === currentUid);
      if (!member) return;

      await updateDoc(doc(db, "groups", group.id), {
        members:     arrayRemove(member),
        memberCount: Math.max(0, (group.memberCount ?? 1) - 1),
      });

      // If we were viewing the chat, go back
      if (activeChat?.id === group.id) setActiveChat(null);
    } catch (e) { console.error("Leave failed:", e); }
    finally { setLeavingId(null); }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const isMember = (g: Group) => g.members?.some((m) => m.uid === currentUid) ?? false;

  const filtered = groups.filter((g) => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) ||
                        g.subject.toLowerCase().includes(search.toLowerCase());
    const matchTab    = filterTab === "mine" ? isMember(g) : true;
    return matchSearch && matchTab;
  });

  const myGroups       = filtered.filter((g) => isMember(g));
  const discoverGroups = filtered.filter((g) => !isMember(g));

  // ── If a chat is open, show it full-screen ───────────────────────────────
  if (activeChat) {
    return (
      <GroupChatPanel
        group={activeChat}
        currentUid={currentUid}
        displayName={displayName}
        onBack={() => setActiveChat(null)}
      />
    );
  }

  // ── Loading state ────────────────────────────────────────────────────────
  if (groupsLoading || authLoading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-slate-400">
        <Spinner className="w-6 h-6" />
        <span className="font-semibold text-sm">Loading groups…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-black text-slate-900 text-2xl mb-1">Study Groups</h2>
          <p className="text-slate-500 text-sm font-medium">
            Connect with peers studying the same subjects.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border-2 border-slate-200 rounded-xl px-3 py-2 flex-1 sm:w-56">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search groups…"
              className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400 font-body" />
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-black shadow-md shadow-orange-200 transition-all hover:-translate-y-0.5 flex-shrink-0">
            <Plus className="w-4 h-4" /> Create
          </button>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex gap-2">
        {(["all", "mine"] as const).map((tab) => (
          <button key={tab} onClick={() => setFilterTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-black transition-all capitalize ${
              filterTab === tab
                ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                : "bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300"
            }`}>
            {tab === "all" ? `All Groups (${groups.length})` : `My Groups (${groups.filter(isMember).length})`}
          </button>
        ))}
      </div>

      {/* ── My groups ── */}
      {filterTab === "all" && myGroups.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">My Groups</p>
            <span className="text-xs font-black text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">{myGroups.length}</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {myGroups.map((g) => {
              const c = COLOR_MAP[g.color] ?? COLOR_MAP.orange;
              const isAdmin = g.adminUid === currentUid;
              return (
                <div key={g.id} className={`border-2 rounded-2xl p-5 ${c.bg} ${c.border}`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${c.iconBg} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>{g.icon}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-display font-bold text-slate-900 text-sm truncate">{g.name}</p>
                          {isAdmin && <Crown className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />}
                          {g.isPrivate && <Lock className="w-3 h-3 text-slate-400 flex-shrink-0" />}
                        </div>
                        <p className={`text-xs font-semibold ${c.text}`}>{g.level}</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-teal-700 bg-teal-100 border border-teal-200 rounded-full px-2.5 py-1 text-xs font-black flex-shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                      {(g.members?.length ?? 0)} members
                    </span>
                  </div>
                  {g.description && (
                    <p className="text-xs text-slate-500 font-medium mb-3 line-clamp-1">{g.description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <button onClick={() => setActiveChat(g)}
                      className={`flex-1 flex items-center justify-center gap-2 ${c.btn.replace("hover:", "").split(" ")[0].replace("bg-", "bg-")} text-white py-2.5 rounded-xl text-xs font-black transition-all hover:-translate-y-0.5 shadow-sm`}
                      style={{ background: c.btn.split(" ")[0].replace("bg-", "") }}
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Open Chat
                    </button>
                    {!isAdmin && (
                      <button onClick={() => leaveGroup(g)} disabled={leavingId === g.id}
                        className="px-3 py-2.5 rounded-xl text-xs font-black border-2 border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                        {leavingId === g.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Leave"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Discover / joined (when "mine" tab is active) ── */}
      {(filterTab === "mine" ? myGroups : discoverGroups).length > 0 && (
        <div>
          {filterTab === "all" && (
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Discover Groups</p>
          )}
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {(filterTab === "mine" ? myGroups : discoverGroups).map((g) => {
              const c      = COLOR_MAP[g.color] ?? COLOR_MAP.orange;
              const joined = isMember(g);
              return (
                <div key={g.id} className="bg-white border-2 border-slate-200 hover:border-slate-300 rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${c.iconBg} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>{g.icon}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-display font-bold text-slate-900 text-sm truncate">{g.name}</p>
                          {g.isPrivate
                            ? <Lock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            : <Globe className="w-3 h-3 text-teal-400 flex-shrink-0" />
                          }
                        </div>
                        <p className="text-xs text-slate-500 font-semibold">{g.level} · {g.subject}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 font-semibold flex-shrink-0">{g.members?.length ?? 0} members</span>
                  </div>
                  {g.description && (
                    <p className="text-xs text-slate-400 font-medium mb-3 line-clamp-2">{g.description}</p>
                  )}

                  {joined ? (
                    <div className="flex gap-2">
                      <button onClick={() => setActiveChat(g)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-orange-500 text-white py-2.5 rounded-xl text-xs font-black transition-colors">
                        <MessageCircle className="w-3.5 h-3.5" /> Open Chat
                      </button>
                      <button onClick={() => leaveGroup(g)} disabled={leavingId === g.id}
                        className="px-3 py-2.5 rounded-xl text-xs font-black border-2 border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                        {leavingId === g.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Leave"}
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => joinGroup(g)} disabled={joiningId === g.id}
                      className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-orange-500 text-white py-2.5 rounded-xl text-xs font-black transition-colors">
                      {joiningId === g.id
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Joining…</>
                        : <><Plus className="w-3.5 h-3.5" /> Join Group</>}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Empty states ── */}
      {filtered.length === 0 && search && (
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-10 text-center">
          <p className="text-2xl mb-2">🔍</p>
          <p className="font-display font-bold text-slate-500 text-lg">No groups found for &quot;{search}&quot;</p>
          <p className="text-slate-400 text-sm mt-1 font-medium">Try a different name or subject, or create a new group.</p>
        </div>
      )}
      {filterTab === "mine" && myGroups.length === 0 && !search && (
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-10 text-center">
          <p className="text-3xl mb-3">👥</p>
          <p className="font-display font-bold text-slate-700 text-lg mb-2">You haven&apos;t joined any groups yet</p>
          <p className="text-slate-400 text-sm font-medium mb-5">Switch to &quot;All Groups&quot; to discover and join study groups.</p>
          <button onClick={() => setFilterTab("all")}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl text-sm font-black transition-all shadow-md shadow-orange-200">
            Browse All Groups
          </button>
        </div>
      )}

      {/* ── Create modal ── */}
      {showCreate && (
        <CreateGroupModal
          currentUid={currentUid}
          displayName={displayName}
          onClose={() => setShowCreate(false)}
          onCreated={(g) => setGroups((p) => [g, ...p])}
        />
      )}
    </div>
  );
}