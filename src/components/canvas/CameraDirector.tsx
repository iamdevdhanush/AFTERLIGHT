import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { useExperienceStore } from '../../store/useExperienceStore';
import { ARTIFACTS } from '../../data/artifacts';
import { DESTINATIONS } from '../../data/destinations';
import { PLANET_RADIUS } from './PlanetSphere';

export const CameraDirector: React.FC = () => {
  const { camera, gl, size } = useThree();
  const state = useExperienceStore((s) => s.state);
  const currentDestination = useExperienceStore((s) => s.currentDestination);
  const selectedArtifactId = useExperienceStore((s) => s.selectedArtifactId);
  const savedCamera = useExperienceStore((s) => s.savedCamera);
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);
  const enterInspection = useExperienceStore((s) => s.enterInspection);

  // Target lookAt vector
  const targetLookAt = useRef(new THREE.Vector3(0, 1.8, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 1.8, 0));
  const prevStateRef = useRef<string | null>(null);

  // Orbital framing & zoom refs for DESTINATION_SELECT
  const orbitalZ = useRef(8.2);
  const targetOrbitalZ = useRef(8.2);
  const orbitalOffsetX = useRef(-0.95);
  const isOrbitalTweening = useRef(false);

  // Free exploration orbit control variables
  const isDragging = useRef(false);
  const prevPointer = useRef({ x: 0, y: 0 });
  const spherical = useRef(new THREE.Spherical(17, Math.PI / 2.6, -0.4));
  const targetSpherical = useRef(new THREE.Spherical(17, Math.PI / 2.6, -0.4));
  const panOffset = useRef(new THREE.Vector3(0, 0, 0));
  const targetPanOffset = useRef(new THREE.Vector3(0, 0, 0));

  // Keep responsive orbital offset & minimum non-cropping zoom distance
  const getOrbitalFraming = () => {
    const aspect = size.width / Math.max(1, size.height);
    const fovRad = THREE.MathUtils.degToRad(42);
    const tanHalf = Math.tan(fovRad / 2);

    // Ensure full circular sphere + thin Mars limb (~2.23) stays completely within frame
    const effectiveRadius = PLANET_RADIUS * 1.05;
    const minVerticalZ = effectiveRadius / (tanHalf * 0.82);
    const minHorizontalZ = effectiveRadius / (tanHalf * Math.max(0.55, aspect) * 0.72);
    const baseZ = Math.max(8.2, minVerticalZ * 1.15, minHorizontalZ * 1.12);
    const minZ = Math.max(6.8, minVerticalZ, minHorizontalZ);
    const offsetX = aspect >= 1.15 ? -0.95 : aspect >= 0.85 ? -0.4 : 0;

    return { baseZ, minZ, maxZ: baseZ + 4.0, offsetX };
  };

  // Explicit state-based camera transitions
  useEffect(() => {
    const dest = DESTINATIONS[currentDestination] || DESTINATIONS.moon;
    const isOrbitalPlanet = currentDestination === 'moon' || currentDestination === 'mars';

    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(targetLookAt.current);
    gsap.killTweensOf(orbitalZ);
    isOrbitalTweening.current = false;

    if (state === 'ARRIVAL') {
      // Establishing shot: Wide cinematic view with Lunar Module centered on right, Earth above horizon
      camera.position.set(-4.5, 2.8, 18.0);
      targetLookAt.current.set(-2.2, 1.8, 0);
      currentLookAt.current.copy(targetLookAt.current);
    } else if (state === 'DESTINATION_SELECT') {
      if (isOrbitalPlanet) {
        const { baseZ, offsetX } = getOrbitalFraming();
        orbitalOffsetX.current = offsetX;

        const enteringFromOutside =
          prevStateRef.current !== 'DESTINATION_SELECT' &&
          prevStateRef.current !== null;

        targetOrbitalZ.current = baseZ;
        orbitalZ.current = enteringFromOutside && !reducedMotion ? baseZ + 2.2 : baseZ;

        // Place camera facing complete 3D sphere in deep black space
        camera.position.set(offsetX, 0.08, orbitalZ.current);
        targetLookAt.current.set(offsetX, 0.04, 0);
        currentLookAt.current.set(offsetX, 0.04, 0);

        if (enteringFromOutside && !reducedMotion) {
          isOrbitalTweening.current = true;
          gsap.to(orbitalZ, {
            current: baseZ,
            duration: 1.15,
            ease: 'power3.out',
            onComplete: () => {
              isOrbitalTweening.current = false;
            },
          });
        }
      } else {
        // Deep Space Voyager orbital framing
        camera.position.set(4.5, 2.4, 8.6);
        targetLookAt.current.set(-1.3, 0.2, 0);
        currentLookAt.current.set(-1.3, 0.2, 0);
      }
    } else if (state === 'ENVIRONMENT_LOADING') {
      if (isOrbitalPlanet) {
        // Seamless orbital dive straight into the sunlit hemisphere until surface fills frame
        const diveDuration = reducedMotion ? 0.45 : 1.85;
        isOrbitalTweening.current = true;
        gsap.to(camera.position, {
          x: 0.25,
          y: 0.16,
          z: 2.38,
          duration: diveDuration,
          ease: 'power2.in',
        });
        gsap.to(targetLookAt.current, {
          x: 0.2,
          y: 0.1,
          z: 0,
          duration: diveDuration * 0.85,
          ease: 'power2.inOut',
        });
      }
    } else if (state === 'GUIDED_INTRO') {
      // Discovery shot: Smooth approach into the planetary landscape
      camera.position.set(
        dest.initialCameraPosition[0] * 1.35,
        dest.initialCameraPosition[1] + 8.5,
        dest.initialCameraPosition[2] * 1.25
      );
      targetLookAt.current.set(dest.initialCameraTarget[0], dest.initialCameraTarget[1], dest.initialCameraTarget[2]);
      currentLookAt.current.copy(targetLookAt.current);

      gsap.to(camera.position, {
        x: dest.initialCameraPosition[0],
        y: dest.initialCameraPosition[1],
        z: dest.initialCameraPosition[2],
        duration: reducedMotion ? 0.6 : 2.6,
        ease: 'power2.out',
      });

      // Synchronize spherical coordinates for free exploration
      const offset = new THREE.Vector3(...dest.initialCameraPosition).sub(
        new THREE.Vector3(...dest.initialCameraTarget)
      );
      spherical.current.setFromVector3(offset);
      targetSpherical.current.copy(spherical.current);
      panOffset.current.set(0, 0, 0);
      targetPanOffset.current.set(0, 0, 0);
    } else if (state === 'ARTIFACT_APPROACH' && selectedArtifactId) {
      const artifact = ARTIFACTS[selectedArtifactId];
      if (artifact) {
        const [ax, ay, az] = artifact.coordinates.worldPosition;

        // Carefully chosen camera-safe layout framing:
        // By offsetting the target lookAt slightly to the left, the 3D model sits
        // in the right 60% of the viewport, leaving the left 40% camera-safe for editorial text!
        let heroPos = new THREE.Vector3(ax + 4.8, ay + 2.6, az + 6.2);
        let heroTarget = new THREE.Vector3(ax - 1.2, ay + 2.0, az);

        if (artifact.destination === 'moon') {
          // Camera-safe layout framing: offset target lookAt so the entire Lunar Module sits
          // cleanly in the right 60% of the viewport, leaving the left 40% reserved for editorial text
          heroPos = new THREE.Vector3(ax + 3.2, ay + 2.5, az + 10.5);
          heroTarget = new THREE.Vector3(ax - 2.8, ay + 2.0, az);
        } else if (artifact.destination === 'deep_space') {
          heroPos = new THREE.Vector3(ax + 4.8, ay + 1.8, az + 5.6);
          heroTarget = new THREE.Vector3(ax - 1.2, ay, az);
        } else if (artifact.destination === 'mars') {
          heroPos = new THREE.Vector3(ax + 3.2, ay + 1.2, az + 4.2);
          heroTarget = new THREE.Vector3(ax - 1.6, ay + 0.6, az);
        }

        gsap.to(camera.position, {
          x: heroPos.x,
          y: heroPos.y,
          z: heroPos.z,
          duration: 2.4,
          ease: 'power3.inOut',
          onComplete: () => {
            enterInspection();
          },
        });

        gsap.to(targetLookAt.current, {
          x: heroTarget.x,
          y: heroTarget.y,
          z: heroTarget.z,
          duration: 2.4,
          ease: 'power3.inOut',
        });
      }
    } else if (state === 'RETURN_TO_EXPLORATION') {
      const returnPos = savedCamera ? savedCamera.position : dest.initialCameraPosition;
      const returnTarget = savedCamera ? savedCamera.target : dest.initialCameraTarget;

      gsap.to(camera.position, {
        x: returnPos[0],
        y: returnPos[1],
        z: returnPos[2],
        duration: 1.8,
        ease: 'power3.out',
      });

      gsap.to(targetLookAt.current, {
        x: returnTarget[0],
        y: returnTarget[1],
        z: returnTarget[2],
        duration: 1.8,
        ease: 'power3.out',
      });

      const offset = new THREE.Vector3(...returnPos).sub(new THREE.Vector3(...returnTarget));
      targetSpherical.current.setFromVector3(offset);
      spherical.current.copy(targetSpherical.current);
    }

    prevStateRef.current = state;
  }, [state, currentDestination, selectedArtifactId, camera, enterInspection, savedCamera, reducedMotion]);

  // Keep responsive framing on viewport resize during orbital DESTINATION_SELECT
  useEffect(() => {
    if (state !== 'DESTINATION_SELECT') return;
    if (currentDestination !== 'moon' && currentDestination !== 'mars') return;
    const { minZ, maxZ, offsetX } = getOrbitalFraming();
    orbitalOffsetX.current = offsetX;
    targetLookAt.current.set(offsetX, 0.04, 0);
    targetOrbitalZ.current = Math.max(minZ, Math.min(maxZ, targetOrbitalZ.current));
  }, [size.width, size.height, state, currentDestination]);

  // Pointer & Touch Interaction for Free Exploration and Orbital Zoom
  useEffect(() => {
    const domElement = gl.domElement;

    const handlePointerDown = (e: PointerEvent) => {
      if (state !== 'FREE_EXPLORATION') return;
      isDragging.current = true;
      prevPointer.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current || state !== 'FREE_EXPLORATION') return;
      const deltaX = e.clientX - prevPointer.current.x;
      const deltaY = e.clientY - prevPointer.current.y;
      prevPointer.current = { x: e.clientX, y: e.clientY };

      const rotateSpeed = 0.004;
      targetSpherical.current.theta -= deltaX * rotateSpeed;
      targetSpherical.current.phi -= deltaY * rotateSpeed;
      // Clamp vertical elevation to prevent plunging below ground
      targetSpherical.current.phi = Math.max(0.12, Math.min(Math.PI / 2 - 0.05, targetSpherical.current.phi));
    };

    const handlePointerUp = () => {
      isDragging.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      if (state === 'DESTINATION_SELECT' && (currentDestination === 'moon' || currentDestination === 'mars')) {
        e.preventDefault();
        const { minZ, maxZ } = getOrbitalFraming();
        targetOrbitalZ.current = Math.max(
          minZ,
          Math.min(maxZ, targetOrbitalZ.current + e.deltaY * 0.004)
        );
        return;
      }

      if (state !== 'FREE_EXPLORATION') return;
      e.preventDefault();
      const zoomSpeed = 0.008;
      targetSpherical.current.radius += e.deltaY * zoomSpeed;
      targetSpherical.current.radius = Math.max(5, Math.min(40, targetSpherical.current.radius));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (state !== 'FREE_EXPLORATION') return;
      const panStep = 0.5;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        targetPanOffset.current.z -= panStep;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        targetPanOffset.current.z += panStep;
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        targetPanOffset.current.x -= panStep;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        targetPanOffset.current.x += panStep;
      }
    };

    domElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    domElement.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      domElement.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gl, state, currentDestination, size.width, size.height]);

  // Frame update
  useFrame((_, delta) => {
    if (state === 'ARRIVAL') {
      // Subtle cinematic drift
      camera.position.x = -4.5 + Math.sin(Date.now() * 0.00025) * 0.4;
      camera.position.y = 2.8 + Math.cos(Date.now() * 0.0002) * 0.12;
      camera.lookAt(-2.2, 1.8, 0);
      return;
    }

    if (state === 'DESTINATION_SELECT' && (currentDestination === 'moon' || currentDestination === 'mars')) {
      const damp = Math.min(1, delta * 7);
      if (!isOrbitalTweening.current) {
        orbitalZ.current += (targetOrbitalZ.current - orbitalZ.current) * damp;
      }
      camera.position.x += (orbitalOffsetX.current - camera.position.x) * damp;
      camera.position.y += (0.08 - camera.position.y) * damp;
      camera.position.z = orbitalZ.current;
    } else if (state === 'FREE_EXPLORATION') {
      const dampFactor = Math.min(1, delta * 7);
      spherical.current.theta += (targetSpherical.current.theta - spherical.current.theta) * dampFactor;
      spherical.current.phi += (targetSpherical.current.phi - spherical.current.phi) * dampFactor;
      spherical.current.radius += (targetSpherical.current.radius - spherical.current.radius) * dampFactor;

      panOffset.current.lerp(targetPanOffset.current, dampFactor);

      const dest = DESTINATIONS[currentDestination] || DESTINATIONS.moon;
      const center = new THREE.Vector3(...dest.initialCameraTarget).add(panOffset.current);

      const newPos = new THREE.Vector3().setFromSpherical(spherical.current).add(center);
      camera.position.copy(newPos);
      targetLookAt.current.copy(center);
    } else if (state === 'ARTIFACT_INSPECTION') {
      // Subtle micro-drift in three-quarter hero view
      if (selectedArtifactId) {
        const artifact = ARTIFACTS[selectedArtifactId];
        if (artifact) {
          const [ax, ay, az] = artifact.coordinates.worldPosition;
          const slowTime = Date.now() * 0.00012;
          const heroBase =
            artifact.destination === 'moon'
              ? new THREE.Vector3(ax + 3.2, ay + 2.5, az + 10.5)
              : new THREE.Vector3(ax + 3.2, ay + 1.2, az + 4.2);

          camera.position.x = heroBase.x + Math.sin(slowTime) * 0.25;
          camera.position.y = heroBase.y + Math.cos(slowTime * 1.4) * 0.06;
          camera.position.z = heroBase.z + Math.sin(slowTime * 0.8) * 0.15;
        }
      }
    }

    currentLookAt.current.lerp(targetLookAt.current, Math.min(1, delta * 6));
    camera.lookAt(currentLookAt.current);
  });

  return null;
};
