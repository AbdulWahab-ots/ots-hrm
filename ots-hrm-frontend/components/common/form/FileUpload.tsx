"use client";
import React, { useState, useRef } from "react";
import { X, Trash2, File as FileIcon, Image as ImageIcon } from "lucide-react";
import { CiFileOn } from "react-icons/ci";
import Image from "next/image";
import UploadIcon from "../../../public/UploadIcon.svg";
interface UploadedFile {
  file: File;
  progress: number;
  status: "uploading" | "success" | "error";
}

const FileUpload: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const selectedFiles = Array.from(event.target.files).map((file) => ({
      file,
      progress: 0,
      status: "uploading" as const,
    }));
    setFiles((prev) => [...prev, ...selectedFiles]);

    // Simulate upload progress
    selectedFiles.forEach((fileObj, index) => {
      const fileIndex = files.length + index;
      const interval = setInterval(() => {
        setFiles((prev) => {
          const updated = [...prev];
          if (updated[fileIndex].progress >= 100) {
            updated[fileIndex].status = "success";
            clearInterval(interval);
          } else {
            updated[fileIndex].progress += 10;
          }
          return updated;
        });
      }, 300);
    });
  };

  const handleRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/"))
      return <ImageIcon className="w-6 h-6 text-g-blue-700" />;
    return <CiFileOn className="w-6 h-6 text-g-gray-800" />;
  };

  return (
    <>
      <div
        className="border border-g-gray-alpha-400 border-dashed lg:rounded-[var(--g-radius-lg)] rounded-[var(--g-radius-lg)] p-6 text-center cursor-pointer hover:bg-g-gray-alpha-100"
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.zip"
          className="hidden"
          onChange={handleFileSelect}
        />
        <div className="flex justify-center">
          {" "}
          <Image src={UploadIcon} alt="UploadIcon" />
        </div>
        <p className="mt-2 text-g-gray-900">
          <span className="text-g-blue-700">Click to upload</span> or drag and
          drop <br />
          <span className="text-copy-13 text-g-gray-700">JPG, PNG, PDF, DOC, ZIP</span>
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-4 gap-3">
          {files.map((item, index) => (
            <div
              key={index}
              className="flex items-center flex-col border border-g-gray-alpha-400 rounded-[var(--g-radius-sm)] p-3 bg-g-background-100 shadow-geist-card relative"
            >
              {getFileIcon(item.file)}
              <div className="ml-3 flex-1">
                <p className="text-label-14 font-medium truncate">{item.file.name}</p>
                <p className="text-copy-13 text-g-gray-800">
                  {(item.file.size / 1024 / 1024).toFixed(1)} MB
                </p>

                {item.status === "uploading" && (
                  <div className="w-full bg-g-gray-200 rounded-[var(--g-radius-full)] h-1 mt-2">
                    <div
                      className="bg-g-blue-700 h-1 rounded-[var(--g-radius-full)] transition-all"
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                )}
                {item.status === "error" && (
                  <p className="text-copy-13 text-g-red-700 mt-1">Upload failed</p>
                )}
              </div>

              <button
                className="ml-3 text-g-gray-700 hover:text-g-red-700 focus-ring-geist rounded-[var(--g-radius-sm)]"
                onClick={() => handleRemove(index)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default FileUpload;
