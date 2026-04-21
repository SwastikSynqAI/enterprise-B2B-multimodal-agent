# LinkedIn Automation Disclaimer

This software includes **optional** LinkedIn automation via Playwright browser automation.

## Use At Your Own Risk

LinkedIn's Terms of Service prohibit automated activity on their platform. By enabling LinkedIn automation in this software, you acknowledge:

- Your LinkedIn account may be restricted, limited, or permanently banned if automation is detected
- LinkedIn actively monitors for automated behavior and may take action without warning
- The authors and contributors of this project take **no responsibility** for any account actions taken by LinkedIn

## Recommended Safety Practices

If you choose to enable LinkedIn automation:

- Keep daily connection limits **low** (≤ 20 per day, configured in `config/outreach.yaml`)
- Do not run automation 24/7 — the scheduler enforces reasonable time windows
- Use a dedicated LinkedIn account rather than your primary professional account
- Review LinkedIn's current Terms of Service before enabling automation
- Monitor your account regularly for any restriction notices

## How to Enable

LinkedIn automation is **disabled by default**. Enable it during setup (`pnpm run setup`) or by editing `config/outreach.yaml`:

```yaml
linkedin:
  enabled: true
  daily_connection_limit: 15  # Keep this low
```

## Educational Purpose

This software is provided for educational and research purposes. You are solely responsible for your own usage and compliance with applicable terms of service and laws.
