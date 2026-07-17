import React, { useState, useEffect } from "react";
import {
  Smartphone,
  Clipboard,
  FileText,
  Link2,
  FolderUp,
  Settings,
  Battery,
  BatteryCharging,
  Wifi,
  Radio,
  Check,
  Copy,
  Download,
  Trash2,
  Volume2,
  ShieldAlert,
  ArrowUpRight,
  User,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useSyncRoom } from "../useSyncRoom";

interface PhoneEmulatorProps {
  roomId: string;
}

export const PhoneEmulator: React.FC<PhoneEmulatorProps> = ({ roomId }) => {
  const [activeTab, setActiveTab] = useState<"clipboard" | "notes" | "links" | "files" | "status">("clipboard");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Initialize a REAL secondary Firebase Sync client representing the Emulator Device
  const phoneDeviceId = "sim_iphone_15";
  const phoneDeviceName = "Simulated iPhone 15";
  const {
    roomData,
    onlineDevices,
    setClipboard,
    updateNote,
    setTypingStatus,
    pushLink,
    markLinkAsOpened,
    shareFile,
    deleteFile,
    respondToAuthChallenge,
    updateSimulatedDevice
  } = useSyncRoom(roomId, phoneDeviceId, phoneDeviceName, "emulator");

  // Local state forms for mobile tabs
  const [clipInput, setClipInput] = useState("");
  const [linkUrlInput, setLinkUrlInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Monitor Auth challenges
  const challenge = roomData?.authChallenge;
  const isPendingChallenge = challenge?.status === "pending";

  const selfStatus = roomData?.devices[phoneDeviceId];
  const batteryPct = selfStatus?.batteryLevel ?? 78;
  const isCharging = selfStatus?.isCharging ?? false;
  const signal = selfStatus?.signalStrength ?? 4;

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendClipboard = async () => {
    if (!clipInput.trim()) return;
    await setClipboard(clipInput);
    setClipInput("");
  };

  const handlePushLink = async () => {
    if (!linkUrlInput.trim()) return;
    let formatted = linkUrlInput.trim();
    if (!/^https?:\/\//i.test(formatted)) {
      formatted = "https://" + formatted;
    }
    await pushLink(formatted, "Cast from iPhone");
    setLinkUrlInput("");
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    updateNote(val);
    
    setTypingStatus(true);
    const timer = setTimeout(() => {
      setTypingStatus(false);
    }, 2000);
  };

  // Sound generator for phone ping alerts
  const playPhoneAlert = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {}
  };

  return (
    <div className="flex flex-col items-center">
      {/* Phone Shell */}
      <div className="relative w-[320px] h-[640px] bg-black rounded-[48px] border-[10px] border-slate-800 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col font-sans select-none ring-1 ring-white/10">
        
        {/* Dynamic Island / Notch */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-30 flex items-center justify-between px-3">
          <div className="w-2.5 h-2.5 bg-slate-900 rounded-full border border-slate-800" />
          <div className="w-1.5 h-1.5 bg-blue-500/80 rounded-full animate-pulse" />
        </div>

        {/* Mobile Status Bar */}
        <div className="h-10 bg-slate-950 px-6 flex items-end justify-between pb-1.5 text-[10px] font-bold text-white z-20 shrink-0">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-slate-400" />
            <Wifi className="w-3 h-3 text-slate-400" />
            <div className="flex items-center gap-0.5">
              {isCharging ? (
                <BatteryCharging className="w-4 h-4 text-emerald-400" />
              ) : (
                <Battery className="w-4 h-4 text-slate-300" />
              )}
              <span className="text-[9px]">{batteryPct}%</span>
            </div>
          </div>
        </div>

        {/* Emulator Contents */}
        <div className="flex-1 bg-slate-950 flex flex-col relative overflow-hidden text-slate-300">
          
          {/* Main Tab Views */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-14">
            
            {/* Clipboard Tab */}
            {activeTab === "clipboard" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                    <Clipboard className="w-4 h-4 text-blue-400" />
                    <span>Clipboard Board</span>
                  </h4>
                  <span className="text-[9px] bg-blue-500/20 text-blue-300 font-bold px-1.5 py-0.5 rounded">
                    Synced
                  </span>
                </div>

                {/* Mobile Send */}
                <div className="space-y-2">
                  <textarea
                    value={clipInput}
                    onChange={(e) => setClipInput(e.target.value)}
                    placeholder="Type to sync instantly to computer..."
                    className="w-full text-xs bg-slate-900 border border-white/5 focus:border-blue-500/30 rounded-xl px-3 py-2 outline-none h-16 resize-none placeholder:text-slate-600 focus:ring-1 focus:ring-blue-500/10"
                    id="phone-clip-textarea"
                  />
                  <button
                    onClick={handleSendClipboard}
                    disabled={!clipInput.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-semibold text-xs py-2 rounded-xl transition-colors cursor-pointer"
                    id="phone-clip-send-btn"
                  >
                    Broadcast to Desktop
                  </button>
                </div>

                {/* Active clipboard representation */}
                <div className="border-t border-white/5 pt-3">
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Active Board</span>
                  {roomData?.clipboard ? (
                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 flex items-start justify-between gap-2 mt-1.5">
                      <p className="text-xs text-blue-100 font-mono break-all max-h-24 overflow-y-auto flex-1 leading-normal">
                        {roomData.clipboard.text}
                      </p>
                      <button
                        onClick={() => handleCopy(roomData.clipboard!.text, "phone-active")}
                        className={`p-1.5 rounded-lg shrink-0 ${
                          copiedId === "phone-active" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"
                        }`}
                        id="phone-btn-copy-clip"
                      >
                        {copiedId === "phone-active" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-[11px] text-slate-600 py-4">No synced clipboard</div>
                  )}
                </div>
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === "notes" && (
              <div className="space-y-4 animate-fadeIn flex flex-col h-full">
                <div className="flex items-center justify-between shrink-0">
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>Live Notepad</span>
                  </h4>
                  <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Real-time</span>
                  </span>
                </div>

                <div className="flex-1 min-h-[140px] flex flex-col">
                  <textarea
                    value={roomData?.note?.content || ""}
                    onChange={handleNoteChange}
                    placeholder="Type notes..."
                    className="w-full flex-1 bg-slate-900 text-xs text-slate-200 border border-white/5 focus:border-emerald-500/30 rounded-xl px-3 py-3 outline-none resize-none focus:ring-1 focus:ring-emerald-500/10 custom-scrollbar"
                    id="phone-note-textarea"
                  />
                  <span className="text-[8px] text-slate-500 font-mono mt-1 text-right block">
                    Saved in Firestore
                  </span>
                </div>
              </div>
            )}

            {/* Links Tab */}
            {activeTab === "links" && (
              <div className="space-y-4 animate-fadeIn">
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  <Link2 className="w-4 h-4 text-indigo-400" />
                  <span>Link Caster</span>
                </h4>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={linkUrlInput}
                    onChange={(e) => setLinkUrlInput(e.target.value)}
                    placeholder="URL (e.g. google.com)"
                    className="w-full text-xs bg-slate-900 border border-white/5 focus:border-indigo-500/30 rounded-xl px-3 py-2 outline-none"
                    id="phone-link-input"
                  />
                  <button
                    onClick={handlePushLink}
                    disabled={!linkUrlInput.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-semibold text-xs py-2 rounded-xl"
                    id="phone-link-send-btn"
                  >
                    Cast link to PC
                  </button>
                </div>

                {/* Received link representation */}
                <div className="border-t border-white/5 pt-3">
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Received Casts</span>
                  {roomData?.pushedLink ? (
                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3 mt-1.5">
                      <h5 className="text-xs font-semibold text-indigo-300 truncate">{roomData.pushedLink.title || "Shared Link"}</h5>
                      <p className="text-[9px] text-slate-500 truncate font-mono mt-0.5">{roomData.pushedLink.url}</p>
                      <button
                        onClick={() => {
                          window.open(roomData.pushedLink!.url, "_blank");
                          markLinkAsOpened();
                        }}
                        className="w-full mt-2.5 bg-slate-800 hover:bg-indigo-600 text-white font-semibold text-[10px] py-1.5 rounded-lg flex items-center justify-center gap-1"
                        id="phone-btn-open-link"
                      >
                        <span>Open Link</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-[11px] text-slate-600 py-4">No links shared yet</div>
                  )}
                </div>
              </div>
            )}

            {/* Files Tab */}
            {activeTab === "files" && (
              <div className="space-y-4 animate-fadeIn">
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  <FolderUp className="w-4 h-4 text-pink-400" />
                  <span>File Vault</span>
                </h4>

                {/* Mini file selector simulator */}
                <div className="bg-slate-900 border border-dashed border-white/10 rounded-xl p-4 text-center">
                  <button
                    onClick={() => {
                      // Simulate sending a photo
                      const dummyDataUrl = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' fill='%23ec4899'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='sans-serif' font-size='10'>Mobile Snapshot</text></svg>";
                      shareFile("Mobile_Snapshot.png", "image/png", 820, dummyDataUrl);
                    }}
                    className="text-pink-400 font-semibold text-xs hover:underline"
                    id="phone-btn-simulate-upload"
                  >
                    Simulate Camera Photo Upload
                  </button>
                  <p className="text-[9px] text-slate-500 mt-1">Uploads a pink graphic instantly to PC</p>
                </div>

                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {roomData?.files && roomData.files.length > 0 ? (
                    roomData.files.map((file) => (
                      <div key={file.id} className="bg-slate-900 border border-white/5 rounded-xl p-2.5 flex items-center justify-between gap-2 text-left">
                        <div className="min-w-0 flex items-center gap-2">
                          <div className="w-7 h-7 rounded bg-pink-500/10 text-pink-400 flex items-center justify-center shrink-0 text-xs">
                            <FolderUp className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-[11px] font-semibold text-slate-200 truncate">{file.name}</h5>
                            <span className="text-[8px] text-slate-500 font-mono block">By {file.sender}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <a
                            href={file.dataUrl}
                            download={file.name}
                            className="p-1 bg-slate-800 text-slate-400 hover:text-white rounded"
                            id={`phone-btn-dl-${file.id}`}
                          >
                            <Download className="w-3 h-3" />
                          </a>
                          <button
                            onClick={() => deleteFile(file.id)}
                            className="p-1 bg-slate-800 text-slate-400 hover:text-red-400 rounded"
                            id={`phone-btn-del-${file.id}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-[10px] text-slate-600 py-4">No files shared</div>
                  )}
                </div>
              </div>
            )}

            {/* Status / Settings Tab */}
            {activeTab === "status" && (
              <div className="space-y-4 animate-fadeIn">
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Emulator Settings</span>
                </h4>

                <div className="space-y-4 bg-slate-900/60 border border-white/5 rounded-xl p-3">
                  {/* Battery Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                      <span>Simulate Battery</span>
                      <span>{batteryPct}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={batteryPct}
                      onChange={(e) => updateSimulatedDevice(phoneDeviceId, { batteryLevel: parseInt(e.target.value) })}
                      className="w-full accent-emerald-400 h-1 rounded-lg cursor-pointer bg-slate-800"
                      id="phone-battery-slider"
                    />
                  </div>

                  {/* Charging Toggle */}
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[10px] text-slate-400 font-bold">Charging Cable Connected</span>
                    <button
                      onClick={() => updateSimulatedDevice(phoneDeviceId, { isCharging: !isCharging })}
                      className={`text-[9px] font-bold px-2 py-1 rounded transition-colors ${
                        isCharging ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"
                      }`}
                      id="phone-btn-toggle-charging"
                    >
                      {isCharging ? "On" : "Off"}
                    </button>
                  </div>

                  {/* Signal Strength */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                      <span>Simulate Signal</span>
                      <span>{signal}/4 Bars</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="4"
                      value={signal}
                      onChange={(e) => updateSimulatedDevice(phoneDeviceId, { signalStrength: parseInt(e.target.value) })}
                      className="w-full accent-emerald-400 h-1 rounded-lg cursor-pointer bg-slate-800"
                      id="phone-signal-slider"
                    />
                  </div>
                </div>

                <div className="text-[10px] text-slate-600 text-center leading-normal">
                  Adjusting these inputs pushes updates to the cloud. You will instantly see them reflect on the Desktop client under "Synced Devices".
                </div>
              </div>
            )}

          </div>

          {/* Secure 2FA Approval Overlay (Slides up like iOS Action Sheet) */}
          <AnimatePresence>
            {isPendingChallenge && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-end"
              >
                <motion.div
                  initial={{ y: 250 }}
                  animate={{ y: 0 }}
                  exit={{ y: 250 }}
                  transition={{ type: "spring", damping: 25, stiffness: 350 }}
                  className="w-full bg-slate-900 rounded-t-3xl border-t border-white/10 p-5 space-y-4"
                >
                  <div className="flex justify-center">
                    <div className="w-10 h-1 bg-slate-700 rounded-full" />
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl mb-2.5 animate-pulse">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <h5 className="text-sm font-bold text-slate-100">Sign-In Approval Request</h5>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-[220px] leading-relaxed">
                      A MacBook Pro is requesting access to your synced cloud account.
                    </p>
                  </div>

                  <div className="space-y-2 pt-1.5">
                    <button
                      onClick={() => respondToAuthChallenge("approved")}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                      id="phone-btn-approve-2fa"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve Request</span>
                    </button>
                    <button
                      onClick={() => respondToAuthChallenge("denied")}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                      id="phone-btn-deny-2fa"
                    >
                      <span>Deny</span>
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Bottom Navigation Bar */}
          <div className="absolute bottom-0 inset-x-0 h-12 bg-slate-950 border-t border-white/5 flex items-center justify-around text-slate-500 px-2 z-30 shrink-0">
            <button
              onClick={() => setActiveTab("clipboard")}
              className={`flex flex-col items-center gap-0.5 text-[8px] font-bold ${activeTab === "clipboard" ? "text-blue-400" : "hover:text-slate-400"}`}
              id="phone-nav-clip"
            >
              <Clipboard className="w-4 h-4" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`flex flex-col items-center gap-0.5 text-[8px] font-bold ${activeTab === "notes" ? "text-emerald-400" : "hover:text-slate-400"}`}
              id="phone-nav-notes"
            >
              <FileText className="w-4 h-4" />
              <span>Notes</span>
            </button>
            <button
              onClick={() => setActiveTab("links")}
              className={`flex flex-col items-center gap-0.5 text-[8px] font-bold ${activeTab === "links" ? "text-indigo-400" : "hover:text-slate-400"}`}
              id="phone-nav-links"
            >
              <Link2 className="w-4 h-4" />
              <span>Casts</span>
            </button>
            <button
              onClick={() => setActiveTab("files")}
              className={`flex flex-col items-center gap-0.5 text-[8px] font-bold ${activeTab === "files" ? "text-pink-400" : "hover:text-slate-400"}`}
              id="phone-nav-files"
            >
              <FolderUp className="w-4 h-4" />
              <span>Vault</span>
            </button>
            <button
              onClick={() => setActiveTab("status")}
              className={`flex flex-col items-center gap-0.5 text-[8px] font-bold ${activeTab === "status" ? "text-slate-300" : "hover:text-slate-400"}`}
              id="phone-nav-settings"
            >
              <Settings className="w-4 h-4" />
              <span>Status</span>
            </button>
          </div>

        </div>

        {/* iPhone Bottom Bar Indicator */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-28 h-1 bg-slate-600 rounded-full z-30" />
      </div>

      <p className="text-[11px] text-slate-500 mt-2.5 font-mono text-center flex items-center gap-1 bg-slate-900/40 px-3 py-1 rounded-full border border-white/5">
        <Sparkles className="w-3 h-3 text-yellow-400" />
        <span>Simulated iPhone 15 client</span>
      </p>
    </div>
  );
};
