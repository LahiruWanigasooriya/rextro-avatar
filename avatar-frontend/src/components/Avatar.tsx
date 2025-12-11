// src/components/Avatar.tsx

import * as THREE from "three";
import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import type { ThreeElements } from "@react-three/fiber";
import { EXPRESSIONS, type ExpressionType } from './expressions';

// --- Lip Sync Types & Mapping ---

export interface LipSyncPhoneme {
  phoneme: string;
  viseme: string;
  start: number;
  end: number;
}

export interface LipSyncData {
  text: string;
  phonemes: LipSyncPhoneme[];
}

// Map A-G visemes to Ready Player Me morph targets
const VISEME_MAP: Record<string, string> = {
  A: "viseme_aa", // mouth open wide
  B: "viseme_E",  // wide smile (using E/I shape)
  C: "viseme_I",  // small opening
  D: "viseme_O",  // rounded lips
  E: "viseme_FF", // teeth touching (F/V)
  F: "viseme_TH", // tongue touch (L/Th)
  G: "viseme_PP", // closed lips (M/B/P)
};

type AvatarProps = ThreeElements["group"] & {
  expression: ExpressionType;
  text?: string;
  speak?: boolean;
  onSpeakEnd?: () => void;
  audioStream?: MediaStream; // Optional audio stream for real-time lip sync
  lipSync?: LipSyncData | null; // Pre-generated lip sync data
  audioElement?: HTMLAudioElement | null; // Audio element for syncing
};

