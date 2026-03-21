import { useState } from "react";
import type { SceneObject } from "../types";

export type SceneRuntimeObject = SceneObject & {
  file?: File;
};

export function useSceneState() {
  const [objects, setObjects] = useState<SceneRuntimeObject[]>([]);

  const addObject = (input: {
    kind: "scan" | "crown";
    file: File;
    name?: string;
  }) => {
    const objectUrl = URL.createObjectURL(input.file);

    const newObject: SceneRuntimeObject = {
      id: crypto.randomUUID(),
      kind: input.kind,
      file: input.file,
      name: input.name ?? input.file.name,
      fileName: input.file.name,
      source: "upload",
      url: objectUrl,
      textureUrl: null,
      sizeBytes: input.file.size,
      visual: {
        visible: true,
        opacity: input.kind === "scan" ? 1 : 0.7,
        color: input.kind === "scan" ? "#88ccff" : "#ffcc88",
      },
      transform: {
        translationMm: [0, 0, 0],
        rotationDeg: [0, 0, 0],
      },
    };

    // Remove existing object of same kind before adding new one
    setObjects((prev) => [
      ...prev.filter((obj) => obj.kind !== input.kind),
      newObject,
    ]);

    console.log(`✅ Added ${input.kind} to scene:`, newObject);
  };

  const removeObject = (id: string) => {
    setObjects((prev) => {
      const objectToRemove = prev.find((obj) => obj.id === id);
      if (objectToRemove?.source === "upload") {
        URL.revokeObjectURL(objectToRemove.url);
      }
      return prev.filter((obj) => obj.id !== id);
    });
    console.log(`🗑️ Removed object from scene:`, id);
  };

  const clearObjects = () => {
    setObjects((prev) => {
      prev.forEach((obj) => {
        if (obj.source === "upload") {
          URL.revokeObjectURL(obj.url);
        }
      });
      return [];
    });
    console.log("🗑️ Cleared all objects from scene");
  };

  return {
    objects,
    addObject,
    removeObject,
    clearObjects,
  };
}
