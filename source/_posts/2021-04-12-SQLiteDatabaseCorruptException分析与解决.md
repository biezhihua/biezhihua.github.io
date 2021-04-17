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

问题在一开始只有零星的一些，并未引起我太多的注意，但是在正式版本放量后，Crash数量便猛增起来，到了不得不修复的状态。

![](20210412234950.jpg)

而且该问题出现的系统版本遍布了5.1.1到11。

![](20210413000002.jpg)

## 尝试修复无果

开始着手修复后，只是拿着关键词在Google和百度上进行搜索，但是惊奇的发现，有同类型错误的出现，但都没有相关的解决方案。

虽说`try catch`能够捕获该异常，但是这种粗暴的方法，再加上不明所以，总是会让人不爽，于是开始查询源码来排查问题出在那里。

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
> https://cs.android.com/android/platform/superproject/+/android-10.0.0_r30:frameworks/base/core/jni/android_database_SQLiteConnection.cpp;l=303;drc=android-10.0.0_r30

在`nativePrepareStatement`方法中，可以看到一个关键字", while compiling:"与Crash日志中的"file is encrypted or is not a database (Sqlite code 26): , while compiling: PRAGMA journal_mode, (OS error - 2:No such file or directory)"相匹配，可以确定真正发生Crash的地点是在拼接错误日志之前。

那么可以进一步将发生Crash的方法锁定到`sqlite3_prepare16_v2`方法中。

由于sqilte3的代码文件过大，建议将库克隆到本地。
> https://android.googlesource.com/platform/external/sqlite.git

这里推荐一下Sourcetrail软件，阅读C代码的神器，以`sqlite3_prepare16_v2()`为起点，通过层层调用可以排查到在`lockBtree()`方法中有可能返回`SQLITE_NOTADB`错误码。

![](20210417172839.jpg)

![](20210417172726.jpg)

![](20210417172520.jpg)

![](20210417173116.jpg)

![](20210417173228.jpg)

同时可以搜索sqlite3.c文件，可以知道在`sqlite3ErrStr()`方法中，将`SQLITE_NOTADB`错误码与错误文案（"file is not a database"）进行了关联。

```
SQLITE_PRIVATE const char *sqlite3ErrStr(int rc){
  static const char* const aMsg[] = {
    ......
    /* SQLITE_NOTADB      */ "file is not a database",
    ......
  };
  const char *zErr = "unknown error";
  switch( rc ){
    case SQLITE_ABORT_ROLLBACK: {
      zErr = "abort due to ROLLBACK";
      break;
    }
    case SQLITE_ROW: {
      zErr = "another row available";
      break;
    }
    case SQLITE_DONE: {
      zErr = "no more rows available";
      break;
    }
    default: {
      rc &= 0xff;
      if( ALWAYS(rc>=0) && rc<ArraySize(aMsg) && aMsg[rc]!=0 ){
        zErr = aMsg[rc];
      }
      break;
    }
  }
  return zErr;
}
```

可以分析得知`lockBtree()`方法就是产生这个Crash的地方，那么着重对该方法进行一个分析。

