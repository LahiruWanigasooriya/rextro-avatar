// src/components/Avatar.tsx
// FIXED VERSION – Working Lip Sync

import * as THREE from "three";
import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import type { ThreeElements } from "@react-three/fiber";

type AvatarProps = ThreeElements["group"] & {
  expression: "happy" | "sad" | "angry" | "neutral";
  text?: string;
  speak?: boolean;
  onSpeakEnd?: () => void;
};

export function Avatar(props: AvatarProps) {
  const {
    expression,
    text = "",
    speak = false,
    onSpeakEnd,
    ...groupProps
  } = props;

  const { scene } = useGLTF("/models/avatar.glb");
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  // Strongly typed refs
  const headRef = useRef<THREE.SkinnedMesh | null>(null);
  const teethRef = useRef<THREE.SkinnedMesh | null>(null);

  const targetMorphs = useRef<Record<string, number>>({});
  const currentViseme = useRef<string | null>(null);
  const visemeStrength = useRef<number>(0);
  const smoothing = 0.12;

  // ─────────────────────────────────────────────────────────────
  // 1. Find and attach refs to meshes in the cloned scene
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh) {
        if (child.name === "Wolf3D_Head") {
          headRef.current = child;
          // Initialize morph targets
          if (!child.morphTargetInfluences) child.morphTargetInfluences = [];
          if (!child.morphTargetDictionary) child.updateMorphTargets?.();
        } else if (child.name === "Wolf3D_Teeth") {
          teethRef.current = child;
          if (!child.morphTargetInfluences) child.morphTargetInfluences = [];
          if (!child.morphTargetDictionary) child.updateMorphTargets?.();
        }
      }
    });

    // Debug: Log available morphs
    if (headRef.current?.morphTargetDictionary) {
      console.log(
        "Available morphs:",
        Object.keys(headRef.current.morphTargetDictionary)
      );
      console.log(
        "Visemes:",
        Object.keys(headRef.current.morphTargetDictionary).filter(
          (k) =>
            k.toLowerCase().includes("viseme") ||
            k.toLowerCase().includes("mouth")
        )
      );
    }
  }, [clonedScene]);

  // ─────────────────────────────────────────────────────────────
  // 2. Expression system
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const head = headRef.current;
    if (!head?.morphTargetDictionary) return;

    const dict = head.morphTargetDictionary;

    // Reset all
    Object.keys(dict).forEach((key) => {
      targetMorphs.current[key] = 0;
    });

    const exprMap: Record<string, Record<string, number>> = {
      happy: {
        mouthSmile_Left: 0.9,
        mouthSmile_Right: 0.9,
        eyeSquintLeft: 0.7,
        eyeSquintRight: 0.7,
      },
      sad: {
        mouthFrown_Left: 0.9,
        mouthFrown_Right: 0.9,
        browInnerUp: 0.8,
      },
      angry: {
        browDown_Left: 1,
        browDown_Right: 1,
        mouthPress_Left: 0.9,
        mouthPress_Right: 0.9,
      },
      neutral: {},
    };

    const expr = exprMap[expression] || {};
    Object.entries(expr).forEach(([name, value]) => {
      if (dict[name] !== undefined) {
        targetMorphs.current[name] = value;
      }
    });
  }, [expression]);

  // ─────────────────────────────────────────────────────────────
  // 3. FIXED Lip Sync with better timing
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!speak || !text) {
      currentViseme.current = null;
      visemeStrength.current = 0;
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Character-by-character analysis for better lip sync
    let charIndex = 0;
    const chars = text.toLowerCase().split("");

    // Animate mouth while speaking
    const animationInterval = setInterval(() => {
      if (charIndex < chars.length) {
        const char = chars[charIndex];

        // Map characters to visemes
        const visemeMap: Record<string, string> = {
          a: "viseme_aa",
          e: "viseme_E",
          i: "viseme_I",
          o: "viseme_O",
          u: "viseme_U",
          p: "viseme_PP",
          b: "viseme_PP",
          m: "viseme_PP",
          f: "viseme_FF",
          v: "viseme_FF",
        };

        const viseme = visemeMap[char];
        if (viseme) {
          currentViseme.current = viseme;
          visemeStrength.current = 1.0;
        } else if (char !== " ") {
          // Generic mouth movement for other characters
          currentViseme.current = "mouthOpen";
          visemeStrength.current = 0.3;
        }

        charIndex++;
      }
    }, 80); // Adjust timing as needed

    utterance.onend = () => {
      clearInterval(animationInterval);
      currentViseme.current = null;
      visemeStrength.current = 0;
      onSpeakEnd?.();
    };

    utterance.onerror = () => {
      clearInterval(animationInterval);
      currentViseme.current = null;
      visemeStrength.current = 0;
      onSpeakEnd?.();
    };

    // Cancel previous speech
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);

    return () => {
      clearInterval(animationInterval);
      speechSynthesis.cancel();
    };
  }, [speak, text, onSpeakEnd]);

  // ─────────────────────────────────────────────────────────────
  // 4. Animation loop – Apply morphs
  // ─────────────────────────────────────────────────────────────
  useFrame(() => {
    const head = headRef.current;
    if (!head?.morphTargetInfluences || !head.morphTargetDictionary) return;

    const dict = head.morphTargetDictionary;
    const influences = head.morphTargetInfluences;
    const teeth = teethRef.current;

    // Apply base expressions
    Object.keys(dict).forEach((key) => {
      const idx = dict[key];
      if (idx === undefined) return;

      const target = targetMorphs.current[key] ?? 0;
      influences[idx] = THREE.MathUtils.lerp(
        influences[idx] || 0,
        target,
        smoothing
      );

      // Sync teeth
      if (teeth?.morphTargetDictionary && teeth.morphTargetInfluences) {
        const teethDict = teeth.morphTargetDictionary;
        if (teethDict[key] !== undefined) {
          const teethIdx = teethDict[key];
          teeth.morphTargetInfluences[teethIdx] = influences[idx];
        }
      }
    });

    // Apply active viseme (OVERRIDE for lip sync)
    if (currentViseme.current && visemeStrength.current > 0) {
      const visemeName = currentViseme.current;
      const idx = dict[visemeName];

      if (idx !== undefined) {
        const targetValue = visemeStrength.current;
        influences[idx] = THREE.MathUtils.lerp(
          influences[idx] || 0,
          targetValue,
          0.5 // Fast response for lip sync
        );

        // Sync teeth
        if (teeth?.morphTargetDictionary && teeth.morphTargetInfluences) {
          const teethDict = teeth.morphTargetDictionary;
          if (teethDict[visemeName] !== undefined) {
            const teethIdx = teethDict[visemeName];
            teeth.morphTargetInfluences[teethIdx] = influences[idx];
          }
        }
      }

      // Decay strength
      visemeStrength.current *= 0.9;
    } else {
      // Smoothly close mouth when not speaking
      const mouthMorphs = Object.keys(dict).filter(
        (k) => k.toLowerCase().includes("viseme") || k === "mouthOpen"
      );

      mouthMorphs.forEach((morphName) => {
        const idx = dict[morphName];
        if (idx !== undefined) {
          influences[idx] = THREE.MathUtils.lerp(influences[idx] || 0, 0, 0.3);
        }
      });
    }
  });

  useEffect(() => {
    setTimeout(() => {
      const head = headRef.current;
      if (head?.morphTargetDictionary) {
        const visemes = Object.keys(head.morphTargetDictionary).filter((k) =>
          k.includes("viseme")
        );
        console.log("Your avatar has these visemes →", visemes);
        if (visemes.length === 0) {
          console.error(
            'NO VISEMES! You downloaded the wrong avatar. Re-download with "Oculus Visemes" checked!'
          );
        }
      }
    }, 3000);
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Render - Simple approach
  // ─────────────────────────────────────────────────────────────
  return (
    <group {...groupProps} dispose={null}>
      <primitive object={clonedScene} scale={1.6} position={[0, -1.6, 0]} />
    </group>
  );
}

useGLTF.preload("/models/avatar.glb");

export default Avatar;
