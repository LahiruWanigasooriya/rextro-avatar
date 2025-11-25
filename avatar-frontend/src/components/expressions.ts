// src/components/expressions.ts

export const EXPRESSION_TYPES = [
  "neutral",
  "happy",
  "sad",
  "angry",
  "surprised",
  "fearful",
  "disgusted",
  "thinking",
  "excited",
  "confused",
  "tired",
  "flirty"
] as const;

export type ExpressionType = typeof EXPRESSION_TYPES[number];

export interface ExpressionMorphTargets {
  [morphName: string]: number;
}

export const EXPRESSIONS: Record<ExpressionType, ExpressionMorphTargets> = {
  neutral: {},

  happy: {
    mouthSmile_Left: 0.9,
    mouthSmile_Right: 0.9,
    eyeSquintLeft: 0.7,
    eyeSquintRight: 0.7,
    cheekSquint_Left: 0.5,
    cheekSquint_Right: 0.5,
  },

  sad: {
    mouthFrown_Left: 0.9,
    mouthFrown_Right: 0.9,
    browInnerUp: 0.8,
    eyeSquintLeft: 0.4,
    eyeSquintRight: 0.4,
    mouthLowerDown_Left: 0.5,
    mouthLowerDown_Right: 0.5,
  },

  angry: {
    browDown_Left: 1.0,
    browDown_Right: 1.0,
    mouthPress_Left: 0.9,
    mouthPress_Right: 0.9,
    eyeSquintLeft: 0.6,
    eyeSquintRight: 0.6,
    noseSneer_Left: 0.5,
    noseSneer_Right: 0.5,
  },

  surprised: {
    eyeWide_Left: 1.0,
    eyeWide_Right: 1.0,
    browInnerUp: 1.0,
    browOuterUp_Left: 0.9,
    browOuterUp_Right: 0.9,
    mouthOpen: 0.7,
    jawOpen: 0.5,
  },

  fearful: {
    eyeWide_Left: 1.0,
    eyeWide_Right: 1.0,
    browInnerUp: 1.0,
    browOuterUp_Left: 0.8,
    browOuterUp_Right: 0.8,
    mouthOpen: 0.4,
    jawForward: 0.3,
  },

  disgusted: {
    noseSneer_Left: 1.0,
    noseSneer_Right: 1.0,
    mouthUpperUp_Left: 0.8,
    mouthUpperUp_Right: 0.8,
    browDown_Left: 0.6,
    browDown_Right: 0.6,
    eyeSquintLeft: 0.5,
    eyeSquintRight: 0.5,
  },

  thinking: {
    browDown_Left: 0.3,
    browInnerUp: 0.4,
    eyeSquintLeft: 0.3,
    mouthLeft: 0.5,
    mouthPucker: 0.3,
  },

  excited: {
    eyeWide_Left: 0.8,
    eyeWide_Right: 0.8,
    mouthSmile_Left: 1.0,
    mouthSmile_Right: 1.0,
    mouthOpen: 0.5,
    browOuterUp_Left: 0.7,
    browOuterUp_Right: 0.7,
  },

  confused: {
    browDown_Left: 0.4,
    browOuterUp_Right: 0.8,
    browInnerUp: 0.5,
    mouthLeft: 0.4,
    mouthFrown_Left: 0.3,
    mouthFrown_Right: 0.3,
  },

  tired: {
    eyeSquintLeft: 0.8,
    eyeSquintRight: 0.8,
    eyeBlink_Left: 0.4,
    eyeBlink_Right: 0.4,
    mouthFrown_Left: 0.4,
    mouthFrown_Right: 0.4,
    browDown_Left: 0.3,
    browDown_Right: 0.3,
  },

  flirty: {
    mouthSmile_Right: 0.8,
    eyeSquintLeft: 0.6,
    eyeWide_Right: 0.5,
    browOuterUp_Left: 0.4,
    mouthDimple_Right: 0.5,
    mouthPucker: 0.3,
  },
};

export const EXPRESSION_OUTPUTS = {
  neutral: {
    emotion: "neutral",
    valence: 0.0,
    arousal: 0.0,
    confidence: 1.0,
    description: "Calm and expressionless face",
  },

  happy: {
    emotion: "happy",
    valence: 0.9,
    arousal: 0.6,
    confidence: 0.95,
    description: "Joyful expression with smile and squinted eyes",
  },

  sad: {
    emotion: "sad",
    valence: -0.8,
    arousal: -0.3,
    confidence: 0.9,
    description: "Sorrowful face with frown and raised inner brows",
  },

  angry: {
    emotion: "angry",
    valence: -0.7,
    arousal: 0.8,
    confidence: 0.92,
    description: "Aggressive expression with furrowed brows and pressed lips",
  },

  surprised: {
    emotion: "surprised",
    valence: 0.3,
    arousal: 0.9,
    confidence: 0.88,
    description: "Shocked look with wide eyes and raised eyebrows",
  },

  fearful: {
    emotion: "fearful",
    valence: -0.6,
    arousal: 0.9,
    confidence: 0.85,
    description: "Frightened expression with wide eyes and tense face",
  },

  disgusted: {
    emotion: "disgusted",
    valence: -0.8,
    arousal: 0.4,
    confidence: 0.87,
    description: "Repulsed look with wrinkled nose and raised upper lip",
  },

  thinking: {
    emotion: "thinking",
    valence: 0.1,
    arousal: 0.2,
    confidence: 0.75,
    description: "Contemplative expression with slightly furrowed brow",
  },

  excited: {
    emotion: "excited",
    valence: 0.95,
    arousal: 0.95,
    confidence: 0.93,
    description: "Enthusiastic face with wide eyes and big smile",
  },

  confused: {
    emotion: "confused",
    valence: -0.2,
    arousal: 0.4,
    confidence: 0.8,
    description: "Puzzled look with asymmetric brows and tilted mouth",
  },

  tired: {
    emotion: "tired",
    valence: -0.4,
    arousal: -0.7,
    confidence: 0.82,
    description: "Fatigued expression with droopy eyes and slight frown",
  },

  flirty: {
    emotion: "flirty",
    valence: 0.7,
    arousal: 0.5,
    confidence: 0.78,
    description: "Playful look with asymmetric smile and one squinted eye",
  },
};

export interface ExpressionInput {
  type: ExpressionType;
  intensity?: number;
  duration?: number;
  text?: string;
  speak?: boolean;
}

export interface ExpressionOutput {
  emotion: string;
  valence: number;
  arousal: number;
  confidence: number;
  description: string;
}

export const getExpressionOutput = (type: ExpressionType): ExpressionOutput => {
  return EXPRESSION_OUTPUTS[type];
};

export const getExpressionMorphs = (type: ExpressionType): ExpressionMorphTargets => {
  return EXPRESSIONS[type];
};

export const getAllExpressionTypes = (): readonly ExpressionType[] => {
  return EXPRESSION_TYPES;
};