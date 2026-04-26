# Local Systemd Service

This project includes a user-level systemd unit for always-on local development:

- Unit file (repo): `ops/systemd/linguistpro-dev.service`
- Unit name (installed): `linguistpro-dev.service`
- Default URL: `http://127.0.0.1:3001`

## Install / Enable

```bash
mkdir -p ~/.config/systemd/user
install -m 644 /home/pardus/Hosting/linguistpro/ops/systemd/linguistpro-dev.service ~/.config/systemd/user/linguistpro-dev.service
systemctl --user daemon-reload
systemctl --user enable --now linguistpro-dev.service
```

## Manage

```bash
systemctl --user status linguistpro-dev.service
systemctl --user restart linguistpro-dev.service
systemctl --user stop linguistpro-dev.service
journalctl --user -u linguistpro-dev.service -f
```

## Notes

1. This runs `npm run dev` continuously.
2. Code changes are picked up automatically by Vite HMR.
3. If dependencies/scripts change, restart the service.
