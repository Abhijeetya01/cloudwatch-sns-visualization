/* ============================================================
   AWS Cloud Monitoring Lab  #BuildwithCloudmessenger
   EC2 CPU utilization -> CloudWatch alarm -> SNS email (SIMULATION)

   Structure (read top to bottom):
   1. DATA       - the nine steps, legend items, defaults
   2. LOGIC      - pure functions (no DOM) such as evaluateAlarm()
   3. STATE      - one central `state` object + functions that change it
   4. RENDER     - functions that only draw the current state
   5. EVENTS     - buttons, sliders, keyboard
   Nothing here talks to AWS or the network.
   ============================================================ */
'use strict';

/* ---------------- 1. DATA ---------------- */
const STEPS = [
  { title: 'EC2 Instance', sub: "Abhijeet launches his web server.",
    plain: "Abhijeet rents a virtual computer in the cloud to run his online shopping website. Customers visit, and the computer works harder when more people arrive, like a shop assistant serving a growing queue.",
    tech: "Amazon EC2 provides resizable virtual computing capacity. CPU utilization is the percentage of the instance's available CPU capacity that is in use.",
    watch: "Customer requests (blue dots) flow into the EC2 box and the CPU meter starts to move.",
    points: ["The instance runs Abhijeet's website.", "A high CPU percentage can mean a heavy workload, but it does not automatically mean the server is failing."],
    event: "EC2 instance i-example123 is running (simulated).",
    info: ['Monitoring starts here', '', '', '', ''] },
  { title: 'CPU Metrics', sub: 'CPU utilization becomes measurable.',
    plain: "The computer reports how busy it is, like a car dashboard sending the speed reading to a control room every few minutes.",
    tech: "EC2 publishes metrics to CloudWatch by default. CPUUtilization is a percentage metric. Basic monitoring gives 5-minute intervals for most EC2 metrics; detailed monitoring gives 1-minute intervals and may incur extra charges.",
    watch: "Purple metric packets travel from EC2 to CloudWatch. Example readings: 24%, 35%, 48%, 76%.",
    points: ["All readings in this lab are simulated educational data.", "CPUUtilization is the metric name; it is measured in percent."],
    event: "Simulated metric packets sent to CloudWatch.",
    info: ['Simulated readings', '24%  ->  35%  ->  48%  ->  76%', 'Basic monitoring: every 5 minutes', 'Detailed monitoring: every 1 minute', '(may incur additional charges)'] },
  { title: 'Amazon CloudWatch', sub: 'Metrics appear in the monitoring dashboard.',
    plain: "CloudWatch is a monitoring officer who writes down every reading and draws a graph so Abhijeet can see trends at a glance.",
    tech: "Amazon CloudWatch collects and stores metrics, shows them in graphs and dashboards, and evaluates alarms against conditions you configure. It does not automatically fix performance problems.",
    watch: "The CPU graph fills with datapoints and the dashboard below updates.",
    points: ["Metrics are stored as time-ordered datapoints.", "Seeing a metric is different from being alerted about it. Alarms come next."],
    event: "CloudWatch graph populated with CPUUtilization datapoints.",
    info: ['What CloudWatch does', 'Collects and stores metrics', 'Graphs and dashboards', 'Evaluates alarms', 'Does not fix problems by itself'] },
  { title: 'Alarm Configuration', sub: 'Set a CPU threshold and evaluation period.',
    plain: "Abhijeet tells the monitoring officer: warn me if the CPU stays above a certain level for a while.",
    tech: "A CloudWatch alarm watches one metric. The statistic, period, threshold, comparison operator and number of evaluation periods decide when its state changes. Outcome depends on that configuration and the data available, not on one sample alone.",
    watch: "A gold dashed threshold line is drawn across the CPU chart. Change the settings in the controls panel.",
    points: ["Example: CPUUtilization > 80% for 3 consecutive 5-minute periods.", "Try changing the threshold, operator and evaluation periods."],
    event: "Alarm configured. Threshold line drawn on the chart.",
    info: ['Alarm settings', 'Metric: CPUUtilization', 'Statistic: Average', '', ''] },
  { title: 'Threshold Breach', sub: 'CPU usage rises above the threshold.',
    plain: "More customers arrive and the computer gets very busy. The officer only raises the alarm if the busy period lasts as long as the rules say.",
    tech: "A threshold breach means datapoints satisfy the configured comparison. The alarm evaluates the configured window of datapoints, not how tall the graph looks.",
    watch: "CPU rises toward 92%. The meter turns red; once enough datapoints breach, the alarm changes state.",
    points: ["Use the slider or presets to change the load.", "With the default rule (3 datapoints) one high sample is not enough."],
    event: "CPU load is increasing (simulated).",
    info: ['Breach rule (simplified)', 'ALARM when the last N datapoints', 'all satisfy the condition.', 'Fewer than N datapoints', '= INSUFFICIENT_DATA.'] },
  { title: 'Alarm State', sub: 'The CloudWatch alarm changes state.',
    plain: "The alarm is like a traffic light: green when things are fine, red when the rule is broken, and grey-gold when the officer has not got enough information.",
    tech: "A CloudWatch metric alarm has three states: OK (condition not breached), ALARM (condition breached), INSUFFICIENT_DATA (not enough data to decide). An alarm can be configured to publish to an SNS topic when it enters selected states.",
    watch: "The matching state pill lights up. When the alarm enters ALARM, a red alarm signal moves toward the next component.",
    points: ["Try 'Clear metric data' to see INSUFFICIENT_DATA.", "Recovering the load returns the alarm to OK."],
    event: "Alarm state evaluated.",
    info: ['Alarm states', 'OK: not breached', 'ALARM: condition breached', 'INSUFFICIENT_DATA: not enough data', ''] },
  { title: 'Amazon SNS', sub: 'The alarm triggers a configured notification action.',
    plain: "SNS is the messenger. When the alarm shouts, the messenger carries the message to everyone on the list.",
    tech: "Amazon Simple Notification Service topics distribute published messages to subscribed endpoints. A CloudWatch alarm publishes to a topic through an alarm action. Email delivery needs a subscription that has been confirmed, and the topic must be set as the action for the relevant alarm state.",
    watch: "The alarm signal travels from the CloudWatch alarm into the SNS topic abhijeet-ec2-cpu-alerts.",
    points: ["Alarm action: publish to topic abhijeet-ec2-cpu-alerts on ALARM.", "No action configured means no notification, even if the alarm turns red."],
    event: "Alarm action published a message to the SNS topic (simulated).",
    info: ['SNS notification path', 'Alarm action -> SNS topic', 'Topic -> email subscription', 'Subscription must be confirmed', 'Topic must be the ALARM action'] },
  { title: 'Email Alert', sub: 'Abhijeet receives a simulated notification.',
    plain: "The messenger delivers a note to Abhijeet's inbox so he can react before customers notice a slow website.",
    tech: "SNS delivers the message to the confirmed email subscription. The message below is simulated and contains no real account data.",
    watch: "A teal envelope travels from SNS to Abhijeet. Then press 'Acknowledge Alert' and 'Recover Server Load'.",
    points: ["Read the simulated email in the inbox panel.", "Acknowledging is a human action. It does not change the alarm state."],
    event: "Simulated email delivered to Abhijeet.",
    info: ['Delivery', 'SNS -> email endpoint', 'Message is simulated', 'Acknowledge, then recover load', ''] },
  { title: 'Complete Architecture', sub: 'Understand the entire monitoring workflow.',
    plain: "The whole chain: computer, monitoring officer, alarm, messenger, Abhijeet. It tells him about trouble, but he still has to act.",
    tech: "EC2 -> CloudWatch Metrics -> CloudWatch Alarm -> SNS Topic -> Email Subscription -> Abhijeet. This detects and notifies. It does not reduce CPU or repair the instance; remediation or scaling needs extra configuration.",
    watch: "All components are visible with metrics, alarm signals and envelopes moving. See the summary below the legend.",
    points: ["Detect and notify only. No automatic fix.", "Next steps in real AWS: Auto Scaling, EC2 alarm actions, EventBridge, Systems Manager."],
    event: "Full workflow visible.",
    info: ['Detect and notify only', 'No automatic remediation', 'Scaling/repair needs extra', 'configuration.', ''] }
];

