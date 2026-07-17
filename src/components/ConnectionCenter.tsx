import React, { useState } from "react";
import { Copy, Check, QrCode, Smartphone, Wifi, Share2, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ConnectionCenterProps {
  roomId: string;
}

export const ConnectionCenter: React.FC<ConnectionCenterProps> = ({ roomId }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Compute the connection URL that we want the physical phone to load
  const getConnectionUrl = () => {
    if (typeof window !== "undefined") {
      // Use the actual browser location
      const base = window.location.origin + window.location.pathname;
      return `${base}?room=${roomId}`;
    }
    return `https://ais-pre-sti7xdqypchbudg3ja3ikn-145091586389.us-west2.run.app?room=${roomId}`;
  };

  const connectionUrl = getConnectionUrl();
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(connectionUrl)}&color=0-0-0&bgcolor=255-255-255&margin=1`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(connectionUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/5 p-6 flex flex-col md:flex-row gap-8 shadow-xl items-center">
      {/* QR Code Column */}
      <div className="flex flex-col items-center shrink-0 text-center">
        <div className="bg-white p-3.5 rounded-2xl border border-white/10 shadow-lg relative group">
          <img
            src={qrCodeUrl}
            alt="Scan QR to Sync Phone"
            className="w-40 h-40 object-contain rounded-lg"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-slate-950/80 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all p-3 text-white">
            <QrCode className="w-8 h-8 text-emerald-400 mb-1" />
            <span className="text-[10px] font-semibold">Instant Pairing</span>
            <span className="text-[8px] text-slate-400">Scan with your Phone Camera</span>
          </div>
        </div>
        <span className="text-[10px] text-slate-500 font-medium mt-3 uppercase tracking-wider flex items-center gap-1.5">
          <Wifi className="w-3 h-3 text-emerald-500 animate-pulse" />
          <span>Real-time QR Bridge</span>
        </span>
      </div>

      {/* Sync Room Identity Column */}
      <div className="flex-1 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>Pair Physical Device</span>
            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Cloud Bridged
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            Scan the QR code or send this URL to your smartphone. Your computer and phone will link instantly using our secure Firebase channel, syncing clipboard notes, files, and logins in real-time.
          </p>
        </div>

        {/* Sync Room Fields */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Room Code */}
          <div className="bg-slate-950/80 border border-white/5 rounded-xl px-4 py-2.5 flex items-center justify-between gap-4">
            <div>
              <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider">Sync Room Code</span>
              <span className="text-sm font-mono font-extrabold text-blue-400 tracking-widest">{roomId}</span>
            </div>
            <button
              onClick={handleCopyCode}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                copiedCode ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 hover:bg-slate-700 text-slate-400"
              }`}
              title="Copy Room Code"
              id="btn-copy-room-code"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Copy Direct Connection Link */}
          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-2 text-xs font-semibold py-3 px-4 rounded-xl cursor-pointer shadow-md transition-all ${
              copiedLink
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/5"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white"
            }`}
            id="btn-copy-invite-link"
          >
            {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedLink ? "Link Copied!" : "Copy Invite Link"}</span>
          </button>
        </div>

        {/* Help Step Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-white/5 pt-4">
          <div className="flex gap-2.5 items-start">
            <div className="w-5 h-5 rounded-full bg-slate-950/80 border border-white/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-slate-400">
              1
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              Scan the QR using your standard iOS or Android camera app.
            </p>
          </div>
          <div className="flex gap-2.5 items-start">
            <div className="w-5 h-5 rounded-full bg-slate-950/80 border border-white/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-slate-400">
              2
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              Tap the loading prompt on your phone to open this app.
            </p>
          </div>
          <div className="flex gap-2.5 items-start">
            <div className="w-5 h-5 rounded-full bg-slate-950/80 border border-white/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-slate-400">
              3
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              Presto! Type, paste, or drop file items to sync them instantly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
