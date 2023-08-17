# Solution | Install Diesel-Cli For Rust In Windwos 11 

## Install MySQL for Windows 11

install exe: https://dev.mysql.com/downloads/installer/

```bash
setx MYSQLCLIENT_LIB_DIR "C:\Program Files\MySQL\MySQL Server 8.0\lib"  
```

## Install PostgreSQL for Windows 11

install exe: https://www.postgresql.org/download/windows/

```bash
setx PQ_LIB_DIR "C:\Program Files\PostgreSQL\15\lib"  
```

## Install Sqlite for Windwos 11

install: https://www.sqlite.org/download.html

- https://www.c-sharpcorner.com/article/how-to-install-sqlite-on-windows-11/


## Install Diesel-Cli

```bash
cargo install diesel_cli   
....

Finished release [optimized] target(s) in 20.59s
Replacing C:\Users\biezhihua\.cargo\bin\diesel.exe
Replaced package `diesel_cli v2.1.0` with `diesel_cli v2.1.0` (executable `diesel.exe`)
```

## How to fix - LINK : fatal error LNK1181: cannot open input file 'sqlite3.lib'

### build sqlite3.lib 

```text
How to build SQLite3 .lib file on Windows 10

Download source from source (https://www.sqlite.org/download.html)

For example: source https://www.sqlite.org/2020/sqlite-amalgamation-3310100.zip

Download binary from binary

For example: binary https://www.sqlite.org/2020/sqlite-dll-win64-x64-3310100.zip

Extract both archives to the same directory

Open Developer Command Prompt for VS 2017 by typing Developer Command in Windows Search

Go to directory where you've extracted source code and binary files (via opened cmd)

```
Run
```bash
lib /DEF:sqlite3.def /OUT:sqlite3.lib /MACHINE:x64
```

### set global SQLITE3_LIB_DIR

```bash
setx SQLITE3_LIB_DIR "D:\App\sqlite3"
```

Run
```bash
C:/Users/biezhihua/.cargo/bin/cargo.exe build --color=always --message-format=json-diagnostic-rendered-ansi --package diesel_demo_step_1_sqlite --bin show_posts
   Compiling proc-macro2 v1.0.66
   Compiling unicode-ident v1.0.11
   Compiling pkg-config v0.3.27
   Compiling vcpkg v0.2.15
   Compiling dotenvy v0.15.7
   Compiling libsqlite3-sys v0.26.0
   Compiling quote v1.0.32
   Compiling syn v2.0.28
   Compiling diesel_table_macro_syntax v0.1.0
   Compiling diesel_derives v2.1.0
   Compiling diesel v2.1.0
   Compiling diesel_demo_step_1_sqlite v0.1.0 (D:\Projects\github\diesel\examples\sqlite\getting_started_step_1)
    Finished dev [unoptimized + debuginfo] target(s) in 10.76s
Process finished with exit code 0
```

- https://github.com/dlang-community/d2sqlite3/issues/49
- https://stackoverflow.com/questions/76349657/what-is-the-missing-sqlite3-lib-file-when-trying-to-run-rustqlite-with-precomp
- https://blog.itdevwu.com/post/915/

## How to fix - exit code: 0xc0000135, STATUS_DLL_NOT_FOUND

```bash
 $biezhihua: D:/Projects/github/examples/sqlite/getting_started_step_1 ❯ echo $LASTEXITCODE
-1073741515
```

```bash
 $biezhihua: D:/Projects/github/examples/postgres/getting_started_step_1 ❯ cargo run
    Finished dev [unoptimized + debuginfo] target(s) in 0.01s
     Running `target\debug\show_posts.exe`
error: process didn't exit successfully: `target\debug\show_posts.exe` (exit code: 0xc0000135, STATUS_DLL_NOT_FOUND)
```

### Solution 1

copy libiconv-2.dll libintl-9.dll sqlite3.dll sqlite3.lib to your project root directory.

```bash
 $biezhihua: D:/Projects/github/examples/sqlite/getting_started_step_1 ❯ diesel setup                     26% 18/68GB
Creating database: db.sqlite3
Running migration 20170124012402_create_posts
```

