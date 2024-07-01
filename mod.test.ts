import { assertEquals, assertStrictEquals } from "./deps_test.ts";
import { normalize, parse, parseSequence, stringify } from "./mod.ts";

Deno.test("stringify()", async (t) => {
  await t.step("simple", async (t) => {
    await t.step("letter", () => {
      assertStrictEquals(
        stringify({ key: "a" }),
        "a",
      );
      assertStrictEquals(
        stringify({ key: "a", shiftKey: true }),
        "a",
      );
    });

    await t.step("capital letter", () => {
      assertStrictEquals(
        stringify({ key: "A" }),
        "A",
      );
      assertStrictEquals(
        stringify({ key: "A", shiftKey: true }),
        "A",
      );
    });

    await t.step("symbol", () => {
      assertStrictEquals(
        stringify({ key: "/" }),
        "/",
      );
      assertStrictEquals(
        stringify({ key: "/", shiftKey: true }),
        "/",
      );
    });

    await t.step("number", () => {
      assertStrictEquals(
        stringify({ key: "1" }),
        "1",
      );
      assertStrictEquals(
        stringify({ key: "1", shiftKey: true }),
        "1",
      );
    });

    await t.step("special key", () => {
      assertStrictEquals(
        stringify({ key: "Enter" }),
        "<enter>",
      );
      assertStrictEquals(
        stringify({ key: "Enter", shiftKey: true }),
        "<s-enter>",
      );
    });

    await t.step("aliases", () => {
      assertStrictEquals(
        stringify({ key: "left" }),
        "<arrowleft>",
      );
      assertStrictEquals(
        stringify({ key: "cr", shiftKey: true }),
        "<s-enter>",
      );
      assertStrictEquals(
        stringify({ key: "esc" }),
        "<escape>",
      );
    });
  });

  await t.step("fall back to event.code", () => {
    assertStrictEquals(
      stringify({
        key: "Unidentified",
        code: "Tab",
        shiftKey: true,
      }),
      "<s-tab>",
    );
  });

  await t.step("modifiers", async (t) => {
    await t.step("letter", () => {
      assertStrictEquals(
        stringify({ key: "a", ctrlKey: true }),
        "<c-a>",
      );
      assertStrictEquals(
        stringify({ key: "a", shiftKey: true, ctrlKey: true }),
        "<c-a>",
      );
    });

    await t.step("capital letter", () => {
      assertStrictEquals(
        stringify({ key: "A", ctrlKey: true }),
        "<c-A>",
      );
      assertStrictEquals(
        stringify({ key: "A", shiftKey: true, ctrlKey: true }),
        "<c-A>",
      );
    });

    await t.step("symbol", () => {
      assertStrictEquals(
        stringify({ key: "/", ctrlKey: true }),
        "<c-/>",
      );
      assertStrictEquals(
        stringify({ key: "/", shiftKey: true, ctrlKey: true }),
        "<c-/>",
      );
      assertStrictEquals(
        stringify({ key: "-", ctrlKey: true }),
        "<c-->",
      );
    });

    await t.step("number", () => {
      assertStrictEquals(
        stringify({ key: "1", ctrlKey: true }),
        "<c-1>",
      );
      assertStrictEquals(
        stringify({ key: "1", shiftKey: true, ctrlKey: true }),
        "<c-1>",
      );
    });

    await t.step("special key", () => {
      assertStrictEquals(
        stringify({ key: "Enter", ctrlKey: true }),
        "<c-enter>",
      );
      assertStrictEquals(
        stringify({ key: "Enter", shiftKey: true, ctrlKey: true }),
        "<c-s-enter>",
      );
    });

    await t.step("multiple modifiers in alphabetical order", () => {
      assertStrictEquals(
        stringify({
          key: "a",
          shiftKey: true,
          ctrlKey: true,
          metaKey: true,
          altKey: true,
        }),
        "<a-c-m-a>",
      );
      assertStrictEquals(
        stringify({
          key: "Enter",
          shiftKey: true,
          ctrlKey: true,
          metaKey: true,
          altKey: true,
        }),
        "<a-c-m-s-enter>",
      );
    });
  });

  await t.step("special cases", async (t) => {
    await t.step("space", () => {
      assertStrictEquals(
        stringify({ key: " " }),
        "<space>",
      );
      assertStrictEquals(
        stringify({ key: " ", shiftKey: true }),
        "<s-space>",
      );
      assertStrictEquals(
        stringify({ key: " ", shiftKey: true, ctrlKey: true }),
        "<c-s-space>",
      );
    });

    await t.step("< and >", () => {
      assertStrictEquals(
        stringify({ key: "<" }),
        "<lt>",
      );
      assertStrictEquals(
        stringify({ key: "<", shiftKey: true }),
        "<lt>",
      );
      assertStrictEquals(
        stringify({ key: "<", shiftKey: true, ctrlKey: true }),
        "<c-lt>",
      );
      assertStrictEquals(
        stringify({ key: ">" }),
        "<gt>",
      );
      assertStrictEquals(
        stringify({ key: ">", shiftKey: true }),
        "<gt>",
      );
      assertStrictEquals(
        stringify({ key: ">", shiftKey: true, ctrlKey: true }),
        "<c-gt>",
      );
    });

    await t.step("Array#join safety", () => {
      assertStrictEquals(
        `${stringify({ key: "<" })}${stringify({ key: "a" })}${
          stringify({ key: ">" })
        }`,
        "<lt>a<gt>",
      );
    });
  });

  await t.step("invalid keys", async (t) => {
    await t.step("unrecognized keys", () => {
      assertStrictEquals(stringify({ key: "Unidentified" }), "");
      assertStrictEquals(stringify({ key: "Process" }), "");
      assertStrictEquals(stringify({ key: "Dead" }), "");
    });

    await t.step("modifiers", () => {
      const modifiers = [
        "Alt",
        "Control",
        "Meta",
        "Shift",
        "OS",
        "Hyper",
        "Super",
        "OSLeft",
        "ControlRight",
      ];
      for (const modifier of modifiers) {
        assertStrictEquals(stringify({ key: modifier }), "");
      }
    });
  });
});

