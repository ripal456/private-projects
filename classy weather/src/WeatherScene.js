/**
 * WeatherScene.js
 *
 * A reusable Three.js-powered React component that renders interactive 3D weather
 * visualizations based on Open-Meteo weather codes. Supports sun, clouds, rain,
 * snow, and thunderstorm scenes with day/night variations and wind effects.
 *
 * Features:
 * - Lightweight particle systems for rain/snow
 * - Dynamic day/night background and lighting
 * - Wind-driven animations
 * - Automatic pause when tab is hidden (performance)
 * - Low-performance device detection
 * - Proper Three.js resource cleanup on unmount
 *
 * Props:
 * - weatherCode: Open-Meteo WMO weather code (0-99)
 * - isDay: boolean for day/night mode (affects colors and lighting)
 * - windSpeed: wind speed in km/h (affects particle drift)
 * - className/style: standard React styling props
 */

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  // Particle counts (reduced for low-performance devices)
  rain: { normal: 200, low: 80 },
  snow: { normal: 300, low: 120 },
  clouds: { normal: 14, low: 6 },

  // Colors
  dayBackground: 0x87a9d8, // Soft sky blue
  nightBackground: 0x0b1e36, // Deep bluish night
  groundColor: 0x0a1426,

  // Animation speeds
  sunRotationSpeed: 0.003,
  cloudDriftBase: 0.002,
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Maps Open-Meteo WMO weather codes to scene types.
 * Reference: https://open-meteo.com/en/docs#weathervariables
 *
 * @param {number} code - WMO weather code (0-99)
 * @returns {string} Scene type: "sun" | "clouds" | "rain" | "snow" | "thunderstorm"
 */
function mapCodeToScene(code) {
  if (code === 0) return "sun"; // Clear sky
  if ([1, 2, 3, 45, 48].includes(code)) return "clouds"; // Partly cloudy, fog
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return "rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow"; // Snow
  if ([95, 96, 99].includes(code)) return "thunderstorm"; // Thunderstorm
  return "clouds"; // Default fallback
}

/**
 * Detects if the device is likely low-performance.
 * Checks for: mobile devices, low core count, memory constraints.
 *
 * @returns {boolean} True if device appears to be low-performance
 */
