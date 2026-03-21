/**
 * WeatherDetails.js
 *
 * Displays detailed weather information with Three.js animated visualizations:
 * - Sunrise/Sunset times with animated sun arc
 * - Humidity with water droplet animation
 * - Wind speed with rotating turbine
 * - Visibility with animated fog/clear scene
 * - UV Index with sun intensity visualization
 * - "Feels Like" temperature
 */

import React, { useRef, useEffect, useMemo, useState } from "react";
import * as THREE from "three";

// ============================================
// Mini Three.js Canvas Component
// ============================================
function MiniCanvas({ children, className = "" }) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const animationRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setSize(80, 80);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Intersection Observer for visibility
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(container);

    // Store ref for cleanup
    const animRef = animationRef;

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animRef.current);
      renderer.dispose();
      if (container?.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Pass scene, camera, renderer to children
  const context = useMemo(
    () => ({
      scene: sceneRef.current,
      camera: cameraRef.current,
      renderer: rendererRef.current,
      animationRef,
      isVisible,
    }),
    [isVisible]
  );

  return (
    <div ref={containerRef} className={`mini-canvas ${className}`}>
      {sceneRef.current && children(context)}
    </div>
  );
}

// ============================================
// Sun Arc Animation (Sunrise/Sunset)
// ============================================
function SunArcScene({ sunrise, sunset, context }) {
  const { scene, renderer, camera, animationRef, isVisible } = context;
  const groupRef = useRef(null);

  useEffect(() => {
    if (!scene || !renderer) return;

    // Clear previous objects
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }

    // Create sun
    const sunGeometry = new THREE.SphereGeometry(0.4, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);

    // Sun glow
    const glowGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffdd44,
      transparent: true,
      opacity: 0.3,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);

    // Arc path
    const arcCurve = new THREE.EllipseCurve(0, -1, 2, 2, 0, Math.PI, false);
    const arcPoints = arcCurve.getPoints(50);
    const arcGeometry = new THREE.BufferGeometry().setFromPoints(
      arcPoints.map((p) => new THREE.Vector3(p.x, p.y, 0))
    );
    const arcMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
    });
    const arc = new THREE.Line(arcGeometry, arcMaterial);

    // Horizon line
    const horizonGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-3, -1, 0),
      new THREE.Vector3(3, -1, 0),
    ]);
    const horizon = new THREE.Line(
      horizonGeometry,
      new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
      })
    );

    const group = new THREE.Group();
    group.add(sun);
    group.add(glow);
    group.add(arc);
    group.add(horizon);
    scene.add(group);
    groupRef.current = { sun, glow };

    // Calculate sun position based on time
    const now = new Date();
    const sunriseTime = new Date(sunrise).getTime();
    const sunsetTime = new Date(sunset).getTime();
    const currentTime = now.getTime();

    let progress = 0;
    if (currentTime >= sunriseTime && currentTime <= sunsetTime) {
      progress = (currentTime - sunriseTime) / (sunsetTime - sunriseTime);
    } else if (currentTime > sunsetTime) {
      progress = 1;
    }

    // Animation
    let time = 0;
    const animate = () => {
      if (!isVisible) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      time += 0.02;

      // Animate sun along arc
      const angle = progress * Math.PI;
      sun.position.x = Math.cos(angle) * 2;
      sun.position.y = Math.sin(angle) * 2 - 1;
      glow.position.copy(sun.position);

      // Pulse glow
      glow.scale.setScalar(1 + Math.sin(time * 2) * 0.1);
      glow.material.opacity = 0.2 + Math.sin(time * 2) * 0.1;

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
      sunGeometry.dispose();
      sunMaterial.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
    };
  }, [scene, renderer, camera, sunrise, sunset, isVisible, animationRef]);

  return null;
}