export function Avatar(props: AvatarProps) {
  const {
    expression,
    text = "",
    speak = false,
    onSpeakEnd,
    audioStream,
    lipSync,
    audioElement,
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
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

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

  // Real-time audio stream lip sync (for OpenAI Realtime API audio)
  useEffect(() => {
    if (!audioStream) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(audioStream);

    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let animationId: number;

    const analyze = () => {
      analyser.getByteFrequencyData(dataArray);

      // Calculate average volume
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      const normalizedVolume = average / 255;

      if (normalizedVolume > 0.02) {
        // Analyze frequency bands for better viseme selection
        const lowFreq = dataArray.slice(0, 10).reduce((sum, v) => sum + v, 0) / 10 / 255;
        const midFreq = dataArray.slice(10, 30).reduce((sum, v) => sum + v, 0) / 20 / 255;
        const highFreq = dataArray.slice(30, 60).reduce((sum, v) => sum + v, 0) / 30 / 255;

        // More sophisticated viseme selection based on formants
        if (highFreq > 0.3 && highFreq > midFreq * 1.2) {
          currentViseme.current = 'viseme_I'; // ee/i sounds
          visemeStrength.current = Math.min(normalizedVolume * 3, 1.0);
        } else if (lowFreq > 0.3 && lowFreq > midFreq * 1.2) {
          currentViseme.current = 'viseme_U'; // oo/u sounds
          visemeStrength.current = Math.min(normalizedVolume * 3, 1.0);
        } else if (midFreq > 0.25) {
          currentViseme.current = 'viseme_aa'; // ah/a sounds
          visemeStrength.current = Math.min(normalizedVolume * 3, 1.0);
        } else if (normalizedVolume > 0.15) {
          currentViseme.current = 'mouthOpen';
          visemeStrength.current = Math.min(normalizedVolume * 2.5, 0.8);
        } else {
          visemeStrength.current = Math.min(normalizedVolume * 2, 0.5);
        }
      } else {
        // Smooth closing
        visemeStrength.current *= 0.85;
        if (visemeStrength.current < 0.03) {
          currentViseme.current = null;
          visemeStrength.current = 0;
        }
      }

      animationId = requestAnimationFrame(analyze);
    };

    analyze();

    return () => {
      cancelAnimationFrame(animationId);
      source.disconnect();
      audioContext.close();
    };
  }, [audioStream]);

  // Text-to-speech lip sync (fallback when no audio stream)
  useEffect(() => {
    // Skip TTS if we have a real audio stream OR if we have lipSync data
    if (audioStream || lipSync || !speak || !text) {
      if (!audioStream && !lipSync && !speak) {
        currentViseme.current = null;
        visemeStrength.current = 0;
      }
      return;
    }

    // Initialize audio context and analyzer for lip sync
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      audioDataRef.current = new Uint8Array(bufferLength);
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "si-LK"; // Sinhala language
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0; // Keep fallback speech silent to avoid duplicate audible voices

    // Try to find a Sinhala voice, fallback to default
    const voices = speechSynthesis.getVoices();
    const sinhalaVoice = voices.find(voice => voice.lang.startsWith('si')) ||
      voices.find(voice => voice.lang.startsWith('en'));
    if (sinhalaVoice) {
      utterance.voice = sinhalaVoice;
    }

    let animationFrame: number;
    const analyzeAudio = () => {
      if (!analyserRef.current || !audioDataRef.current) return;

      analyserRef.current.getByteFrequencyData(audioDataRef.current);

      // Calculate average volume
      const average = audioDataRef.current.reduce((sum, value) => sum + value, 0) / audioDataRef.current.length;
      const normalizedVolume = average / 255;

      // Map volume to mouth opening
      if (normalizedVolume > 0.05) {
        // Determine viseme based on frequency distribution
        const lowFreq = audioDataRef.current.slice(0, 10).reduce((sum, v) => sum + v, 0) / 10;
        const midFreq = audioDataRef.current.slice(10, 30).reduce((sum, v) => sum + v, 0) / 20;
        const highFreq = audioDataRef.current.slice(30, 60).reduce((sum, v) => sum + v, 0) / 30;

        // Select viseme based on frequency content
        if (highFreq > midFreq && highFreq > lowFreq) {
          currentViseme.current = 'viseme_I'; // High frequencies = ee/i sounds
        } else if (lowFreq > midFreq) {
          currentViseme.current = 'viseme_O'; // Low frequencies = oh/oo sounds
        } else {
          currentViseme.current = 'viseme_aa'; // Mid frequencies = ah sounds
        }

        visemeStrength.current = Math.min(normalizedVolume * 2, 1.0);
      } else {
        visemeStrength.current *= 0.8;
        if (visemeStrength.current < 0.05) {
          currentViseme.current = null;
          visemeStrength.current = 0;
        }
      }

      animationFrame = requestAnimationFrame(analyzeAudio);
    };

    utterance.onstart = () => {
      animationFrame = requestAnimationFrame(analyzeAudio);
    };

    utterance.onend = () => {
      cancelAnimationFrame(animationFrame);
      currentViseme.current = null;
      visemeStrength.current = 0;
      onSpeakEnd?.();
    };

    utterance.onerror = () => {
      cancelAnimationFrame(animationFrame);
      currentViseme.current = null;
      visemeStrength.current = 0;
      onSpeakEnd?.();
    };

    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);

    return () => {
      cancelAnimationFrame(animationFrame);
      speechSynthesis.cancel();
    };
  }, [speak, text, onSpeakEnd, audioStream, lipSync]);

  useFrame(() => {
    const head = headRef.current;
    if (!head?.morphTargetInfluences || !head.morphTargetDictionary) return;

    const dict = head.morphTargetDictionary;
    const influences = head.morphTargetInfluences;
    const teeth = teethRef.current;

    // --- Lip Sync Logic (JSON + AudioElement) ---
    if (lipSync && audioElement && !audioElement.paused) {
      const currentTime = audioElement.currentTime;

      // Find the active phoneme
      const activePhoneme = lipSync.phonemes.find(
        (p) => currentTime >= p.start && currentTime <= p.end
      );

      if (activePhoneme) {
        const mappedViseme = VISEME_MAP[activePhoneme.viseme] || "viseme_aa";
        currentViseme.current = mappedViseme;

        // Fade in/out based on how close we are to the center of the phoneme duration?
        // Or just full strength. Let's try full strength with smoothing handling the transitions.
        visemeStrength.current = 1.0;
      } else {
        // No active phoneme (silence between words)
        visemeStrength.current = 0;
        currentViseme.current = null;
      }
    }

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

    if (!lipSync && visemeStrength.current > 0) {
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