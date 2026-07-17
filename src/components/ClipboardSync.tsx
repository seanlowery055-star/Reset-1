import React, { useState, useEffect } from "react";
import { Clipboard, Copy, Check, Trash2, ArrowUpRight, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RoomState, ClipboardItem } from "../types";

interface ClipboardSyncProps {
  roomData: RoomState | null;
  onSetClipboard: (text: string) => Promise<void>;
  onClearHistory: () => Promise<void>;
  currentDeviceName: string;
}

export const ClipboardSync: React.FC<ClipboardSyncProps> = ({
  roomData,
  onSetClipboard,
  onClearHistory,
  currentDeviceName
}) => {
  const [inputText, setInputText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Monitor incoming clipboard changes to animate or auto-alert if it changes from someone else
  const currentClip = roomData?.clipboard;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setIsSending(true);
    try {
      await onSetClipboard(inputText);
      setInputText("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(itemId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Could not copy text: ", err);
    }
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/5 p-6 flex flex-col h-full shadow-xl">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
            <Clipboard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100">Universal Clipboard</h3>
            <p className="text-xs text-slate-400">Copy here, paste anywhere instantly</p>
          </div>
        </div>
        {roomData?.clipboardHistory && roomData.clipboardHistory.length > 0 && (
          <button
            onClick={onClearHistory}
            className="text-xs flex items-center gap-1.5 text-slate-500 hover:text-red-400 transition-colors px-2 py-1 hover:bg-white/5 rounded-md"
            title="Clear board and history"
            id="btn-clear-clipboard"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Board</span>
          </button>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="space-y-3 mb-6">
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or paste text to broadcast to other devices..."
            className="w-full min-h-[90px] text-sm bg-slate-950/80 text-slate-200 border border-white/5 focus:border-blue-500/50 rounded-xl px-4 py-3 outline-none resize-none placeholder:text-slate-600 transition-all focus:ring-1 focus:ring-blue-500/20"
            id="clipboard-textarea"
          />
          {inputText && (
            <button
              type="submit"
              disabled={isSending}
              className="absolute bottom-3 right-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-md transition-all active:scale-95"
              id="clipboard-push-btn"
            >
              <span>{isSending ? "Pushing..." : "Push to Devices"}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </form>

      {/* Active Clip Banner */}
      <div className="mb-6">
        <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Active Clipboard</div>
        {currentClip ? (
          <motion.div
            layoutId="active-clipboard"
            className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start justify-between gap-4"
          >
            <div className="flex-1 overflow-hidden">
              <p className="text-sm text-blue-100 font-mono break-all whitespace-pre-wrap max-h-[140px] overflow-y-auto pr-1">
                {currentClip.text}
              </p>
              <div className="flex items-center gap-2 mt-2.5 text-[10px] text-blue-400">
                <span className="font-semibold">{currentClip.sender}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(currentClip.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                {currentClip.sender === currentDeviceName && (
                  <span className="bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded text-[9px]">Sent by you</span>
                )}
              </div>
            </div>
            <button
              onClick={() => handleCopy(currentClip.text, currentClip.id)}
              className={`p-2 rounded-lg shrink-0 transition-all ${
                copiedId === currentClip.id
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white"
              }`}
              title="Copy to desktop"
              id="btn-copy-active-clip"
            >
              {copiedId === currentClip.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </motion.div>
        ) : (
          <div className="border border-dashed border-white/5 rounded-xl py-6 text-center text-sm text-slate-600">
            No active clipboard content. Paste or type above to start.
          </div>
        )}
      </div>

      {/* Clipboard History */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider flex items-center justify-between">
          <span>History Log</span>
          {roomData?.clipboardHistory && roomData.clipboardHistory.length > 0 && (
            <span className="text-[10px] text-slate-600">{roomData.clipboardHistory.length} items cached</span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          <AnimatePresence initial={false}>
            {roomData?.clipboardHistory && roomData.clipboardHistory.length > 1 ? (
              roomData.clipboardHistory.slice(1).map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-950/40 hover:bg-slate-950/60 transition-colors border border-white/5 rounded-xl p-3 flex items-center justify-between gap-3 group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-slate-300 truncate pr-4 break-all">
                      {item.text}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-[9px] text-slate-500">
                      <span className="font-semibold truncate max-w-[80px]">{item.sender}</span>
                      <span>•</span>
                      <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(item.text, item.id)}
                    className={`p-1.5 rounded-md shrink-0 transition-all opacity-80 group-hover:opacity-100 ${
                      copiedId === item.id
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                    }`}
                    id={`btn-copy-history-${item.id}`}
                  >
                    {copiedId === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </motion.div>
              ))
            ) : (
              <p className="text-xs text-slate-600 text-center py-4">Prior items will show up here</p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
