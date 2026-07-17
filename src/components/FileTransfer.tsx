import React, { useState, useRef } from "react";
import { FolderUp, File, Image, Download, Trash2, ArrowUpCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RoomState, FileItem } from "../types";

interface FileTransferProps {
  roomData: RoomState | null;
  onShareFile: (name: string, type: string, size: number, dataUrl: string) => Promise<void>;
  onDeleteFile: (fileId: string) => Promise<void>;
  currentDeviceName: string;
}

export const FileTransfer: React.FC<FileTransferProps> = ({
  roomData,
  onShareFile,
  onDeleteFile,
  currentDeviceName
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 1;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const processFile = (file: File) => {
    setErrorMsg(null);

    // Limit to 200KB for Firestore storage safety to avoid exceeding doc limits
    if (file.size > 220000) {
      setErrorMsg("Please select a file smaller than 200KB for instant cloud sync.");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      if (result) {
        try {
          await onShareFile(file.name, file.type, file.size, result);
        } catch (err: any) {
          setErrorMsg("File transfer failed: " + err.message);
        } finally {
          setIsUploading(false);
        }
      }
    };
    reader.onerror = () => {
      setErrorMsg("Failed to read local file.");
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const isImage = (type: string) => {
    return type.startsWith("image/");
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/5 p-6 flex flex-col h-full shadow-xl">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-pink-500/10 text-pink-400 rounded-lg">
          <FolderUp className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-100">Direct File Drop</h3>
          <p className="text-xs text-slate-400">Beam photos & papers across screens</p>
        </div>
      </div>

      {/* Drag & Drop Box */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`border-2 border-dashed rounded-xl py-6 px-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 relative ${
          dragActive
            ? "border-pink-500/60 bg-pink-500/5"
            : "border-white/5 bg-slate-950/40 hover:border-white/10 hover:bg-slate-950/60"
        }`}
        id="file-drop-zone"
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInput}
          className="hidden"
          id="file-hidden-input"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2 text-slate-400 py-2">
            <ArrowUpCircle className="w-8 h-8 text-pink-400 animate-bounce" />
            <span className="text-xs font-semibold">Encoding & Syncing...</span>
          </div>
        ) : (
          <>
            <FolderUp className={`w-8 h-8 transition-colors ${dragActive ? "text-pink-400" : "text-slate-500"}`} />
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-pink-400">Click to upload</span> or drag and drop
            </div>
            <div className="text-[10px] text-slate-600">Images or files up to 200KB</div>
          </>
        )}
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg mt-3"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File List */}
      <div className="flex-1 overflow-hidden mt-6 flex flex-col">
        <div className="text-xs font-semibold text-slate-500 mb-2.5 uppercase tracking-wider">
          Shared files ({roomData?.files?.length || 0})
        </div>
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
          <AnimatePresence initial={false}>
            {roomData?.files && roomData.files.length > 0 ? (
              roomData.files.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-slate-950/60 border border-white/5 rounded-xl p-3 flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Icon or Image thumbnail */}
                    {isImage(file.type) ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-slate-900 flex items-center justify-center">
                        <img
                          src={file.dataUrl}
                          alt={file.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shrink-0">
                        <File className="w-4 h-4" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-slate-200 truncate" title={file.name}>
                        {file.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-500 font-mono">
                        <span>{formatBytes(file.size)}</span>
                        <span>•</span>
                        <span className="truncate max-w-[80px]">{file.sender}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={file.dataUrl}
                      download={file.name}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                      title="Download file"
                      id={`btn-download-${file.id}`}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => onDeleteFile(file.id)}
                      className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg opacity-40 group-hover:opacity-100 transition-all"
                      title="Delete shared file"
                      id={`btn-delete-${file.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="border border-dashed border-white/5 rounded-xl py-8 text-center text-xs text-slate-600 flex flex-col items-center justify-center gap-2">
                <File className="w-6 h-6 text-slate-700" />
                <span>No files sent yet</span>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
