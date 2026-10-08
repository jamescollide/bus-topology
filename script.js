(() => {

  const canvas = document.getElementById('simCanvas');

  const ctx = canvas.getContext('2d');

  const srcSelect = document.getElementById('srcNode');

  const destSelect = document.getElementById('destNode');

  const sendBtn = document.getElementById('sendBtn');

  const faultToggle = document.getElementById('faultToggle');

  // UPDATED COMPUTER NAMES
  const names = [

    'James PC',

    'Jaffier PC',

    'Izzat PC',

    'Jerome PC'

  ];

  let nodes = [];

  let broken = false;

  let packet = null;

  let logItems = [];

  let dpr = 1;

  const colors = {

    cyan: '#75e2cd',

    lime: '#c3f36b',

    muted: '#718079',

    text: '#e8efeb',

    red: '#ff746e',

    amber: '#f4bd62'

  };

  const resize = () => {

    const r = canvas.getBoundingClientRect();

    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(r.width * dpr);

    canvas.height = Math.round(r.height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    layoutNodes();

  };

  function layoutNodes() {

    const w = canvas.clientWidth;

    const pad = Math.max(47, w * .085);

    const gap = (w - 2 * pad) / 3;

    nodes = names.map((name, i) => ({

      name,

      x: pad + i * gap

    }));

  }

  function log(message, type = '') {

    const now = new Date();

    const time = now.toLocaleTimeString([], {

      hour: '2-digit',

      minute: '2-digit',

      second: '2-digit',

      hour12: false

    });

    logItems.unshift({

      time,

      message,

      type

    });

    logItems = logItems.slice(0, 5);

    renderLog();

  }

  function renderLog() {

    const list = document.getElementById('logList');

    if (!logItems.length) {

      list.innerHTML =

        '<div class="empty-log">Waiting for network activity…</div>';

      return;

    }

    list.innerHTML = logItems.map(item => `

      <div class="log-entry">

        <span class="log-time">${item.time}</span>

        <span class="${item.type}">${item.message}</span>

      </div>

    `).join('');

  }

  function setStatus(text) {

    const el = document.getElementById('faultState');

    el.classList.toggle('down', broken);

    el.innerHTML = `<i class="dot"></i> ${text}`;

    document.getElementById('networkMetric').textContent =

      broken ? 'Split' : 'Online';

    document.getElementById('networkMetric').style.color =

      broken ? colors.red : '';

    document.getElementById('nodeMetric').innerHTML =

      broken

        ? '02 <small>/ 04</small>'

        : '04 <small>/ 04</small>';

  }

  function updateRoute() {

    document.getElementById('routeFrom').textContent =

      names[+srcSelect.value];

    document.getElementById('routeTo').textContent =

      names[+destSelect.value];

  }

  function drawNode(node, i, w, busY, selected) {

    const x = node.x;

    const y = busY - 111;

    const active =

      packet &&

      Math.round(packet.x) === i;

    ctx.save();

    ctx.strokeStyle =

      broken && ((i < 2) !== (node.x < (w / 2)))

        ? colors.red

        : '#52615a';

    ctx.lineWidth = 1.5;

    ctx.setLineDash([3, 4]);

    ctx.beginPath();

    ctx.moveTo(x, y + 28);

    ctx.lineTo(x, busY);

    ctx.stroke();

    ctx.setLineDash([]);

    ctx.fillStyle = colors.lime;

    ctx.beginPath();

    ctx.arc(x, busY, 3.5, 0, Math.PI * 2);

    ctx.fill();

    const bw = 70;

    const bh = 56;

    ctx.shadowColor =

      active ? '#c3f36b80' : 'transparent';

    ctx.shadowBlur =

      active ? 18 : 0;

    ctx.fillStyle =

      selected ? '#263526' : '#17211d';

    ctx.strokeStyle =

      selected ? colors.lime : '#3b4942';

    ctx.lineWidth = 1;

    roundRect(

      x - bw / 2,

      y - bh / 2,

      bw,

      bh,

      9

    );

    ctx.fill();

    ctx.stroke();

    ctx.shadowBlur = 0;

    ctx.fillStyle = '#0e1713';

    roundRect(

      x - bw / 2 + 6,

      y - bh / 2 + 6,

      bw - 12,

      bh - 19,

      5

    );

    ctx.fill();

    ctx.strokeStyle =

      active ? colors.lime : '#536159';

    ctx.lineWidth = 1.1;

    ctx.beginPath();

    ctx.moveTo(x - 6, y + 12);

    ctx.lineTo(x + 6, y + 12);

    ctx.moveTo(x, y + 12);

    ctx.lineTo(x, y + 17);

    ctx.moveTo(x - 11, y + 17);

    ctx.lineTo(x + 11, y + 17);

    ctx.stroke();

    ctx.textAlign = 'center';

    ctx.font = '500 9px "DM Mono", monospace';

    ctx.fillStyle = colors.text;

    // UPDATED CANVAS LABEL
    ctx.fillText(

      node.name,

      x,

      y - bh / 2 - 9

    );

    ctx.font = '9px "DM Mono", monospace';

    ctx.fillStyle = '#77857d';

    ctx.fillText(

      `.0${i + 1}`,

      x,

      y + bh / 2 + 13

    );

    ctx.restore();

  }

  function roundRect(x, y, w, h, r) {

    ctx.beginPath();

    ctx.roundRect(x, y, w, h, r);

  }

  function draw() {

    const w = canvas.clientWidth;

    const h = canvas.clientHeight;

    if (!w || !h) {

      requestAnimationFrame(draw);

      return;

    }

    ctx.clearRect(0, 0, w, h);

    const busY = h * .68;

    layoutNodes();

    // Faint measurement grid
    ctx.strokeStyle = '#1e2a25';

    ctx.lineWidth = 1;

    for (let x = 20; x < w; x += 40) {

      ctx.beginPath();

      ctx.moveTo(x, 15);

      ctx.lineTo(x, h - 18);

      ctx.stroke();

    }

    for (let y = 20; y < h; y += 40) {

      ctx.beginPath();

      ctx.moveTo(12, y);

      ctx.lineTo(w - 12, y);

      ctx.stroke();

    }

    const left = nodes[0].x - 31;

    const right = nodes[3].x + 31;

    const mid = (left + right) / 2;

    ctx.lineWidth = 3;

    ctx.lineCap = 'round';

    ctx.strokeStyle =

      broken ? colors.red : colors.cyan;

    ctx.shadowColor =

      broken ? '#ff746e33' : '#75e2cd33';

    ctx.shadowBlur = 10;

    ctx.beginPath();

    ctx.moveTo(left, busY);

    ctx.lineTo(

      broken ? mid - 10 : right,

      busY

    );

    ctx.stroke();

    if (broken) {

      ctx.beginPath();

      ctx.moveTo(mid + 10, busY);

      ctx.lineTo(right, busY);

      ctx.stroke();

      ctx.shadowBlur = 0;

      ctx.strokeStyle = colors.red;

      ctx.lineWidth = 2;

      ctx.beginPath();

      ctx.moveTo(

        mid - 5,

        busY - 8

      );

      ctx.lineTo(

        mid + 5,

        busY + 8

      );

      ctx.moveTo(

        mid + 5,

        busY - 8

      );

      ctx.lineTo(

        mid - 5,

        busY + 8

      );

      ctx.stroke();

      ctx.fillStyle = colors.red;

      ctx.textAlign = 'center';

      ctx.font = '9px "DM Mono", monospace';

      ctx.fillText(

        'CABLE BREAK',

        mid,

        busY + 25

      );

    }

    ctx.shadowBlur = 0;

    // Terminators
    ctx.fillStyle = '#43524a';

    ctx.fillRect(

      left - 4,

      busY - 8,

      7,

      16

    );

    ctx.fillRect(

      right - 3,

      busY - 8,

      7,

      16

    );

    ctx.fillStyle = '#89968e';

    ctx.font = '8px "DM Mono", monospace';

    ctx.textAlign = 'left';

    ctx.fillText(

      '50 Ω',

      left - 7,

      busY + 25

    );

    ctx.textAlign = 'right';

    ctx.fillText(

      '50 Ω',

      right + 6,

      busY + 25

    );

    nodes.forEach((node, i) =>

      drawNode(

        node,

        i,

        w,

        busY,

        +srcSelect.value === i

      )

    );

    if (packet) {

      const now = performance.now();

      if (packet.state === 'travel') {

        const dt =

          Math.min(

            32,

            now - (packet.last || now)

          );

        packet.last = now;

        packet.x +=

          packet.direction * dt * .0008;

        const cut =

          (left + right) / 2;

        const px =

          nodes[0].x +

          packet.x *

          (nodes[3].x - nodes[0].x);

        if (

          broken &&

          (

            (packet.direction > 0 && px >= cut - 6) ||

            (packet.direction < 0 && px <= cut + 6)

          )

        ) {

          packet.state = 'dropped';

          packet.doneAt = now;

          sendBtn.disabled = false;

          log(

            `<strong>Packet lost</strong> — cable break blocked the signal.`,

            'err'

          );

        } else if (

          (packet.direction > 0 && packet.x >= packet.to) ||

          (packet.direction < 0 && packet.x <= packet.to)

        ) {

          packet.x = packet.to;

          packet.state = 'delivered';

          packet.doneAt = now;

          sendBtn.disabled = false;

          log(

            `<strong>Delivered</strong> — ${names[packet.src]} → ${names[packet.dest]} received the packet.`,

            'ok'

          );

        }

      }

      if (

        packet.state === 'travel' ||

        packet.state === 'delivered'

      ) {

        const px =

          nodes[0].x +

          packet.x *

          (nodes[3].x - nodes[0].x);

        ctx.beginPath();

        ctx.fillStyle = colors.lime;

        ctx.shadowColor = colors.lime;

        ctx.shadowBlur = 18;

        ctx.arc(

          px,

          busY,

          5,

          0,

          Math.PI * 2

        );

        ctx.fill();

        ctx.shadowBlur = 0;

        ctx.fillStyle = '#d9f7a7';

        ctx.font = '9px "DM Mono", monospace';

        ctx.textAlign = 'center';

        ctx.fillText(

          'DATA',

          px,

          busY - 12

        );

      }

      if (

        packet.state !== 'travel' &&

        now - packet.doneAt > 900

      ) {

        packet = null;

      }

    }

    requestAnimationFrame(draw);

  }

  function send() {

    const from = +srcSelect.value;

    const to = +destSelect.value;

    if (from === to) {

      log(

        'Choose two different computers to send a packet.',

        'err'

      );

      return;

    }

    if (

      broken &&

      ((from < 2) !== (to < 2))

    ) {

      log(

        `<strong>Transmission failed</strong> — the cable break isolates ${names[from]} from ${names[to]}.`,

        'err'

      );

      return;

    }

    if (

      packet &&

      packet.state === 'travel'

    ) {

      return;

    }

    const direction =

      to > from ? 1 : -1;

    packet = {

      src: from,

      dest: to,

      x: from / 3,

      to: to / 3,

      direction,

      state: 'travel',

      last: performance.now()

    };

    sendBtn.disabled = true;

    log(

      `<strong>Transmitting</strong> — ${names[from]} is broadcasting to ${names[to]}.`

    );

  }

  sendBtn.addEventListener(

    'click',

    send

  );

  srcSelect.addEventListener(

    'change',

    updateRoute

  );

  destSelect.addEventListener(

    'change',

    updateRoute

  );

  faultToggle.addEventListener(

    'click',

    () => {

      broken = !broken;

      faultToggle.setAttribute(

        'aria-checked',

        String(broken)

      );

      if (

        packet &&

        packet.state === 'travel'

      ) {

        packet.state = 'dropped';

        packet.doneAt = performance.now();

        sendBtn.disabled = false;

        log(

          '<strong>Packet lost</strong> — the cable fault interrupted transmission.',

          'err'

        );

      }

      setStatus(

        broken

          ? 'CABLE BROKEN · NETWORK SPLIT'

          : 'CABLE INTACT · NETWORK ONLINE'

      );

      log(

        broken

          ? '<strong>Cable fault introduced</strong> — the backbone is split.'

          : '<strong>Cable repaired</strong> — all computers are connected.',

        broken ? 'err' : 'ok'

      );

    }

  );

  document.getElementById(

    'clearLog'

  ).addEventListener(

    'click',

    () => {

      logItems = [];

      renderLog();

    }

  );

  canvas.addEventListener(

    'click',

    e => {

      const r =

        canvas.getBoundingClientRect();

      const x =

        e.clientX - r.left;

      let nearest = 0;

      nodes.forEach((n, i) => {

        if (

          Math.abs(n.x - x) <

          Math.abs(nodes[nearest].x - x)

        ) {

          nearest = i;

        }

      });

      srcSelect.value = String(nearest);

      updateRoute();

    }

  );

  window.addEventListener(

    'resize',

    resize

  );

  updateRoute();

  resize();

  requestAnimationFrame(draw);

})();
