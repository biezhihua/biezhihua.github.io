---
article: true
---

# Learn | Windows && Linux

## Windows

```bash
netstat -ano | findstr :<port>
```

```bash
taskkill /F /PID <PID>
```

```bash
net stop winnat
net start winnat
```

## Linux

- kill target port

```bash
lsof -i:8702
```

```bash
➜  soda_media_tools_server git:(main) ✗ lsof -i:8702
COMMAND     PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
soda_medi 46300 root  138u  IPv4 361534      0t0  TCP localhost:8702 (LISTEN) 
```

```bash
kill 46300
```