const LEGEND = [
  { id: 'metric', glyph: '●', color: 'var(--purple)', label: 'Metric packet', target: '.pk-metric', step: 2, desc: 'A purple dot is one CPU reading travelling from EC2 to CloudWatch. (Appears at Step 2.)' },
  { id: 'alarm', glyph: '!', color: 'var(--red)', label: 'Alarm signal', target: '.pk-alarm', step: 6, desc: 'A red dot is the alarm state-change message that the alarm sends toward SNS. (Step 6.)' },
  { id: 'env', glyph: '✉', color: 'var(--teal)', label: 'Envelope', target: '.pk-env', step: 8, desc: 'A teal envelope is the SNS email notification heading to Abhijeet. (Step 8.)' },
  { id: 'gauge', glyph: '◔', color: 'var(--blue)', label: 'CPU gauge', target: '#gaugeFill', step: 1, desc: 'The bar inside EC2 shows the current simulated CPU utilization. Green is calm, gold is busy, red is high. (Step 1.)' },
  { id: 'check', glyph: '✔', color: 'var(--green)', label: 'Green check', target: '#pillOK', step: 4, desc: 'Normal alarm state (OK) or a successfully delivered simulated notification. (Step 4.)' },
  { id: 'warn', glyph: '⚠', color: 'var(--red)', label: 'Red warning', target: '#pillALARM', step: 4, desc: 'The alarm condition is breached, so the alarm is in the ALARM state. (Step 4.)' },
  { id: 'thr', glyph: '┄', color: 'var(--gold)', label: 'Gold dashed line', target: '#mThrG', step: 4, desc: 'The configured CPU threshold. Chart values on the wrong side of this line count as breaching. (Step 4.)' },
  { id: 'chart', glyph: '∿', color: 'var(--purple)', label: 'Chart', target: '#miniChart', step: 2, desc: 'The CPU utilization history, drawn from the simulation state. (Step 2.)' },
  { id: 'cloud', glyph: '☁', color: 'var(--blue)', label: 'Cloud icon', target: '#g-cw', step: 2, desc: 'AWS cloud services: EC2, CloudWatch and SNS live in the AWS cloud, not on Abhijeet\'s laptop. (Step 1.)' }
];

