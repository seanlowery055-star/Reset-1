import { useEffect, useState, useRef } from "react";
import { doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { RoomState, SyncDevice, ClipboardItem, NoteState, LinkPush, FileItem, AuthChallenge } from "./types";

// Generate a random 6-character room code (e.g., SY-4821)
export function generateRoomCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const numbers = "23456789";
  const randL = () => letters.charAt(Math.floor(Math.random() * letters.length));
  const randN = () => numbers.charAt(Math.floor(Math.random() * numbers.length));
  return `${randL()}${randL()}-${randN()}${randN()}${randN()}`;
}

export function generateDeviceId(): string {
  return "dev_" + Math.random().toString(36).substring(2, 11);
}

const DEFAULT_NOTE_STATE: NoteState = {
  content: "",
  updatedAt: Date.now(),
  typingDeviceName: null,
  typingDeviceExpires: null
};

export function useSyncRoom(roomId: string, deviceId: string, deviceName: string, deviceType: "desktop" | "phone" | "emulator") {
  const [roomData, setRoomData] = useState<RoomState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // We keep the device details in refs to prevent unnecessary re-running of heartbeats
  const deviceStateRef = useRef<Omit<SyncDevice, "id">>({
    name: deviceName,
    type: deviceType,
    batteryLevel: 80,
    isCharging: false,
    signalStrength: 4,
    lastActive: Date.now()
  });

  // Track battery if available in physical browser
  useEffect(() => {
    if (typeof window !== "undefined" && "getBattery" in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          deviceStateRef.current.batteryLevel = Math.round(battery.level * 100);
          deviceStateRef.current.isCharging = battery.charging;
          triggerHeartbeat();
        };
        updateBattery();
        battery.addEventListener("levelchange", updateBattery);
        battery.addEventListener("chargingchange", updateBattery);
        return () => {
          battery.removeEventListener("levelchange", updateBattery);
          battery.removeEventListener("chargingchange", updateBattery);
        };
      }).catch(() => {});
    }
  }, []);

  // Update refs when device name or type changes
  useEffect(() => {
    deviceStateRef.current.name = deviceName;
    deviceStateRef.current.type = deviceType;
    triggerHeartbeat();
  }, [deviceName, deviceType]);

  const triggerHeartbeat = async () => {
    if (!roomId) return;
    const docRef = doc(db, "rooms", roomId);
    try {
      await updateDoc(docRef, {
        [`devices.${deviceId}`]: {
          id: deviceId,
          ...deviceStateRef.current,
          lastActive: Date.now()
        },
        updatedAt: Date.now()
      });
    } catch (e) {
      // If document doesn't exist, we'll initialize it in the subscriber
    }
  };

  // Subscribe to room changes
  useEffect(() => {
    if (!roomId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const docRef = doc(db, "rooms", roomId);

    const unsubscribe = onSnapshot(
      docRef,
      async (docSnap) => {
        if (!docSnap.exists()) {
          // Document does not exist yet. Initialize it with default RoomState!
          const initialRoom: RoomState = {
            roomId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            devices: {
              [deviceId]: {
                id: deviceId,
                name: deviceStateRef.current.name,
                type: deviceStateRef.current.type,
                batteryLevel: deviceStateRef.current.batteryLevel,
                isCharging: deviceStateRef.current.isCharging,
                signalStrength: deviceStateRef.current.signalStrength,
                lastActive: Date.now()
              }
            },
            clipboard: null,
            clipboardHistory: [],
            note: DEFAULT_NOTE_STATE,
            pushedLink: null,
            files: [],
            authChallenge: null
          };

          try {
            await setDoc(docRef, initialRoom);
            setRoomData(initialRoom);
          } catch (err: any) {
            console.error("Error creating room:", err);
            setError("Could not initialize sync session: " + err.message);
          }
        } else {
          const data = docSnap.data() as RoomState;
          setRoomData(data);
        }
        setIsLoading(false);
      },
      (err) => {
        console.error("Firestore subscription error:", err);
        setError("Synchronization lost: " + err.message);
        setIsLoading(false);
      }
    );

    // Heartbeat loop every 15 seconds to keep device online status updated
    const heartbeatInterval = setInterval(() => {
      triggerHeartbeat();
    }, 15000);

    // Initial heartbeat
    setTimeout(() => {
      triggerHeartbeat();
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(heartbeatInterval);
    };
  }, [roomId, deviceId]);

  // Clean stale offline devices from the UI state locally or in firebase
  const getOnlineDevices = (): SyncDevice[] => {
    if (!roomData?.devices) return [];
    const now = Date.now();
    // Consider device offline if no heartbeat for 45 seconds
    return (Object.values(roomData.devices) as SyncDevice[]).filter(
      (d) => now - d.lastActive < 45000
    );
  };

  // Sync operations
  const setClipboard = async (text: string) => {
    if (!roomId) return;
    const docRef = doc(db, "rooms", roomId);
    const newItem: ClipboardItem = {
      id: "clip_" + Math.random().toString(36).substring(2, 9),
      text,
      timestamp: Date.now(),
      sender: deviceName
    };

    // Get current history to push safely
    const currentHistory = roomData?.clipboardHistory || [];
    // Keep history length capped at 10 items
    const updatedHistory = [newItem, ...currentHistory.filter(h => h.text !== text)].slice(0, 10);

    await updateDoc(docRef, {
      clipboard: newItem,
      clipboardHistory: updatedHistory,
      updatedAt: Date.now()
    });
  };

  const clearClipboardHistory = async () => {
    if (!roomId) return;
    const docRef = doc(db, "rooms", roomId);
    await updateDoc(docRef, {
      clipboard: null,
      clipboardHistory: [],
      updatedAt: Date.now()
    });
  };

  const updateNote = async (content: string) => {
    if (!roomId) return;
    const docRef = doc(db, "rooms", roomId);
    await updateDoc(docRef, {
      "note.content": content,
      "note.updatedAt": Date.now(),
      updatedAt: Date.now()
    });
  };

  const setTypingStatus = async (isTyping: boolean) => {
    if (!roomId) return;
    const docRef = doc(db, "rooms", roomId);
    await updateDoc(docRef, {
      "note.typingDeviceName": isTyping ? deviceName : null,
      "note.typingDeviceExpires": isTyping ? Date.now() + 3000 : null
    });
  };

  const pushLink = async (url: string, title?: string) => {
    if (!roomId) return;
    const docRef = doc(db, "rooms", roomId);
    const link: LinkPush = {
      url,
      title: title || url,
      sender: deviceName,
      timestamp: Date.now(),
      opened: false
    };
    await updateDoc(docRef, {
      pushedLink: link,
      updatedAt: Date.now()
    });
  };

  const markLinkAsOpened = async () => {
    if (!roomId || !roomData?.pushedLink) return;
    const docRef = doc(db, "rooms", roomId);
    await updateDoc(docRef, {
      "pushedLink.opened": true
    });
  };

  const shareFile = async (name: string, type: string, size: number, dataUrl: string) => {
    if (!roomId) return;
    const docRef = doc(db, "rooms", roomId);
    const newFile: FileItem = {
      id: "file_" + Math.random().toString(36).substring(2, 9),
      name,
      type,
      size,
      dataUrl,
      sender: deviceName,
      timestamp: Date.now()
    };
    const currentFiles = roomData?.files || [];
    // Cap at 6 files to prevent excessive document size
    const updatedFiles = [newFile, ...currentFiles].slice(0, 6);

    await updateDoc(docRef, {
      files: updatedFiles,
      updatedAt: Date.now()
    });
  };

  const deleteFile = async (fileId: string) => {
    if (!roomId || !roomData) return;
    const docRef = doc(db, "rooms", roomId);
    const updatedFiles = roomData.files.filter((f) => f.id !== fileId);
    await updateDoc(docRef, {
      files: updatedFiles,
      updatedAt: Date.now()
    });
  };

  const createAuthChallenge = async () => {
    if (!roomId) return;
    const docRef = doc(db, "rooms", roomId);
    const challenge: AuthChallenge = {
      id: "auth_" + Math.random().toString(36).substring(2, 9),
      status: "pending",
      timestamp: Date.now(),
      sender: deviceName
    };
    await updateDoc(docRef, {
      authChallenge: challenge,
      updatedAt: Date.now()
    });
  };

  const respondToAuthChallenge = async (status: "approved" | "denied") => {
    if (!roomId || !roomData?.authChallenge) return;
    const docRef = doc(db, "rooms", roomId);
    await updateDoc(docRef, {
      "authChallenge.status": status,
      updatedAt: Date.now()
    });
  };

  const clearAuthChallenge = async () => {
    if (!roomId) return;
    const docRef = doc(db, "rooms", roomId);
    await updateDoc(docRef, {
      authChallenge: null,
      updatedAt: Date.now()
    });
  };

  // Update a device's simulated properties (battery level, signals) for emulator fun
  const updateSimulatedDevice = async (targetDeviceId: string, updates: Partial<Omit<SyncDevice, "id">>) => {
    if (!roomId || !roomData?.devices[targetDeviceId]) return;
    const docRef = doc(db, "rooms", roomId);
    const currentDevice = roomData.devices[targetDeviceId];
    await updateDoc(docRef, {
      [`devices.${targetDeviceId}`]: {
        ...currentDevice,
        ...updates,
        lastActive: Date.now()
      }
    });
  };

  return {
    roomData,
    onlineDevices: getOnlineDevices(),
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
    updateSimulatedDevice,
    triggerHeartbeat
  };
}
