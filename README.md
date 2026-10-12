# Codec Buddy

A small developer toolkit for encoding and decoding text, entirely in your browser.

Codec Buddy bundles four common conversions — Base64, URL encoding, Hex, and JWT decoding — behind a single sidebar so you never have to hunt for four different online tools. Type into either side of a conversion and the other side updates instantly. There's no setup, no accounts, and nothing you type ever leaves your browser.

## Features

- **Four tools in one app** — Base64, URL, Hex, and JWT Decode, switchable from the sidebar on the left.
- **Live, two-way conversion** — for Base64/URL/Hex, type or paste into either the plain-text box or the encoded box and the other updates as you type. No Encode/Decode button to press.
- **UTF-8 safe** — Base64 and Hex conversions handle multi-byte characters (emoji, accented letters, non-Latin scripts) correctly, not just plain ASCII.
- **Clear, inline error messages** — invalid input (malformed Base64, bad `%` sequences, odd-length or non-hex text) shows a short error under the box that caused it, without clearing your other box.
- **JWT decoding** — paste any JSON Web Token and see its Header and Payload pretty-printed as JSON, plus the raw Signature segment. This is a decode-only viewer — the signature is shown but never cryptographically verified.
- **One-click Copy** — every box has its own Copy button; it briefly turns into a checkmark to confirm the copy worked.
- **Remembers your last tool** — whichever tool (Base64, URL, Hex, JWT) you had open is saved and reopened automatically next time.
- **Settings panel** — a gear icon in the top-right opens a small settings dialog for appearance options (see Customization below).
- **Responsive layout** — on narrower windows or mobile screens, the sidebar collapses above the workspace and side-by-side boxes stack vertically.

## How to Use

1. **Pick a tool** from the sidebar on the left: Base64, URL, Hex, or JWT Decode.
2. **For Base64 / URL / Hex** — type or paste into either box:
   - The **left box** holds plain text.
   - The **right box** holds the encoded form.
   - Editing either box live-updates the other. If what you typed on one side isn't valid (e.g. broken Base64), an error appears under that box and the other box is left untouched until you fix it.
3. **For JWT Decode** — paste a token into the single input box. Its three parts are decoded automatically:
   - **Header** and **Payload** are shown as pretty-printed JSON.
   - **Signature** is shown as its raw text — Codec Buddy never checks whether a token's signature is valid, it just splits and decodes the token.
4. **Copy any box's contents** with the Copy button in its header — it copies straight to your clipboard and briefly confirms with a checkmark.
5. **Clear the current tool** with the Clear button next to the workspace title — it empties just the tool you're currently on, leaving the others untouched.

## Customization

Click the **gear/settings icon** in the top-right corner of the app to open the Settings panel, where you can adjust the app's appearance:

- **Theme** — switch between a light and a dark color scheme.
- **Accent color** — choose from several accent color swatches to personalize highlights such as the active tool in the sidebar and focus states.

Both your theme and accent choices are saved automatically and will still be applied the next time you open Codec Buddy.

## Tips & Shortcuts

- **Nothing is uploaded or saved to a server.** All encoding, decoding, and JSON parsing happens locally in your browser — your data never leaves your device. Only your last-used tool and appearance settings are stored locally (in your browser) so they persist between visits.
- **Emptying a box clears its pair.** If you delete everything from one side of a Base64/URL/Hex conversion, the other side clears too, rather than showing an error.
- **Hex input ignores whitespace** — you can paste hex with spaces or line breaks between byte pairs and it'll still decode correctly.
- **JWT Decode is read-only by design** — it's meant for quickly inspecting a token's claims during development or debugging, not for verifying that a token is genuine. Never treat a token as trustworthy just because Codec Buddy could decode it.
