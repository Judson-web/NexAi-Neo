import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("developer page mounts its React application", () => {
  const source = fs.readFileSync(new URL("../src/DevelopersApp.jsx", import.meta.url), "utf8");
  assert.match(source, /createRoot\(document\.getElementById\(["']root["']\)\)\.render\(<DevelopersApp\/>\)/);
});


test("developer UI includes password visibility, verification, and one-time key messaging", () => {
  const source = fs.readFileSync(new URL("../src/DevelopersApp.jsx", import.meta.url), "utf8");
  assert.match(source,/Show password/);
  assert.match(source,/Verification email sent/);
  assert.match(source,/ONE-TIME SECRET/);
  assert.match(source,/Never be displayed again/);
});