import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@chat-runtime": path.resolve(
        __dirname,
        "../../client/app/src/features/chat-runtime",
      ),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    css: false,
  },
});
