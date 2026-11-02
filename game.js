
/* ==========================================
   TAMBAHAN: JOYSTICK + MUZIK + SUARA + SFX
   Tampal di hujung game.js
========================================== */

(() => {
  const css = document.createElement('style');
  css.textContent = `
    #touch-controls { display:none !important; }

    #magic-controls {
      position:fixed;
      inset:0;
      z-index:99999;
      pointer-events:none;
      font-family:Arial,sans-serif;
      user-select:none;
      -webkit-user-select:none;
    }

    #magic-joystick {
      position:absolute;
      left:28px;
      bottom:25px;
      width:132px;
      height:132px;
      border-radius:50%;
      background:rgba(15,45,65,.48);
      border:4px solid rgba(255,255,255,.8);
      box-shadow:0 0 18px #58dfff;
      pointer-events:auto;
      touch-action:none;
    }

    #magic-stick {
      position:absolute;
      width:56px;
      height:56px;
      left:34px;
      top:34px;
      border-radius:50%;
      background:linear-gradient(145deg,#fff,#60d9ff);
      border:3px solid white;
      box-shadow:0 3px 12px #123;
      pointer-events:none;
    }

    .magic-button {
      position:absolute;
      right:25px;
      width:82px;
      height:82px;
      border-radius:50%;
      border:3px solid white;
      color:white;
      font-weight:bold;
      font-size:14px;
      text-shadow:1px 2px 3px #333;
      box-shadow:0 4px 12px #1238;
      pointer-events:auto;
      touch-action:none;
    }

    #magic-jump {
      bottom:35px;
      background:linear-gradient(145deg,#ffdb48,#ff8c19);
    }

    #magic-spell {
      bottom:132px;
      background:linear-gradient(145deg,#db6aff,#702bdf);
    }

    #magic-sound {
      position:absolute;
      right:18px;
      top:18px;
      width:48px;
      height:48px;
      border-radius:50%;
      border:2px solid white;
      background:#173d66cc;
      color:white;
      font-size:22px;
      pointer-events:auto;
    }

    #magic-controls button:active {
      transform:scale(.91);
      filter:brightness(1.25);
    }

    @media (max-width:600px) {
      #magic-joystick {
        width:115px;height:115px;left:16px;bottom:18px;
      }
      #magic-stick {left:29px;top:29px;}
      .magic-button {width:72px;height:72px;right:17px;}
      #magic-jump {bottom:25px;}
      #magic-spell {bottom:110px;}
    }
  `;
  document.head.appendChild(css);

  const ui = document.createElement('div');
  ui.id = 'magic-controls';
  ui.innerHTML = `
    <div id="magic-joystick">
      <div id="magic-stick"></div>
    </div>
    <button id="magic-jump" class="magic-button">⬆ LOMPAT</button>
    <button id="magic-spell" class="magic-button">✨ SIHIR</button>
    <button id="magic-sound">🔊</button>
  `;
  document.body.appendChild(ui);

  /* JOYSTICK */

  const pad = document.getElementById('magic-joystick');
  const stick = document.getElementById('magic-stick');
  let joystickPointer = null;

  function resetJoystick() {
    moveX = 0;
    moveZ = 0;
    stick.style.left = '29px';
    stick.style.top = '29px';
    if (innerWidth > 600) {
      stick.style.left = '34px';
      stick.style.top = '34px';
    }
  }

  function moveJoystick(e) {
    if (joystickPointer !== e.pointerId) return;

    const r = pad.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    let x = (e.clientX - cx) / (r.width * .34);
    let y = (e.clientY - cy) / (r.height * .34);

    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }

    moveX = x;
    moveZ = y;

    const max = r.width * .29;
    stick.style.left = (r.width / 2 - 28 + x * max) + 'px';
    stick.style.top = (r.height / 2 - 28 + y * max) + 'px';
  }

  pad.addEventListener('pointerdown', e => {
    e.preventDefault();
    joystickPointer = e.pointerId;
    pad.setPointerCapture(e.pointerId);
    moveJoystick(e);
    startAudio();
  });

  pad.addEventListener('pointermove', moveJoystick);

  function releaseJoystick(e) {
    if (joystickPointer !== e.pointerId) return;
    joystickPointer = null;
    resetJoystick();
  }

  pad.addEventListener('pointerup', releaseJoystick);
  pad.addEventListener('pointercancel', releaseJoystick);

  /* AUDIO */

  let audioContext = null;
  let masterGain = null;
  let musicGain = null;
  let muted = false;
  let musicTimer = null;
  let musicStep = 0;

  function startAudio() {
    if (!audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      audioContext = new AudioCtx();
      masterGain = audioContext.createGain();
      masterGain.gain.value = muted ? 0 : 0.65;
      masterGain.connect(audioContext.destination);

      musicGain = audioContext.createGain();
      musicGain.gain.value = 0.10;
      musicGain.connect(masterGain);
    }

    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    if (!musicTimer) {
      playMusic();
      musicTimer = setInterval(playMusic, 420);
    }
  }

  function tone(freq, duration, type = 'sine', volume = 0.15, destination = null) {
    if (!audioContext || muted) return;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioContext.currentTime);

    gain.gain.setValueAtTime(0.001, audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.025);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + duration
    );

    osc.connect(gain);
    gain.connect(destination || masterGain);
    osc.start();
    osc.stop(audioContext.currentTime + duration + 0.03);
  }

  /* Melodi ciptaan asal, gaya pengembaraan ceria */

  const melody = [
    523,659,784,659,587,698,880,698,
    523,659,784,1046,880,784,659,587,
    523,587,659,784,659,587,523,392
  ];

  function playMusic() {
    if (!audioContext || muted) return;

    const note = melody[musicStep % melody.length];
    tone(note, 0.32, 'triangle', 0.055, musicGain);

    if (musicStep % 4 === 0) {
      tone(note / 2, 0.38, 'sine', 0.035, musicGain);
    }

    musicStep++;
  }

  function soundJump() {
    tone(380, .12, 'sine', .15);
    setTimeout(() => tone(620, .16, 'sine', .12), 80);
  }

  function soundMagic() {
    tone(500, .15, 'sine', .12);
    setTimeout(() => tone(750, .18, 'triangle', .12), 100);
    setTimeout(() => tone(1050, .25, 'sine', .1), 200);
  }

  function soundCrystal() {
    tone(880, .18, 'sine', .18);
    setTimeout(() => tone(1175, .25, 'sine', .16), 100);
    setTimeout(() => tone(1568, .3, 'sine', .12), 200);
  }

  function soundSuccess() {
    [523,659,784,1046].forEach((n,i) => {
      setTimeout(() => tone(n,.3,'triangle',.13),i*130);
    });
  }

  /* SUARA BAHASA MELAYU */

  let lastSpeech = 0;

  function speakMalay(message) {
    if (!('speechSynthesis' in window) || muted) return;

    const now = Date.now();
    if (now - lastSpeech < 1800) return;
    lastSpeech = now;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'ms-MY';
    utterance.rate = 0.92;
    utterance.pitch = 1.15;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const malayVoice = voices.find(v =>
      v.lang.toLowerCase().startsWith('ms')
    );

    if (malayVoice) utterance.voice = malayVoice;

    window.speechSynthesis.speak(utterance);
  }

  /* BUTANG LOMPAT */

  const jumpButton = document.getElementById('magic-jump');

  jumpButton.addEventListener('pointerdown', e => {
    e.preventDefault();
    startAudio();

    if (typeof jumping !== 'undefined' && !jumping) {
      jumping = true;
      velocityY = 10;
      soundJump();
    }
  });

  /* BUTANG SIHIR */

  const spellButton = document.getElementById('magic-spell');

  spellButton.addEventListener('pointerdown', e => {
    e.preventDefault();
    startAudio();
    magicOn = true;
    useMagic();
    soundMagic();
    speakMalay('Kuasa ajaib! Tarik kristal ke sini!');
  });

  function stopSpell() {
    magicOn = false;
  }

  spellButton.addEventListener('pointerup', stopSpell);
  spellButton.addEventListener('pointercancel', stopSpell);
  spellButton.addEventListener('lostpointercapture', stopSpell);

  /* BUTANG BUNYI */

  document.getElementById('magic-sound').addEventListener('click', () => {
    muted = !muted;

    const button = document.getElementById('magic-sound');
    button.textContent = muted ? '🔇' : '🔊';

    if (masterGain && audioContext) {
      masterGain.gain.setTargetAtTime(
        muted ? 0 : 0.65,
        audioContext.currentTime,
        0.08
      );
    }

    if (muted && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
    } else {
      startAudio();
      speakMalay('Bunyi permainan dihidupkan!');
    }
  });

  /* SUARA PEMBUKA */

  document.getElementById('start-button')?.addEventListener('click', () => {
    startAudio();
    setTimeout(() => speakMalay('Selamat datang ke Magical Jurassic Kingdom!'), 500);
  });

  document.getElementById('play-button')?.addEventListener('click', () => {
    startAudio();
    setTimeout(() => speakMalay('Jom mulakan pengembaraan!'), 900);
  });

  /* GANTIKAN MESEJ ASAL DENGAN KESAN BUNYI */

  const oldShowMessage = showMessage;

  showMessage = function(message) {
    oldShowMessage(message);

    if (message.includes('Kristal')) {
      soundCrystal();
      speakMalay('Hebat! Kristal berjaya dikumpulkan!');
    } else if (message.includes('Telur')) {
      soundSuccess();
      speakMalay('Bagus! Kamu telah menjumpai telur dinosaur!');
    } else if (message.includes('wira')) {
      speakMalay('Teruskan! Kamu memang hebat!');
    }
  };

})();
