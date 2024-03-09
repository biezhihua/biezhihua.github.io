# Speeded-Up Robust Features (SURF) 

It's an algorithm used to find distinctive keypoints in an image that are both scale-invariant and rotation invariant. These keypoints will help us to make sure that we are tracking the right object over multiple frames because the appearance of the object might change from time to time.
Steps to rebuild OpenCV4-Python distribution to enable SURF because it's excluded by default due to a patent.

Note: the patent was expired https://patents.google.com/patent/US6711293

```bash
git clone --recursive https://github.com/skvark/opencv-python.git

cd opencv-python

Edit manually setup.py: line 
21-22: build_contrib = Trueline 
194: add "-DOPENCV_ENABLE_NONFREE=ON" to cmake_args

pip install --upgrade pip cmake setuptools

pip install scikit-build

python setup.py bdist_wheel

cd <where you cloned the git repo>\opencv-python\dist

pip install --force-reinstall opencv_contrib_python-4.8.1.78-cp311-cp311-win_amd64.whl
```

Reference: https://github.com/opencv/opencv-python/issues/126
Follow chapter 3 of the book OpenCV 4 with Python Blueprints 2nd Edition
Authors: Dr. Menua Gevorgyan, Arsen Mamikonyan, Michael Beyeler. 
ISBN: 978-1789801811.
Amazon link: https://www.amazon.com/OpenCV-Python-Blueprints-creative-computer/dp/1789801818/ref=sr_1_1?crid=GA7CJWNEP0N4&keywords=opencv+4+with+python&qid=1696599897&s=books&sprefix=open+cv4+with+python%2Cstripbooks-intl-ship%2C481&sr=1-1