---
article: true
---

# Learn | Stable Diffusion

## 第一课：

### 课程总结

- AI绘画的基本概念与原理：
  - 扩散模型
    - 基本流程：增加噪声 -> 深度学习 -> 去噪并风格化重绘
  - AI绘画 = AI图像生成

### 提示词

```prompts
1girl, walking in the forest, the sun fell on her body, 

(masterpiece:1,2), best quality, masterpiece, highres, original, extremely detail wallpaper, perfect lighting, (extremely detailed CG:1.2), drawing, paintbrush, 

looking at viewer,  close-up,  upper body, 
```

```prompts
NSFW,(worst quality:2),(low quality:2), (normal quality:2), lowres, normal quality, ((monochrome)),((grayscale)), skin spots,
acnes, skin blemishes, age spot, (ugly:1.331),(duplicate:1.331),(morbid:1.21),(mutilated:1.21),(tranny:1.331),mutated hands,
(poorly drawn hands:1.5), blurry, (bad anatomy:1.21),(bad proportions:1.331), extra limbs, (disfigured:1.331),(missing arms:1.331),
(extra legs:1.331),(fused fingers:1.61051),(too many fingers:1.61051),(unclear eyes:1.331),lowers, bad hands, missing fingers, extra digit,(((extra arms and legs)))
```

### 问题

- https://www.bilibili.com/video/BV1As4y127HW/?spm_id_from=333.788&vd_source=7067fca17f42bb32fbfaf035206bde26
- https://decentralizedcreator.com/cfg-scale-in-stable-diffusion-and-how-to-use-it/
  - The CFG scale adjusts how much the image looks closer to the prompt and/ or input image. 

## 第二课：文生图入门（text to image）与提示词基础

### 提示词基本概念
- 提示词的概念和基本逻辑
  - 如何书写提示词：
    - 通用模板：
      - 内容相关：
        - 描述人物
        - 描述场景
        - 描述环境（时间、光照）
        - 描述画幅视角
        - 其他画面要素
      - 标准化相关：
        - 高品质标准化
        - 画风标准化
        - 其他特殊要求
  - 提示词分类：
    - 内容型提示词：
      - 人物及主体特征：
        - 服饰穿搭：white dress
        - 发型发色：blonde hair，long hair
        - 五官特点：small eyes， big mouth
        - 面部表情：smiling
        - 肢体动作：stretching arms
      - 场景特点：
        - 室内、室外：indoor/outdoor
        - 大场景：forest, city, street
        - 小细节：tree，bush，white flower
      - 环境光照：
        - 白天黑夜：day、night
        - 特定时段：morning、sunset
        - 光环境：sunlight，bright，dark
        - 天空：blue sky，starry，sky
      - 画幅视角：
        - 距离：close-up，distant
        - 人物比例：full body、upper body
        - 观察视角：from above、view of back
        - 镜头类型：wide range， Sony A7 III
    - 标准化提示词：
      - 画质：
        - best quality, ultra detailed, masterpiece, hires, 8k
      - 画风：
        - painting, illustration, anim, game cg
- 提示词语法（输入，间隔）

### 出图参数

- Sampling method 采样方法
- Sampling steps 采样步数

### 提示词

```
1girl, walking, forest, path, sun, sunshine, shining one body,

yellow skirt and white t-shirt, blonde hair, long hair, smiling, stretching arms, hands up, 

tree, bush, (white flower:1.5), path, outdoor,

(masterpiece:1,2), best quality, masterpiece, highres, original, extremely detail wallpaper, perfect lighting, (extremely detailed CG:1.2), drawing, paintbrush, 

looking at viewer,  close-up,  upper body, 
```
