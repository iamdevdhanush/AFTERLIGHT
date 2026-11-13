import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { guideVoiceEngine, VoiceState } from '../../audio/GuideVoiceEngine';
import { useExperienceStore } from '../../store/useExperienceStore';

interface GuideCharacterSceneProps {
  isSpeaking: boolean;
  isPaused: boolean;
  visemeSignal: number;
  artifactKey: string;
}

/**
 * 3D AFTERLIGHT Museum Guide Presenter — Dr. Mae Vance, Senior Curator.
 * Features articulated lips/jaw synchronized to speech boundaries,
 * eyelid blinking, welcoming curatorial presentation gestures,
 * telemetry headset LED, and natural breathing posture.
 */
const GuideCharacterModel: React.FC<GuideCharacterSceneProps> = ({
  isSpeaking,
  isPaused,
  visemeSignal,
  artifactKey,
}) => {
  const headGroupRef = useRef<THREE.Group>(null);
  const jawRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Group>(null);
  const rightEyeRef = useRef<THREE.Group>(null);
  const upperLeftLidRef = useRef<THREE.Mesh>(null);
  const upperRightLidRef = useRef<THREE.Mesh>(null);
  const armGroupRef = useRef<THREE.Group>(null);
  const chestGroupRef = useRef<THREE.Group>(null);
  const micLedRef = useRef<THREE.MeshStandardMaterial>(null);

  const reducedMotion = useExperienceStore((s) => s.reducedMotion);

  // Gesture timer for artifact introduction
  const gestureProgressRef = useRef(0);
  const [gestureTriggerTime, setGestureTriggerTime] = useState(performance.now());

  // Blink state
  const nextBlinkTimeRef = useRef(performance.now() + 2500);
  const blinkStateRef = useRef({ isBlinking: false, startTime: 0, duration: 140 });

  // Retrigger curatorial presentation gesture on artifact change
  useEffect(() => {
    setGestureTriggerTime(performance.now());
    gestureProgressRef.current = 0;
  }, [artifactKey]);

  // Materials
  const materials = useMemo(() => {
    const skinMat = new THREE.MeshStandardMaterial({
      color: '#D8A580',
      roughness: 0.62,
      metalness: 0.04,
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: '#1B1715',
      roughness: 0.78,
      metalness: 0.12,
    });

    const suitDarkMat = new THREE.MeshStandardMaterial({
      color: '#131922',
      roughness: 0.72,
      metalness: 0.22,
    });

    const suitWhiteMat = new THREE.MeshStandardMaterial({
      color: '#DEE3EB',
      roughness: 0.55,
      metalness: 0.25,
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: '#D99A63',
      roughness: 0.32,
      metalness: 0.88,
    });

    const headsetMat = new THREE.MeshStandardMaterial({
      color: '#242B36',
      roughness: 0.45,
      metalness: 0.65,
    });

    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: '#F2F5FA' });
    const irisMat = new THREE.MeshStandardMaterial({ color: '#4B3520', roughness: 0.4 });
    const pupilMat = new THREE.MeshBasicMaterial({ color: '#0B0B0C' });
    const mouthInteriorMat = new THREE.MeshBasicMaterial({ color: '#2A1316' });

    const micLedMat = new THREE.MeshStandardMaterial({
      color: '#D99A63',
      emissive: '#D99A63',
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });

    return {
      skinMat,
      hairMat,
      suitDarkMat,
      suitWhiteMat,
      goldMat,
      headsetMat,
      eyeWhiteMat,
      irisMat,
      pupilMat,
      mouthInteriorMat,
      micLedMat,
    };
  }, []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const now = performance.now();

    // 1. Natural Breathing Rhythm
    if (chestGroupRef.current) {
      const breath = reducedMotion ? 0 : Math.sin(time * 1.5) * 0.012;
      chestGroupRef.current.position.y = breath;
    }

    // 2. Realistic Eyelid Blinking
    if (!reducedMotion) {
      if (!blinkStateRef.current.isBlinking && now > nextBlinkTimeRef.current) {
        blinkStateRef.current.isBlinking = true;
        blinkStateRef.current.startTime = now;
        blinkStateRef.current.duration = 110 + Math.random() * 50;
      }

      if (blinkStateRef.current.isBlinking) {
        const elapsed = now - blinkStateRef.current.startTime;
        const half = blinkStateRef.current.duration / 2;
        let lidPos = 0;
        if (elapsed < half) {
          lidPos = elapsed / half;
        } else if (elapsed < blinkStateRef.current.duration) {
          lidPos = 1 - (elapsed - half) / half;
        } else {
          blinkStateRef.current.isBlinking = false;
          nextBlinkTimeRef.current = now + 3200 + Math.random() * 2600;
        }

        const lidScaleY = 1.0 - lidPos * 0.88;
        if (upperLeftLidRef.current) upperLeftLidRef.current.scale.y = lidScaleY;
        if (upperRightLidRef.current) upperRightLidRef.current.scale.y = lidScaleY;
      }
    }

    // 3. Lip Synchronization & Jaw Modulation
    if (jawRef.current) {
      const targetMouthOpen = isSpeaking && !isPaused ? Math.min(1.0, visemeSignal * 1.1) : 0;
      // Smooth lerp for fluid speech articulation
      jawRef.current.position.y = THREE.MathUtils.lerp(
        jawRef.current.position.y,
        -targetMouthOpen * 0.048,
        0.28
      );
      jawRef.current.rotation.x = THREE.MathUtils.lerp(
        jawRef.current.rotation.x,
        targetMouthOpen * 0.12,
        0.28
      );
    }

    // 4. Subtle Head Gestures & Conversational Nods
    if (headGroupRef.current) {
      if (reducedMotion) {
        headGroupRef.current.rotation.set(0, -0.06, 0);
      } else {
        const speechNod = isSpeaking && !isPaused ? Math.sin(time * 4.2) * 0.022 : 0;
        const subtleTilt = Math.sin(time * 0.7) * 0.018 - 0.05;
        headGroupRef.current.rotation.x = THREE.MathUtils.lerp(
          headGroupRef.current.rotation.x,
          speechNod + 0.02,
          0.1
        );
        headGroupRef.current.rotation.y = THREE.MathUtils.lerp(
          headGroupRef.current.rotation.y,
          subtleTilt,
          0.08
        );
        headGroupRef.current.rotation.z = Math.sin(time * 1.1) * 0.012;
      }
    }

    // 5. Curatorial Presentation Arm Gesture
    if (armGroupRef.current) {
      const elapsedSinceTrigger = (now - gestureTriggerTime) / 1000;
      let targetArmX = 0;
      let targetArmZ = 0;
      let targetArmY = 0;

      if (!reducedMotion) {
        if (elapsedSinceTrigger < 3.2) {
          // Welcome / presentation gesture: arm rises and opens toward the left artifact photo
          const phase = Math.sin((elapsedSinceTrigger / 3.2) * Math.PI);
          targetArmX = -0.58 * phase;
          targetArmZ = 0.42 * phase;
          targetArmY = -0.32 * phase;
        } else if (isSpeaking && !isPaused) {
          // Subtle restrained speaking micro-gestures
          const speakWave = Math.sin(time * 1.8);
          targetArmX = -0.08 + speakWave * 0.04;
          targetArmZ = 0.04 + Math.cos(time * 1.4) * 0.02;
        }
      }

      armGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        armGroupRef.current.rotation.x,
        targetArmX,
        0.08
      );
      armGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        armGroupRef.current.rotation.z,
        targetArmZ,
        0.08
      );
      armGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        armGroupRef.current.rotation.y,
        targetArmY,
        0.08
      );
    }

    // 6. Headset Telemetry LED Pulse
    if (micLedRef.current) {
      if (isSpeaking && !isPaused) {
        micLedRef.current.emissiveIntensity = 1.0 + Math.sin(time * 8.0) * 0.45;
      } else {
        micLedRef.current.emissiveIntensity = 0.25;
      }
    }
  });

  return (
    <group position={[0, -1.05, 0]}>
      {/* Upper Torso & Space Suit Chest */}
      <group ref={chestGroupRef}>
        {/* Main Composite Flight Tunic */}
        <mesh position={[0, 0.42, 0]} material={materials.suitDarkMat}>
          <boxGeometry args={[0.96, 0.72, 0.48]} />
        </mesh>

        {/* Lunar-White Composite Chest Plating */}
        <mesh position={[0, 0.48, 0.14]} material={materials.suitWhiteMat}>
          <boxGeometry args={[0.82, 0.52, 0.24]} />
        </mesh>

        {/* Mission Gold Trim Epaulets / Shoulder Piping */}
        <mesh position={[0, 0.73, 0.12]} material={materials.goldMat}>
          <boxGeometry args={[0.86, 0.035, 0.28]} />
        </mesh>

        {/* AFTERLIGHT Mission Badge on Left Chest */}
        <group position={[-0.24, 0.55, 0.27]}>
          <mesh material={materials.goldMat}>
            <cylinderGeometry args={[0.045, 0.045, 0.015, 16]} />
          </mesh>
        </group>

        {/* Collar Ring & Neck Seal */}
        <mesh position={[0, 0.76, 0.02]} material={materials.headsetMat}>
          <cylinderGeometry args={[0.18, 0.21, 0.12, 24]} />
        </mesh>
        <mesh position={[0, 0.81, 0.02]} material={materials.goldMat}>
          <torusGeometry args={[0.19, 0.014, 12, 32]} />
        </mesh>

        {/* Articulated Right Arm & Presentation Glove */}
        <group ref={armGroupRef} position={[-0.48, 0.68, 0.05]}>
          {/* Shoulder Cap */}
          <mesh material={materials.suitDarkMat}>
            <sphereGeometry args={[0.12, 16, 16]} />
          </mesh>
          {/* Upper Arm */}
          <mesh position={[-0.04, -0.22, 0.02]} material={materials.suitWhiteMat}>
            <cylinderGeometry args={[0.085, 0.08, 0.32, 16]} />
          </mesh>
          {/* Elbow Joint */}
          <mesh position={[-0.04, -0.4, 0.04]} material={materials.headsetMat}>
            <sphereGeometry args={[0.075, 12, 12]} />
          </mesh>
          {/* Forearm & Curator Glove */}
          <group position={[-0.04, -0.4, 0.04]}>
            <mesh position={[0.08, -0.18, 0.14]} rotation={[0.4, 0.1, -0.3]} material={materials.suitDarkMat}>
              <cylinderGeometry args={[0.075, 0.07, 0.28, 16]} />
            </mesh>
            {/* Gloved Hand with Open Welcoming Palm */}
            <group position={[0.14, -0.34, 0.24]} rotation={[0.3, 0.4, -0.2]}>
              <mesh material={materials.suitWhiteMat}>
                <boxGeometry args={[0.085, 0.12, 0.045]} />
              </mesh>
              {/* Gold Ring Trim on Glove Cuff */}
              <mesh position={[0, 0.06, 0]} material={materials.goldMat}>
                <boxGeometry args={[0.09, 0.015, 0.05]} />
              </mesh>
            </group>
          </group>
        </group>

        {/* Left Arm (Relaxed) */}
        <group position={[0.48, 0.68, 0.05]}>
          <mesh material={materials.suitDarkMat}>
            <sphereGeometry args={[0.12, 16, 16]} />
          </mesh>
          <mesh position={[0.04, -0.26, 0]} material={materials.suitWhiteMat}>
            <cylinderGeometry args={[0.085, 0.08, 0.38, 16]} />
          </mesh>
          <mesh position={[0.04, -0.48, 0.02]} material={materials.suitDarkMat}>
            <cylinderGeometry args={[0.075, 0.07, 0.24, 16]} />
          </mesh>
        </group>
      </group>

      {/* Head, Face & Telemetry Headset */}
      <group ref={headGroupRef} position={[0, 0.88, 0.02]}>
        {/* Sculpted Neck */}
        <mesh position={[0, 0.04, 0]} material={materials.skinMat}>
          <cylinderGeometry args={[0.11, 0.125, 0.18, 20]} />
        </mesh>

        {/* Stylized Cranium & Face */}
        <mesh position={[0, 0.26, 0.02]} material={materials.skinMat}>
          <sphereGeometry args={[0.22, 24, 24]} />
        </mesh>

        {/* Cheekbones & Jaw Profile */}
        <mesh position={[0, 0.2, 0.08]} material={materials.skinMat}>
          <boxGeometry args={[0.26, 0.22, 0.18]} />
        </mesh>

        {/* Sculpted Nose */}
        <mesh position={[0, 0.22, 0.24]} rotation={[0.2, 0, 0]} material={materials.skinMat}>
          <coneGeometry args={[0.032, 0.09, 8]} />
        </mesh>

        {/* Sculpted Upper Lip */}
        <mesh position={[0, 0.145, 0.22]} material={materials.skinMat}>
          <boxGeometry args={[0.105, 0.025, 0.04]} />
        </mesh>

        {/* Oral Cavity Background */}
        <mesh position={[0, 0.13, 0.20]} material={materials.mouthInteriorMat}>
          <boxGeometry args={[0.09, 0.035, 0.02]} />
        </mesh>

        {/* Articulated Lower Jaw / Lip (Pivots smoothly on speech visemes) */}
        <group ref={jawRef} position={[0, 0.12, 0.18]}>
          <mesh position={[0, -0.015, 0.035]} material={materials.skinMat}>
            <boxGeometry args={[0.11, 0.032, 0.05]} />
          </mesh>
          {/* Chin */}
          <mesh position={[0, -0.05, 0.02]} material={materials.skinMat}>
            <sphereGeometry args={[0.065, 12, 12]} />
          </mesh>
        </group>

        {/* Expressive Eyes */}
        {/* Left Eye */}
        <group ref={leftEyeRef} position={[-0.075, 0.26, 0.18]}>
          {/* Sclera */}
          <mesh material={materials.eyeWhiteMat}>
            <sphereGeometry args={[0.038, 16, 16]} />
          </mesh>
          {/* Iris */}
          <mesh position={[0.005, 0, 0.028]} material={materials.irisMat}>
            <sphereGeometry args={[0.022, 12, 12]} />
          </mesh>
          {/* Pupil */}
          <mesh position={[0.005, 0, 0.036]} material={materials.pupilMat}>
            <sphereGeometry args={[0.012, 8, 8]} />
          </mesh>
          {/* Upper Eyelid for Blinking */}
          <mesh
            ref={upperLeftLidRef}
            position={[0, 0.026, 0.01]}
            rotation={[0, 0, 0]}
            material={materials.skinMat}
          >
            <sphereGeometry args={[0.042, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          </mesh>
        </group>

        {/* Right Eye */}
        <group ref={rightEyeRef} position={[0.075, 0.26, 0.18]}>
          <mesh material={materials.eyeWhiteMat}>
            <sphereGeometry args={[0.038, 16, 16]} />
          </mesh>
          <mesh position={[-0.005, 0, 0.028]} material={materials.irisMat}>
            <sphereGeometry args={[0.022, 12, 12]} />
          </mesh>
          <mesh position={[-0.005, 0, 0.036]} material={materials.pupilMat}>
            <sphereGeometry args={[0.012, 8, 8]} />
          </mesh>
          <mesh
            ref={upperRightLidRef}
            position={[0, 0.026, 0.01]}
            rotation={[0, 0, 0]}
            material={materials.skinMat}
          >
            <sphereGeometry args={[0.042, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          </mesh>
        </group>

        {/* Stylized Modern Hair Volume */}
        <group position={[0, 0.32, -0.02]}>
          <mesh material={materials.hairMat}>
            <sphereGeometry args={[0.235, 20, 20]} />
          </mesh>
          {/* Sleek Side Strands */}
          <mesh position={[-0.14, -0.06, 0.04]} material={materials.hairMat}>
            <boxGeometry args={[0.08, 0.18, 0.18]} />
          </mesh>
          <mesh position={[0.14, -0.06, 0.04]} material={materials.hairMat}>
            <boxGeometry args={[0.08, 0.18, 0.18]} />
          </mesh>
        </group>

        {/* Modern Astronaut Communications Headset */}
        <group position={[0.22, 0.24, 0.02]}>
          {/* Ear Cup */}
          <mesh material={materials.headsetMat}>
            <cylinderGeometry args={[0.055, 0.055, 0.03, 16]} />
          </mesh>
          {/* Gold Acoustic Ring */}
          <mesh position={[0.018, 0, 0]} material={materials.goldMat}>
            <torusGeometry args={[0.048, 0.008, 12, 24]} />
          </mesh>
          {/* Headband wrapping behind cranium */}
          <mesh position={[-0.22, 0.04, -0.08]} rotation={[0.4, 0, 0]} material={materials.headsetMat}>
            <torusGeometry args={[0.23, 0.012, 8, 32, Math.PI * 0.9]} />
          </mesh>
          {/* Curved Boom Microphone leading to mouth */}
          <group position={[0, -0.02, 0.04]} rotation={[-0.3, 0.5, -0.4]}>
            <mesh position={[0, 0, 0.14]} material={materials.headsetMat}>
              <cylinderGeometry args={[0.008, 0.008, 0.24, 8]} />
            </mesh>
            {/* Microphone Tip with Telemetry Indicator LED */}
            <mesh position={[0, 0, 0.27]} material={materials.micLedMat}>
              <sphereGeometry args={[0.015, 12, 12]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
};

export const GuideCharacter3D: React.FC<{
  artifactKey: string;
  isSpeaking: boolean;
  isPaused: boolean;
  visemeSignal: number;
}> = ({ artifactKey, isSpeaking, isPaused, visemeSignal }) => {
  return (
    <div className="relative w-full h-full bg-gradient-to-b from-[#0D121B] via-[#090D14] to-[#06080D] overflow-hidden select-none">
      {/* Subtle telemetry radial grid background */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(217,154,99,0.06)_0%,transparent_70%)]" />

      {/* Header Presenter Title Badge */}
      <div className="absolute top-3 left-4 z-10 flex items-center space-x-2 pointer-events-none">
        <span
          className={`w-2 h-2 rounded-full transition-colors ${
            isSpeaking && !isPaused ? 'bg-gold animate-pulse' : 'bg-starlight/30'
          }`}
        />
        <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-starlight/75">
          {isSpeaking && !isPaused ? 'CURATOR TRANSMITTING' : 'CURATOR ON STANDBY'}
        </span>
      </div>

      <Canvas
        shadows={false}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio : 1)]}
        camera={{ position: [0, 0.22, 1.85], fov: 34 }}
      >
        {/* Museum Key & Rim Lighting */}
        <ambientLight intensity={0.65} color="#1C2330" />
        <directionalLight position={[-1.8, 2.2, 1.8]} intensity={2.8} color="#FFF5EB" />
        <directionalLight position={[1.8, 1.4, -1.5]} intensity={1.6} color="#75A3D9" />
        <directionalLight position={[0, -1.2, 1.2]} intensity={0.4} color="#D99A63" />

        <GuideCharacterModel
          artifactKey={artifactKey}
          isSpeaking={isSpeaking}
          isPaused={isPaused}
          visemeSignal={visemeSignal}
        />
      </Canvas>
    </div>
  );
};

