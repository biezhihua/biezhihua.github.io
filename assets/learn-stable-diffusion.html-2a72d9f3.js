import{_ as i,Y as e,Z as l,a2 as n}from"./framework-301d0703.js";const a={},s=n(`<h1 id="learn-stable-diffusion" tabindex="-1"><a class="header-anchor" href="#learn-stable-diffusion" aria-hidden="true">#</a> Learn | Stable Diffusion</h1><h2 id="第一课" tabindex="-1"><a class="header-anchor" href="#第一课" aria-hidden="true">#</a> 第一课：</h2><h3 id="课程总结" tabindex="-1"><a class="header-anchor" href="#课程总结" aria-hidden="true">#</a> 课程总结</h3><ul><li>AI绘画的基本概念与原理： <ul><li>扩散模型 <ul><li>基本流程：增加噪声 -&gt; 深度学习 -&gt; 去噪并风格化重绘</li></ul></li><li>AI绘画 = AI图像生成</li></ul></li></ul><h3 id="提示词" tabindex="-1"><a class="header-anchor" href="#提示词" aria-hidden="true">#</a> 提示词</h3><div class="language-prompts line-numbers-mode" data-ext="prompts"><pre class="language-prompts"><code>1girl, walking in the forest, the sun fell on her body, 

(masterpiece:1,2), best quality, masterpiece, highres, original, extremely detail wallpaper, perfect lighting, (extremely detailed CG:1.2), drawing, paintbrush, 

looking at viewer,  close-up,  upper body, 
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-prompts line-numbers-mode" data-ext="prompts"><pre class="language-prompts"><code>NSFW,(worst quality:2),(low quality:2), (normal quality:2), lowres, normal quality, ((monochrome)),((grayscale)), skin spots,
acnes, skin blemishes, age spot, (ugly:1.331),(duplicate:1.331),(morbid:1.21),(mutilated:1.21),(tranny:1.331),mutated hands,
(poorly drawn hands:1.5), blurry, (bad anatomy:1.21),(bad proportions:1.331), extra limbs, (disfigured:1.331),(missing arms:1.331),
(extra legs:1.331),(fused fingers:1.61051),(too many fingers:1.61051),(unclear eyes:1.331),lowers, bad hands, missing fingers, extra digit,(((extra arms and legs)))
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>1girl, walking, forest, path, sun, sunshine, shining one body,

yellow skirt and white t-shirt, blonde hair, long hair, smiling, stretching arms, hands up,

tree, bush, (white flower:1.5), path, outdoor,

(masterpiece:1,2), best quality, masterpiece, highres, original, extremely detail wallpaper, perfect lighting, (extremely detailed CG:1.2), drawing, paintbrush,

looking at viewer, close-up, upper body,
Negative prompt: NSFW,(worst quality:2),(low quality:2), (normal quality:2), lowres, normal quality, ((monochrome)),((grayscale)), skin spots,
acnes, skin blemishes, age spot, (ugly:1.331),(duplicate:1.331),(morbid:1.21),(mutilated:1.21),(tranny:1.331),mutated hands,
(poorly drawn hands:1.5), blurry, (bad anatomy:1.21),(bad proportions:1.331), extra limbs, (disfigured:1.331),(missing arms:1.331),
(extra legs:1.331),(fused fingers:1.61051),(too many fingers:1.61051),(unclear eyes:1.331),lowers, bad hands, missing fingers, extra digit,(((extra arms and legs)))

Steps: 30, Sampler: DPM++ SDE Karras, CFG scale: 8, Seed: 4214200061, Size: 512x512, Model hash: 2c6c9b3e47, Model: 橘子AbyssOrangeMix2 - SFW_Soft NSFW_AbyssOrangeMix2_sfw, Version: v1.6.0
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="问题" tabindex="-1"><a class="header-anchor" href="#问题" aria-hidden="true">#</a> 问题</h3><ul><li>https://www.bilibili.com/video/BV1As4y127HW/?spm_id_from=333.788&amp;vd_source=7067fca17f42bb32fbfaf035206bde26</li><li>https://decentralizedcreator.com/cfg-scale-in-stable-diffusion-and-how-to-use-it/ <ul><li>The CFG scale adjusts how much the image looks closer to the prompt and/ or input image.</li></ul></li></ul><h2 id="第二课-文生图入门-text-to-image-与提示词基础" tabindex="-1"><a class="header-anchor" href="#第二课-文生图入门-text-to-image-与提示词基础" aria-hidden="true">#</a> 第二课：文生图入门（text to image）与提示词基础</h2><h3 id="提示词基本概念" tabindex="-1"><a class="header-anchor" href="#提示词基本概念" aria-hidden="true">#</a> 提示词基本概念</h3><ul><li>提示词的概念和基本逻辑 <ul><li>如何书写提示词： <ul><li>通用模板： <ul><li>内容相关： <ul><li>描述人物</li><li>描述场景</li><li>描述环境（时间、光照）</li><li>描述画幅视角</li><li>其他画面要素</li></ul></li><li>标准化相关： <ul><li>高品质标准化</li><li>画风标准化</li><li>其他特殊要求</li></ul></li></ul></li></ul></li><li>提示词分类： <ul><li>内容型提示词： <ul><li>人物及主体特征： <ul><li>服饰穿搭：white dress</li><li>发型发色：blonde hair，long hair</li><li>五官特点：small eyes， big mouth</li><li>面部表情：smiling</li><li>肢体动作：stretching arms</li></ul></li><li>场景特点： <ul><li>室内、室外：indoor/outdoor</li><li>大场景：forest, city, street</li><li>小细节：tree，bush，white flower</li></ul></li><li>环境光照： <ul><li>白天黑夜：day、night</li><li>特定时段：morning、sunset</li><li>光环境：sunlight，bright，dark</li><li>天空：blue sky，starry，sky</li></ul></li><li>画幅视角： <ul><li>距离：close-up，distant</li><li>人物比例：full body、upper body</li><li>观察视角：from above、view of back</li><li>镜头类型：wide range， Sony A7 III</li></ul></li></ul></li><li>标准化提示词： <ul><li>画质： <ul><li>best quality, ultra detailed, masterpiece, hires, 8k</li></ul></li><li>画风： <ul><li>painting, illustration, anim, game cg</li></ul></li></ul></li></ul></li></ul></li><li>提示词语法（输入，间隔）</li></ul><h3 id="出图参数" tabindex="-1"><a class="header-anchor" href="#出图参数" aria-hidden="true">#</a> 出图参数</h3><ul><li>Sampling method 采样方法</li><li>Sampling steps 采样步数</li></ul><h3 id="提示词-1" tabindex="-1"><a class="header-anchor" href="#提示词-1" aria-hidden="true">#</a> 提示词</h3><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>1girl, walking, forest, path, sun, sunshine, shining one body,

yellow skirt and white t-shirt, blonde hair, long hair, smiling, stretching arms, hands up, 

tree, bush, (white flower:1.5), path, outdoor,

(masterpiece:1,2), best quality, masterpiece, highres, original, extremely detail wallpaper, perfect lighting, (extremely detailed CG:1.2), drawing, paintbrush, 

looking at viewer,  close-up,  upper body, 
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="第三课" tabindex="-1"><a class="header-anchor" href="#第三课" aria-hidden="true">#</a> 第三课：</h2><h3 id="图生图原理" tabindex="-1"><a class="header-anchor" href="#图生图原理" aria-hidden="true">#</a> 图生图原理</h3><ul><li>图生图的概念和基本逻辑</li><li>图片作为信息传递给AI的意义</li><li>随机种子的含义</li></ul><h2 id="第四课" tabindex="-1"><a class="header-anchor" href="#第四课" aria-hidden="true">#</a> 第四课</h2><ul><li>模型的概念及原理</li><li>文件构成和加载位置 <ul><li>checkpoint</li></ul></li><li>模型下载渠道分析</li><li>Civitai百科全书</li><li>模型分类</li><li>二次元模型</li><li>写实模型</li><li>2.5D模型</li></ul><h2 id="第五课" tabindex="-1"><a class="header-anchor" href="#第五课" aria-hidden="true">#</a> 第五课</h2><ul><li>导入部分</li><li>高清修复（Hi-Res Fix)原理与操作</li><li>SD放大脚本原理与操作</li><li>附加功能放大算法</li></ul><h2 id="第六课" tabindex="-1"><a class="header-anchor" href="#第六课" aria-hidden="true">#</a> 第六课</h2><ul><li>进阶模型概念铺垫</li><li>Embeddings的概念及三种应用 <ul><li>嵌入式向量</li><li>是个标记</li></ul></li><li>LoRa概念简析 <ul><li>Low-Rank Adaptation Models 低秩模型</li><li>LoRa的作用在于帮你向AI传递、描述一个特征准确、主体清晰的形象</li></ul></li><li>Hypemetwork（超网络）概念简析</li></ul><h2 id="第七课" tabindex="-1"><a class="header-anchor" href="#第七课" aria-hidden="true">#</a> 第七课</h2><ul><li>局部重绘简介</li><li>基本操作流程</li><li>核心参数解析</li><li>inPaint Sketch操作及应用</li><li>inPaint Upload操作及应用</li></ul><h2 id="第八课" tabindex="-1"><a class="header-anchor" href="#第八课" aria-hidden="true">#</a> 第八课</h2><ul><li>扩展概述</li><li>3种扩展安装方法</li><li>4项初学者必装的基本扩展</li></ul><h2 id="第九课" tabindex="-1"><a class="header-anchor" href="#第九课" aria-hidden="true">#</a> 第九课</h2><ul><li>LoRa概述</li><li>原理及作用</li><li>人物模型</li><li>画风或风格</li><li>概念</li><li>服饰</li><li>物体、特定元素</li></ul><h2 id="第十课" tabindex="-1"><a class="header-anchor" href="#第十课" aria-hidden="true">#</a> 第十课</h2><ul><li>ControlNet原理拆解 <ul><li>ControlNet根据一些额外信息控制扩散生成走向</li><li>微调扩散模型</li><li>DIFFUSION 在ControlNet的指导下生成图像作品</li></ul></li><li>安装方式</li><li>基本使用方式</li><li>参数详细解析</li><li>五大ControlNet模型原理与应用</li><li>多重控制网缝隙与实践</li></ul><h2 id="碰到的问题" tabindex="-1"><a class="header-anchor" href="#碰到的问题" aria-hidden="true">#</a> 碰到的问题</h2><ul><li>https://github.com/AUTOMATIC1111/stable-diffusion-webui/issues/9665</li></ul><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>Traceback (most recent call last):
  File &quot;D:\\Projects\\ai\\stable-diffusion-webui\\venv\\lib\\site-packages\\gradio\\routes.py&quot;, line 488, in run_predict
    output = await app.get_blocks().process_api(
  File &quot;D:\\Projects\\ai\\stable-diffusion-webui\\venv\\lib\\site-packages\\gradio\\blocks.py&quot;, line 1431, in process_api
    result = await self.call_function(
  File &quot;D:\\Projects\\ai\\stable-diffusion-webui\\venv\\lib\\site-packages\\gradio\\blocks.py&quot;, line 1103, in call_function
    prediction = await anyio.to_thread.run_sync(
  File &quot;D:\\Projects\\ai\\stable-diffusion-webui\\venv\\lib\\site-packages\\anyio\\to_thread.py&quot;, line 31, in run_sync
    return await get_asynclib().run_sync_in_worker_thread(
  File &quot;D:\\Projects\\ai\\stable-diffusion-webui\\venv\\lib\\site-packages\\anyio\\_backends\\_asyncio.py&quot;, line 937, in run_sync_in_worker_thread
    return await future
  File &quot;D:\\Projects\\ai\\stable-diffusion-webui\\venv\\lib\\site-packages\\anyio\\_backends\\_asyncio.py&quot;, line 867, in run
    result = context.run(func, *args)
  File &quot;D:\\Projects\\ai\\stable-diffusion-webui\\venv\\lib\\site-packages\\gradio\\utils.py&quot;, line 707, in wrapper
    response = f(*args, **kwargs)
  File &quot;D:\\Projects\\ai\\stable-diffusion-webui\\extensions\\sd-webui-controlnet\\scripts\\controlnet_ui\\controlnet_ui_group.py&quot;, line 679, in run_annotator
    result, is_image = preprocessor(
  File &quot;D:\\Projects\\ai\\stable-diffusion-webui\\extensions\\sd-webui-controlnet\\scripts\\utils.py&quot;, line 75, in decorated_func
    return cached_func(*args, **kwargs)
  File &quot;D:\\Projects\\ai\\stable-diffusion-webui\\extensions\\sd-webui-controlnet\\scripts\\utils.py&quot;, line 63, in cached_func
    return func(*args, **kwargs)
  File &quot;D:\\Projects\\ai\\stable-diffusion-webui\\extensions\\sd-webui-controlnet\\scripts\\global_state.py&quot;, line 35, in unified_preprocessor
    return preprocessor_modules[preprocessor_name](*args, **kwargs)
  File &quot;D:\\Projects\\ai\\stable-diffusion-webui\\extensions\\sd-webui-controlnet\\scripts\\processor.py&quot;, line 252, in run_model
    return remove_pad(self.model_openpose(
  File &quot;D:\\Projects\\ai\\stable-diffusion-webui\\extensions\\sd-webui-controlnet\\annotator\\openpose\\__init__.py&quot;, line 352, in __call__
    poses = self.detect_poses(oriImg, include_hand, include_face)
  File &quot;D:\\Projects\\ai\\stable-diffusion-webui\\extensions\\sd-webui-controlnet\\annotator\\openpose\\__init__.py&quot;, line 272, in detect_poses
    self.load_model()
  File &quot;D:\\Projects\\ai\\stable-diffusion-webui\\extensions\\sd-webui-controlnet\\annotator\\openpose\\__init__.py&quot;, line 191, in load_model
    self.body_estimation = Body(body_modelpath)
  File &quot;D:\\Projects\\ai\\stable-diffusion-webui\\extensions\\sd-webui-controlnet\\annotator\\openpose\\body.py&quot;, line 22, in __init__
    model_dict = util.transfer(self.model, torch.load(model_path))
  File &quot;D:\\Projects\\ai\\stable-diffusion-webui\\modules\\safe.py&quot;, line 108, in load
    return load_with_extra(filename, *args, extra_handler=global_extra_handler, **kwargs)
  File &quot;D:\\Projects\\ai\\stable-diffusion-webui\\modules\\safe.py&quot;, line 156, in load_with_extra
    return unsafe_torch_load(filename, *args, **kwargs)
  File &quot;D:\\Projects\\ai\\stable-diffusion-webui\\venv\\lib\\site-packages\\torch\\serialization.py&quot;, line 815, in load
    return _legacy_load(opened_file, map_location, pickle_module, **pickle_load_args)
  File &quot;D:\\Projects\\ai\\stable-diffusion-webui\\venv\\lib\\site-packages\\torch\\serialization.py&quot;, line 1051, in _legacy_load
    typed_storage._untyped_storage._set_from_file(
RuntimeError: unexpected EOF, expected 52048 more bytes. The file might be corrupted.
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,37),r=[s];function t(d,o){return e(),l("div",null,r)}const c=i(a,[["render",t],["__file","learn-stable-diffusion.html.vue"]]);export{c as default};