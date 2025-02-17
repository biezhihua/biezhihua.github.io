import{_ as e,Y as n,Z as s,a2 as a}from"./framework-301d0703.js";const t={},i=a(`<h1 id="speeded-up-robust-features-surf" tabindex="-1"><a class="header-anchor" href="#speeded-up-robust-features-surf" aria-hidden="true">#</a> Speeded-Up Robust Features (SURF)</h1><p>It&#39;s an algorithm used to find distinctive keypoints in an image that are both scale-invariant and rotation invariant. These keypoints will help us to make sure that we are tracking the right object over multiple frames because the appearance of the object might change from time to time. Steps to rebuild OpenCV4-Python distribution to enable SURF because it&#39;s excluded by default due to a patent.</p><p>Note: the patent was expired https://patents.google.com/patent/US6711293</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token function">git</span> clone <span class="token parameter variable">--recursive</span> https://github.com/skvark/opencv-python.git

<span class="token builtin class-name">cd</span> opencv-python

Edit manually setup.py: line 
<span class="token number">21</span>-22: build_contrib <span class="token operator">=</span> Trueline 
<span class="token number">194</span>: <span class="token function">add</span> <span class="token string">&quot;-DOPENCV_ENABLE_NONFREE=ON&quot;</span> to cmake_args

pip <span class="token function">install</span> <span class="token parameter variable">--upgrade</span> pip cmake setuptools

pip <span class="token function">install</span> scikit-build

python setup.py bdist_wheel

<span class="token builtin class-name">cd</span> <span class="token operator">&lt;</span>where you cloned the <span class="token function">git</span> repo<span class="token operator">&gt;</span><span class="token punctuation">\\</span>opencv-python<span class="token punctuation">\\</span>dist

pip <span class="token function">install</span> --force-reinstall opencv_contrib_python-4.8.1.78-cp311-cp311-win_amd64.whl
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>Reference: https://github.com/opencv/opencv-python/issues/126 Follow chapter 3 of the book OpenCV 4 with Python Blueprints 2nd Edition Authors: Dr. Menua Gevorgyan, Arsen Mamikonyan, Michael Beyeler. ISBN: 978-1789801811. Amazon link: https://www.amazon.com/OpenCV-Python-Blueprints-creative-computer/dp/1789801818/ref=sr_1_1?crid=GA7CJWNEP0N4&amp;keywords=opencv+4+with+python&amp;qid=1696599897&amp;s=books&amp;sprefix=open+cv4+with+python%2Cstripbooks-intl-ship%2C481&amp;sr=1-1</p>`,5),o=[i];function p(l,c){return n(),s("div",null,o)}const u=e(t,[["render",p],["__file","using-opencv-4-surf-algorithm-feature-detection-quoc-bao-nguyen.html.vue"]]);export{u as default};
