# Cloudwatch-sns-on-ec2-monitoring-cpu-utilization-projects-visual

**#BuildwithCloudmessenger**

> Educational simulation only. No live AWS resources are created or monitored.

## 1. Project overview
An animated, interactive, beginner-friendly web lab that explains **EC2 CPU utilization monitoring with Amazon CloudWatch alarms and Amazon SNS email notifications**. It continues Abhijeet's cloud learning story: his online shop runs on EC2, traffic grows, and he needs an alert before the site slows down. Built with plain HTML, CSS, JavaScript and inline SVG. No libraries, build step, AWS account or credentials.

## 2. Learning objectives
- Explain what EC2 CPU utilization is and what it does (and does not) tell you.
- Describe basic (5-minute) vs detailed (1-minute, may incur charges) monitoring.
- Configure alarm threshold, period, evaluation periods and operator conceptually.
- Distinguish the alarm states OK, ALARM and INSUFFICIENT_DATA.
- Explain how an alarm action publishes to an SNS topic and why an email subscription must be confirmed.
- State clearly that this design detects and notifies, but does not remediate.

## 3. AWS services explained
| Service | Story role | Purpose |
|---|---|---|
| Amazon EC2 | Abhijeet's virtual computer | Runs the shopping website, publishes `CPUUtilization` |
| Amazon CloudWatch | Monitoring officer | Stores metrics, draws graphs, evaluates alarms |
| Amazon SNS | Notification messenger | Topic `abhijeet-ec2-cpu-alerts` delivers to an email subscription |

## 4. The nine learning steps
1. **EC2 Instance** – Abhijeet launches his web server.
2. **CPU Metrics** – CPU utilization becomes measurable (24%, 35%, 48%, 76% simulated).
3. **CloudWatch** – Metrics appear in the monitoring dashboard.
4. **Alarm Configuration** – Set threshold, period, evaluation periods, operator.
5. **Threshold Breach** – CPU rises above the threshold.
6. **Alarm State** – The alarm changes state.
7. **Amazon SNS** – The alarm action publishes to the topic.
8. **Email Alert** – Abhijeet receives a simulated notification.
9. **Complete Architecture** – Full workflow plus troubleshooting points.

Clicking a step reveals every component up to that step and rebuilds that step's scenario.

## 5. Architecture flow
`EC2 Instance → CloudWatch Metrics → CloudWatch Alarm → Amazon SNS Topic → Email Subscription → Abhijeet`

## 6. Moving-object legend
Metric packet (purple), Alarm signal (red), Envelope (teal), CPU gauge, Green check (OK/delivered), Red warning (ALARM), Gold dashed line (threshold), Chart, Cloud icon. Each legend item is a button that explains the object and highlights it in the diagram.

## 7. Interactive controls
Play / Pause / Reset / Previous / Next, step selection, CPU slider, presets (Normal 25%, Moderate 55%, High 85%, Critical 96%), alarm name, threshold, operator, period, evaluation periods, sampling interval, **Simulate Alarm**, **Send Test Notification**, **Acknowledge Alert**, **Recover Server Load**, **Clear metric data** (shows INSUFFICIENT_DATA), light/dark toggle, Left/Right arrow keys. Auto-play advances every 5 seconds. Reduced-motion preferences are respected (no packet animation, particles or glow).

## 8. Prerequisites
Any modern browser. For local serving: Python 3. Optional: Node.js for `node --check js/app.js`.

## 9. Local setup
```bash
cd cloudwatch-sns-ec2-cpu-monitoring-visual
python3 -m http.server 8000
```
Open `http://localhost:8000`.

## 10. GitHub repository setup
```bash
git init
git add .
git commit -m "Add CloudWatch + SNS EC2 CPU monitoring visual"
git branch -M main
git remote add origin https://github.com/<your-username>/Cloudwatch-sns-on-ec2-monitoring-cpu-utilization-projects-visual.git
git push -u origin main
```

## 11. GitHub Pages deployment
1. Push the project to GitHub (files at the repository root).
2. Open **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`, then Save.
3. Visit `https://<your-username>.github.io/<repository-name>/` after the build completes.

`.nojekyll` is included so GitHub Pages serves the files as-is.

## 12. Folder structure
```
cloudwatch-sns-ec2-cpu-monitoring-visual/
├── index.html
├── css/style.css
├── js/app.js
├── .nojekyll
├── LICENSE
└── README.md
```

## 13. Customization guide
- **Story text and steps:** edit the `STEPS` array in `js/app.js`.
- **Legend:** edit `LEGEND`.
- **Defaults** (threshold, periods): edit `DEFAULTS`.
- **Colours and fonts:** CSS variables at the top of `css/style.css`.
- **Alarm rules:** `evaluateAlarm()` is a pure function; change it and test with Node (`require('./js/app.js')`).
- **Diagram:** edit the SVG in `index.html`; reveal timing is the `data-min` attribute.

## 14. Technical accuracy notes and simulation limitations
- All data is simulated. Nothing connects to CloudWatch, SNS or any AWS API.
- EC2 basic monitoring publishes most metrics every 5 minutes; detailed monitoring is 1 minute and may incur charges.
- Real alarms use a statistic, period, threshold, operator, evaluation periods and datapoints-to-alarm (M out of N), plus missing-data treatment. This lab uses a simplified **N of N** rule: ALARM when the last N datapoints all breach; INSUFFICIENT_DATA when fewer than N exist; otherwise OK.
- The lab ticks one datapoint per second or two for teaching; it does not simulate real elapsed minutes or missing data.
- SNS email requires a confirmed subscription and the topic must be configured as an alarm action. The OK transition has no action in this lab, so recovery sends no email.
- The email shown is fabricated locally. `i-example123` and `abhijeet@example.com` are placeholders.
- This design detects and notifies. It does not lower CPU or repair the instance.

## 15. Suggested improvements for a real AWS implementation
- Create the alarm and SNS topic with CloudFormation/Terraform; confirm the email subscription.
- Use datapoints-to-alarm (e.g. 3 of 5) and tune missing-data handling.
- Add OK and INSUFFICIENT_DATA actions where useful.
- Enable detailed monitoring only if 1-minute resolution justifies the cost.
- Add remediation: Auto Scaling, EC2 alarm actions, EventBridge + Lambda or Systems Manager.
- Add CloudWatch Logs, status check alarms, memory/disk metrics via the CloudWatch agent.

## 16. Screenshots
_Screenshots not generated. Add your own:_
- `docs/screenshots/step-1.png` (placeholder)
- `docs/screenshots/step-6-alarm.png` (placeholder)
- `docs/screenshots/step-9-architecture.png` (placeholder)

## 17. License
See `LICENSE`. It is a **placeholder**: the EduBridge license terms were not provided, so replace it with the correct text before publishing.

## 18. Branding
**#BuildwithCloudmessenger**