const DEFAULTS = { name: 'abhijeet-ec2-high-cpu', threshold: 80, period: 300, evalPeriods: 3, operator: '>', interval: 300 };
const MAX_POINTS = 20;
const JITTER = [0, 2, -1, 1, -2, 1, 0, -1];      // deterministic "noise" so the graph feels alive
const NORMAL_HISTORY = [24, 35, 48, 76, 52, 44, 38, 41, 39, 40];
const SVGNS = 'http://www.w3.org/2000/svg';

/* ---------------- 2. LOGIC (pure, testable) ---------------- */
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

function compare(value, op, threshold) {
  switch (op) {
    case '>': return value > threshold;
    case '>=': return value >= threshold;
    case '<': return value < threshold;
    case '<=': return value <= threshold;
    default: return false;
  }
}

/* Simplified CloudWatch evaluation (N of N):
   - fewer datapoints than evalPeriods  -> INSUFFICIENT_DATA
   - every one of the last N breaches   -> ALARM
   - otherwise                          -> OK
   Real CloudWatch also supports "M out of N" and missing-data settings. */
function evaluateAlarm(samples, cfg) {
  const n = cfg.evalPeriods;
  if (samples.length < n) return 'INSUFFICIENT_DATA';
  const windowed = samples.slice(-n);
  return windowed.every(v => compare(v, cfg.operator, cfg.threshold)) ? 'ALARM' : 'OK';
}

function jitterFor(i, target) { return clamp(target + JITTER[i % JITTER.length], 0, 100); }

/* The scenario (history + target load) used when a step is selected. */
function buildHistory(step) {
  if (step === 1) return { samples: Array(10).fill(0).map((_, i) => jitterFor(i, 25)), target: 25 };
  if (step === 2) return { samples: [24, 35, 48, 76], target: 76 };
  if (step <= 4) return { samples: NORMAL_HISTORY.slice(), target: 40 };
  if (step === 5) return { samples: NORMAL_HISTORY.slice(), target: 92 };
  return { samples: NORMAL_HISTORY.slice(0, 5).concat([90, 93, 92, 94, 92]), target: 92 };
}

function levelColor(cpu) { return cpu < 60 ? 'var(--green)' : (cpu < 80 ? 'var(--gold)' : 'var(--red)'); }
function healthText(cpu) {
  if (cpu < 60) return 'Healthy: running normally';
  if (cpu < 80) return 'Busy: keep watching';
  return 'Heavy load: investigate (high CPU is not always a failure)';
}
function breachingValue(cfg) {
  const up = cfg.operator === '>' || cfg.operator === '>=';
  if (up) return clamp(cfg.threshold + 10, 0, 100);
  return clamp(cfg.threshold - 10, 0, 100);
}
function sanitizeName(s) { return String(s).replace(/[^A-Za-z0-9._-]/g, '').slice(0, 40) || DEFAULTS.name; }

