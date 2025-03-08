import { defineUserConfig } from "vuepress";

import theme from "./theme.js";

export default defineUserConfig({
  base: "/",

  lang: 'zh-CN',
  title: 'biezhihua的日常',
  description: ' ',

  theme,

  // Enable it with pwa
  // shouldPrefetch: false,
});
