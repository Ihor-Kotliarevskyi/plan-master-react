import { createLogger, defineConfig } from "vite";

const viteLogger = createLogger();
const originalWarn = viteLogger.warn;

viteLogger.warn = (msg, options) => {
  if (msg.includes("can't be bundled without type=\"module\" attribute")) {
    return;
  }
  originalWarn(msg, options);
};

export default defineConfig({
  customLogger: viteLogger,
});