/* ---------------- 3. STATE ---------------- */
let state;
const timers = { play: null, tick: null, deliver: null };
const $ = id => document.getElementById(id);
const reducedMotion = typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function createState() {
  return { step: 1, playing: false, target: 25, current: 25, history: [], tickCount: 0,
    config: Object.assign({}, DEFAULTS), alarmState: 'NOT_CONFIGURED', snsStatus: 'idle',
    acked: false, episodeSent: false, notif: null, event: '' };
}

function setEvent(text) { state.event = text; }

function pushSample(v) {
  state.history.push(v);
  if (state.history.length > MAX_POINTS) state.history.shift();
  state.current = v;
  reevaluate();
}

function reevaluate() {
  const prev = state.alarmState;
  const next = state.step >= 4 ? evaluateAlarm(state.history, state.config) : 'NOT_CONFIGURED';
  state.alarmState = next;
  if (next !== prev) onTransition(prev, next);
  maybePublish();
}

function onTransition(prev, next) {
  const c = state.config;
  if (prev === 'ALARM') state.episodeSent = false;
  if (next === 'ALARM') setEvent('OK -> ALARM: CPUUtilization ' + c.operator + ' ' + c.threshold + '% for ' + c.evalPeriods + ' datapoint(s).');
  else if (next === 'OK' && prev === 'ALARM') setEvent('ALARM -> OK: recovered. No OK action is configured, so no email is sent.');
  else if (next === 'OK') setEvent('Enough data: alarm state is OK.');
  else if (next === 'INSUFFICIENT_DATA') setEvent('Not enough datapoints: INSUFFICIENT_DATA.');
}

/* Alarm action: only after step 7 (when the SNS action exists) and once per ALARM episode. */
function maybePublish() {
  if (state.step >= 7 && state.alarmState === 'ALARM' && !state.episodeSent) {
    state.episodeSent = true;
    publish(false);
  }
}

function publish(isTest) {
  clearTimeout(timers.deliver); timers.deliver = null;
  state.snsStatus = 'published';
  state.acked = false;
  state.notif = { observed: state.current, operator: state.config.operator, threshold: state.config.threshold, alarm: state.alarmState, test: !!isTest };
  setEvent(isTest ? 'Test message published to SNS topic abhijeet-ec2-cpu-alerts.' : 'Alarm action published to SNS topic abhijeet-ec2-cpu-alerts.');
  ensureDelivery();
}

/* Email delivery is only shown from step 8 onward. */
function ensureDelivery() {
  if (state.step >= 8 && state.snsStatus === 'published' && !timers.deliver) {
    timers.deliver = setTimeout(() => {
      timers.deliver = null;
      if (state.snsStatus === 'published') { state.snsStatus = 'delivered'; setEvent('Simulated email delivered to Abhijeet.'); }
      render();
    }, 1600);
  }
}

function goToStep(n) {
  clearTimeout(timers.deliver); timers.deliver = null;
  state.step = clamp(n, 1, 9);
  const h = buildHistory(state.step);
  state.history = h.samples.slice();
  state.target = h.target;
  state.current = state.history[state.history.length - 1];
  state.tickCount = 0;
  state.snsStatus = 'idle'; state.acked = false; state.episodeSent = false; state.notif = null;
  state.alarmState = state.step >= 4 ? evaluateAlarm(state.history, state.config) : 'NOT_CONFIGURED';
  setEvent(STEPS[state.step - 1].event);
  maybePublish();
  ensureDelivery();
  if (state.playing) schedulePlay();
  render();
}

function tick() {
  state.tickCount++;
  pushSample(jitterFor(state.tickCount, state.target));
  render();
}
function restartTick() {
  clearInterval(timers.tick);
  const base = state.config.interval === 60 ? 800 : 1600;
  timers.tick = setInterval(() => { if (!document.hidden) tick(); }, reducedMotion ? base + 600 : base);
}