```text
Download gettext0.21-iconv1.16-shared-64 from http://mlocati.github.io/articles/gettext-iconv-windows.html
Extract the ZIP. It will contain, inter alia, libintl-8.dll which is newer than libintl-9.dll
Rename libintl-8.dll to libintl-9.dll
Place your new libintl-9.dll in the same directory as your executable (e.g., target\debug) to get the fixed libintl to link correctly. If you just copy it and don't rename it, it will link to the broken libintl-9.dll in the Postgres install directory.
I asked if we could expect a non-broken libintl DLL in upcoming versions (after they figure out the performance regression). I don't know yet, but at least we have a fix.
```

### Solution 2

- Add `D:\App\sqlite3` and `D:\App\gettext0.21-iconv1.16-shared-64\bin` to your PATH.
- Restart your PowerShell
- Build your project

```bash
PowerShell 7.3.6
 $biezhihua: D:/Projects/github/examples/sqlite/getting_started_step_1 ❯ diesel setup
 $biezhihua: D:/Projects/github/examples/sqlite/getting_started_step_1 ❯ diesel setup                     26% 18/68GB
Creating migrations directory at: D:\Projects\github\examples\sqlite\getting_started_step_1\migrations
Creating database: db.sqlite3
```

### References

- https://github.com/diesel-rs/diesel/issues/2015#issuecomment-474172079
- https://github.com/diesel-rs/diesel/discussions/2947

## How to fix - Unsupported type: serial

```SQL
# sqlite
CREATE TABLE posts (
id INTEGER PRIMARY KEY,
title VARCHAR NOT NULL,
body TEXT NOT NULL,
published BOOLEAN NOT NULL DEFAULT FALSE
)
```

```SQL
# postgreSQL
CREATE TABLE posts (
id SERIAL PRIMARY KEY,
title VARCHAR NOT NULL,
body TEXT NOT NULL,
published BOOLEAN NOT NULL DEFAULT FALSE
)
```

- https://github.com/diesel-rs/diesel/issues/427

## Demo

```bash
# create database sqlite
 $biezhihua: D:/Projects/github/diesel_demo on master ≢  ?3 ❯ diesel setup
Creating migrations directory at: D:\Projects\github\diesel_demo\migrations
Creating database: db.sqlite3
```

```bash
 $biezhihua: D:/Projects/github/diesel_demo on master ≢  ?7 ❯ diesel migration generate create_posts    23% 15/68GB
Creating migrations\2023-08-10-081601_create_posts\up.sql
Creating migrations\2023-08-10-081601_create_posts\down.sql
```

```bash
# create tables in sqlite3
# create schema
 $biezhihua: D:/Projects/github/diesel_demo on master ≢  ?7 ❯ diesel migration run                      28% 19/68GB
Running migration 2023-08-10-081601_create_posts
 $biezhihua: D:/Projects/github/diesel_demo on master ≢  ?8 ❯ diesel migration run                      28% 19/68GB
 $biezhihua: D:/Projects/github/diesel_demo on master ≢  ?8 ❯      

```

```bash
 $biezhihua: D:/Projects/github/diesel_demo on master ≢  ?8 ❯ diesel migration redo                     28% 19/68GB
Rolling back migration 2023-08-10-081601_create_posts
Running migration 2023-08-10-081601_create_posts
```

## Other

### what is setx in poweshell

The Setx command is a PowerShell command used to set the value of an environment variable in the Windows operating system. It is similar to the set command in Windows Command Prompt but with the added capability of setting environment variables permanently.

When you set an environment variable using Setx, it will persist even after you close the PowerShell window. This is because the value is stored in the Windows registry. This can be useful for setting variables that are used by multiple applications or scripts.

Here is the basic syntax of the Setx command:

```bash
Setx variable value
```

For example, to set the JAVA_HOME environment variable to the path C:\Program Files\Java\jdk1.8.0_111, you would use the following command:

```bash
Setx JAVA_HOME "C:\Program Files\Java\jdk1.8.0_111"
```

After running this command, the JAVA_HOME environment variable will be set permanently, and you can access it from any PowerShell or Command Prompt window on the system.
