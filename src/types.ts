export interface SyncDevice {
  id: string;
  name: string;
  type: "desktop" | "phone" | "emulator";
  batteryLevel: number;
  isCharging: boolean;
  signalStrength: number; // 0 to 4
  lastActive: number;
}

export interface ClipboardItem {
  id: string;
  text: string;
  timestamp: number;
  sender: string;
}

export interface NoteState {
  content: string;
  updatedAt: number;
  typingDeviceName: string | null;
  typingDeviceExpires: number | null;
}

export interface LinkPush {
  url: string;
  title?: string;
  sender: string;
  timestamp: number;
  opened: boolean;
}

export interface FileItem {
  id: string;
  name: string;
  type: string; // e.g. "image/png", "text/plain"
  size: number;
  dataUrl: string; // Base64 representation for small file transfer
  sender: string;
  timestamp: number;
}

export interface AuthChallenge {
  id: string;
  status: "pending" | "approved" | "denied";
  timestamp: number;
  sender: string;
}

export interface RoomState {
  roomId: string;
  createdAt: number;
  updatedAt: number;
  devices: { [deviceId: string]: SyncDevice };
  clipboard: ClipboardItem | null;
  clipboardHistory: ClipboardItem[];
  note: NoteState;
  pushedLink: LinkPush | null;
  files: FileItem[];
  authChallenge: AuthChallenge | null;
}