/* Load changes */
function applyLoad(v) {
  state.target = clamp(v, 0, 100);
  setEvent('Simulated CPU load set to ' + state.target + '%.');
  pushSample(state.target);
  render();
}
function simulateAlarm() {
  if (state.step < 6) { goToStep(6); setEvent('Alarm simulated: showing a configured alarm in ALARM state.'); render(); return; }
  const c = state.config, v = breachingValue(c);
  state.target = v;
  if (!compare(v, c.operator, c.threshold)) { setEvent('This threshold/operator cannot be breached by a value in 0-100%. Change the configuration.'); render(); return; }
  for (let i = 0; i < c.evalPeriods; i++) pushSample(v);
  render();
}
function sendTest() {
  if (state.step < 8) { goToStep(8); }
  publish(true);
  render();
}
function acknowledge() {
  if (state.snsStatus !== 'delivered') { setEvent('Nothing to acknowledge yet. Wait for the simulated email to be delivered (Step 8).'); render(); return; }
  state.acked = true; setEvent('Alert acknowledged by Abhijeet (does not change the alarm state).'); render();
}
function recover() {
  state.target = 25;
  setEvent('Server load recovered to 25%.');
  const n = Math.max(1, state.config.evalPeriods);
  for (let i = 0; i < n; i++) pushSample(25);
  render();
}
function clearData() {
  state.history = []; state.current = 0;
  state.episodeSent = false;
  reevaluate();
  setEvent('Metric data cleared. Waiting for new datapoints.');
  render();
}

/* Playback */
function schedulePlay() {
  clearTimeout(timers.play);
  if (!state.playing) return;
  timers.play = setTimeout(() => {
    if (state.step < 9) goToStep(state.step + 1);
    else { pause(); setEvent('Auto-play finished.'); render(); }
  }, 5000);
}
function play() { if (state.playing) return; if (state.step === 9) goToStep(1); state.playing = true; schedulePlay(); render(); }
function pause() { state.playing = false; clearTimeout(timers.play); timers.play = null; render(); }
function reset() {
  pause();
  state.config = Object.assign({}, DEFAULTS);
  syncControls();
  restartTick();
  goToStep(1);
}

/* ---------------- 4. RENDER ---------------- */
function setText(id, t) { const el = $(id); if (el) el.textContent = t; }
function pointsFor(samples, x0, y0, w, h) {
  return samples.map((v, i) => [x0 + i * (w / (MAX_POINTS - 1)), y0 + h - (v / 100) * h]);
}
function drawChart(p, x0, y0, w, h) {
  const pts = pointsFor(state.history, x0, y0, w, h);
  const str = pts.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ');
  $(p + 'Line').setAttribute('points', str);
  if (pts.length) {
    const last = pts[pts.length - 1], first = pts[0];
    $(p + 'Area').setAttribute('points', str + ' ' + last[0].toFixed(1) + ',' + (y0 + h) + ' ' + first[0].toFixed(1) + ',' + (y0 + h));
    $(p + 'Dot').setAttribute('cx', last[0]); $(p + 'Dot').setAttribute('cy', last[1]);
    $(p + 'Dot').style.display = '';
    $(p + 'Dot').style.fill = levelColor(state.current);
  } else {
    $(p + 'Area').setAttribute('points', ''); $(p + 'Dot').style.display = 'none';
  }
  const ty = y0 + h - (state.config.threshold / 100) * h;
  const thr = $(p === 'm' ? 'mThr' : 'dThr2'), lbl = $(p === 'm' ? 'mThrLbl' : 'dThrLbl');
  thr.setAttribute('y1', ty); thr.setAttribute('y2', ty);
  lbl.setAttribute('y', ty - 6 < y0 + 8 ? ty + 14 : ty - 6);
  lbl.textContent = state.config.operator + ' ' + state.config.threshold + '%';
}

function renderNodes() {
  document.querySelectorAll('.node').forEach(el => {
    const min = Number(el.getAttribute('data-min'));
    const visible = state.step >= min;
    if (visible && !el.classList.contains('show')) {
      el.classList.add('show');
      if (!reducedMotion) { el.classList.add('fresh'); setTimeout(() => el.classList.remove('fresh'), 1700); }
    } else if (!visible) { el.classList.remove('show', 'fresh'); }
    // Step 6 shows SNS only as a faded preview of "the next component".
    if (el.id === 'g-sns') el.classList.toggle('dim', state.step === 6);
    if (el.id === 'w4' || el.id === 'g-sns') el.classList.toggle('dim', state.step === 6);
  });
}

function renderPackets() {
  const animOk = !reducedMotion && typeof SVGAnimateMotionElement !== 'undefined';
  const svg = $('diagram');
  svg.classList.toggle('anim-on', animOk);
  const speed = (2.8 - state.current / 50).toFixed(2) + 's';
  $('amReq1').setAttribute('dur', speed); $('amReq2').setAttribute('dur', speed);
  document.querySelectorAll('#packets .packet').forEach(g => {
    const min = Number(g.getAttribute('data-min')), needs = g.getAttribute('data-needs');
    let on = state.step >= min;
    if (needs === 'alarm') on = on && state.alarmState === 'ALARM';
    if (needs === 'env') on = on && state.snsStatus !== 'idle' && !state.acked;
    g.classList.toggle('on', on);
  });
}

