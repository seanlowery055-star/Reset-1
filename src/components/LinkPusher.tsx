import React, { useState, useEffect } from "react";
import { ExternalLink, Link2, Share2, Youtube, MapPin, Globe, Compass } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RoomState } from "../types";

interface LinkPusherProps {
  roomData: RoomState | null;
  onPushLink: (url: string, title?: string) => Promise<void>;
  onMarkAsOpened: () => Promise<void>;
  currentDeviceName: string;
}

export const LinkPusher: React.FC<LinkPusherProps> = ({
  roomData,
  onPushLink,
  onMarkAsOpened,
  currentDeviceName
}) => {
  const [urlInput, setUrlInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [isPushing, setIsPushing] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const activeLink = roomData?.pushedLink;

  // Listen for a newly pushed link from another sender and show a prominent toast/notification
  useEffect(() => {
    if (activeLink && activeLink.sender !== currentDeviceName && !activeLink.opened) {
      // Check if it's within the last 20 seconds to prevent stale alerts
      if (Date.now() - activeLink.timestamp < 20000) {
        setShowAlert(true);
      }
    }
  }, [activeLink?.timestamp, activeLink?.sender, activeLink?.opened]);

  const handlePush = async (e?: React.FormEvent, customUrl?: string, customTitle?: string) => {
    if (e) e.preventDefault();
    const finalUrl = customUrl || urlInput;
    const finalTitle = customTitle || titleInput || finalUrl;

    if (!finalUrl.trim()) return;

    // Standardize URL protocol if not provided
    let formattedUrl = finalUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = "https://" + formattedUrl;
    }

    setIsPushing(true);
    try {
      await onPushLink(formattedUrl, finalTitle);
      setUrlInput("");
      setTitleInput("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsPushing(false);
    }
  };

  const handleOpenLink = () => {
    if (activeLink?.url) {
      window.open(activeLink.url, "_blank", "noopener,noreferrer");
      onMarkAsOpened();
      setShowAlert(false);
    }
  };

  const PRESETS = [
    { name: "YouTube", url: "https://youtube.com", icon: Youtube, color: "hover:text-red-500 hover:bg-red-500/10" },
    { name: "Google Maps", url: "https://maps.google.com", icon: MapPin, color: "hover:text-emerald-400 hover:bg-emerald-400/10" },
    { name: "Wikipedia", url: "https://wikipedia.org", icon: Globe, color: "hover:text-teal-400 hover:bg-teal-400/10" },
    { name: "AI Studio", url: "https://aistudio.google.com", icon: Compass, color: "hover:text-violet-400 hover:bg-violet-400/10" }
  ];

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/5 p-6 flex flex-col h-full shadow-xl relative overflow-hidden">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
          <Link2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-100">Link Pusher</h3>
          <p className="text-xs text-slate-400">Cast browser tabs & URLs instantly</p>
        </div>
      </div>

      {/* Push Input Form */}
      <form onSubmit={(e) => handlePush(e)} className="space-y-3 mb-5">
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Paste URL (e.g. youtube.com)"
          className="w-full text-xs bg-slate-950/80 text-slate-200 border border-white/5 focus:border-indigo-500/50 rounded-xl px-4 py-3 outline-none placeholder:text-slate-600 transition-all focus:ring-1 focus:ring-indigo-500/20"
          id="link-url-input"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder="Label (optional)"
            className="flex-1 text-xs bg-slate-950/80 text-slate-200 border border-white/5 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 outline-none placeholder:text-slate-600 transition-all focus:ring-1 focus:ring-indigo-500/20"
            id="link-title-input"
          />
          <button
            type="submit"
            disabled={isPushing || !urlInput.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white font-semibold text-xs px-4 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            id="link-push-submit-btn"
          >
            <span>Cast</span>
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Preset Quick Pushes */}
      <div className="mb-6">
        <div className="text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">Quick Presets</div>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handlePush(undefined, preset.url, preset.name)}
              className={`flex items-center gap-2 border border-white/5 bg-slate-950/40 rounded-xl px-3 py-2 text-xs text-slate-400 transition-all ${preset.color}`}
              id={`preset-link-${preset.name}`}
            >
              <preset.icon className="w-3.5 h-3.5" />
              <span className="truncate">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Currently Casted Link Display */}
      <div className="flex-1 flex flex-col justify-end">
        <div className="text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">Casted Link</div>
        {activeLink ? (
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-indigo-300 truncate">{activeLink.title || activeLink.url}</h4>
              <p className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">{activeLink.url}</p>
              <div className="flex items-center gap-1.5 mt-2 text-[9px] text-slate-500">
                <span className="font-semibold truncate max-w-[80px]">{activeLink.sender}</span>
                <span>•</span>
                <span>{new Date(activeLink.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            <a
              href={activeLink.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onMarkAsOpened}
              className="p-2 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg transition-colors shrink-0"
              title="Open Link"
              id="casted-link-anchor"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <div className="border border-dashed border-white/5 rounded-xl py-6 text-center text-xs text-slate-600">
            No active URLs casted. Enter a website address above.
          </div>
        )}
      </div>

      {/* Push Alert Toast */}
      <AnimatePresence>
        {showAlert && activeLink && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute inset-x-4 bottom-4 bg-slate-950 border border-indigo-500/50 rounded-xl p-4 shadow-2xl z-20 flex flex-col gap-3"
          >
            <div>
              <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>
                <span>Incoming URL Shared!</span>
              </div>
              <p className="text-xs font-semibold text-slate-200 truncate mt-1">
                {activeLink.title || "Untitled Link"}
              </p>
              <p className="text-[10px] text-slate-500 truncate font-mono mt-0.5">
                {activeLink.url}
              </p>
              <p className="text-[9px] text-indigo-300/60 mt-1">Sent from {activeLink.sender}</p>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  onMarkAsOpened();
                  setShowAlert(false);
                }}
                className="text-[10px] font-semibold text-slate-400 hover:text-slate-200 px-2.5 py-1.5 hover:bg-white/5 rounded-lg transition-colors"
                id="btn-alert-dismiss"
              >
                Dismiss
              </button>
              <button
                onClick={handleOpenLink}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                id="btn-alert-open"
              >
                <span>Open Link</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
