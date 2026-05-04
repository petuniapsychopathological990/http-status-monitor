# Automation

## cron

The simplest production setup: run with `--once` from cron and let the OS handle scheduling.

```cron
0 * * * * cd /opt/http-status-monitor && tsx http-status-monitor.mts --once --urls-file ./urls.txt >> ./data/cron.log 2>&1
```

This runs once per hour. Logs go to `./data/cron.log`. State files accumulate in `./data/state/`.

## systemd timer

Alternatively, a systemd timer gives you better logging and restart semantics.

`/etc/systemd/system/http-status-monitor.service`:

```ini
[Unit]
Description=http-status-monitor

[Service]
Type=oneshot
WorkingDirectory=/opt/http-status-monitor
ExecStart=tsx http-status-monitor.mts --once --urls-file ./urls.txt
StandardOutput=append:/var/log/http-status-monitor.log
StandardError=append:/var/log/http-status-monitor.log
```

`/etc/systemd/system/http-status-monitor.timer`:

```ini
[Unit]
Description=Run http-status-monitor hourly

[Timer]
OnCalendar=hourly
Persistent=true

[Install]
WantedBy=timers.target
```

Enable:

```sh
systemctl enable --now http-status-monitor.timer
```

## CI/CD smoke test

Run after each deploy to catch regressions before they reach users. The exit code is 0 even if changes are detected, so pipe through a check on stdout if you want to fail the pipeline on change:

```sh
output=$(tsx http-status-monitor.mts --once --urls "https://your-site.com/")
if echo "$output" | grep -q '\[CHANGED\]'; then
  echo "Status changed after deploy:"
  tsx http-status-monitor.mts --once --diff --urls "https://your-site.com/"
  exit 1
fi
```

## Watch mode as a daemon

The built-in watch mode works for development or low-stakes monitoring:

```sh
tsx http-status-monitor.mts --urls-file ./urls.txt --interval 300 --verbose
```

For production, prefer `--once` + cron/systemd. The watch loop holds a Node.js process open indefinitely and doesn't handle SIGTERM gracefully.
