import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface JarvisMegazordHeadProps {
  active: boolean;   // true when speaking
  size?: number;     // container height in px
  idle?: boolean;    // always visible when true
  analyser?: AnalyserNode | null; // Audio analyser for reactive animation
}

/**
 * CyberCore-style holographic mecha head with Three.js.
 * Features: dark metal skull, glowing visor, animated jaw,
 * orbiting data rings, floating particles — all audio-reactive.
 */
function JarvisMegazordHead({ active, size = 200, idle = false, analyser = null }: JarvisMegazordHeadProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [visible, setVisible] = useState(idle);

  useEffect(() => {
    if (idle) { setVisible(true); return; }
    if (active) { setVisible(true); }
    else {
      const t = setTimeout(() => setVisible(false), 600);
      return () => clearTimeout(t);
    }
  }, [active, idle]);

  useEffect(() => {
    if (!visible || !containerRef.current) return;
    const container = containerRef.current;

    // ─── SCENE SETUP ──────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = null; // Transparent

    const w = container.clientWidth || 280;
    const h = container.clientHeight || size;
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    camera.position.set(0, 0.2, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ─── LIGHTING ─────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x0044ff, 0.4));

    const keyLight = new THREE.PointLight(0x00ffff, 2.5, 20);
    keyLight.position.set(4, 4, 5);
    scene.add(keyLight);

    const rimLight = new THREE.SpotLight(0x6600ff, 4);
    rimLight.position.set(-4, 6, -4);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0x0066ff, 1, 15);
    fillLight.position.set(0, -3, 3);
    scene.add(fillLight);

    // ─── MATERIALS ────────────────────────────────────────────
    const armorMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a1628,
      metalness: 0.92,
      roughness: 0.18,
      transparent: true,
      opacity: 0.92,
      emissive: 0x000810,
      side: THREE.DoubleSide,
    });

    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00aaff,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
    });

    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });

    const accentMaterial = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });

    // ─── HEAD GROUP ───────────────────────────────────────────
    const headGroup = new THREE.Group();
    scene.add(headGroup);

    // 1. Core skull (low-poly icosahedron)
    const skullGeo = new THREE.IcosahedronGeometry(1.15, 1);
    const skull = new THREE.Mesh(skullGeo, armorMaterial);
    const skullWire = new THREE.Mesh(skullGeo, wireframeMaterial);
    skullWire.scale.setScalar(1.025);
    headGroup.add(skull);
    headGroup.add(skullWire);

    // 2. Face plate
    const faceGeo = new THREE.BoxGeometry(1.5, 1.4, 0.45);
    const face = new THREE.Mesh(faceGeo, armorMaterial);
    face.position.set(0, 0.05, 0.75);
    const faceWire = new THREE.Mesh(faceGeo, wireframeMaterial);
    faceWire.position.copy(face.position);
    faceWire.scale.setScalar(1.02);
    headGroup.add(face);
    headGroup.add(faceWire);

    // 3. Helmet crest (central ridge)
    const crestGeo = new THREE.BoxGeometry(0.2, 0.55, 0.7);
    const crest = new THREE.Mesh(crestGeo, armorMaterial);
    crest.position.set(0, 1.0, 0.3);
    crest.rotation.x = 0.2;
    headGroup.add(crest);

    // Crest tip glow
    const crestTipGeo = new THREE.BoxGeometry(0.12, 0.12, 0.35);
    const crestTip = new THREE.Mesh(crestTipGeo, accentMaterial);
    crestTip.position.set(0, 1.25, 0.4);
    crestTip.rotation.x = 0.3;
    headGroup.add(crestTip);

    // 4. Side horns
    const hornGeo = new THREE.ConeGeometry(0.08, 0.7, 4);
    const leftHorn = new THREE.Mesh(hornGeo, armorMaterial);
    leftHorn.position.set(-0.85, 0.8, -0.1);
    leftHorn.rotation.z = 0.5;
    headGroup.add(leftHorn);

    const rightHorn = new THREE.Mesh(hornGeo, armorMaterial);
    rightHorn.position.set(0.85, 0.8, -0.1);
    rightHorn.rotation.z = -0.5;
    headGroup.add(rightHorn);

    // Horn tips glow
    const tipGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const leftTip = new THREE.Mesh(tipGeo, glowMaterial);
    leftTip.position.set(-1.1, 1.1, -0.1);
    headGroup.add(leftTip);
    const rightTip = new THREE.Mesh(tipGeo, glowMaterial);
    rightTip.position.set(1.1, 1.1, -0.1);
    headGroup.add(rightTip);

    // 5. Eyes / Visor (the money shot)
    const eyeGeo = new THREE.BoxGeometry(1.15, 0.14, 0.08);
    const eyes = new THREE.Mesh(eyeGeo, glowMaterial);
    eyes.position.set(0, 0.22, 1.0);
    headGroup.add(eyes);

    // Eye surrounds
    const eyeFrameGeo = new THREE.BoxGeometry(1.35, 0.28, 0.06);
    const eyeFrame = new THREE.Mesh(eyeFrameGeo, new THREE.MeshStandardMaterial({
      color: 0x050c18, metalness: 0.95, roughness: 0.1,
    }));
    eyeFrame.position.set(0, 0.22, 0.97);
    headGroup.add(eyeFrame);

    // 6. Cheek plates
    const cheekGeo = new THREE.BoxGeometry(0.3, 0.5, 0.18);
    const leftCheek = new THREE.Mesh(cheekGeo, armorMaterial);
    leftCheek.position.set(-0.78, -0.05, 0.5);
    leftCheek.rotation.y = 0.4;
    headGroup.add(leftCheek);
    const rightCheek = new THREE.Mesh(cheekGeo, armorMaterial);
    rightCheek.position.set(0.78, -0.05, 0.5);
    rightCheek.rotation.y = -0.4;
    headGroup.add(rightCheek);

    // Cheek vent lines
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 3; i++) {
        const ventGeo = new THREE.BoxGeometry(0.18, 0.015, 0.015);
        const vent = new THREE.Mesh(ventGeo, accentMaterial);
        vent.position.set(side * 0.82, -0.08 + i * 0.08, 0.55);
        vent.rotation.y = side * 0.4;
        headGroup.add(vent);
      }
    }

    // 7. Jaw (animated)
    const jawGroup = new THREE.Group();
    jawGroup.position.set(0, -0.35, 0.2);
    headGroup.add(jawGroup);

    const jawGeo = new THREE.CylinderGeometry(0.65, 0.45, 0.7, 6);
    const jaw = new THREE.Mesh(jawGeo, armorMaterial);
    jaw.rotation.x = Math.PI / 2;
    jaw.scale.set(1, 0.45, 1);
    jaw.position.set(0, -0.35, 0);
    jawGroup.add(jaw);

    const jawWire = new THREE.Mesh(jawGeo, wireframeMaterial);
    jawWire.rotation.copy(jaw.rotation);
    jawWire.scale.copy(jaw.scale);
    jawWire.scale.multiplyScalar(1.02);
    jawWire.position.copy(jaw.position);
    jawGroup.add(jawWire);

    // Chin plate
    const chinGeo = new THREE.BoxGeometry(0.35, 0.45, 0.5);
    const chin = new THREE.Mesh(chinGeo, armorMaterial);
    chin.position.set(0, -0.7, 0.25);
    chin.rotation.x = -0.35;
    jawGroup.add(chin);

    // Mouth grille
    const mouthGlowGeo = new THREE.BoxGeometry(0.5, 0.06, 0.05);
    const mouthGlow = new THREE.Mesh(mouthGlowGeo, glowMaterial);
    mouthGlow.position.set(0, -0.15, 0.62);
    jawGroup.add(mouthGlow);

    for (let i = 0; i < 4; i++) {
      const lineGeo = new THREE.BoxGeometry(0.4, 0.01, 0.03);
      const line = new THREE.Mesh(lineGeo, accentMaterial);
      line.position.set(0, -0.08 - i * 0.055, 0.6);
      jawGroup.add(line);
    }

    // 8. Neck
    const neckGeo = new THREE.CylinderGeometry(0.32, 0.38, 0.3, 12);
    const neck = new THREE.Mesh(neckGeo, armorMaterial);
    neck.position.set(0, -1.1, 0.1);
    headGroup.add(neck);

    // Neck glow rings
    for (let i = 0; i < 2; i++) {
      const ringGeo = new THREE.TorusGeometry(0.35 + i * 0.03, 0.008, 8, 32);
      const ring = new THREE.Mesh(ringGeo, accentMaterial);
      ring.position.set(0, -1.0 - i * 0.1, 0.1);
      headGroup.add(ring);
    }

    // 9. Holographic data rings (orbiting)
    const dataRingGeo = new THREE.TorusGeometry(2.3, 0.015, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x0088ff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending,
    });

    const ring1 = new THREE.Mesh(dataRingGeo, ringMat.clone());
    headGroup.add(ring1);

    const ring2 = new THREE.Mesh(dataRingGeo, ringMat.clone());
    ring2.scale.setScalar(0.82);
    ring2.rotation.x = Math.PI / 1.5;
    headGroup.add(ring2);

    const ring3 = new THREE.Mesh(dataRingGeo, ringMat.clone());
    ring3.scale.setScalar(1.15);
    ring3.rotation.y = Math.PI / 3;
    headGroup.add(ring3);

    // 10. Floating particles
    const particleCount = 200;
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 12;
    }
    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({
      size: 0.04, color: 0x00ffff, transparent: true, opacity: 0.25,
    });
    const starField = new THREE.Points(particlesGeo, particlesMat);
    scene.add(starField);

    // ─── ANIMATION LOOP ──────────────────────────────────────
    const dataArray = new Uint8Array(512);
    let time = 0;
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      time += 0.01;

      // Audio analysis
      let volume = 0;
      if (analyser) {
        try {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          const startBin = 5;
          const endBin = 60;
          for (let i = startBin; i < endBin; i++) sum += dataArray[i];
          volume = sum / (endBin - startBin);
        } catch {}
      }

      const normalizedVol = volume / 255;
      const speechIntensity = Math.pow(normalizedVol, 2.5);

      // Jaw movement (audio-reactive)
      const targetJaw = speechIntensity * 0.7;
      jawGroup.rotation.x = THREE.MathUtils.lerp(jawGroup.rotation.x, targetJaw, 0.2);

      // Eye glow pulse
      const basePulse = Math.sin(time * 2) * 0.15 + 0.55;
      const glowIntensity = basePulse + speechIntensity * 2.5;
      const targetColor = new THREE.Color(0x00ffff);
      if (speechIntensity > 0.1) {
        targetColor.setHSL(0.5, 0.8, 0.5 + speechIntensity * 0.4);
      }
      glowMaterial.color.lerp(targetColor, 0.15);
      glowMaterial.opacity = THREE.MathUtils.clamp(glowIntensity, 0.3, 1.0);

      // Mouth glow
      mouthGlow.scale.y = 1 + speechIntensity * 3;
      (mouthGlow.material as THREE.MeshBasicMaterial).opacity = 0.3 + speechIntensity * 0.7;

      // Head idle motion
      headGroup.rotation.y = Math.sin(time * 0.4) * 0.12;
      headGroup.rotation.z = Math.cos(time * 0.25) * 0.04;
      headGroup.rotation.x = Math.sin(time * 0.15) * 0.03;

      // Ring rotations (speed up when talking)
      const ringSpeed = 1 + speechIntensity * 6;
      ring1.rotation.z += 0.004 * ringSpeed;
      ring1.rotation.x = Math.sin(time * 0.5) * 0.08;
      ring2.rotation.x += 0.003 * ringSpeed;
      ring2.rotation.y += 0.002;
      ring3.rotation.y -= 0.0035 * ringSpeed;

      // Particle drift
      starField.rotation.y = time * 0.015;

      // Crest tip pulse
      crestTip.scale.setScalar(1 + Math.sin(time * 3) * 0.1);

      // Horn tip pulse
      leftTip.scale.setScalar(1 + Math.sin(time * 2.5) * 0.15);
      rightTip.scale.setScalar(1 + Math.cos(time * 2.5) * 0.15);

      // Key light reacts to speech
      keyLight.intensity = 2 + speechIntensity * 3;

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      if (newW === 0 || newH === 0) return;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      // Dispose geometries & materials
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material?.dispose();
        }
      });
      particlesGeo.dispose();
      particlesMat.dispose();
    };
  }, [visible, analyser, active, size]);

  if (!visible) return null;

  if (idle) {
    return (
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: size,
          opacity: idle && !active ? 0.7 : 1,
          transition: 'opacity 0.5s ease',
        }}
      />
    );
  }

  // Overlay mode (not used currently, but kept for future)
  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-none"
      style={{
        animation: active ? 'megazordEnter 0.5s ease-out forwards' : 'megazordExit 0.5s ease-in forwards',
      }}
    >
      <style>{`
        @keyframes megazordEnter { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes megazordExit { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(0.8); opacity: 0; } }
      `}</style>
      <div ref={containerRef} style={{ width: size, height: size }} />
    </div>
  );
}

export default JarvisMegazordHead;
export { JarvisMegazordHead };