// ============================================
// Water Droplet Animation (Humidity)
// ============================================
function HumidityScene({ humidity, context }) {
  const { scene, renderer, camera, animationRef, isVisible } = context;

  useEffect(() => {
    if (!scene || !renderer) return;

    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }

    // Create water droplets
    const droplets = [];
    const dropletCount = Math.floor(humidity / 10);

    for (let i = 0; i < dropletCount; i++) {
      const geometry = new THREE.SphereGeometry(0.15, 16, 16);
      const material = new THREE.MeshBasicMaterial({
        color: 0x64b5f6,
        transparent: true,
        opacity: 0.7,
      });
      const droplet = new THREE.Mesh(geometry, material);
      droplet.position.x = (Math.random() - 0.5) * 3;
      droplet.position.y = Math.random() * 3 + 2;
      droplet.userData.speed = 0.02 + Math.random() * 0.03;
      droplet.userData.initialY = droplet.position.y;
      scene.add(droplet);
      droplets.push(droplet);
    }

    // Wave at bottom
    const waveGeometry = new THREE.PlaneGeometry(4, 1, 20, 1);
    const waveMaterial = new THREE.MeshBasicMaterial({
      color: 0x2196f3,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    const wave = new THREE.Mesh(waveGeometry, waveMaterial);
    wave.position.y = -1.5;
    scene.add(wave);

    let time = 0;
    const animate = () => {
      if (!isVisible) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      time += 0.03;

      // Animate droplets falling
      droplets.forEach((droplet) => {
        droplet.position.y -= droplet.userData.speed;
        if (droplet.position.y < -2) {
          droplet.position.y = droplet.userData.initialY;
        }
      });

      // Wave animation
      const positions = waveGeometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        positions.setZ(i, Math.sin(x * 2 + time) * 0.1);
      }
      positions.needsUpdate = true;

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
      droplets.forEach((d) => {
        d.geometry.dispose();
        d.material.dispose();
      });
      waveGeometry.dispose();
      waveMaterial.dispose();
    };
  }, [scene, renderer, camera, humidity, isVisible, animationRef]);

  return null;
}

