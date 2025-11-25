export const RESPONSES = {
  hi: { response: "Hi there, nice to meet you!", expression: "happy" },
  hello: { response: "Hello! How can I help you today?", expression: "happy" },
  "how are you": { response: "I'm doing great, thanks for asking!", expression: "happy" },
  "how are you?": { response: "I'm not feeling good today... How about you?", expression: "sad" },
  bye: { response: "Goodbye! Take care!", expression: "neutral" },
  "see you": { response: "See you later!", expression: "happy" },
  angry: { response: "DON'T TALK TO ME RIGHT NOW!", expression: "angry" },
  furious: { response: "I AM EXTREMELY UPSET!", expression: "angry" },
  love: { response: "Aww, I love you too!", expression: "happy" },
  "i love you": { response: "That makes me so happy!", expression: "happy" },
  sorry: { response: "It's okay, don't worry about it.", expression: "neutral" },
  "i'm sorry": { response: "I forgive you... It's alright.", expression: "sad" },
  laugh: { response: "Hahaha! That's hilarious!", expression: "happy" },
  lol: { response: "LOL! You're too funny!", expression: "happy" },
  scared: { response: "Ahh! Don't scare me like that!", expression: "surprised" },
  surprise: { response: "Whoa! You surprised me!", expression: "surprised" },
  confused: { response: "Wait... what do you mean?", expression: "confused" },
  thinking: { response: "Hmm... let me think about that.", expression: "thinking" },
  yes: { response: "Yes! Absolutely!", expression: "happy" },
  no: { response: "No way!", expression: "angry" },
} as const;

export type ExpressionKey = keyof typeof RESPONSES extends infer K
  ? K extends string
    ? K
    : never
  : never;