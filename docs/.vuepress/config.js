import { defineUserConfig, defaultTheme } from 'vuepress'
import {
  navbar,
  sidebar
} from './configs/index.js'

export default defineUserConfig({

  base: '/',

  // https://v2.vuepress.vuejs.org/reference/config.html#lang
  lang: 'zh-CN',
  title: 'biezhihua\'s living',
  description: ' ',

  // https://v2.vuepress.vuejs.org/guide/theme.html
  theme: defaultTheme({
    // default theme config
    navbar: navbar,
    sidebar: sidebar,
  }),
})

