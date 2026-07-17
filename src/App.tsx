/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useSyncRoom, generateRoomCode, generateDeviceId } from "./useSyncRoom";
import { ConnectionCenter } from "./components/ConnectionCenter";
import { ClipboardSync } from "./components/ClipboardSync";
import { NoteSync } from "./components/NoteSync";
import { LinkPusher } from "./components/LinkPusher";
import { FileTransfer } from "./components/FileTransfer";
import { DeviceControl } from "./components/DeviceControl";
import { PhoneEmulator } from "./components/PhoneEmulator";
import {
  Cloud,
  Smartphone,
  Laptop,
  Edit2,
  Check as CheckIcon,
  RefreshCw,
  Layers,
  ShieldCheck,
  ExternalLink,
  Clipboard,
  FileText,
  Link2,
  FolderUp,
  Settings,
  ShieldAlert,
  BatteryCharging,
  Battery,
  Radio,
  Wifi,
  Sparkles,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // 1. Resolve room ID and device ID from URL parameters or LocalStorage
  const [roomId, setRoomId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryRoom = params.get("room");
      if (queryRoom && queryRoom.trim().length === 6) {
        return queryRoom.trim().toUpperCase();
      }
      const cached = localStorage.getItem("sync_room_id");
      if (cached && cached.trim().length === 6) {
        return cached;
      }
    }
    const generated = generateRoomCode();
    if (typeof window !== "undefined") {
      localStorage.setItem("sync_room_id", generated);
    }
    return generated;
  });

  const [deviceId] = useState<string>(() => {
    const cached = localStorage.getItem("sync_device_id");
    if (cached) return cached;
    const generated = generateDeviceId();
    localStorage.setItem("sync_device_id", generated);
    return generated;
  });

  // 2. Local device characteristics
  const [deviceName, setDeviceName] = useState<string>(() => {
    const cached = localStorage.getItem("sync_device_name");
    if (cached) return cached;
    const isMac = navigator.userAgent.includes("Mac");
    const isWindows = navigator.userAgent.includes("Win");
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile) return "My Smartphone";
    return isMac ? "MacBook Pro" : isWindows ? "Windows PC" : "Web Client";
  });

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(deviceName);

  // 3. View mode defaults (auto detect small screens, or allow toggle)
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [forceViewMode, setForceViewMode] = useState<"auto" | "desktop" | "mobile">("auto");
  const [showSimulator, setShowSimulator] = useState(true);

  // Mobile navigation tabs if opened on actual physical smartphone
  const [mobileActiveTab, setMobileActiveTab] = useState<"clipboard" | "notes" | "links" | "files" | "status">("clipboard");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mobileClipText, setMobileClipText] = useState("");
  const [mobileLinkText, setMobileLinkText] = useState("");

  // Track window resizing for responsive layouts
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 1024;
      setIsMobileScreen(isMobile);
      // Auto-hide simulator on narrow screens to fit nicely
      if (window.innerWidth < 1280) {
        setShowSimulator(false);
      } else {
        setShowSimulator(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update current room in address bar without reloading to preserve state & allow direct copy-pasting of URL
  useEffect(() => {
    if (typeof window !== "undefined" && roomId) {
      const params = new URLSearchParams(window.location.search);
      if (params.get("room") !== roomId) {
        params.set("room", roomId);
        const newUrl = window.location.pathname + "?" + params.toString();
        window.history.replaceState({ path: newUrl }, "", newUrl);
      }
      localStorage.setItem("sync_room_id", roomId);
    }
  }, [roomId]);

  const handleSaveDeviceName = () => {
    if (nameInput.trim()) {
      setDeviceName(nameInput.trim());
      localStorage.setItem("sync_device_name", nameInput.trim());
      setIsEditingName(false);
    }
  };

  // Determine physical device type based on user agent
  const getDeviceType = (): "desktop" | "phone" | "emulator" => {
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    return isMobile ? "phone" : "desktop";
  };

  // 4. Fire up the master hook for this browser window/client
  const currentDeviceType = getDeviceType();
  const {
    roomData,
    onlineDevices,
    isLoading,
    error,
    setClipboard,
    clearClipboardHistory,
    updateNote,
    setTypingStatus,
    pushLink,
    markLinkAsOpened,
    shareFile,
    deleteFile,
    createAuthChallenge,
    respondToAuthChallenge,
    clearAuthChallenge,
    updateSimulatedDevice
  } = useSyncRoom(roomId, deviceId, deviceName, currentDeviceType);

  // Quick regenerator for full room reset
  const handleRegenerateRoom = () => {
    const newRoom = generateRoomCode();
    setRoomId(newRoom);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("room", newRoom);
      const newUrl = window.location.pathname + "?" + params.toString();
      window.history.pushState({ path: newUrl }, "", newUrl);
    }
  };

  // Check if we should render full-screen mobile app layout (for real mobile browsers or forced mobile preview)
  const renderMobileLayout = forceViewMode === "mobile" || (forceViewMode === "auto" && (isMobileScreen || currentDeviceType === "phone"));

  const handleMobileCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMobileSendClip = async () => {
    if (!mobileClipText.trim()) return;
    await setClipboard(mobileClipText);
    setMobileClipText("");
  };

  const handleMobileSendLink = async () => {
    if (!mobileLinkText.trim()) return;
    let formatted = mobileLinkText.trim();
    if (!/^https?:\/\//i.test(formatted)) {
      formatted = "https://" + formatted;
    }
    await pushLink(formatted, "Cast from phone");
    setMobileLinkText("");
  };

  const handleMobileNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    updateNote(val);
    setTypingStatus(true);
    setTimeout(() => {
      setTypingStatus(false);
    }, 2000);
  };

  // Fetch mobile properties for the status screen
  const mobileDeviceSelf = roomData?.devices[deviceId];
  const mobileBattery = mobileDeviceSelf?.batteryLevel ?? 100;
  const mobileIsCharging = mobileDeviceSelf?.isCharging ?? false;

  // Render physical Mobile layout
  if (renderMobileLayout) {
    const isPendingChallenge = roomData?.authChallenge?.status === "pending";

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none relative pb-16">
        {/* Mobile Header Banner */}
        <header className="bg-slate-900 border-b border-white/5 py-3 px-4 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="font-mono text-[10px] bg-slate-950 px-2 py-0.5 rounded text-slate-400 font-bold tracking-widest">
              ROOM: {roomId}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setForceViewMode("desktop")}
              className="text-[10px] text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded"
              id="mobile-view-force-desktop"
            >
              Desktop Mode
            </button>
          </div>
        </header>

        {/* Mobile Body Area */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Clipboard Tab */}
          {mobileActiveTab === "clipboard" && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Clipboard className="w-5 h-5 text-blue-400" />
                  <span>Clipboard Sync</span>
                </h3>
                <p className="text-xs text-slate-500">Clipboard syncs to all computers instantly</p>
              </div>

              <div className="space-y-2">
                <textarea
                  value={mobileClipText}
                  onChange={(e) => setMobileClipText(e.target.value)}
                  placeholder="Type or paste clipboard contents to broadcast..."
                  className="w-full text-xs bg-slate-900 border border-white/5 focus:border-blue-500/30 rounded-xl px-3 py-2.5 h-20 outline-none resize-none placeholder:text-slate-600 focus:ring-1 focus:ring-blue-500/10"
                  id="m-clip-textarea"
                />
                <button
                  onClick={handleMobileSendClip}
                  disabled={!mobileClipText.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
                  id="m-clip-send-btn"
                >
                  Broadcast to Desktop
                </button>
              </div>

              <div className="border-t border-white/5 pt-4">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Active Clipboard</span>
                {roomData?.clipboard ? (
                  <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 flex items-start justify-between gap-3 mt-1.5">
                    <p className="text-xs text-blue-100 font-mono break-all max-h-40 overflow-y-auto flex-1 leading-normal">
                      {roomData.clipboard.text}
                    </p>
                    <button
                      onClick={() => handleMobileCopy(roomData.clipboard!.text, "m-active")}
                      className={`p-2 rounded-lg shrink-0 ${
                        copiedId === "m-active" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"
                      }`}
                      id="m-btn-copy-clip"
                    >
                      {copiedId === "m-active" ? <CheckIcon className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-xs text-slate-600 py-6">No shared board clipboard found</div>
                )}
              </div>
            </div>
          )}

          {/* Notepad Tab */}
          {mobileActiveTab === "notes" && (
            <div className="space-y-4 animate-fadeIn flex flex-col h-full">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <span>Synchronized Notepad</span>
                </h3>
                <p className="text-xs text-slate-500">Live markdown canvas co-shared with PC</p>
              </div>

              <div className="flex-1 min-h-[220px] flex flex-col">
                <textarea
                  value={roomData?.note?.content || ""}
                  onChange={handleMobileNoteChange}
                  placeholder="Type notes..."
                  className="w-full flex-1 bg-slate-900 text-xs text-slate-200 border border-white/5 focus:border-emerald-500/30 rounded-xl px-3 py-3 outline-none resize-none focus:ring-1 focus:ring-emerald-500/10 custom-scrollbar"
                  id="m-note-textarea"
                />
              </div>
            </div>
          )}

          {/* Cast Links Tab */}
          {mobileActiveTab === "links" && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-indigo-400" />
                  <span>Link Caster</span>
                </h3>
                <p className="text-xs text-slate-500">Open website links instantly on desktop</p>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  value={mobileLinkText}
                  onChange={(e) => setMobileLinkText(e.target.value)}
                  placeholder="Website address (e.g. apple.com)"
                  className="w-full text-xs bg-slate-900 border border-white/5 focus:border-indigo-500/30 rounded-xl px-3 py-2.5 outline-none"
                  id="m-link-input"
                />
                <button
                  onClick={handleMobileSendLink}
                  disabled={!mobileLinkText.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-xl"
                  id="m-link-send-btn"
                >
                  Cast link to PC
                </button>
              </div>

              <div className="border-t border-white/5 pt-4">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Casted Links</span>
                {roomData?.pushedLink ? (
                  <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3 mt-1.5">
                    <h5 className="text-xs font-semibold text-indigo-300 truncate">{roomData.pushedLink.title || "Shared link"}</h5>
                    <p className="text-[9px] text-slate-500 truncate font-mono mt-0.5">{roomData.pushedLink.url}</p>
                    <button
                      onClick={() => {
                        window.open(roomData.pushedLink!.url, "_blank");
                        markLinkAsOpened();
                      }}
                      className="w-full mt-2.5 bg-slate-800 hover:bg-indigo-600 text-white font-semibold text-[10px] py-2 rounded-lg flex items-center justify-center gap-1"
                      id="m-btn-open-link"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-xs text-slate-600 py-6">No links shared yet</div>
                )}
              </div>
            </div>
          )}

          {/* File Vault Tab */}
          {mobileActiveTab === "files" && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <FolderUp className="w-5 h-5 text-pink-400" />
                  <span>File Vault</span>
                </h3>
                <p className="text-xs text-slate-500">Retrieve files shared from desktop</p>
              </div>

              {/* Simple file uploader simulator on mobile */}
              <div className="bg-slate-900 border border-dashed border-white/10 rounded-xl p-4 text-center">
                <button
                  onClick={() => {
                    const dummyDataUrl = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' fill='%23ec4899'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='sans-serif' font-size='10'>Mobile Snap</text></svg>";
                    shareFile("Camera_Snapshot.png", "image/png", 820, dummyDataUrl);
                  }}
                  className="text-pink-400 font-semibold text-xs hover:underline cursor-pointer"
                  id="m-btn-sim-upload"
                >
                  Simulate Camera Upload
                </button>
                <p className="text-[9px] text-slate-500 mt-1">Simulates uploading a 200KB local image asset</p>
              </div>

              <div className="space-y-2">
                {roomData?.files && roomData.files.length > 0 ? (
                  roomData.files.map((file) => (
                    <div key={file.id} className="bg-slate-900 border border-white/5 rounded-xl p-3 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded bg-pink-500/10 text-pink-400 flex items-center justify-center shrink-0">
                          <FolderUp className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-semibold text-slate-200 truncate">{file.name}</h5>
                          <span className="text-[8px] text-slate-500 font-mono">By {file.sender}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <a
                          href={file.dataUrl}
                          download={file.name}
                          className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded"
                          id={`m-btn-dl-${file.id}`}
                        >
                          <FolderUp className="w-3.5 h-3.5 rotate-180" />
                        </a>
                        <button
                          onClick={() => deleteFile(file.id)}
                          className="p-1.5 bg-slate-800 text-slate-400 hover:text-red-400 rounded"
                          id={`m-btn-del-${file.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-xs text-slate-600 py-6">Vault is empty</div>
                )}
              </div>
            </div>
          )}

          {/* Status Settings Tab */}
          {mobileActiveTab === "status" && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-slate-400" />
                  <span>Device & Status</span>
                </h3>
                <p className="text-xs text-slate-500">Configure phone identity & settings</p>
              </div>

              <div className="bg-slate-900 border border-white/5 rounded-xl p-4 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Device Handle</label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full text-xs bg-slate-950 border border-white/5 rounded-lg px-3 py-2 outline-none"
                    id="m-device-name-input"
                  />
                  <button
                    onClick={() => {
                      if (nameInput.trim()) {
                        setDeviceName(nameInput.trim());
                        localStorage.setItem("sync_device_name", nameInput.trim());
                      }
                    }}
                    className="mt-2 text-[10px] bg-slate-800 hover:bg-slate-700 text-white font-semibold py-1.5 px-3 rounded-lg"
                    id="m-save-name-btn"
                  >
                    Save Name
                  </button>
                </div>

                <div className="flex justify-between items-center border-t border-white/5 pt-3">
                  <span className="text-xs text-slate-400">Battery Level</span>
                  <span className="text-xs text-slate-200 font-mono flex items-center gap-1">
                    {mobileIsCharging ? <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" /> : <Battery className="w-3.5 h-3.5" />}
                    {mobileBattery}%
                  </span>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* Secure 2FA Challenge Popups for mobile */}
        <AnimatePresence>
          {isPendingChallenge && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end"
            >
              <div className="w-full bg-slate-900 border-t border-white/10 rounded-t-3xl p-6 space-y-4">
                <div className="flex justify-center">
                  <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-indigo-500/15 text-indigo-400 rounded-2xl mb-3 animate-bounce">
                    <ShieldAlert className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-extrabold text-slate-100">Sign-In Verification Prompt</h4>
                  <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-normal">
                    A laptop computer is requesting immediate permission to sign in. Allow this session?
                  </p>
                </div>
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => respondToAuthChallenge("approved")}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                    id="m-btn-approve-login"
                  >
                    <CheckIcon className="w-4 h-4" />
                    <span>Approve Session</span>
                  </button>
                  <button
                    onClick={() => respondToAuthChallenge("denied")}
                    className="w-full bg-slate-800 text-slate-300 font-bold py-3 rounded-xl cursor-pointer"
                    id="m-btn-deny-login"
                  >
                    <span>Deny Session</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile bottom bar */}
        <nav className="fixed bottom-0 inset-x-0 h-16 bg-slate-900 border-t border-white/5 flex items-center justify-around z-40 text-slate-500">
          <button
            onClick={() => setMobileActiveTab("clipboard")}
            className={`flex flex-col items-center gap-1 text-[9px] font-bold ${mobileActiveTab === "clipboard" ? "text-blue-400" : ""}`}
            id="m-nav-board"
          >
            <Clipboard className="w-5 h-5" />
            <span>Board</span>
          </button>
          <button
            onClick={() => setMobileActiveTab("notes")}
            className={`flex flex-col items-center gap-1 text-[9px] font-bold ${mobileActiveTab === "notes" ? "text-emerald-400" : ""}`}
            id="m-nav-notes"
          >
            <FileText className="w-5 h-5" />
            <span>Notes</span>
          </button>
          <button
            onClick={() => setMobileActiveTab("links")}
            className={`flex flex-col items-center gap-1 text-[9px] font-bold ${mobileActiveTab === "links" ? "text-indigo-400" : ""}`}
            id="m-nav-casts"
          >
            <Link2 className="w-5 h-5" />
            <span>Casts</span>
          </button>
          <button
            onClick={() => setMobileActiveTab("files")}
            className={`flex flex-col items-center gap-1 text-[9px] font-bold ${mobileActiveTab === "files" ? "text-pink-400" : ""}`}
            id="m-nav-vault"
          >
            <FolderUp className="w-5 h-5" />
            <span>Vault</span>
          </button>
          <button
            onClick={() => setMobileActiveTab("status")}
            className={`flex flex-col items-center gap-1 text-[9px] font-bold ${mobileActiveTab === "status" ? "text-slate-200" : ""}`}
            id="m-nav-device"
          >
            <Settings className="w-5 h-5" />
            <span>Device</span>
          </button>
        </nav>
      </div>
    );
  }

  // Otherwise, render full beautiful Desktop Dashboard layout with Simulated phone
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500/30 selection:text-blue-200 pb-12">
      
      {/* 1. Header Banner */}
      <header className="border-b border-white/5 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/10 text-white">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-100 text-sm tracking-tight">Sync Portal</h1>
                <span className="text-[10px] bg-blue-500/10 text-blue-400 font-bold px-2 py-0.5 rounded border border-blue-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                  <span>Live Connection</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Account-to-Phone Real-time Gateway</p>
            </div>
          </div>

          {/* Interactive Editable Device Name & Controls */}
          <div className="flex items-center gap-4">
            
            {/* Device tag */}
            <div className="flex items-center gap-2 bg-slate-950/80 border border-white/5 rounded-xl px-3 py-1.5">
              <Laptop className="w-3.5 h-3.5 text-slate-500" />
              <div className="text-left">
                <span className="block text-[8px] text-slate-600 font-bold uppercase tracking-wider">Device name</span>
                {isEditingName ? (
                  <div className="flex items-center gap-1 mt-0.5">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onBlur={handleSaveDeviceName}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveDeviceName()}
                      className="text-[10px] bg-slate-900 border border-white/10 text-slate-200 px-1 py-0.5 outline-none rounded"
                      autoFocus
                      id="desktop-device-name-input"
                    />
                    <button onClick={handleSaveDeviceName} className="text-emerald-400" id="btn-save-desktop-device-name">
                      <CheckIcon className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 mt-0.5 group">
                    <span className="text-xs text-slate-300 font-semibold">{deviceName}</span>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-slate-600 hover:text-slate-400 transition-colors"
                      id="btn-edit-desktop-device-name"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Room Reset */}
            <button
              onClick={handleRegenerateRoom}
              className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-white/5 px-3 py-2 rounded-xl transition-colors cursor-pointer"
              title="Leave current room and spin up a new room code"
              id="btn-regenerate-room"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>New Room</span>
            </button>

            {/* View Mode Toggle */}
            <button
              onClick={() => setForceViewMode("mobile")}
              className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-white/5 px-3 py-2 rounded-xl transition-colors cursor-pointer"
              title="Force full mobile viewport simulation for desktop"
              id="btn-toggle-mobile-view"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Test Phone Layout</span>
            </button>

            {/* Phone Simulator toggle */}
            <button
              onClick={() => setShowSimulator(!showSimulator)}
              className={`text-xs flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                showSimulator
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                  : "bg-slate-900 hover:bg-slate-800 text-slate-300"
              }`}
              id="btn-toggle-simulator-dock"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{showSimulator ? "Simulator Visible" : "Open Phone Emulator"}</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. Main Page Layout Grid */}
      <main className="max-w-7xl mx-auto px-6 mt-8 flex-1 w-full">
        <div className="flex flex-col xl:flex-row gap-8 items-start">
          
          {/* Main workspace (Connection Center + Sync Modules grid) */}
          <div className="flex-1 space-y-6 w-full">
            
            {/* Onboarding Bridge Portal */}
            <ConnectionCenter roomId={roomId} />

            {/* Error Overlay */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-400 text-xs">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <div>
                  <span className="font-semibold">Firebase error: </span>
                  {error}
                </div>
              </div>
            )}

            {/* Dynamic Sync Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              
              {/* Clipboard Module */}
              <div className="h-[440px]">
                <ClipboardSync
                  roomData={roomData}
                  onSetClipboard={setClipboard}
                  onClearHistory={clearClipboardHistory}
                  currentDeviceName={deviceName}
                />
              </div>

              {/* Real-time Notepad Module */}
              <div className="h-[440px]">
                <NoteSync
                  roomData={roomData}
                  onUpdateNote={updateNote}
                  onSetTypingStatus={setTypingStatus}
                  currentDeviceName={deviceName}
                />
              </div>

              {/* URL Caster */}
              <div className="h-[420px]">
                <LinkPusher
                  roomData={roomData}
                  onPushLink={pushLink}
                  onMarkAsOpened={markLinkAsOpened}
                  currentDeviceName={deviceName}
                />
              </div>

              {/* File Vault Drop zone */}
              <div className="h-[420px]">
                <FileTransfer
                  roomData={roomData}
                  onShareFile={shareFile}
                  onDeleteFile={deleteFile}
                  currentDeviceName={deviceName}
                />
              </div>

            </div>

          </div>

          {/* Side-Dock containing Device list and Auth Prompts (Always on desktop side, plus toggleable iPhone Simulator!) */}
          <div className="w-full xl:w-[320px] shrink-0 space-y-6">
            
            {/* Device list & Authenticator */}
            <div className="min-h-[440px] w-full">
              <DeviceControl
                roomData={roomData}
                onlineDevices={onlineDevices}
                currentDeviceId={deviceId}
                onTriggerAuth={createAuthChallenge}
                onRespondAuth={respondToAuthChallenge}
                onClearAuth={clearAuthChallenge}
                onUpdateSimulated={updateSimulatedDevice}
                currentDeviceType={currentDeviceType}
              />
            </div>

            {/* Side Simulator Slider frame */}
            <AnimatePresence>
              {showSimulator && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="w-full bg-slate-950/20 backdrop-blur-sm p-2 rounded-[52px] border border-white/5 flex flex-col items-center"
                >
                  <PhoneEmulator roomId={roomId} />
                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>
      </main>

    </div>
  );
}
