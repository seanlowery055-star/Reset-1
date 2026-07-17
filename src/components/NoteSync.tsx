import React, { useState, useEffect, useRef } from "react";
import { FileText, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RoomState } from "../types";

interface NoteSyncProps {
  roomData: RoomState | null;
  onUpdateNote: (content: string) => Promise<void>;
  onSetTypingStatus: (isTyping: boolean) => Promise<void>;
  currentDeviceName: string;
}

export const NoteSync: React.FC<NoteSyncProps> = ({
  roomData,
  onUpdateNote,
  onSetTypingStatus,
  currentDeviceName
}) => {
  const noteState = roomData?.note;
  const [localContent, setLocalContent] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncContentRef = useRef("");

  // Sync incoming Firestore changes to local textarea state
  useEffect(() => {
    if (noteState) {
      // Overwrite local content ONLY if:
      // 1. The user is not currently focused/typing in the box, or
      // 2. The Firestore text has diverged significantly from what we last saved (someone else changed it)
      if (!isFocused || noteState.content !== lastSyncContentRef.current) {
        setLocalContent(noteState.content || "");
        lastSyncContentRef.current = noteState.content || "";
      }
    }
  }, [noteState?.content, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalContent(val);

    // Broadcast typing status
    onSetTypingStatus(true);

    // Clear typing status after 2 seconds of silence
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      onSetTypingStatus(false);
    }, 2000);

    // Instantly save to Firestore (debounced or on every change for real-time feel)
    // To maintain responsive typing, save directly to Firestore with a very tiny delay
    lastSyncContentRef.current = val;
    onUpdateNote(val);
  };

  const handleBlur = () => {
    setIsFocused(false);
    onSetTypingStatus(false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  // Check if someone else is typing
  const otherTyping =
    noteState?.typingDeviceName &&
    noteState.typingDeviceName !== currentDeviceName &&
    noteState.typingDeviceExpires &&
    noteState.typingDeviceExpires > Date.now();

  const characterCount = localContent.length;
  const wordCount = localContent.trim() ? localContent.trim().split(/\s+/).length : 0;

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/5 p-6 flex flex-col h-full shadow-xl">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100">Synchronized Notepad</h3>
            <p className="text-xs text-slate-400">Co-write markdown notes in real-time</p>
          </div>
        </div>

        {/* Typing indicator */}
        <div className="h-5 flex items-center">
          <AnimatePresence>
            {otherTyping && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-1.5 text-xs text-emerald-400"
              >
                <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                <span className="font-medium">{noteState?.typingDeviceName} is typing...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 flex flex-col relative min-h-[160px]">
        <textarea
          value={localContent}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Start typing notes here... They will instantly appear on your phone and are saved securely in Firestore."
          className="w-full flex-1 bg-slate-950/80 text-slate-200 border border-white/5 focus:border-emerald-500/50 rounded-xl px-4 py-4 outline-none font-sans text-sm resize-none placeholder:text-slate-600 transition-all focus:ring-1 focus:ring-emerald-500/20 custom-scrollbar"
          id="synced-note-textarea"
        />
        {isFocused && (
          <div className="absolute top-3 right-3 text-[10px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            <span>Sync Live</span>
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between mt-3 text-[10px] text-slate-500 font-mono">
        <div>
          {characterCount > 0 ? (
            <span>
              {characterCount} chars • {wordCount} words
            </span>
          ) : (
            <span>Empty slate</span>
          )}
        </div>
        <div>
          {noteState?.updatedAt ? (
            <span>
              Last saved:{" "}
              {new Date(noteState.updatedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
              })}
            </span>
          ) : (
            <span>Auto-saving</span>
          )}
        </div>
      </div>
    </div>
  );
};