```
/*
** Get a reference to pPage1 of the database file.  This will
** also acquire a readlock on that file.
**
** SQLITE_OK is returned on success.  If the file is not a
** well-formed database file, then SQLITE_CORRUPT is returned.
** SQLITE_BUSY is returned if the database is locked.  SQLITE_NOMEM
** is returned if we run out of memory. 
*/
static int lockBtree(BtShared *pBt){
  int rc;              /* Result code from subfunctions */
  MemPage *pPage1;     /* Page 1 of the database file */
  u32 nPage;           /* Number of pages in the database */
  u32 nPageFile = 0;   /* Number of pages in the database file */
  u32 nPageHeader;     /* Number of pages in the database according to hdr */

  /* Do some checking to help insure the file we opened really is
  ** a valid database file. 
  */
  nPage = nPageHeader = get4byte(28+(u8*)pPage1->aData);
  sqlite3PagerPagecount(pBt->pPager, (int*)&nPageFile);
  if( nPage==0 || memcmp(24+(u8*)pPage1->aData, 92+(u8*)pPage1->aData,4)!=0 ){
    nPage = nPageFile;
  }

  if( nPage>0 ){
    u32 pageSize;
    u32 usableSize;
    u8 *page1 = pPage1->aData;
    rc = SQLITE_NOTADB;

    ......

#ifdef SQLITE_OMIT_WAL
    ......
#else
    if( page1[18]>2 ){
      pBt->btsFlags |= BTS_READ_ONLY;
    }
    if( page1[19]>2 ){
      goto page1_init_failed;
    }

    /* If the write version is set to 2, this database should be accessed
    ** in WAL mode. If the log is not already open, open it now. Then 
    ** return SQLITE_OK and return without populating BtShared.pPage1.
    ** The caller detects this and calls this function again. This is
    ** required as the version of page 1 currently in the page1 buffer
    ** may not be the latest version - there may be a newer one in the log
    ** file.
    */
    if( page1[19]==2 && (pBt->btsFlags & BTS_NO_WAL)==0 ){
      int isOpen = 0;
      rc = sqlite3PagerOpenWal(pBt->pPager, &isOpen);
      if( rc!=SQLITE_OK ){
        goto page1_init_failed;
      }else{
        setDefaultSyncFlag(pBt, SQLITE_DEFAULT_WAL_SYNCHRONOUS+1);
        if( isOpen==0 ){
          releasePageOne(pPage1);
          return SQLITE_OK;
        }
      }
      rc = SQLITE_NOTADB;
    }else{
      setDefaultSyncFlag(pBt, SQLITE_DEFAULT_SYNCHRONOUS+1);
    }
#endif

    ......

page1_init_failed:
  releasePageOne(pPage1);
  pBt->pPage1 = 0;
  return rc;
}
```

我将`lockBTree()`中和Crash不相关的逻辑进行了去除，通过分析可以知道，`rc`的默认值就是`SQLITE_NOTADB`，在随后的逻辑中
通过`sqlite3PagerOpenWal()`方法尝试通过WAL的方式打开数据库，但是其结果不为`SQLITE_OK`，导致逻辑直接跳向了`page1_init_failed`中。

![](20210417185532.jpg)

在`sqlite3PagerOpenWal()`方法中又后续调用了`pagerOpenWal()`等方法，都是WAL的逻辑。

WAL预写式日志（Write-ahead logging，缩写 WAL）是关系数据库系统中用于提供原子性和持久性（ACID属性中的两个）的一系列技术。在使用WAL的系统中，所有的修改在提交之前都要先写入log文件中。

至此，想要解决这个Crash，只需要禁止数据库的WAL模式即可。

# 引用
- JOURNAL_MODE:https://sqlite.org/pragma.html#pragma_journal_mode
- WAL:https://zh.wikipedia.org/zh-hans/%E9%A2%84%E5%86%99%E5%BC%8F%E6%97%A5%E5%BF%97
- AndroidWAL:https://source.android.com/devices/tech/perf/compatibility-wal
- nativePrepareStatement: https://cs.android.com/android/platform/superproject/+/android-10.0.0_r30:frameworks/base/core/jni/android_database_SQLiteConnection.cpp;l=303;drc=android-10.0.0_r30
- sqlite:https://android.googlesource.com/platform/external/sqlite.git
- https://blog.csdn.net/aasmfox/article/details/8026333
- https://stackoverflow.com/questions/11901460/is-it-possible-to-disable-wal-on-android-sqlite-database
- https://stackoverflow.com/questions/53659206/disabling-sqlite-write-ahead-logging-in-android-pie/53689702
- https://github.com/CoatiSoftware/Sourcetrail
- https://blog.csdn.net/zearot/article/details/51039593
- https://cs.android.com/android/platform/superproject/+/master:external/rust/crates/
- http://sqlite.1065341.n5.nabble.com/sqlite-3-7-2-doesn-t-compile-if-SQLITE-OMIT-WAL-is-defined-td45921.html
- https://www.sqlite.org/src/info/d1ed743b6e
- https://www.sqlite.org/compile.html