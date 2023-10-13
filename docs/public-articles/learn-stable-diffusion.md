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

```
1girl, walking, forest, path, sun, sunshine, shining one body,

yellow skirt and white t-shirt, blonde hair, long hair, smiling, stretching arms, hands up,

tree, bush, (white flower:1.5), path, outdoor,

(masterpiece:1,2), best quality, masterpiece, highres, original, extremely detail wallpaper, perfect lighting, (extremely detailed CG:1.2), drawing, paintbrush,

looking at viewer, close-up, upper body,
Negative prompt: NSFW,(worst quality:2),(low quality:2), (normal quality:2), lowres, normal quality, ((monochrome)),((grayscale)), skin spots,
acnes, skin blemishes, age spot, (ugly:1.331),(duplicate:1.331),(morbid:1.21),(mutilated:1.21),(tranny:1.331),mutated hands,
(poorly drawn hands:1.5), blurry, (bad anatomy:1.21),(bad proportions:1.331), extra limbs, (disfigured:1.331),(missing arms:1.331),
(extra legs:1.331),(fused fingers:1.61051),(too many fingers:1.61051),(unclear eyes:1.331),lowers, bad hands, missing fingers, extra digit,(((extra arms and legs)))

Steps: 30, Sampler: DPM++ SDE Karras, CFG scale: 8, Seed: 4214200061, Size: 512x512, Model hash: 2c6c9b3e47, Model: 橘子AbyssOrangeMix2 - SFW_Soft NSFW_AbyssOrangeMix2_sfw, Version: v1.6.0
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

## 第三课：

### 图生图原理

- 图生图的概念和基本逻辑
- 图片作为信息传递给AI的意义
- 随机种子的含义

## 第四课

- 模型的概念及原理
- 文件构成和加载位置
  - checkpoint
- 模型下载渠道分析
- Civitai百科全书
- 模型分类
- 二次元模型
- 写实模型
- 2.5D模型

## 第五课

- 导入部分
- 高清修复（Hi-Res Fix)原理与操作
- SD放大脚本原理与操作
- 附加功能放大算法


## 第六课

- 进阶模型概念铺垫
- Embeddings的概念及三种应用
  - 嵌入式向量
  - 是个标记
- LoRa概念简析
  - Low-Rank Adaptation Models 低秩模型
  - LoRa的作用在于帮你向AI传递、描述一个特征准确、主体清晰的形象
- Hypemetwork（超网络）概念简析

## 第七课

- 局部重绘简介
- 基本操作流程
- 核心参数解析
- inPaint Sketch操作及应用
- inPaint Upload操作及应用


## 第八课

- 扩展概述
- 3种扩展安装方法
- 4项初学者必装的基本扩展

## 第九课

- LoRa概述
- 原理及作用
- 人物模型
- 画风或风格
- 概念
- 服饰
- 物体、特定元素

## 第十课

- ControlNet原理拆解
  - ControlNet根据一些额外信息控制扩散生成走向
  - 微调扩散模型
  - DIFFUSION 在ControlNet的指导下生成图像作品
- 安装方式
- 基本使用方式
- 参数详细解析
- 五大ControlNet模型原理与应用
- 多重控制网缝隙与实践


## 碰到的问题

- https://github.com/AUTOMATIC1111/stable-diffusion-webui/issues/9665

```
Traceback (most recent call last):
  File "D:\Projects\ai\stable-diffusion-webui\venv\lib\site-packages\gradio\routes.py", line 488, in run_predict
    output = await app.get_blocks().process_api(
  File "D:\Projects\ai\stable-diffusion-webui\venv\lib\site-packages\gradio\blocks.py", line 1431, in process_api
    result = await self.call_function(
  File "D:\Projects\ai\stable-diffusion-webui\venv\lib\site-packages\gradio\blocks.py", line 1103, in call_function
    prediction = await anyio.to_thread.run_sync(
  File "D:\Projects\ai\stable-diffusion-webui\venv\lib\site-packages\anyio\to_thread.py", line 31, in run_sync
    return await get_asynclib().run_sync_in_worker_thread(
  File "D:\Projects\ai\stable-diffusion-webui\venv\lib\site-packages\anyio\_backends\_asyncio.py", line 937, in run_sync_in_worker_thread
    return await future
  File "D:\Projects\ai\stable-diffusion-webui\venv\lib\site-packages\anyio\_backends\_asyncio.py", line 867, in run
    result = context.run(func, *args)
  File "D:\Projects\ai\stable-diffusion-webui\venv\lib\site-packages\gradio\utils.py", line 707, in wrapper
    response = f(*args, **kwargs)
  File "D:\Projects\ai\stable-diffusion-webui\extensions\sd-webui-controlnet\scripts\controlnet_ui\controlnet_ui_group.py", line 679, in run_annotator
    result, is_image = preprocessor(
  File "D:\Projects\ai\stable-diffusion-webui\extensions\sd-webui-controlnet\scripts\utils.py", line 75, in decorated_func
    return cached_func(*args, **kwargs)
  File "D:\Projects\ai\stable-diffusion-webui\extensions\sd-webui-controlnet\scripts\utils.py", line 63, in cached_func
    return func(*args, **kwargs)
  File "D:\Projects\ai\stable-diffusion-webui\extensions\sd-webui-controlnet\scripts\global_state.py", line 35, in unified_preprocessor
    return preprocessor_modules[preprocessor_name](*args, **kwargs)
  File "D:\Projects\ai\stable-diffusion-webui\extensions\sd-webui-controlnet\scripts\processor.py", line 252, in run_model
    return remove_pad(self.model_openpose(
  File "D:\Projects\ai\stable-diffusion-webui\extensions\sd-webui-controlnet\annotator\openpose\__init__.py", line 352, in __call__
    poses = self.detect_poses(oriImg, include_hand, include_face)
  File "D:\Projects\ai\stable-diffusion-webui\extensions\sd-webui-controlnet\annotator\openpose\__init__.py", line 272, in detect_poses
    self.load_model()
  File "D:\Projects\ai\stable-diffusion-webui\extensions\sd-webui-controlnet\annotator\openpose\__init__.py", line 191, in load_model
    self.body_estimation = Body(body_modelpath)
  File "D:\Projects\ai\stable-diffusion-webui\extensions\sd-webui-controlnet\annotator\openpose\body.py", line 22, in __init__
    model_dict = util.transfer(self.model, torch.load(model_path))
  File "D:\Projects\ai\stable-diffusion-webui\modules\safe.py", line 108, in load
    return load_with_extra(filename, *args, extra_handler=global_extra_handler, **kwargs)
  File "D:\Projects\ai\stable-diffusion-webui\modules\safe.py", line 156, in load_with_extra
    return unsafe_torch_load(filename, *args, **kwargs)
  File "D:\Projects\ai\stable-diffusion-webui\venv\lib\site-packages\torch\serialization.py", line 815, in load
    return _legacy_load(opened_file, map_location, pickle_module, **pickle_load_args)
  File "D:\Projects\ai\stable-diffusion-webui\venv\lib\site-packages\torch\serialization.py", line 1051, in _legacy_load
    typed_storage._untyped_storage._set_from_file(
RuntimeError: unexpected EOF, expected 52048 more bytes. The file might be corrupted.
```