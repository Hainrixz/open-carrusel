---
description: Stop the local Open Carrusel dev server (defaults to :3100, accepts a port arg).
argument-hint: [port]
allowed-tools: Bash(lsof *), Bash(kill *), Bash(echo *)
---

Port to stop: $ARGUMENTS (defaults to 3100 if empty).

Run:

```bash
PORT=${ARGUMENTS:-3100}
PIDS=$(lsof -ti :$PORT 2>/dev/null)
if [ -n "$PIDS" ]; then
  echo "$PIDS" | xargs kill 2>/dev/null && echo "Stopped server on :$PORT (PIDs: $PIDS)."
else
  echo "Nothing was running on :$PORT."
fi
```
