// Expo Router's entry point, re-exported from inside the project root.
//
// Pointing `main` directly at `expo-router/entry` resolves to the hoisted
// package at the workspace root, which sits outside Metro's server root
// (this repo has no `workspaces` field, so the server root is `apps/mobile`).
// The resulting `../../node_modules/...` entry path is normalized away when
// Metro builds the bundle URL, and the bundle request then 500s.
//
// Re-exporting from a local file keeps the entry inside the server root; the
// bare `expo-router/entry` import below is resolved by normal Node lookup,
// which walks up to the hoisted root `node_modules`.
import 'expo-router/entry';
