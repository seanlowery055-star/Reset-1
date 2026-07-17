import React, { useState, useEffect } from "react";
import { Laptop, Smartphone, Radio, Battery, BatteryCharging, AlertTriangle, ShieldCheck, Key, Volume2, Shield } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RoomState, SyncDevice } from "../types";

interface DeviceControlProps {
  roomData: RoomState | null;
  onlineDevices: SyncDevice[];
  currentDeviceId: string;
  onTriggerAuth: () => Promise<void>;
  onRespondAuth: (status: "approved" | "denied") => Promise<void>;
  onClearAuth: () => Promise<void>;
  onUpdateSimulated: (deviceId: string, updates: Partial<Omit<SyncDevice, "id">>) => Promise<void>;
  currentDeviceType: "desktop" | "phone" | "emulator";
}

export const DeviceControl: React.FC<DeviceControlProps> = ({
  roomData,
  onlineDevices,
  currentDeviceId,
  onTriggerAuth,
  onRespondAuth,
  onClearAuth,
  onUpdateSimulated,
  currentDeviceType
}) => {
  const challenge = roomData?.authChallenge;
  const [authStatusText, setAuthStatusText] = useState<string | null>(null);
  const [isPinging, setIsPinging] = useState<string | null>(null);

  // Sound generator using Web Audio API (zero dependency, highly responsive, work anywhere!)
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // First high chime
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gain1.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.4);

      // Second harmonizing chime shortly after
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(1318.51, audioCtx.currentTime); // E6
        gain2.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.6);
      }, 100);
    } catch (e) {
      console.log("Web Audio not allowed or failed:", e);
    }
  };

  // Listen for incoming challenge to play audio notification chime if pending or completed
  useEffect(() => {
    if (challenge) {
      if (challenge.status === "pending" && challenge.sender !== roomData?.devices[currentDeviceId]?.name) {
        playChime();
      } else if (challenge.status === "approved" && challenge.sender === roomData?.devices[currentDeviceId]?.name) {
        setAuthStatusText("Authenticated Successfully!");
        playChime();
        const timer = setTimeout(() => {
          setAuthStatusText(null);
          onClearAuth();
        }, 4000);
        return () => clearTimeout(timer);
      } else if (challenge.status === "denied" && challenge.sender === roomData?.devices[currentDeviceId]?.name) {
        setAuthStatusText("Access Denied by Phone.");
        const timer = setTimeout(() => {
          setAuthStatusText(null);
          onClearAuth();
        }, 4000);
        return () => clearTimeout(timer);
      }
    } else {
      setAuthStatusText(null);
    }
  }, [challenge?.status, challenge?.id]);

  const handlePing = (device: SyncDevice) => {
    setIsPinging(device.id);
    playChime();
    
    // In a production setup, this would write a ping state to Firestore.
    // For this app, we'll trigger a beautiful visual pulse in the device list.
    setTimeout(() => {
      setIsPinging(null);
    }, 1500);
  };

  const signalBars = (strength: number) => {
    return (
      <div className="flex items-end gap-0.5 h-3">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`w-[2px] rounded-full transition-all ${
              bar <= strength ? "bg-emerald-400" : "bg-slate-700"
            }`}
            style={{ height: `${bar * 25}%` }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/5 p-6 flex flex-col h-full shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-100">Control & Gateways</h3>
          <p className="text-xs text-slate-400">Manage connections & 2FA security</p>
        </div>
      </div>

      {/* Connected Devices Grid */}
      <div className="mb-6 flex-1 flex flex-col">
        <div className="text-[10px] font-semibold text-slate-500 mb-3 uppercase tracking-wider">
          Synced Devices ({onlineDevices.length})
        </div>
        <div className="space-y-3 overflow-y-auto max-h-[220px] pr-1 flex-1 custom-scrollbar">
          {onlineDevices.map((device) => {
            const isSelf = device.id === currentDeviceId;
            const isPinged = isPinging === device.id;

            return (
              <motion.div
                key={device.id}
                animate={isPinged ? { scale: [1, 1.02, 1] } : {}}
                transition={{ duration: 0.5, repeat: isPinged ? 2 : 0 }}
                className={`border rounded-xl p-3 flex items-center justify-between gap-3 relative overflow-hidden ${
                  isSelf
                    ? "bg-slate-950/60 border-emerald-500/10"
                    : "bg-slate-950/40 border-white/5 hover:bg-slate-950/60 transition-colors"
                }`}
              >
                {/* Visual pulse for pings */}
                {isPinged && (
                  <div className="absolute inset-0 bg-blue-500/5 animate-pulse pointer-events-none" />
                )}

                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-lg ${
                    isSelf ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-400"
                  }`}>
                    {device.type === "desktop" ? (
                      <Laptop className="w-4 h-4" />
                    ) : (
                      <Smartphone className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {device.name}
                      </span>
                      {isSelf && (
                        <span className="text-[8px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded">
                          Self
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1 shrink-0">
                        {device.isCharging ? (
                          <BatteryCharging className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Battery className="w-3 h-3" />
                        )}
                        {device.batteryLevel}%
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Radio className="w-2.5 h-2.5" />
                        {signalBars(device.signalStrength)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Device Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Ping Chime Trigger */}
                  <button
                    onClick={() => handlePing(device)}
                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-blue-400 rounded-lg transition-colors cursor-pointer"
                    title={`Ping ${device.name}`}
                    id={`btn-ping-device-${device.id}`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Simulator Sliders (only show for emulator or self if desktop to play around!) */}
                  {device.type === "emulator" && (
                    <button
                      onClick={() =>
                        onUpdateSimulated(device.id, {
                          batteryLevel: Math.max(10, (device.batteryLevel + 25) % 105),
                          isCharging: !device.isCharging
                        })
                      }
                      className="text-[9px] font-bold text-slate-500 hover:text-slate-300 bg-slate-900 border border-white/5 hover:border-white/10 px-1.5 py-1 rounded"
                      id={`btn-simulate-battery-${device.id}`}
                    >
                      Sim Power
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Secure 2FA Challenge Portal */}
      <div className="mt-auto border-t border-white/5 pt-5">
        <div className="text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">
          Secure Authentication Sync
        </div>

        {/* Challenge flow state */}
        <div className="bg-slate-950/60 border border-white/5 rounded-xl p-4 flex flex-col justify-center text-center">
          <AnimatePresence mode="wait">
            {!challenge && !authStatusText ? (
              <motion.div
                key="trigger"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-2"
              >
                <div className="flex justify-center mb-2.5">
                  <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-full">
                    <Key className="w-5 h-5" />
                  </div>
                </div>
                <h4 className="text-xs font-semibold text-slate-300">Test Multi-Device Auth</h4>
                <p className="text-[10px] text-slate-500 max-w-[200px] mx-auto mt-1 mb-3 leading-relaxed">
                  Generate a login challenge that must be approved on your phone.
                </p>
                <button
                  onClick={onTriggerAuth}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 px-4 rounded-xl cursor-pointer shadow-md shadow-blue-500/10 active:scale-95 transition-all"
                  id="btn-trigger-2fa"
                >
                  Request Phone Auth
                </button>
              </motion.div>
            ) : challenge?.status === "pending" && challenge.sender === roomData?.devices[currentDeviceId]?.name ? (
              <motion.div
                key="pending"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-3 flex flex-col items-center"
              >
                <div className="w-7 h-7 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-3"></div>
                <h4 className="text-xs font-semibold text-indigo-400">Awaiting Approval</h4>
                <p className="text-[10px] text-slate-400 mt-1">
                  Open your connected phone. A security prompt was sent to verify your identity.
                </p>
                <button
                  onClick={onClearAuth}
                  className="text-[10px] text-red-400 hover:bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-lg mt-4 cursor-pointer"
                  id="btn-cancel-auth-challenge"
                >
                  Cancel Request
                </button>
              </motion.div>
            ) : authStatusText ? (
              <motion.div
                key="completed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="py-3 flex flex-col items-center"
              >
                <div className={`p-2.5 rounded-full mb-2 ${
                  challenge?.status === "approved" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                }`}>
                  <Shield className="w-5 h-5" />
                </div>
                <h4 className={`text-xs font-bold ${
                  challenge?.status === "approved" ? "text-emerald-400" : "text-red-400"
                }`}>
                  {authStatusText}
                </h4>
                <p className="text-[9px] text-slate-500 mt-1">
                  {challenge?.status === "approved"
                    ? "Access token successfully shared."
                    : "The sign-in attempt was rejected by the owner."}
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