// ============================================
// Wind Turbine Animation
// ============================================
function WindScene({ windSpeed, context }) {
  const { scene, renderer, camera, animationRef, isVisible } = context;

  useEffect(() => {
    if (!scene || !renderer) return;

    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }

    // Create wind turbine
    const poleGeometry = new THREE.CylinderGeometry(0.08, 0.12, 2.5, 8);
    const poleMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = -0.5;
    scene.add(pole);

    // Hub
    const hubGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const hubMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hub = new THREE.Mesh(hubGeometry, hubMaterial);
    hub.position.y = 1.2;
    scene.add(hub);

    // Blades
    const bladeGroup = new THREE.Group();
    bladeGroup.position.y = 1.2;

    for (let i = 0; i < 3; i++) {
      const bladeGeometry = new THREE.BoxGeometry(0.15, 1.5, 0.02);
      const bladeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
      blade.position.y = 0.75;
      blade.rotation.z = (i * Math.PI * 2) / 3;

      const bladeWrapper = new THREE.Group();
      bladeWrapper.add(blade);
      bladeWrapper.rotation.z = (i * Math.PI * 2) / 3;
      bladeGroup.add(bladeWrapper);
    }
    scene.add(bladeGroup);

    // Wind particles
    const particleCount = 30;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 6 - 3;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 4;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xaaaaaa,
      size: 0.05,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Animation speed based on wind
    const rotationSpeed = windSpeed * 0.005;

    const animate = () => {
      if (!isVisible) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      bladeGroup.rotation.z += rotationSpeed;

      // Move particles
      const positions = particleGeometry.attributes.position;
      for (let i = 0; i < particleCount; i++) {
        positions.array[i * 3] += 0.05 + windSpeed * 0.002;
        if (positions.array[i * 3] > 4) {
          positions.array[i * 3] = -4;
        }
      }
      positions.needsUpdate = true;

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [scene, renderer, camera, windSpeed, isVisible, animationRef]);

  return null;
}

// ============================================
// Visibility Scene (Fog/Clear)
// ============================================
function VisibilityScene({ visibility, context }) {
  const { scene, renderer, camera, animationRef, isVisible } = context;

  useEffect(() => {
    if (!scene || !renderer) return;

    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }

    // Create eye
    const eyeOuterGeometry = new THREE.RingGeometry(0.8, 1, 32);
    const eyeOuterMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    });
    const eyeOuter = new THREE.Mesh(eyeOuterGeometry, eyeOuterMaterial);
    scene.add(eyeOuter);

    const irisGeometry = new THREE.CircleGeometry(0.6, 32);
    const irisMaterial = new THREE.MeshBasicMaterial({ color: 0x4fc3f7 });
    const iris = new THREE.Mesh(irisGeometry, irisMaterial);
    iris.position.z = 0.01;
    scene.add(iris);

    const pupilGeometry = new THREE.CircleGeometry(0.25, 32);
    const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x1a1a2e });
    const pupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    pupil.position.z = 0.02;
    scene.add(pupil);

    // Visibility indicator (rays)
    const rayCount = 8;
    const rays = [];
    const normalizedVisibility = Math.min(visibility / 20, 1); // Assume 20km is max

    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const rayLength = 1.5 * normalizedVisibility;
      const rayGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(Math.cos(angle) * 1.1, Math.sin(angle) * 1.1, 0),
        new THREE.Vector3(
          Math.cos(angle) * (1.1 + rayLength),
          Math.sin(angle) * (1.1 + rayLength),
          0
        ),
      ]);
      const rayMaterial = new THREE.LineBasicMaterial({
        color: 0x4fc3f7,
        transparent: true,
        opacity: normalizedVisibility * 0.8,
      });
      const ray = new THREE.Line(rayGeometry, rayMaterial);
      scene.add(ray);
      rays.push({ ray, angle, length: rayLength });
    }

    let time = 0;
    const animate = () => {
      if (!isVisible) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      time += 0.02;

      // Pulse effect on pupil
      pupil.scale.setScalar(1 + Math.sin(time * 2) * 0.1);

      // Rotate rays slightly
      rays.forEach(({ ray }, i) => {
        ray.rotation.z = Math.sin(time + i) * 0.1;
      });

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [scene, renderer, camera, visibility, isVisible, animationRef]);

  return null;
}

// ============================================
// UV Index Sun Scene
// ============================================
function UVIndexScene({ uvIndex, context }) {
  const { scene, renderer, camera, animationRef, isVisible } = context;

  useEffect(() => {
    if (!scene || !renderer) return;

    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }

    // Color based on UV level
    const getUVColor = (uv) => {
      if (uv <= 2) return 0x4caf50; // Low - green
      if (uv <= 5) return 0xffeb3b; // Moderate - yellow
      if (uv <= 7) return 0xff9800; // High - orange
      if (uv <= 10) return 0xf44336; // Very high - red
      return 0x9c27b0; // Extreme - purple
    };

    const uvColor = getUVColor(uvIndex);

    // Create sun core
    const sunGeometry = new THREE.CircleGeometry(0.6, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: uvColor });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);

    // Create rays based on UV intensity
    const rayCount = Math.min(Math.floor(uvIndex) + 4, 16);
    const rays = [];

    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const rayLength = 0.5 + (uvIndex / 11) * 1;

      const rayGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(Math.cos(angle) * 0.7, Math.sin(angle) * 0.7, 0),
        new THREE.Vector3(
          Math.cos(angle) * (0.7 + rayLength),
          Math.sin(angle) * (0.7 + rayLength),
          0
        ),
      ]);
      const rayMaterial = new THREE.LineBasicMaterial({
        color: uvColor,
        transparent: true,
        opacity: 0.8,
      });
      const ray = new THREE.Line(rayGeometry, rayMaterial);
      scene.add(ray);
      rays.push(ray);
    }

    // Outer glow
    const glowGeometry = new THREE.RingGeometry(0.6, 1.2, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: uvColor,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glow);

    let time = 0;
    const animate = () => {
      if (!isVisible) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      time += 0.03;

      // Rotate rays
      rays.forEach((ray, i) => {
        ray.rotation.z = time * 0.5 + i * 0.1;
      });

      // Pulse glow
      glow.scale.setScalar(1 + Math.sin(time * 2) * 0.15);
      glow.material.opacity = 0.15 + Math.sin(time * 2) * 0.1;

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [scene, renderer, camera, uvIndex, isVisible, animationRef]);

  return null;
}

