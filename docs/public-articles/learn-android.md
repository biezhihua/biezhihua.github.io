---
article: true
---

# Learn | Android

## how-to-dynamically-generate-the-raw-resource-identifier-in-android

> https://stackoverflow.com/questions/6222758/how-to-dynamically-generate-the-raw-resource-identifier-in-android

Use Resources.getIdentifier() method:
```kotlin
int resId = getResources().getIdentifier("raw/book_name", null, this.getPackageName());

```

If your code not in activity or application, you need to get Context first.
```kotlin
Context context = getContext(); // or getBaseContext(), or getApplicationContext()
int resId = context.getResources().getIdentifier("raw/book_name", null, context.getP
```