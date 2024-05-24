const aliases = {
  "left": "ArrowLeft",
  "right": "ArrowRight",
  "up": "ArrowUp",
  "down": "ArrowDown",
  "bs": "Backspace",
  "menu": "ContextMenu",
  "apps": "ContextMenu",
  "del": "Delete",
  "return": "Enter",
  "cr": "Enter",
  "esc": "Escape",
  "pgup": "PageUp",
  "pgdn": "PageDown",
  "lt": "<",
  "less": "<",
  "lesser": "<",
  "gt": ">",
  "greater": ">",
};

const enUsTranslations = {
  "Backquote": ["`", "~"],
  "Digit1": ["1", "!"],
  "Digit2": ["2", "@"],
  "Digit3": ["3", "#"],
  "Digit4": ["4", "$"],
  "Digit5": ["5", "%"],
  "Digit6": ["6", "^"],
  "Digit7": ["7", "&"],
  "Digit8": ["8", "*"],
  "Digit9": ["9", "("],
  "Digit0": ["0", ")"],
  "Minus": ["-", "_"],
  "Equal": ["=", "+"],
  "Backslash": ["\\", "|"],
  "BracketLeft": ["[", "{"],
  "BracketRight": ["]", "}"],
  "Semicolon": [";", ":"],
  "Quote": ["'", '"'],
  "Comma": [",", "<"],
  "Period": [".", ">"],
  "Slash": ["/", "?"],
};

const modifierMap = {
  "a": "altKey",
  "c": "ctrlKey",
  "m": "metaKey",
  "s": "shiftKey",
} as const;

const specialCases = {
  "<": "lt",
  ">": "gt",
};

const ignored =
  /^($|Unidentified$|Dead$|Alt|Control|Hyper|Meta|Shift|Super|OS)/;

const has = <T extends object, K extends keyof T>(
  obj: T,
  key: string | number | symbol,
): key is K => Object.hasOwn(obj, key);

const alias = (key: string) => {
  const keyLower = key.toLowerCase();
  if (has(aliases, keyLower)) {
    return aliases[keyLower];
  }
  return key;
};

const codeToEnUsQwerty = (code: string, shift?: boolean) => {
  if (code.startsWith("Key")) {
    let key = code.slice(3);
    if (!shift) {
      key = key.toLowerCase();
    }
    return key;
  }

  if (has(enUsTranslations, code)) {
    return enUsTranslations[code][shift ? 1 : 0];
  }

  return code;
};

export interface InvalidKeyError {
  name: "InvalidKeyError";
  key: string;
  message: `Invalid key: ${string}`;
}
export interface UnknownModifierError {
  name: "UnknownModifierError";
  modifier: string;
  context: string;
  message: `${string}: Unknown modifier: ${string}`;
}
export interface DuplicateModifierError {
  name: "DuplicateModifierError";
  modifier: string;
  context: string;
  message: `${string}: Duplicate modifier: ${string}`;
}
export interface DisallowedModifierError {
  name: "DisallowedModifierError";
  modifier: string;
  context: string;
  message: `${string}: Unusable modifier with single-character keys: ${string}`;
}

/**
 * Represents a key with optional modifiers.
 */
export interface Key {
  key: string;
  code?: string;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
}

/**
 * Converts a Key event into a string representation.
 *
 * @param event - The Key event to stringify.
 * @returns The string representation of the Key event.
 */
export const stringify = (
  event: Key,
): string => {
  let shift = event.shiftKey;
  let key = event.key || "Unidentified";
  if (key === "Unidentified") {
    key = codeToEnUsQwerty(event.code || "", shift);
  } else {
    key = alias(key);
    if (key === " ") {
      key = "Space";
    }
  }

  if (ignored.test(key)) {
    return "";
  }

  if (key.length === 1) {
    shift = false;
  } else {
    key = key.toLowerCase();
  }

  let modifiers = "";
  if (event.altKey) modifiers += "a-";
  if (event.ctrlKey) modifiers += "c-";
  if (event.metaKey) modifiers += "m-";
  if (shift) modifiers += "s-";

  if (has(specialCases, key)) key = specialCases[key];

  return modifiers || key.length > 1 ? `<${modifiers}${key}>` : key;
};

export type Result<T, E> = { ok: true; value: T } | { ok: false; value: E };

/**
 * Parses a key string and returns a Result object containing the parsed key or an error.
 *
 * @param keyString - The key string to parse.
 * @returns A Result object containing the parsed key or an error.
 */
export const parse = (
  keyString: string,
): Result<
  Key,
  | InvalidKeyError
  | UnknownModifierError
  | DuplicateModifierError
  | DisallowedModifierError
> => {
  if (keyString.length === 1) {
    if (/\s/.test(keyString)) {
      return {
        ok: false,
        value: {
          name: "InvalidKeyError",
          key: keyString,
          message: `Invalid key: ${keyString}`,
        },
      };
    }
    return { ok: true, value: { key: keyString } };
  }

  const match = keyString.match(/^<((?:[a-z]-)*)([a-z\d]+|[^<>\s])>$/i);
  if (!match) {
    return {
      ok: false,
      value: {
        name: "InvalidKeyError",
        key: keyString,
        message: `Invalid key: ${keyString}`,
      },
    };
  }
  const [, modifiers, key] = match;

  const obj: Key = {
    key: alias(key),
  };

  for (const modifier of modifiers.split("-").slice(0, -1)) {
    const modifierLower = modifier.toLowerCase();
    if (!has(modifierMap, modifierLower)) {
      return {
        ok: false,
        value: {
          name: "UnknownModifierError",
          modifier,
          context: keyString,
          message: `${keyString}: Unknown modifier: ${modifier}`,
        },
      };
    }
    const modifierName = modifierMap[modifierLower];

    if (obj[modifierName] !== undefined) {
      return {
        ok: false,
        value: {
          name: "DuplicateModifierError",
          modifier,
          context: keyString,
          message: `${keyString}: Duplicate modifier: ${modifier}`,
        },
      };
    }

    obj[modifierName] = true;

    if (obj.key.length === 1 && obj.shiftKey) {
      return {
        ok: false,
        value: {
          name: "DisallowedModifierError",
          modifier,
          context: keyString,
          message:
            `${keyString}: Unusable modifier with single-character keys: ${modifier}`,
        },
      };
    }
  }

  return { ok: true, value: obj };
};

/**
 * Normalizes a key string by parsing and stringifying it.
 *
 * @param keyString - The key string to normalize.
 * @returns A Result object containing the normalized key string or an error.
 */
export const normalize = (keyString: string): Result<
  string,
  | InvalidKeyError
  | UnknownModifierError
  | DuplicateModifierError
  | DisallowedModifierError
> => {
  const result = parse(keyString);
  return result.ok ? { ok: true, value: stringify(result.value) } : result;
};

/**
 * Parses a key sequence and returns an array of strings.
 *
 * @param sequence The key sequence to parse.
 * @returns An array of strings representing the parsed key sequence.
 */
export const parseSequence = (keySequence: string): string[] | null =>
  keySequence.match(/<[^<>\s]+>|[\s\S]|^$/g);
