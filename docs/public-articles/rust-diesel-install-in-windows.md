# Install Diesel-Cli For Rust In Windwos 11 

## install MySQL for Windows 11

install exe: https://dev.mysql.com/downloads/installer/

```bash
setx MYSQLCLIENT_LIB_DIR "C:\Program Files\MySQL\MySQL Server 8.0\lib"  
```

## Install PostgreSQL for Windows 11

install exe: https://www.postgresql.org/download/windows/

```bash
setx PQ_LIB_DIR "C:\Program Files\PostgreSQL\15\lib"  
```

## install Sqlite for Windwos 11

install: https://www.sqlite.org/download.html

- https://www.c-sharpcorner.com/article/how-to-install-sqlite-on-windows-11/


## install Diesel-Cli

```bash
cargo install diesel_cli   

....

Finished release [optimized] target(s) in 20.59s
Replacing C:\Users\biezhihua\.cargo\bin\diesel.exe
Replaced package `diesel_cli v2.1.0` with `diesel_cli v2.1.0` (executable `diesel.exe`)
```

## other

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