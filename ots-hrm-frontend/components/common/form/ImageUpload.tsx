import React, { useRef, useState } from "react";
import { Plus, Upload, X } from "lucide-react";
import Button from "../Button";

interface ImageUploadProps {
  label?: string;
  description?: string;
  onImageChange?: (file: File | null) => void;
  initialImage?: string | null;
  showDeleteButton?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  label = "Profile Image",
  description = "Image should be below 4mb",
  onImageChange,
  initialImage = null,
  showDeleteButton = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImage);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null); // Reset error on new file selection

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Check file size
      if (file.size > 4 * 1024 * 1024) {
        setError("File size should be below 4MB");
        return;
      }

      // Check file type
      const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      const isValidType =
        validTypes.includes(file.type) ||
        ["jpeg", "jpg", "png", "webp"].includes(fileExtension || "");

      if (!isValidType) {
        setError("Please upload only JPG, PNG, JPEG, or WEBP image files");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      if (onImageChange) onImageChange(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (onImageChange) onImageChange(null);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative">
          <div
            className={`w-24 h-24 rounded-[var(--g-radius-full)] ${
              previewUrl ? "" : "border-2 border-dashed border-g-gray-alpha-400"
            } flex items-center justify-center overflow-hidden`}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <Plus className="text-g-gray-800" />
            )}
          </div>
          {previewUrl &&
            !showDeleteButton && ( // Only show cross icon if showDeleteButton is false
              <button
                onClick={handleRemoveImage}
                className="absolute -top-1 -right-1 bg-g-background-100 rounded-[var(--g-radius-full)] p-1 shadow-geist-card border border-g-gray-alpha-400 focus-ring-geist"
              >
                <X className="h-3 w-3 text-g-gray-900" />
              </button>
            )}
        </div>

        <div className="flex items-center">
          <div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                label={previewUrl ? "Edit" : "Upload"}
                onClick={triggerFileInput}
              />
              {showDeleteButton && previewUrl && (
                <Button
                  variant="outline"
                  label="Delete"
                  onClick={handleRemoveImage}
                />
              )}
            </div>
            <p className="text-copy-13 text-g-gray-800 mt-2">{description}</p>
          </div>
          <input
            type="file"
            className="hidden"
            accept=".jpg,.jpeg,.png,.webp"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </div>
      </div>

      {error && <div className="text-g-red-700 text-label-14 mt-2">{error}</div>}
    </div>
  );
};

export default ImageUpload;