Deno.test("normalize()", async (t) => {
  await t.step("single characters", () => {
    assertStrictEquals(normalize("a").value, "a");
    assertStrictEquals(normalize("A").value, "A");
    assertStrictEquals(normalize("/").value, "/");
    assertStrictEquals(normalize("1").value, "1");
  });

  await t.step("keys", () => {
    assertStrictEquals(normalize("<a>").value, "a");
    assertStrictEquals(normalize("<A>").value, "A");
    assertStrictEquals(normalize("</>").value, "/");
    assertStrictEquals(normalize("<1>").value, "1");

    assertStrictEquals(normalize("<c-a>").value, "<c-a>");
    assertStrictEquals(normalize("<c-A>").value, "<c-A>");
    assertStrictEquals(normalize("<c-/>").value, "<c-/>");
    assertStrictEquals(normalize("<c-1>").value, "<c-1>");

    assertStrictEquals(normalize("<Escape>").value, "<escape>");
    assertStrictEquals(normalize("<C-ESC>").value, "<c-escape>");
    assertStrictEquals(normalize("<F12>").value, "<f12>");
  });

  await t.step("< and >", () => {
    assertStrictEquals(normalize("<").value, "<lt>");
    assertStrictEquals(normalize(">").value, "<gt>");
  });

  await t.step("the empty string", () => {
    assertEquals(normalize("").value, {
      name: "InvalidKeyError",
      key: "",
      message: "Invalid key: ",
    });
  });

  await t.step("errors", () => {
    assertEquals(normalize("ab").value, {
      name: "InvalidKeyError",
      key: "ab",
      message: "Invalid key: ab",
    });
    assertEquals(normalize("<S-gt>").value, {
      name: "DisallowedModifierError",
      modifier: "S",
      context: "<S-gt>",
      message: "<S-gt>: Unusable modifier with single-character keys: S",
    });
  });
});