function stateBadge() {
  switch (state.alarmState) {
    case 'OK': return ['OK', 'ok'];
    case 'ALARM': return ['ALARM', 'alarm'];
    case 'INSUFFICIENT_DATA': return ['INSUFFICIENT_DATA', 'insufficient'];
    default: return ['Not configured yet', ''];
  }
}
function snsLabel() {
  const s = state.snsStatus;
  if (s === 'idle') return state.step >= 7 ? 'Idle: no message published yet' : 'Not configured yet';
  if (s === 'published') return 'Published to topic' + (state.step >= 8 ? ', delivering...' : ' (email delivery at Step 8)');
  return 'Delivered to email (simulated)' + (state.acked ? ' · Acknowledged' : '');
}

function renderDiagram() {
  const c = state.config, cpu = Math.round(state.current);
  renderNodes(); renderPackets();
  setText('gaugeTxt', 'CPU ' + cpu + '%');
  const fill = $('gaugeFill'); fill.setAttribute('width', Math.max(4, 194 * cpu / 100)); fill.style.fill = levelColor(cpu);
  setText('ec2Health', healthText(cpu).split(':')[0]);
  setText('mLatest', 'Latest: ' + (state.history.length ? cpu + '%' : 'no data') + ' (simulated)');
  drawChart('m', 415, 125, 280, 150);
  const info = STEPS[state.step - 1].info; // step-specific text for the info panel
  setText('infoTitle', info[0] || 'Info');
  for (let i = 1; i <= 5; i++) setText('info' + i, info[i] || '');
  setText('alarmNameTxt', c.name);
  setText('condTxt', 'CPUUtilization ' + c.operator + ' ' + c.threshold + '% · ' + c.evalPeriods + 'x' + (c.period / 60) + ' min');
  const st = state.alarmState;
  $('pillOK').firstElementChild.setAttribute('class', 'pill' + (st === 'OK' ? ' on-ok' : ''));
  $('pillALARM').firstElementChild.setAttribute('class', 'pill' + (st === 'ALARM' ? ' on-alarm' : ''));
  $('pillID').firstElementChild.setAttribute('class', 'pill' + (st === 'INSUFFICIENT_DATA' ? ' on-id' : ''));
  const ic = $('aiCircle'), gl = $('aiGlyph');
  ic.setAttribute('fill', st === 'ALARM' ? '#ef4444' : (st === 'INSUFFICIENT_DATA' ? '#ffb020' : '#22c55e'));
  gl.textContent = st === 'ALARM' ? '!' : (st === 'INSUFFICIENT_DATA' ? '?' : '✔');
  setText('snsTxt', 'Status: ' + (state.snsStatus === 'idle' ? 'idle' : (state.snsStatus === 'published' ? 'published' : 'delivered')));
  const fresh = state.snsStatus === 'delivered' && !state.acked;
  setText('inboxTxt', fresh ? 'Inbox: 1 new alert' : (state.snsStatus === 'delivered' ? 'Inbox: 1 read' : 'Inbox: 0 new'));
}

function renderDashboard() {
  const c = state.config, cpu = Math.round(state.current);
  setText('dCpu', state.history.length ? cpu + '%' : 'No data');
  $('dCpu').style.color = levelColor(cpu);
  setText('dThr', state.step >= 4 ? c.operator + ' ' + c.threshold + '%' : 'Not set');
  const b = stateBadge(), badge = $('dState');
  badge.textContent = b[0]; badge.className = 'badge' + (b[1] ? ' ' + b[1] : '');
  setText('dHealth', healthText(cpu));
  setText('dSns', snsLabel());
  setText('dEvent', state.event);
  drawChart('d', 40, 15, 540, 170);
}

function renderCaption() {
  const s = STEPS[state.step - 1];
  setText('capTitle', 'Step ' + state.step + ': ' + s.title);
  setText('capPlain', s.plain); setText('capTech', s.tech); setText('capWatch', s.watch);
  const ul = $('capPoints'); ul.textContent = '';
  s.points.forEach(p => { const li = document.createElement('li'); li.textContent = p; ul.appendChild(li); });
}

