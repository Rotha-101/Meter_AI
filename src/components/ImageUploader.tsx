import React, { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';

interface ImageUploaderProps {
  onImagesSelected: (base64s: string[]) => void;
  isLoading?: boolean;
}

export function ImageUploader({ onImagesSelected, isLoading }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      alert('Please upload image files.');
      return;
    }

    const promises = imageFiles.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    const base64s = await Promise.all(promises);
    onImagesSelected(base64s);
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    // Reset input so the same files can be selected again if needed
    e.target.value = '';
  };

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`
        w-full border-2 border-dashed rounded-2xl p-10 text-center transition-colors cursor-pointer
        ${isDragging ? 'border-[#f97316] bg-[#f97316]/10' : 'border-[#2a2a2a] hover:border-[#f97316] hover:bg-[#1a1a1a]'}
        ${isLoading ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={onFileInput}
        className="hidden"
        id="file-upload"
        disabled={isLoading}
      />
      <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center gap-4">
        <div className={`p-4 rounded-full ${isDragging ? 'bg-[#f97316]/20 text-[#f97316]' : 'bg-[#1a1a1a] text-neutral-500'}`}>
          <UploadCloud size={32} />
        </div>
        <div>
          <p className="text-lg font-medium text-neutral-200">
            Drag & drop meter photos here
          </p>
          <p className="text-sm text-neutral-500 mt-1">
            or click to browse files (supports multiple)
          </p>
        </div>
      </label>
    </div>
  );
}