Deno.test("parseSequence()", async (t) => {
  await t.step("single characters", () => {
    assertEquals(parseSequence("a"), ["a"]);
    assertEquals(parseSequence("<"), ["<"]);
    assertEquals(parseSequence(">"), [">"]);
    assertEquals(parseSequence("/"), ["/"]);
    assertEquals(parseSequence("1"), ["1"]);
    assertEquals(parseSequence(" "), [" "]);
    assertEquals(parseSequence("\t"), ["\t"]);
    assertEquals(parseSequence("\n"), ["\n"]);
  });

  await t.step("sequence of characters", () => {
    assertEquals(parseSequence("a<>/1 \t\n"), [
      "a",
      "<",
      ">",
      "/",
      "1",
      " ",
      "\t",
      "\n",
    ]);
    assertEquals(parseSequence(">>"), [">", ">"]);
    assertEquals(parseSequence("<2j"), ["<", "2", "j"]);
  });

  await t.step("single keys", () => {
    assertEquals(parseSequence("<a>"), ["<a>"]);
    assertEquals(parseSequence("<A>"), ["<A>"]);
    assertEquals(parseSequence("</>"), ["</>"]);
    assertEquals(parseSequence("<1>"), ["<1>"]);
    assertEquals(parseSequence("<Escape>"), ["<Escape>"]);
    assertEquals(parseSequence("<escApe>"), ["<escApe>"]);

    assertEquals(parseSequence("<c-a>"), ["<c-a>"]);
    assertEquals(parseSequence("<c-A>"), ["<c-A>"]);
    assertEquals(parseSequence("<c-/>"), ["<c-/>"]);
    assertEquals(parseSequence("<c-1>"), ["<c-1>"]);
    assertEquals(parseSequence("<c-Escape>"), ["<c-Escape>"]);
    assertEquals(parseSequence("<c-a-m-Escape>"), ["<c-a-m-Escape>"]);
    assertEquals(parseSequence("<s-K1>"), ["<s-K1>"]);
  });

  await t.step("invalid single keys", () => {
    assertEquals(parseSequence("<-a>"), ["<-a>"]);
    assertEquals(parseSequence("<x-esc>"), ["<x-esc>"]);
    assertEquals(parseSequence("<shift-esc>"), ["<shift-esc>"]);
    assertEquals(parseSequence("<s-++>"), ["<s-++>"]);
  });

  await t.step("mix", () => {
    assertEquals(parseSequence("a<a><c-a><esc><c-esc>b<Del>"), [
      "a",
      "<a>",
      "<c-a>",
      "<esc>",
      "<c-esc>",
      "b",
      "<Del>",
    ]);

    assertEquals(parseSequence("<c-<>"), ["<", "c", "-", "<", ">"]);
    assertEquals(parseSequence("<c->>"), ["<c->", ">"]);
    assertEquals(parseSequence("<c- >"), ["<", "c", "-", " ", ">"]);
  });

  await t.step("empty string", () => {
    assertEquals(parseSequence(""), [""]);
  });
});

