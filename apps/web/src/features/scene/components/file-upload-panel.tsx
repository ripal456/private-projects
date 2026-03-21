"use client";

import { useState } from "react";
import type { SceneRuntimeObject } from "../hooks/use-scene-state";

interface FileUploadPanelProps {
  objects: SceneRuntimeObject[];
  addObject: (input: {
    kind: "scan" | "crown";
    file: File;
    name?: string;
  }) => void;
  removeObject: (id: string) => void;
}

export function FileUploadPanel({
  objects,
  addObject,
  removeObject,
}: FileUploadPanelProps) {
  const [dragOver, setDragOver] = useState<"scan" | "crown" | null>(null);

  // Get current scan and crown from scene state
  const scanObject = objects.find((obj) => obj.kind === "scan");
  const crownObject = objects.find((obj) => obj.kind === "crown");

  const handleFile = (file: File, kind: "scan" | "crown") => {
    const fileName = file.name.toLowerCase();

    if (!fileName.endsWith(".stl") && !fileName.endsWith(".ply")) {
      console.error("❌ Invalid file type. Please upload .stl or .ply files");
      alert("Please upload .stl or .ply files only");
      return;
    }

    // Add to scene state
    addObject({
      kind,
      file,
      name: file.name,
    });
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    kind: "scan" | "crown",
  ) => {
    e.preventDefault();
    setDragOver(null);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file, kind);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDragEnter = (kind: "scan" | "crown") => {
    setDragOver(kind);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleFileInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    kind: "scan" | "crown",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file, kind);
    }
    // Reset input value to allow re-uploading the same file
    e.target.value = "";
  };

  const handleRemove = (kind: "scan" | "crown") => {
    const objectToRemove = objects.find((obj) => obj.kind === kind);
    if (objectToRemove) {
      removeObject(objectToRemove.id);
    }
  };

  return (
    <div className="rounded-lg border border-slate-300/70 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">File Upload</h2>
        <p className="text-sm text-slate-600">
          Upload STL or PLY files for scan and crown
        </p>
      </div>

      <div className="space-y-4">
        {/* Scan Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium block">Tooth Scan</label>
          <div
            onDrop={(e) => handleDrop(e, "scan")}
            onDragOver={handleDragOver}
            onDragEnter={() => handleDragEnter("scan")}
            onDragLeave={handleDragLeave}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center transition-all
              ${
                dragOver === "scan"
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-300 hover:border-slate-400"
              }
            `}
          >
            {scanObject ? (
              <div className="space-y-2">
                <div className="text-green-600 font-medium text-sm">
                  ✓ {scanObject.name}
                </div>
                <div className="text-xs text-slate-500">
                  {scanObject.file
                    ? `${(scanObject.file.size / 1024).toFixed(2)} KB`
                    : ""}
                </div>
                <button
                  onClick={() => handleRemove("scan")}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <div className="text-4xl mb-2">📁</div>
                <div className="text-sm text-slate-600 mb-1">
                  Drop scan file here
                </div>
                <div className="text-xs text-slate-400">STL or PLY format</div>
              </>
            )}
          </div>
          {!scanObject && (
            <label className="block">
              <input
                type="file"
                accept=".stl,.ply"
                onChange={(e) => handleFileInput(e, "scan")}
                className="hidden"
              />
              <span className="block text-center text-xs text-blue-600 hover:underline cursor-pointer">
                or click to browse
              </span>
            </label>
          )}
        </div>

        {/* Crown Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium block">Crown Design</label>
          <div
            onDrop={(e) => handleDrop(e, "crown")}
            onDragOver={handleDragOver}
            onDragEnter={() => handleDragEnter("crown")}
            onDragLeave={handleDragLeave}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center transition-all
              ${
                dragOver === "crown"
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-300 hover:border-slate-400"
              }
            `}
          >
            {crownObject ? (
              <div className="space-y-2">
                <div className="text-green-600 font-medium text-sm">
                  ✓ {crownObject.name}
                </div>
                <div className="text-xs text-slate-500">
                  {crownObject.file
                    ? `${(crownObject.file.size / 1024).toFixed(2)} KB`
                    : ""}
                </div>
                <button
                  onClick={() => handleRemove("crown")}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <div className="text-4xl mb-2">📁</div>
                <div className="text-sm text-slate-600 mb-1">
                  Drop crown file here
                </div>
                <div className="text-xs text-slate-400">STL or PLY format</div>
              </>
            )}
          </div>
          {!crownObject && (
            <label className="block">
              <input
                type="file"
                accept=".stl,.ply"
                onChange={(e) => handleFileInput(e, "crown")}
                className="hidden"
              />
              <span className="block text-center text-xs text-blue-600 hover:underline cursor-pointer">
                or click to browse
              </span>
            </label>
          )}
        </div>

        {/* Status Indicator */}
        {(scanObject || crownObject) && (
          <div className="pt-4 border-t border-slate-200">
            <div className="text-sm font-medium mb-2">Status:</div>
            <div className="space-y-1 text-xs">
              <div className={scanObject ? "text-green-600" : "text-slate-400"}>
                {scanObject ? "✓" : "○"} Scan file{" "}
                {scanObject ? "loaded" : "pending"}
              </div>
              <div
                className={crownObject ? "text-green-600" : "text-slate-400"}
              >
                {crownObject ? "✓" : "○"} Crown file{" "}
                {crownObject ? "loaded" : "pending"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
