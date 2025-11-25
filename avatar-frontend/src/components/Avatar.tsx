// src/components/Avatar.tsx

import * as THREE from "three";
import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import type { ThreeElements } from "@react-three/fiber";
import { EXPRESSIONS, type ExpressionType } from './expressions';

type AvatarProps = ThreeElements["group"] & {
  expression: ExpressionType;
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

  const headRef = useRef<THREE.SkinnedMesh | null>(null);
  const teethRef = useRef<THREE.SkinnedMesh | null>(null);

  const targetMorphs = useRef<Record<string, number>>({});
  const currentViseme = useRef<string | null>(null);
  const visemeStrength = useRef<number>(0);
  const smoothing = 0.12;

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh) {
        if (child.name === "Wolf3D_Head") {
          headRef.current = child;
          if (!child.morphTargetInfluences) child.morphTargetInfluences = [];
          if (!child.morphTargetDictionary) child.updateMorphTargets?.();
        } else if (child.name === "Wolf3D_Teeth") {
          teethRef.current = child;
          if (!child.morphTargetInfluences) child.morphTargetInfluences = [];
          if (!child.morphTargetDictionary) child.updateMorphTargets?.();
        }
      }
    });

    if (headRef.current?.morphTargetDictionary) {
      console.log("Available morphs:", Object.keys(headRef.current.morphTargetDictionary));
      console.log("Visemes:", Object.keys(headRef.current.morphTargetDictionary).filter(k => 
        k.toLowerCase().includes('viseme') || k.toLowerCase().includes('mouth')
      ));
    }
  }, [clonedScene]);

  useEffect(() => {
    const head = headRef.current;
    if (!head?.morphTargetDictionary) return;

    const dict = head.morphTargetDictionary;

    Object.keys(dict).forEach((key) => {
      targetMorphs.current[key] = 0;
    });

    const expr = EXPRESSIONS[expression] || {};
    Object.entries(expr).forEach(([name, value]) => {
      if (dict[name] !== undefined) {
        targetMorphs.current[name] = value;
      }
    });
  }, [expression]);

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

    let charIndex = 0;
    const chars = text.toLowerCase().split('');
    
    const animationInterval = setInterval(() => {
      if (charIndex < chars.length) {
        const char = chars[charIndex];
        
        const visemeMap: Record<string, string> = {
          'a': 'viseme_aa',
          'e': 'viseme_E', 
          'i': 'viseme_I',
          'o': 'viseme_O',
          'u': 'viseme_U',
          'p': 'viseme_PP',
          'b': 'viseme_PP',
          'm': 'viseme_PP',
          'f': 'viseme_FF',
          'v': 'viseme_FF',
        };

        const viseme = visemeMap[char];
        if (viseme) {
          currentViseme.current = viseme;
          visemeStrength.current = 1.0;
        } else if (char !== ' ') {
          currentViseme.current = 'mouthOpen';
          visemeStrength.current = 0.3;
        }
        
        charIndex++;
      }
    }, 80);

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

    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);

    return () => {
      clearInterval(animationInterval);
      speechSynthesis.cancel();
    };
  }, [speak, text, onSpeakEnd]);

  useFrame(() => {
    const head = headRef.current;
    if (!head?.morphTargetInfluences || !head.morphTargetDictionary) return;

    const dict = head.morphTargetDictionary;
    const influences = head.morphTargetInfluences;
    const teeth = teethRef.current;

    Object.keys(dict).forEach((key) => {
      const idx = dict[key];
      if (idx === undefined) return;

      let target = targetMorphs.current[key] ?? 0;

      if (currentViseme.current && key === currentViseme.current && visemeStrength.current > 0) {
        target = Math.max(target, visemeStrength.current);
      }

      influences[idx] = THREE.MathUtils.lerp(
        influences[idx] || 0,
        target,
        key.toLowerCase().includes('viseme') ? 0.5 : smoothing
      );

      if (teeth?.morphTargetDictionary && teeth.morphTargetInfluences) {
        const teethDict = teeth.morphTargetDictionary;
        if (teethDict[key] !== undefined) {
          const teethIdx = teethDict[key];
          teeth.morphTargetInfluences[teethIdx] = influences[idx];
        }
      }
    });

    if (visemeStrength.current > 0) {
      visemeStrength.current *= 0.9;
      if (visemeStrength.current < 0.01) {
        visemeStrength.current = 0;
        currentViseme.current = null;
      }
    }
  });

  return (
    <group {...groupProps} dispose={null}>
      <primitive 
        object={clonedScene} 
        scale={1.6} 
        position={[0, -1.6, 0]} 
      />
    </group>
  );
}

useGLTF.preload("/models/avatar.glb");

export default Avatar;