Deno.test("parse()", async (t) => {
  await t.step("single characters", () => {
    assertEquals(parse("a").value, { key: "a" });
    assertEquals(parse("A").value, { key: "A" });
    assertEquals(parse("/").value, { key: "/" });
    assertEquals(parse("<").value, { key: "<" });
    assertEquals(parse(">").value, { key: ">" });
    assertEquals(parse("1").value, { key: "1" });
  });

  await t.step("keys", async (t) => {
    await t.step("dash", () => {
      assertEquals(parse("<->").value, { key: "-" });
      assertEquals(parse("<a-->").value, { key: "-", altKey: true });
    });

    await t.step("< and >", () => {
      assertEquals(parse("<gt>").value, { key: ">" });
      assertEquals(parse("<less>").value, { key: "<" });
      assertEquals(parse("<c-lesser>").value, { key: "<", ctrlKey: true });
    });

    await t.step("case preservation", () => {
      assertEquals(parse("<escape>").value, { key: "escape" });
      assertEquals(parse("<Escape>").value, { key: "Escape" });
      assertEquals(parse("<escApe>").value, { key: "escApe" });
      assertEquals(parse("<f1>").value, { key: "f1" });
      assertEquals(parse("<F1>").value, { key: "F1" });
      assertEquals(parse("<A>").value, { key: "A" });
    });

    await t.step("modifiers", () => {
      assertEquals(parse("<c-s-a-m-escape>").value, {
        key: "escape",
        altKey: true,
        ctrlKey: true,
        metaKey: true,
        shiftKey: true,
      });

      assertEquals(parse("<c-1>").value, { key: "1", ctrlKey: true });
    });

    await t.step("aliases", () => {
      assertEquals(parse("<left>").value, { key: "ArrowLeft" });
      assertEquals(parse("<c-cr>").value, { key: "Enter", ctrlKey: true });
    });
  });

  await t.step("the empty string", () => {
    assertEquals(parse("").value, {
      name: "InvalidKeyError",
      key: "",
      message: "Invalid key: ",
    });
  });

  await t.step("errors", async (t) => {
    await t.step("single characters", () => {
      assertEquals(parse(" ").value, {
        name: "InvalidKeyError",
        key: " ",
        message: "Invalid key:  ",
      });
      assertEquals(parse("\t").value, {
        name: "InvalidKeyError",
        key: "\t",
        message: "Invalid key: \t",
      });
      assertEquals(parse("\n").value, {
        name: "InvalidKeyError",
        key: "\n",
        message: "Invalid key: \n",
      });
    });

    await t.step("keys", () => {
      assertEquals(parse("<>").value, {
        name: "InvalidKeyError",
        key: "<>",
        message: "Invalid key: <>",
      });
      assertEquals(parse("<ctrl-a>").value, {
        name: "InvalidKeyError",
        key: "<ctrl-a>",
        message: "Invalid key: <ctrl-a>",
      });
      assertEquals(parse("ab").value, {
        name: "InvalidKeyError",
        key: "ab",
        message: "Invalid key: ab",
      });
      assertEquals(parse("<a").value, {
        name: "InvalidKeyError",
        key: "<a",
        message: "Invalid key: <a",
      });
      assertEquals(parse("<a >").value, {
        name: "InvalidKeyError",
        key: "<a >",
        message: "Invalid key: <a >",
      });
      assertEquals(parse("<a- >").value, {
        name: "InvalidKeyError",
        key: "<a- >",
        message: "Invalid key: <a- >",
      });
      assertEquals(parse("<a-++>").value, {
        name: "InvalidKeyError",
        key: "<a-++>",
        message: "Invalid key: <a-++>",
      });
    });

    await t.step("unknown modifiers", () => {
      assertEquals(parse("<x-a>").value, {
        name: "UnknownModifierError",
        modifier: "x",
        context: "<x-a>",
        message: "<x-a>: Unknown modifier: x",
      });
      assertEquals(parse("<X-a>").value, {
        name: "UnknownModifierError",
        modifier: "X",
        context: "<X-a>",
        message: "<X-a>: Unknown modifier: X",
      });
      assertEquals(parse("<c-c-a>").value, {
        name: "DuplicateModifierError",
        modifier: "c",
        context: "<c-c-a>",
        message: "<c-c-a>: Duplicate modifier: c",
      });
      assertEquals(parse("<c-C-a>").value, {
        name: "DuplicateModifierError",
        modifier: "C",
        context: "<c-C-a>",
        message: "<c-C-a>: Duplicate modifier: C",
      });
      assertEquals(parse("<C-c-a>").value, {
        name: "DuplicateModifierError",
        modifier: "c",
        context: "<C-c-a>",
        message: "<C-c-a>: Duplicate modifier: c",
      });
      assertEquals(parse("<a-s-C-m-s-esc>").value, {
        name: "DuplicateModifierError",
        modifier: "s",
        context: "<a-s-C-m-s-esc>",
        message: "<a-s-C-m-s-esc>: Duplicate modifier: s",
      });
      assertEquals(parse("<a-s-C-m-S-esc>").value, {
        name: "DuplicateModifierError",
        modifier: "S",
        context: "<a-s-C-m-S-esc>",
        message: "<a-s-C-m-S-esc>: Duplicate modifier: S",
      });
    });

    await t.step("disallowed modifiers", () => {
      assertEquals(parse("<s-a>").value, {
        name: "DisallowedModifierError",
        modifier: "s",
        context: "<s-a>",
        message: "<s-a>: Unusable modifier with single-character keys: s",
      });
      assertEquals(parse("<c-S-/>").value, {
        name: "DisallowedModifierError",
        modifier: "S",
        context: "<c-S-/>",
        message: "<c-S-/>: Unusable modifier with single-character keys: S",
      });
      assertEquals(parse("<s-lt>").value, {
        name: "DisallowedModifierError",
        modifier: "s",
        context: "<s-lt>",
        message: "<s-lt>: Unusable modifier with single-character keys: s",
      });
      assertEquals(parse("<S-greater>").value, {
        name: "DisallowedModifierError",
        modifier: "S",
        context: "<S-greater>",
        message: "<S-greater>: Unusable modifier with single-character keys: S",
      });
    });
  });
});