function renderSidebar() {
  document.querySelectorAll('.step-btn').forEach((btn, i) => {
    if (i + 1 === state.step) btn.setAttribute('aria-current', 'step'); else btn.removeAttribute('aria-current');
    btn.classList.toggle('done', i + 1 < state.step);
  });
}

function renderInbox() {
  const mail = $('mail'), empty = $('inboxEmpty');
  const show = state.notif && state.step >= 8 && state.snsStatus === 'delivered';
  mail.hidden = !show; empty.hidden = !!show;
  if (!show) { empty.textContent = (state.notif && state.step >= 8) ? 'Message is being delivered...' : 'No notification yet. Reach Step 8, or press "Send Test Notification".'; return; }
  const n = state.notif;
  setText('mailSubject', n.test ? 'TEST: SNS notification from CloudWatch alarm (simulated)' : 'ALERT: EC2 CPU Utilization High');
  setText('mailBody', (n.test ? 'This is a test notification. No real alarm fired.\n\n' : 'Your EC2 instance has exceeded the configured CPU utilization threshold.\n\n') +
    'Instance: i-example123\nMetric: CPUUtilization\nObserved CPU: ' + Math.round(n.observed) + '%\nConfigured threshold: ' + n.operator + ' ' + n.threshold + '%\nAlarm state: ' + (n.test ? state.alarmState : n.alarm) +
    '\n\nPlease investigate the workload and take appropriate action.\n\n[SIMULATED MESSAGE: generated locally in your browser]');
  $('mailAck').hidden = !state.acked;
}

function renderControls() {
  const c = state.config;
  $('playBtn').disabled = state.playing; $('pauseBtn').disabled = !state.playing;
  $('prevBtn').disabled = state.step === 1; $('nextBtn').disabled = state.step === 9;
  $('playBtn').setAttribute('aria-pressed', String(state.playing));
  setText('stepCounter', 'Step ' + state.step + ' of 9' + (state.playing ? ' (playing)' : ''));
  $('cpuSlider').value = Math.round(state.current); setText('cpuOut', Math.round(state.current) + '%');
  $('ackBtn').disabled = !(state.snsStatus === 'delivered' && !state.acked);
  const per = c.period / 60, mins = c.evalPeriods * per;
  let note = 'Rule: ALARM when the last ' + c.evalPeriods + ' datapoint(s) (' + per + '-min Average each) are ' + c.operator + ' ' + c.threshold + '%. A sustained breach of about ' + mins + ' simulated minute(s) is needed, so one high sample is not enough unless the evaluation periods are set to 1.';
  if (c.period < c.interval) note += ' Warning: the alarm period (' + per + ' min) is shorter than the metric interval (' + (c.interval / 60) + ' min); in real AWS this can cause gaps and INSUFFICIENT_DATA. The simulation does not model gaps.';
  setText('configNote', note);
  $('summary').hidden = state.step < 9;
}

function render() { renderSidebar(); renderCaption(); renderDiagram(); renderDashboard(); renderInbox(); renderControls(); }

/* Copy config values into the form fields (used at start and on reset). */
function syncControls() {
  const c = state.config;
  $('alarmName').value = c.name; $('thrSlider').value = c.threshold; setText('thrOut', c.threshold + '%');
  $('operator').value = c.operator; $('period').value = String(c.period);
  $('evalPeriods').value = c.evalPeriods; $('interval').value = String(c.interval);
}

/* ---------------- 5. EVENTS ---------------- */
function buildSidebar() {
  const ol = $('stepList');
  STEPS.forEach((s, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'step-btn';
    const num = document.createElement('span'); num.className = 'num'; num.textContent = String(i + 1);
    const wrap = document.createElement('span');
    const t = document.createElement('span'); t.className = 't'; t.textContent = s.title;
    const sub = document.createElement('span'); sub.className = 's'; sub.textContent = s.sub;
    wrap.appendChild(t); wrap.appendChild(sub); b.appendChild(num); b.appendChild(wrap);
    b.addEventListener('click', () => goToStep(i + 1));
    li.appendChild(b); ol.appendChild(li);
  });
}

function buildLegend() {
  const box = $('legendList');
  LEGEND.forEach(item => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'legend-btn'; b.setAttribute('aria-pressed', 'false');
    const g = document.createElement('span'); g.className = 'g'; g.style.color = item.color; g.setAttribute('aria-hidden', 'true'); g.textContent = item.glyph;
    const l = document.createElement('span'); l.textContent = item.label;
    b.appendChild(g); b.appendChild(l);
    b.addEventListener('click', () => {
      box.querySelectorAll('.legend-btn').forEach(x => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true');
      setText('legendDesc', item.label + ': ' + item.desc);
      document.querySelectorAll(item.target).forEach(el => { el.classList.remove('flash'); void el.getBoundingClientRect(); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1900); });
    });
    box.appendChild(b);
  });
}

