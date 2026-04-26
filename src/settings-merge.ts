/**
 * settings.json 부분 머지 — `.claude/settings.json` PreToolUse hook entry 추가.
 *
 * SPEC: docs/specs/karpathy-hook-autowire.md AC2/AC4 — opt-in 시 idempotent 등록.
 *
 * 사용처: karpathy-coder hook auto-wire (v0.6.0). 기존 매처 entry 보존 + 동일 command 중복 X.
 */

export interface ClaudeHookCommand {
  type: "command";
  command: string;
  async?: boolean;
  timeout?: number;
}

export interface ClaudeHookMatcher {
  matcher?: string;
  hooks: ClaudeHookCommand[];
}

export interface ClaudeSettings {
  // 기타 키 (statusLine, _comment 등) 보존 — 알 필요 없음
  [key: string]: unknown;
  hooks?: {
    [event: string]: ClaudeHookMatcher[];
  };
}

/**
 * PreToolUse 배열에 hook entry 추가 (idempotent). 기존 settings 객체는 mutation 안 함 (deep clone).
 *
 * 동작:
 *   - hooks.PreToolUse 없음 → 생성
 *   - matcher 일치하는 entry 없음 → 새 entry 추가
 *   - matcher 일치 + command 동일한 hook 있음 → idempotent (변경 없음)
 *   - matcher 일치 + command 다름 → hooks 배열에 append
 */
export function addPreToolUseHook(
  settings: ClaudeSettings,
  matcher: string,
  command: string,
): ClaudeSettings {
  const next: ClaudeSettings = JSON.parse(JSON.stringify(settings));
  if (!next.hooks) {
    next.hooks = {};
  }
  if (!next.hooks.PreToolUse) {
    next.hooks.PreToolUse = [];
  }
  const preToolUse = next.hooks.PreToolUse;
  const existing = preToolUse.find((m) => m.matcher === matcher);
  const newHook: ClaudeHookCommand = { type: "command", command };
  if (existing) {
    if (existing.hooks.some((h) => h.command === command)) {
      return next; // idempotent — 동일 command 중복 X
    }
    existing.hooks.push(newHook);
  } else {
    preToolUse.push({ matcher, hooks: [newHook] });
  }
  return next;
}