function isLowPerformanceDevice() {
  // Check for mobile/tablet user agents
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  // Check hardware concurrency (CPU cores)
  const lowCores =
    navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;

  // Check device memory (if available)
  const lowMemory = navigator.deviceMemory && navigator.deviceMemory <= 4;

  return isMobile || lowCores || lowMemory;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function WeatherScene({
  weatherCode,
  isDay = true,
  windSpeed = 0,
  className,
  style,
}) {
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const animatedRefs = useRef({});

  // Track if we should render (can be disabled on very low-end devices)
  const [shouldRender] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !shouldRender) return;

    // Performance mode detection
    const isLowPerf = isLowPerformanceDevice();

    // ==========================================================================
    // THREE.JS SCENE SETUP
    // ==========================================================================

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 180;

    // Create scene with fog for depth
    const scene = new THREE.Scene();
    const bgDay = new THREE.Color(CONFIG.dayBackground);
    const bgNight = new THREE.Color(CONFIG.nightBackground);
    scene.background = isDay ? bgDay : bgNight;
    scene.fog = new THREE.Fog(scene.background, 20, 80);

    // Perspective camera positioned to view the weather scene
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
    camera.position.set(0, 6, 14);

    // WebGL renderer with antialiasing (disabled on low-perf devices)
    const renderer = new THREE.WebGLRenderer({
      antialias: !isLowPerf,
      powerPreference: isLowPerf ? "low-power" : "high-performance",
    });
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, isLowPerf ? 1 : 2)
    );
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // ==========================================================================
    // LIGHTING SETUP
    // ==========================================================================

    // Ambient light provides base illumination (dimmer at night)
    const ambient = new THREE.AmbientLight(
      isDay ? 0xffffff : 0x9fb3ff,
      isDay ? 0.9 : 0.5
    );
    scene.add(ambient);

    // Ground plane for visual grounding
    const groundGeo = new THREE.CircleGeometry(20, isLowPerf ? 32 : 64);
    const groundMat = new THREE.MeshBasicMaterial({
      color: CONFIG.groundColor,
      transparent: true,
      opacity: 0.5,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    scene.add(ground);

    // ==========================================================================
    // WEATHER-SPECIFIC SCENE BUILDING
    // ==========================================================================

    const type = mapCodeToScene(weatherCode);
    const cleanupFns = [];

    // -------------------------------------------------------------------------
    // SUN SCENE: Glowing sphere with point light
    // -------------------------------------------------------------------------
    if (type === "sun") {
      const sunGeo = new THREE.SphereGeometry(
        3,
        isLowPerf ? 16 : 32,
        isLowPerf ? 16 : 32
      );
      const sunMat = new THREE.MeshStandardMaterial({
        color: isDay ? 0xffdd55 : 0xbba965,
        emissive: isDay ? 0xffbb33 : 0x664400,
        emissiveIntensity: isDay ? 1.2 : 0.6,
        roughness: 0.3,
        metalness: 0.0,
      });
      const sun = new THREE.Mesh(sunGeo, sunMat);
      sun.position.set(0, 6, 0);
      scene.add(sun);

      // Point light emanates from sun position
      const sunLight = new THREE.PointLight(
        isDay ? 0xfff2a8 : 0xcfc49a,
        isDay ? 1.2 : 0.8,
        100
      );
      sunLight.position.copy(sun.position);
      scene.add(sunLight);

      // Store reference for rotation animation
      animatedRefs.current.sun = sun;

      cleanupFns.push(() => {
        sunGeo.dispose();
        sunMat.dispose();
      });
    }

    // -------------------------------------------------------------------------
    // CLOUDS SCENE: Semi-transparent spheres drifting
    // -------------------------------------------------------------------------
    if (type === "clouds") {
      const cloudGroup = new THREE.Group();
      const puffMat = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
      });
      const puffGeo = new THREE.SphereGeometry(
        1.6,
        isLowPerf ? 12 : 20,
        isLowPerf ? 8 : 16
      );

      const count = isLowPerf ? CONFIG.clouds.low : CONFIG.clouds.normal;
      for (let i = 0; i < count; i++) {
        const puff = new THREE.Mesh(puffGeo, puffMat);
        const x = (Math.random() - 0.5) * 16;
        const z = (Math.random() - 0.5) * 8;
        const y = 3 + Math.random() * 3;
        puff.position.set(x, y, z);
        puff.scale.setScalar(0.8 + Math.random() * 0.8);
        cloudGroup.add(puff);
      }
      scene.add(cloudGroup);
      animatedRefs.current.cloudGroup = cloudGroup;

      cleanupFns.push(() => {
        puffGeo.dispose();
        puffMat.dispose();
      });
    }

    // -------------------------------------------------------------------------
    // RAIN SCENE: Line segments falling with wind drift
    // -------------------------------------------------------------------------
    if (type === "rain" || type === "thunderstorm") {
      const dropCount = isLowPerf ? CONFIG.rain.low : CONFIG.rain.normal;
      const positions = new Float32Array(dropCount * 6); // 2 vertices per line
      const speed = new Float32Array(dropCount);

      for (let i = 0; i < dropCount; i++) {
        const x = (Math.random() - 0.5) * 18;
        const y = Math.random() * 12 + 2;
        const z = (Math.random() - 0.5) * 8;
        const len = 0.8 + Math.random() * 0.6;
        const s = 0.15 + Math.random() * 0.3;
        speed[i] = s;

        const idx = i * 6;
        positions[idx + 0] = x;
        positions[idx + 1] = y;
        positions[idx + 2] = z;
        positions[idx + 3] = x;
        positions[idx + 4] = y - len;
        positions[idx + 5] = z;
      }

      const rainGeo = new THREE.BufferGeometry();
      rainGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const rainMat = new THREE.LineBasicMaterial({ color: 0x9ec7ff });
      const rain = new THREE.LineSegments(rainGeo, rainMat);
      scene.add(rain);
      animatedRefs.current.rain = { rain, positions, speed };

      cleanupFns.push(() => {
        rainGeo.dispose();
        rainMat.dispose();
      });
    }

    // -------------------------------------------------------------------------
    // THUNDERSTORM: Add lightning flashes
    // -------------------------------------------------------------------------
    if (type === "thunderstorm") {
      // Add darker clouds for storm
      const stormCloudGroup = new THREE.Group();
      const stormMat = new THREE.MeshPhongMaterial({
        color: 0x444455,
        transparent: true,
        opacity: 0.9,
      });
      const stormGeo = new THREE.SphereGeometry(
        2.2,
        isLowPerf ? 10 : 16,
        isLowPerf ? 8 : 12
      );

      for (let i = 0; i < 8; i++) {
        const cloud = new THREE.Mesh(stormGeo, stormMat);
        cloud.position.set(
          (Math.random() - 0.5) * 14,
          6 + Math.random() * 2,
          (Math.random() - 0.5) * 6
        );
        cloud.scale.setScalar(0.8 + Math.random() * 0.6);
        stormCloudGroup.add(cloud);
      }
      scene.add(stormCloudGroup);

      // Lightning flash light
      const lightningLight = new THREE.PointLight(0xffffff, 0, 100);
      lightningLight.position.set(0, 10, 0);
      scene.add(lightningLight);
      animatedRefs.current.lightning = lightningLight;
      animatedRefs.current.lastFlash = 0;

      cleanupFns.push(() => {
        stormGeo.dispose();
        stormMat.dispose();
      });
    }

    // -------------------------------------------------------------------------
    // SNOW SCENE: Point particles drifting down
    // -------------------------------------------------------------------------
    if (type === "snow") {
      const flakeCount = isLowPerf ? CONFIG.snow.low : CONFIG.snow.normal;
      const positions = new Float32Array(flakeCount * 3);
      const drift = new Float32Array(flakeCount);
      const fall = new Float32Array(flakeCount);

      for (let i = 0; i < flakeCount; i++) {
        positions[i * 3 + 0] = (Math.random() - 0.5) * 18;
        positions[i * 3 + 1] = Math.random() * 12 + 2;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
        drift[i] = (Math.random() - 0.5) * 0.02;
        fall[i] = 0.02 + Math.random() * 0.04;
      }

      const snowGeo = new THREE.BufferGeometry();
      snowGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const snowMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.06,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.95,
      });
      const snow = new THREE.Points(snowGeo, snowMat);
      scene.add(snow);
      animatedRefs.current.snow = { snow, positions, drift, fall };

      cleanupFns.push(() => {
        snowGeo.dispose();
        snowMat.dispose();
      });
    }

    // Rotation group for subtle ambient motion
    const group = new THREE.Group();
    scene.add(group);
    animatedRefs.current.group = group;

    // ==========================================================================
    // ANIMATION LOOP
    // ==========================================================================

    let paused = false;

    const animate = () => {
      // Subtle ambient rotation
      if (animatedRefs.current.group) {
        animatedRefs.current.group.rotation.y += 0.0005;
      }

      // Sun rotation animation
      if (animatedRefs.current.sun) {
        animatedRefs.current.sun.rotation.y += CONFIG.sunRotationSpeed;
      }

      // Rain animation with wind drift
      const rainData = animatedRefs.current.rain;
      if (rainData) {
        const { positions, rain, speed } = rainData;
        for (let i = 0; i < speed.length; i++) {
          const idx = i * 6;
          const fallSpeed = speed[i];
          const driftX = Math.min(windSpeed, 20) * 0.003;

          // Apply horizontal drift from wind
          positions[idx + 0] += driftX;
          positions[idx + 3] += driftX;
          // Apply vertical fall
          positions[idx + 1] -= fallSpeed;
          positions[idx + 4] -= fallSpeed;

          // Reset drops that fall below ground
          if (positions[idx + 1] < -0.5) {
            const y = Math.random() * 12 + 2;
            positions[idx + 1] = y;
            positions[idx + 4] = y - (0.8 + Math.random() * 0.6);
            positions[idx + 0] = (Math.random() - 0.5) * 18;
            positions[idx + 3] = positions[idx + 0];
          }
        }
        rain.geometry.attributes.position.needsUpdate = true;
      }

      // Lightning flash animation
      const lightning = animatedRefs.current.lightning;
      if (lightning) {
        const now = Date.now();
        if (
          now - animatedRefs.current.lastFlash >
          2000 + Math.random() * 4000
        ) {
          // Random flash
          lightning.intensity = 2 + Math.random() * 3;
          animatedRefs.current.lastFlash = now;
          // Quick fade
          setTimeout(() => {
            if (lightning) lightning.intensity = 0;
          }, 50 + Math.random() * 100);
        }
      }

      // Snow animation with drift
      const snowData = animatedRefs.current.snow;
      if (snowData) {
        const { positions, snow, drift, fall } = snowData;
        for (let i = 0; i < fall.length; i++) {
          const idx = i * 3;
          const windDrift = Math.min(windSpeed, 20) * 0.0025;

          positions[idx + 0] += drift[i] + windDrift;
          positions[idx + 1] -= fall[i];

          // Reset flakes that fall below ground
          if (positions[idx + 1] < -0.5) {
            positions[idx + 0] = (Math.random() - 0.5) * 18;
            positions[idx + 1] = Math.random() * 12 + 2;
            positions[idx + 2] = (Math.random() - 0.5) * 8;
          }
        }
        snow.geometry.attributes.position.needsUpdate = true;
      }

      // Cloud drift animation
      const cloudGroup = animatedRefs.current.cloudGroup;
      if (cloudGroup) {
        cloudGroup.children.forEach((puff, i) => {
          const windDrift = Math.min(windSpeed, 20) * 0.0015;
          puff.position.x +=
            Math.sin((Date.now() * 0.0002 + i) % Math.PI) *
              CONFIG.cloudDriftBase +
            windDrift;
        });
      }

      renderer.render(scene, camera);
      if (!paused) rafRef.current = requestAnimationFrame(animate);
    };

    animate();

    // ==========================================================================
    // EVENT HANDLERS
    // ==========================================================================

    // Pause animation when tab is hidden (battery/performance)
    const onVisibility = () => {
      const nowHidden = document.visibilityState === "hidden";
      if (nowHidden) {
        paused = true;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      } else if (paused) {
        paused = false;
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    // Handle window resize
    const onResize = () => {
      const w = container.clientWidth || width;
      const h = container.clientHeight || height;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    // Store refs for potential external access
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // ==========================================================================
    // CLEANUP ON UNMOUNT
    // ==========================================================================

    return () => {
      // Cancel animation frame
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      // Remove event listeners
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);

      // Dispose all Three.js objects to prevent memory leaks
      scene.traverse((obj) => {
        if (obj.isMesh || obj.isPoints || obj.isLine) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => m.dispose());
            } else {
              obj.material.dispose();
            }
          }
        }
      });

      // Run custom cleanup functions
      cleanupFns.forEach((fn) => {
        try {
          fn();
        } catch (e) {
          /* ignore cleanup errors */
        }
      });

      // Dispose renderer and remove canvas
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [weatherCode, isDay, windSpeed, shouldRender]);

  // Render container div that will hold the Three.js canvas
  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: "100%",
        height: 220,
        borderRadius: 12,
        overflow: "hidden",
        ...style,
      }}
      aria-label="3D weather visualization"
      role="img"
    />
  );
}