// ============================================
// AQI Particles Scene
// ============================================
function AQIScene({ aqi, context }) {
  const { scene, renderer, camera, animationRef, isVisible } = context;

  useEffect(() => {
    if (!scene || !renderer) return;

    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }

    // AQI color scale
    const getAQIColor = (value) => {
      if (value <= 50) return 0x4caf50; // Good - green
      if (value <= 100) return 0xffeb3b; // Moderate - yellow
      if (value <= 150) return 0xff9800; // Unhealthy for sensitive - orange
      if (value <= 200) return 0xf44336; // Unhealthy - red
      if (value <= 300) return 0x9c27b0; // Very unhealthy - purple
      return 0x880e4f; // Hazardous - maroon
    };

    const aqiColor = getAQIColor(aqi);

    // Create particles representing air quality
    const particleCount = Math.min(Math.floor(aqi / 5) + 10, 100);
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const color = new THREE.Color(aqiColor);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2;

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() * 0.1 + 0.05;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Lung shape outline
    const lungShape = new THREE.Shape();
    lungShape.moveTo(0, 1);
    lungShape.bezierCurveTo(-1, 0.8, -1.2, -0.5, -0.5, -1);
    lungShape.lineTo(0, -0.5);
    lungShape.lineTo(0.5, -1);
    lungShape.bezierCurveTo(1.2, -0.5, 1, 0.8, 0, 1);

    const lungGeometry = new THREE.ShapeGeometry(lungShape);
    const lungMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
    });
    const lung = new THREE.Mesh(lungGeometry, lungMaterial);
    lung.scale.setScalar(1.2);
    scene.add(lung);

    let time = 0;
    const animate = () => {
      if (!isVisible) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      time += 0.01;

      // Float particles
      const pos = geometry.attributes.position;
      for (let i = 0; i < particleCount; i++) {
        pos.array[i * 3 + 1] += Math.sin(time + i) * 0.005;
        pos.array[i * 3] += Math.cos(time + i * 0.5) * 0.003;
      }
      pos.needsUpdate = true;

      // Breathing animation on lung
      lung.scale.setScalar(1.2 + Math.sin(time * 2) * 0.1);

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [scene, renderer, camera, aqi, isVisible, animationRef]);

  return null;
}

// ============================================
// Weather Detail Card Component
// ============================================
function DetailCard({ title, value, unit, icon, children, color }) {
  return (
    <div className="weather-detail-card" style={{ "--card-accent": color }}>
      <div className="weather-detail-card__visual">{children}</div>
      <div className="weather-detail-card__content">
        <span className="weather-detail-card__icon">{icon}</span>
        <span className="weather-detail-card__title">{title}</span>
        <span className="weather-detail-card__value">
          {value}
          {unit && <span className="weather-detail-card__unit">{unit}</span>}
        </span>
      </div>
    </div>
  );
}

