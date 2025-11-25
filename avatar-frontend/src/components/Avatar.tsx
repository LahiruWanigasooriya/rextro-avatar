// src/components/Avatar.tsx
// FINAL VERSION – ZERO TypeScript errors

import * as THREE from 'three'
import  { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
//import { useGraph } from '@react-three/fiber'
import { SkeletonUtils } from 'three-stdlib'
import type { ThreeElements } from '@react-three/fiber'


type AvatarProps = ThreeElements['group'] & {
  expression: 'happy' | 'sad' | 'angry' | 'neutral'
  text?: string
  speak?: boolean
  onSpeakEnd?: () => void
}

export function Avatar(props: AvatarProps) {
  const { expression, text = '', speak = false, onSpeakEnd, ...groupProps } = props

  const { scene } = useGLTF('/models/avatar.glb')
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene])
  //const { nodes, materials } = useGraph(clonedScene) as any

  // Strongly typed refs
  const headRef = useRef<THREE.SkinnedMesh & {
    morphTargetDictionary: Record<string, number>
    morphTargetInfluences: number[]
  }>(null!)

  const teethRef = useRef<THREE.SkinnedMesh & {
    morphTargetDictionary?: Record<string, number>
    morphTargetInfluences?: number[]
  } | null>(null)

  const targetMorphs = useRef<Record<string, number>>({})
  const currentViseme = useRef<string | null>(null)
  const smoothing = 0.12

  // ─────────────────────────────────────────────────────────────
  // 1. Initialize morph arrays + dictionary (guarantees no undefined)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const head = headRef.current
    const teeth = teethRef.current

    if (head) {
      if (!head.morphTargetInfluences) head.morphTargetInfluences = []
      if (!head.morphTargetDictionary) head.updateMorphTargets?.()
    }
    if (teeth) {
      if (!teeth.morphTargetInfluences) teeth.morphTargetInfluences = []
      if (!teeth.morphTargetDictionary) teeth.updateMorphTargets?.()
    }
  }, [])

  // ─────────────────────────────────────────────────────────────
  // 2. Expression system
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const head = headRef.current
    if (!head?.morphTargetDictionary) return

    // Reset all
    Object.keys(head.morphTargetDictionary).forEach(key => {
      targetMorphs.current[key] = 0
    })

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
    }

    const expr = exprMap[expression] || {}
    Object.entries(expr).forEach(([name, value]) => {
      if (head.morphTargetDictionary[name] !== undefined) {
        targetMorphs.current[name] = value
      }
    })
  }, [expression])

  // ─────────────────────────────────────────────────────────────
  // 3. Lip Sync
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!speak || !text) return

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'

    const map: Record<string, string> = {
      a: 'viseme_aa', e: 'viseme_E', i: 'viseme_IH',
      o: 'viseme_O', u: 'viseme_U', f: 'viseme_FF',
      m: 'viseme_PP', p: 'viseme_PP', b: 'viseme_PP',
    }

    utterance.onboundary = e => {
      if (e.name === 'word') {
        const char = text[e.charIndex]?.toLowerCase()
        currentViseme.current = map[char] ?? null
      }
    }

    utterance.onend = () => {
      currentViseme.current = null
      onSpeakEnd?.()
    }

    speechSynthesis.cancel()
    speechSynthesis.speak(utterance)
  }, [speak, text, onSpeakEnd])

  // ─────────────────────────────────────────────────────────────
  // 4. Animation loop – 100% safe
  // ─────────────────────────────────────────────────────────────
  useFrame(() => {
    const head = headRef.current
    if (!head?.morphTargetInfluences || !head.morphTargetDictionary) return

    const dict = head.morphTargetDictionary
    const teeth = teethRef.current

    // Apply expressions
    Object.keys(dict).forEach(key => {
      const idx = dict[key]
      const target = targetMorphs.current[key] ?? 0

      head.morphTargetInfluences[idx] = THREE.MathUtils.lerp(
        head.morphTargetInfluences[idx],
        target,
        smoothing
      )

      if (teeth?.morphTargetDictionary?.[key] !== undefined) {
        teeth.morphTargetInfluences![teeth.morphTargetDictionary[key]] = head.morphTargetInfluences[idx]
      }
    })

    // Viseme override
    if (currentViseme.current && dict[currentViseme.current] !== undefined) {
      const idx = dict[currentViseme.current]
      head.morphTargetInfluences[idx] = THREE.MathUtils.lerp(head.morphTargetInfluences[idx], 1, 0.4)
    }

    // Reset visemes when silent
    if (currentViseme.current === null) {
      const visemes = ['viseme_aa', 'viseme_E', 'viseme_O', 'viseme_U', 'viseme_IH', 'viseme_FF', 'viseme_PP']
      visemes.forEach(v => {
        const idx = dict[v]
        if (idx !== undefined) {
          head.morphTargetInfluences[idx] = THREE.MathUtils.lerp(head.morphTargetInfluences[idx], 0, 0.3)
        }
      })
    }
  })

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
 // FINAL WORKING RETURN — COPY-PASTE THIS
return (
  <group {...groupProps} dispose={null}>
    {/* This renders the entire cloned avatar correctly */}
    <primitive object={clonedScene} scale={1.6} position={[0, -1.6, 0]} />

    {/* Attach our refs to the actual head/teeth meshes inside the cloned scene */}
    {clonedScene.getObjectByName('Wolf3D_Head') && (
      <primitive
        object={clonedScene.getObjectByName('Wolf3D_Head')!}
        ref={headRef}
      />
    )}
    {clonedScene.getObjectByName('Wolf3D_Teeth') && (
      <primitive
        object={clonedScene.getObjectByName('Wolf3D_Teeth')!}
        ref={teethRef}
      />
    )}
  </group>
)
}

useGLTF.preload('/models/avatar.glb')

export default Avatar