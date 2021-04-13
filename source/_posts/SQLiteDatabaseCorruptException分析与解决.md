---
title: "Crash: 'SQLiteDatabaseCorruptException: file is encrypted or is not a database'的分析与解决"
tags:
---

# 先说解决方案与结论

## 方案

如果使用的Room库，那么需要按照如下方法设置`JournalMode`：

```
Room.databaseBuilder(context, XXX::class.java, DATABASE_NAME)
                .setJournalMode(JournalMode.TRUNCATE)
                .build()
```

如果直接使用SQLite，那么需要按照如下的方法设置`JournalMode`：
```
SQLiteDatabase.disableWriteAheadLogging

SQLiteDatabase.OpenParams.setJournalMode(String mode)
```

什么是`JournalMode`请参看这里：
> https://source.android.com/devices/tech/perf/compatibility-wal

## 结论

Android 9 引入了 SQLiteDatabase 的一种特殊模式，称为“兼容性 WAL（预写日志记录）(Write-Ahead-Logging)”，它允许数据库使用 journal_mode=WAL，同时保留每个数据库最多创建一个连接的行为。

WAL使数据库的工作方式发生了变化，在一些状态下会抛出此异常。需要按照上文解决方案中的方法，手动关闭WAL模式，即可修复此问题。

# 排查方向和路径

## 明确Crash堆栈信息

```
android.database.sqlite.SQLiteDatabaseCorruptException: file is encrypted or is not a database (Sqlite code 26): , while compiling: PRAGMA journal_mode, (OS error - 2:No such file or directory)
	at android.database.sqlite.SQLiteConnection.nativePrepareStatement(Native Method)
	at android.database.sqlite.SQLiteConnection.acquirePreparedStatement(SQLiteConnection.java:925)
	at android.database.sqlite.SQLiteConnection.executeForString(SQLiteConnection.java:670)
	at android.database.sqlite.SQLiteConnection.setJournalMode(SQLiteConnection.java:356)
	at android.database.sqlite.SQLiteConnection.setWalModeFromConfiguration(SQLiteConnection.java:319)
	at android.database.sqlite.SQLiteConnection.open(SQLiteConnection.java:229)
	at android.database.sqlite.SQLiteConnection.open(SQLiteConnection.java:207)
	at android.database.sqlite.SQLiteConnectionPool.openConnectionLocked(SQLiteConnectionPool.java:511)
	at android.database.sqlite.SQLiteConnectionPool.open(SQLiteConnectionPool.java:194)
	at android.database.sqlite.SQLiteConnectionPool.open(SQLiteConnectionPool.java:183)
	at android.database.sqlite.SQLiteDatabase.openInner(SQLiteDatabase.java:880)
	at android.database.sqlite.SQLiteDatabase.open(SQLiteDatabase.java:867)
	at android.database.sqlite.SQLiteDatabase.openDatabase(SQLiteDatabase.java:767)
	at android.app.ContextImpl.openOrCreateDatabase(ContextImpl.java:739)
	at android.content.ContextWrapper.openOrCreateDatabase(ContextWrapper.java:289)
	at android.database.sqlite.SQLiteOpenHelper.getDatabaseLocked(SQLiteOpenHelper.java:235)
	at android.database.sqlite.SQLiteOpenHelper.getWritableDatabase(SQLiteOpenHelper.java:175)
	at android.arch.persistence.a.a.b$a.a(SourceFile:96)
	at android.arch.persistence.a.a.b.a(SourceFile:54)
	at android.arch.persistence.room.RoomDatabase.query(SourceFile:233)
```

## 明确问题影响范围

问题在一开始只有零星的一些，并未引起我太多的注意，但是在正式版本放量后，Crash数量边猛增起来，到了不得不修复的状态。

![](20210412234950.jpg)

而且该问题出现的系统版本遍布了5.1.1到11。

![](20210413000002.jpg)

## 尝试修复无果

开始着手修复后，一开始就只是拿着关键词在Google和百度上进行搜索，但是惊奇的发现，有出现同类型错误的但都没有相关的解决方案。

虽说`try catch`能够捕获该异常，但是这种粗暴的方法，再加上不明所以总是会让人不爽，于是开始查询源码来排查问题出在那里。

## 源码寻因

根据堆栈信息可以明确知道，异常是在`nativePrepareStatement`的方法中抛出的，由于此方法是JNI代码，并无法快捷的直接在AS中索引，所以此处用到了Andoid Code Search网站进行源码搜索。

`nativePrepareStatement`是`android_database_SQLiteConnection.cpp`文件中的方法，方法如下：
```
static jlong nativePrepareStatement(JNIEnv* env, jclass clazz, jlong connectionPtr, jstring sqlString) {
    SQLiteConnection* connection = reinterpret_cast<SQLiteConnection*>(connectionPtr);

    jsize sqlLength = env->GetStringLength(sqlString);
    const jchar* sql = env->GetStringCritical(sqlString, NULL);
    sqlite3_stmt* statement;
    int err = sqlite3_prepare16_v2(connection->db, sql, sqlLength * sizeof(jchar), &statement, NULL);
    env->ReleaseStringCritical(sqlString, sql);

    if (err != SQLITE_OK) {
        // Error messages like 'near ")": syntax error' are not
        // always helpful enough, so construct an error string that
        // includes the query itself.
        const char *query = env->GetStringUTFChars(sqlString, NULL);
        char *message = (char*) malloc(strlen(query) + 50);
        if (message) {
            strcpy(message, ", while compiling: "); // less than 50 chars
            strcat(message, query);
        }
        env->ReleaseStringUTFChars(sqlString, query);
        throw_sqlite3_exception(env, connection->db, message);
        free(message);
        return 0;
    }

    ALOGV("Prepared statement %p on connection %p", statement, connection->db);
    return reinterpret_cast<jlong>(statement);
}
```

# 引用
- JOURNAL_MODE:https://sqlite.org/pragma.html#pragma_journal_mode
- WAL:https://zh.wikipedia.org/zh-hans/%E9%A2%84%E5%86%99%E5%BC%8F%E6%97%A5%E5%BF%97
- AndroidWAL:https://source.android.com/devices/tech/perf/compatibility-wal
- nativePrepareStatement:https://cs.android.com/android/platform/superproject/+/android-10.0.0_r30:frameworks/base/core/jni/android_database_SQLiteConnection.cpp;l=303;drc=android-10.0.0_r30
- sqlite:https://android.googlesource.com/platform/external/sqlite.git
- https://blog.csdn.net/aasmfox/article/details/8026333
- https://stackoverflow.com/questions/11901460/is-it-possible-to-disable-wal-on-android-sqlite-database
- https://stackoverflow.com/questions/53659206/disabling-sqlite-write-ahead-logging-in-android-pie/53689702
