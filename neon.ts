import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  buckets: {
    "kiyo-media": { access: "public_read" },
  },
});
