---
article: true
---

# learn-linux

## kill target port

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