/* ── 조용한 나팔 ─────────────────────────────────────────
   음악 파일이 없어도 브라우저가 직접 소리를 냅니다 (Web Audio).
   부드러운 나팔(플루겔호른에 가까운 음색) 한 줄기와 아주 낮은 현 소리.
   원곡: 고마움 상조 자체 선율 (F장조, 56bpm, 16마디 + 쉼 2마디, 약 77초 반복)

   사용:  QuietHorn.start()  QuietHorn.stop()  QuietHorn.resume()  QuietHorn.playing  QuietHorn.state
   부고장에서는 사용자가 눌렀을 때만 start()를 부릅니다. 홈에서는 자동으로 시도하되
   브라우저가 막으면(state "suspended") 첫 터치에 resume()으로 이어 붙입니다.
   QuietHorn.render(ctx, t0) 는 한 바퀴를 주어진 컨텍스트(오프라인 포함)에 예약합니다. */
(function () {
  "use strict";

  var BPM = 56;
  var BEAT = 60 / BPM;

  // 음 높이 (Hz)
  var N = { C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00,
            Bb4: 466.16, C5: 523.25, D5: 587.33,
            E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, Bb3: 233.08, D3: 146.83 };

  // 선율: [음, 박] — 4/4, 마디마다 4박
  var MELODY = [
    ["C4", 2], ["F4", 2],  ["A4", 3], ["G4", 1],  ["F4", 2], ["D4", 2],  ["C4", 4],
    ["C4", 2], ["F4", 2],  ["A4", 3], ["Bb4", 1], ["C5", 3], ["A4", 1],  ["F4", 4],
    ["A4", 2], ["C5", 2],  ["D5", 3], ["C5", 1],  ["A4", 2], ["F4", 2],  ["G4", 4],
    ["C4", 2], ["F4", 2],  ["A4", 3], ["G4", 1],  ["F4", 3], ["D4", 1],  ["F4", 4]
  ];
  // 마디마다 하나씩 깔리는 화음 (낮은 현). 성부가 조금씩만 움직이도록 골랐다.
  var CHORDS = {
    F:  ["F3", "A3", "C4"],
    Bb: ["F3", "Bb3", "D4"],
    C:  ["E3", "G3", "C4"],
    Dm: ["F3", "A3", "D4"]
  };
  var PROG = ["F", "F", "Bb", "C",  "F", "F", "Bb", "F",  "F", "Bb", "Dm", "C",  "F", "F", "Bb", "F"];
  var BARS = 16, REST_BARS = 2;
  var CYCLE = (BARS + REST_BARS) * 4 * BEAT;      // 한 바퀴 길이(초)

  function impulse(ctx, seconds, decay) {
    var rate = ctx.sampleRate, len = Math.floor(rate * seconds);
    var buf = ctx.createBuffer(2, len, rate);
    for (var c = 0; c < 2; c++) {
      var d = buf.getChannelData(c);
      for (var i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  // 출력 묶음: 건조한 소리 + 잔향 → 주 음량
  function makeBus(ctx, level) {
    var master = ctx.createGain();
    master.gain.value = level;
    var mix = ctx.createGain();
    var dry = ctx.createGain(); dry.gain.value = 0.72;
    var wet = ctx.createGain(); wet.gain.value = 0.45;
    var verb = ctx.createConvolver();
    verb.buffer = impulse(ctx, 3.2, 2.6);
    mix.connect(dry); dry.connect(master);
    mix.connect(verb); verb.connect(wet); wet.connect(master);
    master.connect(ctx.destination);
    return { master: master, mix: mix };
  }

  // 나팔 한 음. 관악기답게 숨을 불어넣듯 시작하고, 조금 지나 떨림이 붙는다.
  function horn(ctx, out, freq, t0, dur, vel) {
    var tEnd = t0 + dur - 0.06;
    var saw = ctx.createOscillator(); saw.type = "sawtooth"; saw.frequency.value = freq;
    var tri = ctx.createOscillator(); tri.type = "triangle"; tri.frequency.value = freq; tri.detune.value = 3;
    var gs = ctx.createGain(); gs.gain.value = 0.42;
    var gt = ctx.createGain(); gt.gain.value = 0.58;

    var lfo = ctx.createOscillator(); lfo.type = "sine"; lfo.frequency.value = 5.1;
    var depth = ctx.createGain();
    depth.gain.setValueAtTime(0, t0);
    depth.gain.setValueAtTime(0, t0 + 0.35);
    depth.gain.linearRampToValueAtTime(5.5, t0 + 1.1);   // 센트 단위 떨림
    lfo.connect(depth); depth.connect(saw.detune); depth.connect(tri.detune);

    var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 0.9;
    lp.frequency.setValueAtTime(420, t0);
    lp.frequency.exponentialRampToValueAtTime(1500, t0 + 0.14);
    lp.frequency.exponentialRampToValueAtTime(1050, t0 + 0.6);
    lp.frequency.setValueAtTime(1050, Math.max(t0 + 0.6, tEnd - 0.2));
    lp.frequency.exponentialRampToValueAtTime(500, tEnd + 0.25);

    var amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(vel, t0 + 0.11);
    amp.gain.exponentialRampToValueAtTime(vel * 0.8, t0 + 0.5);
    amp.gain.setValueAtTime(vel * 0.8, Math.max(t0 + 0.5, tEnd - 0.2));
    amp.gain.exponentialRampToValueAtTime(0.0001, tEnd + 0.3);

    saw.connect(gs); tri.connect(gt); gs.connect(lp); gt.connect(lp); lp.connect(amp); amp.connect(out);
    saw.start(t0); tri.start(t0); lfo.start(t0);
    saw.stop(tEnd + 0.4); tri.stop(tEnd + 0.4); lfo.stop(tEnd + 0.4);
  }

  // 낮은 현 — 거의 들리지 않을 만큼, 나팔 아래를 받쳐 준다
  function pad(ctx, out, freq, t0, dur, vel) {
    var a = ctx.createOscillator(); a.type = "sine"; a.frequency.value = freq; a.detune.value = -4;
    var b = ctx.createOscillator(); b.type = "triangle"; b.frequency.value = freq; b.detune.value = 4;
    var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 620; lp.Q.value = 0.5;
    var amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(vel, t0 + 1.4);
    amp.gain.setValueAtTime(vel, t0 + dur - 0.2);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 1.6);
    a.connect(lp); b.connect(lp); lp.connect(amp); amp.connect(out);
    a.start(t0); b.start(t0); a.stop(t0 + dur + 1.8); b.stop(t0 + dur + 1.8);
  }

  // 한 바퀴를 t0부터 예약한다
  function render(ctx, out, t0) {
    var t = t0;
    for (var i = 0; i < MELODY.length; i++) {
      var dur = MELODY[i][1] * BEAT;
      // 마디 첫 음은 아주 조금 세게, 긴 음은 조금 여리게
      var vel = 0.16 + (MELODY[i][1] >= 3 ? -0.015 : 0.01);
      horn(ctx, out, N[MELODY[i][0]], t, dur, vel);
      t += dur;
    }
    for (var b = 0; b < BARS; b++) {
      var notes = CHORDS[PROG[b]];
      for (var k = 0; k < notes.length; k++) {
        pad(ctx, out, N[notes[k]], t0 + b * 4 * BEAT, 4 * BEAT, 0.028);
      }
    }
  }

  var ctx = null, bus = null, timer = 0, playing = false;

  // 0.5초마다 들여다보며, 다음 바퀴가 3초 앞으로 다가오면 예약한다.
  // 브라우저가 소리를 아직 허락하지 않아(suspended) 시간이 멈춰 있으면 기다린다.
  function tick(nextT0) {
    if (!playing || !ctx) return;
    if (ctx.state === "running" && ctx.currentTime > nextT0 - 3) {
      render(ctx, bus.mix, nextT0);
      nextT0 += CYCLE;
    }
    timer = setTimeout(function () { tick(nextT0); }, 500);
  }

  /* 시작한다. 브라우저가 사용자 동작 없이는 소리를 막을 수 있는데,
     그때는 state가 "suspended"로 남고 resume()이 허락되는 순간 이어서 난다. */
  function start() {
    if (playing) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    bus = makeBus(ctx, 0.0001);
    bus.master.gain.setValueAtTime(0.0001, ctx.currentTime);
    bus.master.gain.exponentialRampToValueAtTime(0.9, ctx.currentTime + 2.5);
    playing = true;
    if (ctx.state === "suspended") ctx.resume().catch(function () {});
    tick(ctx.currentTime + 0.3);
    return true;
  }

  function resume() {
    if (ctx && ctx.state === "suspended") return ctx.resume();
    return Promise.resolve();
  }

  function stop() {
    if (!playing) return;
    playing = false;
    clearTimeout(timer);
    var c = ctx, b = bus;
    ctx = null; bus = null;
    b.master.gain.cancelScheduledValues(c.currentTime);
    b.master.gain.setValueAtTime(b.master.gain.value, c.currentTime);
    b.master.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 1.2);
    setTimeout(function () { c.close(); }, 1500);
  }

  window.QuietHorn = {
    start: start,
    stop: stop,
    resume: resume,
    get playing() { return playing; },
    get state() { return ctx ? ctx.state : "closed"; },   // running | suspended | closed
    get time() { return ctx ? ctx.currentTime % CYCLE : 0; },  // 이번 바퀴에서 흐른 초
    get duration() { return CYCLE; },
    onstate: function (cb) { if (ctx) ctx.addEventListener("statechange", cb); },
    cycleSeconds: CYCLE,
    render: function (offCtx, t0) { var b = makeBus(offCtx, 0.9); render(offCtx, b.mix, t0); }
  };
})();
