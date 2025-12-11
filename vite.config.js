import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // 🔥 إجبار المتصفح على تحميل نسخة جديدة دائمًا
  build: {
    sourcemap: false,
  },

  // 🔥 تغيير مجلد الكاش في كل Build لمنع المتصفح من استخدام النسخ القديمة
  cacheDir: "vite-cache-" + Date.now(),
});