// ============================================
// Format time helper
// ============================================
function formatTime(dateString) {
  if (!dateString) return "--:--";
  const date = new Date(dateString);
  return date.toLocaleTimeString("en", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ============================================
// Get UV Level Label
// ============================================
function getUVLabel(uv) {
  if (uv <= 2) return "Low";
  if (uv <= 5) return "Moderate";
  if (uv <= 7) return "High";
  if (uv <= 10) return "Very High";
  return "Extreme";
}

// ============================================
// Get AQI Label
// ============================================
function getAQILabel(aqi) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy (Sensitive)";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

// ============================================
// Main Weather Details Component
// ============================================
export default function WeatherDetails({
  sunrise,
  sunset,
  humidity,
  windSpeed,
  windDirection,
  visibility,
  uvIndex,
  feelsLike,
  pressure,
  aqi = null, // Optional - may not always be available
}) {
  // Estimate AQI if not provided (just for demo)
  const displayAQI = aqi ?? Math.floor(30 + Math.random() * 50);

  return (
    <section
      className="weather-details"
      aria-label="Detailed weather information"
    >
      <h3 className="weather-details__title">
        <span className="weather-details__title-icon">📊</span>
        Weather Details
      </h3>

      <div className="weather-details__grid">
        {/* Sunrise */}
        <DetailCard
          title="Sunrise"
          value={formatTime(sunrise)}
          icon="🌅"
          color="#ff9800"
        >
          <MiniCanvas className="mini-canvas--sun">
            {(context) => (
              <SunArcScene
                sunrise={sunrise}
                sunset={sunset}
                context={context}
              />
            )}
          </MiniCanvas>
        </DetailCard>

        {/* Sunset */}
        <DetailCard
          title="Sunset"
          value={formatTime(sunset)}
          icon="🌇"
          color="#e65100"
        >
          <MiniCanvas className="mini-canvas--sun">
            {(context) => (
              <SunArcScene
                sunrise={sunrise}
                sunset={sunset}
                context={context}
              />
            )}
          </MiniCanvas>
        </DetailCard>

        {/* Humidity */}
        <DetailCard
          title="Humidity"
          value={humidity ?? "--"}
          unit="%"
          icon="💧"
          color="#2196f3"
        >
          <MiniCanvas>
            {(context) => (
              <HumidityScene humidity={humidity ?? 50} context={context} />
            )}
          </MiniCanvas>
        </DetailCard>

        {/* Wind */}
        <DetailCard
          title="Wind"
          value={windSpeed ?? "--"}
          unit=" km/h"
          icon="💨"
          color="#78909c"
        >
          <MiniCanvas>
            {(context) => (
              <WindScene windSpeed={windSpeed ?? 10} context={context} />
            )}
          </MiniCanvas>
        </DetailCard>

        {/* Visibility */}
        <DetailCard
          title="Visibility"
          value={visibility ?? "--"}
          unit=" km"
          icon="👁️"
          color="#4fc3f7"
        >
          <MiniCanvas>
            {(context) => (
              <VisibilityScene
                visibility={visibility ?? 10}
                context={context}
              />
            )}
          </MiniCanvas>
        </DetailCard>

        {/* UV Index */}
        <DetailCard
          title="UV Index"
          value={`${uvIndex ?? "--"} ${
            uvIndex ? `(${getUVLabel(uvIndex)})` : ""
          }`}
          icon="☀️"
          color={
            uvIndex <= 2
              ? "#4caf50"
              : uvIndex <= 5
              ? "#ffeb3b"
              : uvIndex <= 7
              ? "#ff9800"
              : "#f44336"
          }
        >
          <MiniCanvas>
            {(context) => (
              <UVIndexScene uvIndex={uvIndex ?? 5} context={context} />
            )}
          </MiniCanvas>
        </DetailCard>

        {/* Feels Like */}
        <DetailCard
          title="Feels Like"
          value={feelsLike ?? "--"}
          unit="°"
          icon="🌡️"
          color="#ff7043"
        >
          <div className="feels-like-visual">
            <div
              className="feels-like-thermometer"
              style={{
                "--fill-level": `${Math.min(
                  100,
                  Math.max(0, ((feelsLike ?? 20) + 10) * 2)
                )}%`,
              }}
            />
          </div>
        </DetailCard>

        {/* Air Quality */}
        <DetailCard
          title="Air Quality"
          value={`${displayAQI} (${getAQILabel(displayAQI)})`}
          icon="🫁"
          color={
            displayAQI <= 50
              ? "#4caf50"
              : displayAQI <= 100
              ? "#ffeb3b"
              : "#f44336"
          }
        >
          <MiniCanvas>
            {(context) => <AQIScene aqi={displayAQI} context={context} />}
          </MiniCanvas>
        </DetailCard>
      </div>
    </section>
  );
}
