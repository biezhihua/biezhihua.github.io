# 透明状态栏

```xml
<style name="ThemeImmersive" parent="Theme.AppCompat.Light.NoActionBar">
    <item name="windowActionBar">false</item>
    <item name="windowNoTitle">true</item>
    <item name="android:windowAnimationStyle">@android:style/Animation.Translucent</item>
    <item name="android:windowIsTranslucent">true</item>
    <item name="android:windowBackground">@android:color/transparent</item>
    <item name="android:background">@color/transparent</item>
    <item name="android:windowFrame">@null</item>
</style>
```

```java
public static void immersive(Window window, int color, @FloatRange(from = 0.0, to = 1.0) float alpha) {
    if (Build.VERSION.SDK_INT >= 21) {
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(mixtureColor(color, alpha));

        int systemUiVisibility = window.getDecorView().getSystemUiVisibility();
        systemUiVisibility |= View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN;
        systemUiVisibility |= View.SYSTEM_UI_FLAG_LAYOUT_STABLE;
        window.getDecorView().setSystemUiVisibility(systemUiVisibility);
    } else if (Build.VERSION.SDK_INT >= 19) {
        window.addFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        setTranslucentView((ViewGroup) window.getDecorView(), color, alpha);
    } else if (Build.VERSION.SDK_INT >= MIN_API && Build.VERSION.SDK_INT > 16) {
        int systemUiVisibility = window.getDecorView().getSystemUiVisibility();
        systemUiVisibility |= View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN;
        systemUiVisibility |= View.SYSTEM_UI_FLAG_LAYOUT_STABLE;
        window.getDecorView().setSystemUiVisibility(systemUiVisibility);
    }
}

/**
 * 创建假的透明栏
 */
public static void setTranslucentView(ViewGroup container, int color, @FloatRange(from = 0.0, to = 1.0) float alpha) {
    if (Build.VERSION.SDK_INT >= 19) {
        int mixtureColor = mixtureColor(color, alpha);
        View translucentView = container.findViewById(android.R.id.custom);
        if (translucentView == null && mixtureColor != 0) {
            translucentView = new View(container.getContext());
            translucentView.setId(android.R.id.custom);
            ViewGroup.LayoutParams lp = new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, getStatusBarHeight(container.getContext()));
            container.addView(translucentView, lp);
        }
        if (translucentView != null) {
            translucentView.setBackgroundColor(mixtureColor);
        }
    }
}

/**
 * 获取状态栏高度
 */
public static int getStatusBarHeight(Context context) {
    int result = 24;
    int resId = context.getResources().getIdentifier("status_bar_height", "dimen", "android");
    if (resId > 0) {
        result = context.getResources().getDimensionPixelSize(resId);
    } else {
        result = (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, result, Resources.getSystem().getDisplayMetrics());
    }
    return result;
}

public static int getNavBarHeight(Context context) {
    if (!hasNavBar(context)) {
        return 0;
    }
    Resources resources = context.getResources();
    int resourceId = resources.getIdentifier("navigation_bar_height", "dimen", "android");
    int height = resources.getDimensionPixelSize(resourceId);
    return height;
}
```