function buildParticles() {
  if (reducedMotion) return;
  const host = $('particles');
  for (let i = 0; i < 26; i++) {
    const p = document.createElement('i');
    p.style.left = (i * 37 % 100) + '%'; p.style.top = (60 + (i * 53 % 50)) + '%';
    p.style.animationDuration = (14 + (i % 7) * 3) + 's'; p.style.animationDelay = (-(i % 9) * 2) + 's';
    host.appendChild(p);
  }
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = $('themeBtn');
  btn.textContent = theme === 'dark' ? 'Light theme' : 'Dark theme';
  btn.setAttribute('aria-pressed', String(theme === 'light'));
  try { localStorage.setItem('cwlab-theme', theme); } catch (e) { /* storage may be blocked: ignore */ }
}

function bindEvents() {
  $('playBtn').addEventListener('click', play);
  $('pauseBtn').addEventListener('click', pause);
  $('resetBtn').addEventListener('click', reset);
  $('prevBtn').addEventListener('click', () => goToStep(state.step - 1));
  $('nextBtn').addEventListener('click', () => goToStep(state.step + 1));
  $('themeBtn').addEventListener('click', () => setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));

  const slider = $('cpuSlider');
  slider.addEventListener('input', () => { state.target = Number(slider.value); state.current = state.target; setText('cpuOut', slider.value + '%'); renderDiagram(); renderDashboard(); });
  slider.addEventListener('change', () => applyLoad(Number(slider.value)));
  document.querySelectorAll('[data-load]').forEach(b => b.addEventListener('click', () => applyLoad(Number(b.getAttribute('data-load')))));

  const cfgChanged = () => { reevaluate(); render(); };
  $('alarmName').addEventListener('input', e => { state.config.name = sanitizeName(e.target.value); renderDiagram(); });
  $('thrSlider').addEventListener('input', e => { state.config.threshold = Number(e.target.value); setText('thrOut', e.target.value + '%'); setEvent('Threshold changed to ' + e.target.value + '%.'); cfgChanged(); });
  $('operator').addEventListener('change', e => { state.config.operator = e.target.value; setEvent('Operator changed to ' + e.target.value + '.'); cfgChanged(); });
  $('period').addEventListener('change', e => { state.config.period = Number(e.target.value); cfgChanged(); });
  $('evalPeriods').addEventListener('change', e => { state.config.evalPeriods = clamp(parseInt(e.target.value, 10) || 1, 1, 5); e.target.value = state.config.evalPeriods; setEvent('Evaluation periods set to ' + state.config.evalPeriods + '.'); cfgChanged(); });
  $('interval').addEventListener('change', e => { state.config.interval = Number(e.target.value); restartTick(); cfgChanged(); });

  $('simAlarmBtn').addEventListener('click', simulateAlarm);
  $('testBtn').addEventListener('click', sendTest);
  $('ackBtn').addEventListener('click', acknowledge);
  $('recoverBtn').addEventListener('click', recover);
  $('clearBtn').addEventListener('click', clearData);

  document.addEventListener('keydown', e => {
    const tag = (e.target && e.target.tagName) || '';
    if (/INPUT|SELECT|TEXTAREA/.test(tag)) return;
    if (e.key === 'ArrowRight' && state.step < 9) goToStep(state.step + 1);
    if (e.key === 'ArrowLeft' && state.step > 1) goToStep(state.step - 1);
  });
  // Do not run auto-play while the tab is hidden
  document.addEventListener('visibilitychange', () => { if (document.hidden && state.playing) pause(); });
}

function init() {
  state = createState();
  buildSidebar(); buildLegend(); buildParticles(); bindEvents();
  let theme = 'dark';
  try { theme = localStorage.getItem('cwlab-theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'); } catch (e) { /* ignore */ }
  setTheme(theme);
  if (reducedMotion) document.body.classList.add('reduced');
  syncControls(); restartTick(); goToStep(1);
}

if (typeof document !== 'undefined') init();
if (typeof module !== 'undefined') module.exports = { evaluateAlarm, compare, buildHistory, jitterFor, breachingValue, sanitizeName };
