"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";
import { setPlacementMeshes } from "../../placement/run-crown-placement";
import type { SceneRuntimeObject } from "../../scene/hooks/use-scene-state";

interface StlViewerWorkbenchProps {
  objects: SceneRuntimeObject[];
}

const DEFAULT_MESH_COLORS = {
  scan: "#88ccff",
  crown: "#ffcc88",
} as const;

export function StlViewerWorkbench({ objects }: StlViewerWorkbenchProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const frustumSizeRef = useRef(50);

  const meshesRef = useRef<{
    scan?: THREE.Mesh;
    crown?: THREE.Mesh;
  }>({});

  const meshPositionsRef = useRef({
    scan: { x: 0, y: 0, z: 0 },
    crown: { x: 0, y: 0, z: 0 },
  });

  const [loadedMeshes, setLoadedMeshes] = useState({
    scan: false,
    crown: false,
  });

  const [visibility, setVisibility] = useState({
    scan: true,
    crown: true,
  });

  const [opacity, setOpacity] = useState({
    scan: 1.0,
    crown: 0.7,
  });

  const [meshColors, setMeshColors] = useState<{ scan: string; crown: string }>({
    scan: DEFAULT_MESH_COLORS.scan,
    crown: DEFAULT_MESH_COLORS.crown,
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    sceneRef.current = scene;

    const aspect = container.clientWidth / container.clientHeight;
    const frustumSize = frustumSizeRef.current;
    const camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000,
    );
    camera.position.set(40, 40, 40);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.22);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xb8c6d8, 0.35);
    scene.add(hemiLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.95);
    dirLight1.position.set(1.2, 1.4, 1.1);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.42);
    dirLight2.position.set(-1.1, 0.35, -1.0);
    scene.add(dirLight2);

    const dirLight3 = new THREE.DirectionalLight(0xffffff, 0.18);
    dirLight3.position.set(0, -1.2, 0);
    scene.add(dirLight3);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.03;
    controls.rotateSpeed = 0.95;
    controls.zoomSpeed = 1.05;
    controls.panSpeed = 0.9;
    controls.screenSpacePanning = true;
    controls.minZoom = 0.5;
    controls.maxZoom = 3;
    controlsRef.current = controls;

    const gridHelper = new THREE.GridHelper(100, 20, 0xcccccc, 0xe0e0e0);
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(20);
    scene.add(axesHelper);

    let animationFrameId: number;
    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    const handleResize = () => {
      if (!camera || !renderer) return;

      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;
      const newAspect = width / height;

      const activeFrustumSize = frustumSizeRef.current;
      camera.left = (activeFrustumSize * newAspect) / -2;
      camera.right = (activeFrustumSize * newAspect) / 2;
      camera.top = activeFrustumSize / 2;
      camera.bottom = activeFrustumSize / -2;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };

    handleResize();

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    window.addEventListener("resize", handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      controls.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const load3DFile = useCallback(
    (file: File, type: "scan" | "crown") => {
      if (!sceneRef.current || !cameraRef.current || !controlsRef.current) {
        return;
      }

      const fileName = file.name.toLowerCase();
      const isSTL = fileName.endsWith(".stl");
      const isPLY = fileName.endsWith(".ply");

      if (!isSTL && !isPLY) {
        alert("Only STL and PLY files are supported");
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          let geometry: THREE.BufferGeometry;

          if (isSTL) {
            const stlLoader = new STLLoader();
            geometry = stlLoader.parse(arrayBuffer);
          } else {
            const plyLoader = new PLYLoader();
            geometry = plyLoader.parse(arrayBuffer);
          }

          geometry.computeVertexNormals();
          geometry.center();

          const positionAttribute = geometry.getAttribute("position");
          if (!positionAttribute) {
            throw new Error("Geometry is missing position attribute");
          }

          const colorAttribute = geometry.getAttribute("color");
          const hasVertexColors = !!colorAttribute;
          const hasColorOverride =
            meshColors[type] !== DEFAULT_MESH_COLORS[type];
          const useOriginalScanColor = type === "scan" && hasVertexColors;

          const material = new THREE.MeshPhongMaterial({
            color:
              useOriginalScanColor && !hasColorOverride
                ? 0xffffff
                : meshColors[type],
            transparent: true,
            opacity: type === "scan" ? 1.0 : 0.7,
            side: THREE.FrontSide,
            flatShading: false,
            shininess: 30,
            vertexColors: hasVertexColors && !hasColorOverride,
          });

          const mesh = new THREE.Mesh(geometry, material);
          mesh.name = type;
          const targetPosition = meshPositionsRef.current[type];
          mesh.position.set(
            targetPosition.x,
            targetPosition.y,
            targetPosition.z,
          );

          const oldMesh = meshesRef.current[type];
          if (oldMesh) {
            sceneRef.current?.remove(oldMesh);
            oldMesh.geometry.dispose();
            (oldMesh.material as THREE.Material).dispose();
          }

          sceneRef.current?.add(mesh);
          meshesRef.current[type] = mesh;
          setPlacementMeshes({ [type]: mesh });
          setLoadedMeshes((prev) => ({ ...prev, [type]: true }));

          if (type === "scan") {
            const box = new THREE.Box3().setFromObject(mesh);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scanFrustumSize = maxDim + 20;

            frustumSizeRef.current = scanFrustumSize;
            controlsRef.current?.target.set(0, 0, 0);

            const cameraDistance = scanFrustumSize * 1.5;
            if (
              cameraRef.current &&
              rendererRef.current &&
              containerRef.current
            ) {
              cameraRef.current.position.set(
                cameraDistance,
                cameraDistance,
                cameraDistance,
              );

              const aspect =
                containerRef.current.clientWidth /
                containerRef.current.clientHeight;
              cameraRef.current.left = (scanFrustumSize * aspect) / -2;
              cameraRef.current.right = (scanFrustumSize * aspect) / 2;
              cameraRef.current.top = scanFrustumSize / 2;
              cameraRef.current.bottom = scanFrustumSize / -2;
              cameraRef.current.updateProjectionMatrix();
            }
          }
        } catch {
          alert(`Failed to load ${type} file.`);
        }
      };

      reader.onerror = () => {
        alert(`Failed to read ${type} file`);
      };

      reader.readAsArrayBuffer(file);
    },
    [meshColors],
  );

  useEffect(() => {
    if (meshesRef.current.scan) {
      const p = meshPositionsRef.current.scan;
      meshesRef.current.scan.position.set(p.x, p.y, p.z);
    }
    if (meshesRef.current.crown) {
      const p = meshPositionsRef.current.crown;
      meshesRef.current.crown.position.set(p.x, p.y, p.z);
    }
  }, []);

  const scanFile = objects.find((obj) => obj.kind === "scan")?.file;
  const crownFile = objects.find((obj) => obj.kind === "crown")?.file;

  useEffect(() => {
    if (scanFile) {
      load3DFile(scanFile, "scan");
    }
  }, [load3DFile, scanFile]);

  useEffect(() => {
    if (crownFile) {
      load3DFile(crownFile, "crown");
    }
  }, [crownFile, load3DFile]);

  useEffect(() => {
    if (meshesRef.current.scan) {
      meshesRef.current.scan.visible = visibility.scan;
    }
    if (meshesRef.current.crown) {
      meshesRef.current.crown.visible = visibility.crown;
    }
  }, [visibility]);

  useEffect(() => {
    if (meshesRef.current.scan) {
      (meshesRef.current.scan.material as THREE.MeshPhongMaterial).opacity =
        opacity.scan;
    }
    if (meshesRef.current.crown) {
      (meshesRef.current.crown.material as THREE.MeshPhongMaterial).opacity =
        opacity.crown;
    }
  }, [opacity]);

  useEffect(() => {
    if (meshesRef.current.scan) {
      const scanMaterial = meshesRef.current.scan
        .material as THREE.MeshPhongMaterial;
      const scanHasVertexColors =
        !!meshesRef.current.scan.geometry.getAttribute("color");
      const scanHasColorOverride = meshColors.scan !== DEFAULT_MESH_COLORS.scan;
      scanMaterial.vertexColors = scanHasVertexColors && !scanHasColorOverride;
      scanMaterial.color.set(
        scanMaterial.vertexColors ? "#ffffff" : meshColors.scan,
      );
      scanMaterial.needsUpdate = true;
    }

    if (meshesRef.current.crown) {
      const crownMaterial = meshesRef.current.crown
        .material as THREE.MeshPhongMaterial;
      const crownHasVertexColors =
        !!meshesRef.current.crown.geometry.getAttribute("color");
      const crownHasColorOverride =
        meshColors.crown !== DEFAULT_MESH_COLORS.crown;
      crownMaterial.vertexColors =
        crownHasVertexColors && !crownHasColorOverride;
      crownMaterial.color.set(
        crownMaterial.vertexColors ? "#ffffff" : meshColors.crown,
      );
      crownMaterial.needsUpdate = true;
    }
  }, [meshColors]);

  return (
    <div className="rounded-lg border border-slate-300/70 bg-white shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div
          ref={containerRef}
          className="w-full bg-linear-to-br from-slate-50 to-slate-100"
          style={{ minHeight: "460px", height: "min(72vh, 760px)" }}
        />

        <div className="p-4 bg-white border-t border-slate-200 lg:border-t-0 lg:border-l space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold">Viewer Controls</h3>
            <div className="text-xs text-slate-500">
              {loadedMeshes.scan && loadedMeshes.crown
                ? "2 models loaded"
                : loadedMeshes.scan || loadedMeshes.crown
                  ? "1 model loaded"
                  : "No models loaded"}
            </div>
          </div>

          {loadedMeshes.scan && (
            <div className="space-y-2 p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#88ccff]"></div>
                  Scan
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibility.scan}
                    onChange={(e) =>
                      setVisibility((prev) => ({
                        ...prev,
                        scan: e.target.checked,
                      }))
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-xs text-slate-600">Visible</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 w-16">Opacity:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={opacity.scan}
                  onChange={(e) =>
                    setOpacity((prev) => ({
                      ...prev,
                      scan: parseFloat(e.target.value),
                    }))
                  }
                  className="flex-1"
                />
                <span className="text-xs font-mono w-8 text-right">
                  {opacity.scan.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 w-16">Color:</span>
                <input
                  type="color"
                  value={meshColors.scan}
                  onChange={(e) =>
                    setMeshColors((prev) => ({ ...prev, scan: e.target.value }))
                  }
                  className="h-7 w-10 rounded border border-slate-300 bg-white p-1"
                />
              </div>
            </div>
          )}

          {loadedMeshes.crown && (
            <div className="space-y-2 p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ffcc88]"></div>
                  Crown
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibility.crown}
                    onChange={(e) =>
                      setVisibility((prev) => ({
                        ...prev,
                        crown: e.target.checked,
                      }))
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-xs text-slate-600">Visible</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 w-16">Opacity:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={opacity.crown}
                  onChange={(e) =>
                    setOpacity((prev) => ({
                      ...prev,
                      crown: parseFloat(e.target.value),
                    }))
                  }
                  className="flex-1"
                />
                <span className="text-xs font-mono w-8 text-right">
                  {opacity.crown.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 w-16">Color:</span>
                <input
                  type="color"
                  value={meshColors.crown}
                  onChange={(e) =>
                    setMeshColors((prev) => ({
                      ...prev,
                      crown: e.target.value,
                    }))
                  }
                  className="h-7 w-10 rounded border border-slate-300 bg-white p-1"
                />
              </div>
            </div>
          )}

          {!loadedMeshes.scan && !loadedMeshes.crown && (
            <div className="text-center py-6 text-slate-400">
              <div className="text-4xl">🦷</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
