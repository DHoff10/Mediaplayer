   var bufferSize = 0;
      var signal = new Float32Array(bufferSize);
      var channels = 0;
      var rate = 0;
      var ftimer = 0,
          m_BeatTimer = 0,
          m_BeatCounter = 0;
      var frameBufferLength = 0;
      var fft = null;
      var clearClr = [0, 0, 1];

      var bd;
      var kick_det;
      var vu = null;
  /*
 <!--
 <script target="#signal" type="application/processing">
      // Draw synth signal with Processing.js
      float bsize = 100;

      void setup() {
        size(innerWidth, innerHeight);
        stroke(0);
        strokeWeight(1);
        rectMode(CENTER);
        bsize = innerHeight / 2;
        frameRate(30);
      }

      float xp = 0;

      void draw() {
        if (!vu) return;

        background(0);
        stroke(clearClr[0] * 255, clearClr[1] * 255, clearClr[2] * 255);
        fill(clearClr[0] * 255, clearClr[1] * 255, clearClr[2] * 255);

        xp += 0.005;

        pushMatrix();

        translate(width / 2, height / 2);

        float ec = (vu.vu_levels[0] + vu.vu_levels[1]) / 2;
        if (ec != ec) ec = 0;

        fill(clearClr[0] * 255 * ec, clearClr[1] * 255 * ec, clearClr[2] * 255 * ec);

        ellipse(0, 0, 150, 150);

        for (int i = 0; i < 360; i += 10) {
          pushMatrix();
          rotate(PI * 2 * (i / 360) + xp);
          float c = vu.vu_levels[i / 10];
          float p = c * bsize;
          if (p != p) p = 0;

          translate(0, 80 + p / 2);

          fill(clearClr[0] * 255 * c, clearClr[1] * 255 * c, clearClr[2] * 255 * c);

          rect(0, 0, 10, p);
          popMatrix();
        }
        popMatrix();
      }
    </script>
-->
   <!--
 <div>
      <canvas id="signal">
      </canvas>
    </div>
-->
*/

      function initProcessing() {
        // Init in-line Processing sketch
        var scripts = document.getElementsByTagName("script");

        for (var i = 0; i < scripts.length; i++) {
          if (scripts[i].type == "application/processing") {
            var src = scripts[i].getAttribute("target");
            var canvas = scripts[i].nextSibling;

            if (src && src.indexOf("#") > -1) {
              canvas = document.getElementById(src.substr(src.indexOf("#") + 1));
            } else {
              while (canvas && canvas.nodeName.toUpperCase() != "CANVAS") {
                canvas = canvas.nextSibling;
              }
            }

            if (canvas) {
              new Processing(canvas, scripts[i].text);
            }
          }
        }
      }


      function loadedMetadata() {
        var audio = document.getElementById('audio');

        channels = audio.mozChannels;
        rate = audio.mozSampleRate;
        frameBufferLength = audio.mozFrameBufferLength;

        bufferSize = frameBufferLength / channels;

        fft = new FFT(bufferSize, rate);
        signal = new Float32Array(bufferSize);
        bd = new BeatDetektor(95, 120);
        kick_det = new BeatDetektor.modules.vis.BassKick();
        vu = new BeatDetektor.modules.vis.VU();

        audio.addEventListener("MozAudioAvailable", audioAvailable, false);
      }

      function audioAvailable(event) {
        if (fft == null) return;

        var fb = event.frameBuffer;

        for (var i = 0, fbl = bufferSize; i < fbl; i++) {
          // Assuming interlaced stereo channels,
          // need to split and merge into a stero-mix mono signal
          signal[i] = (fb[2 * i] + fb[2 * i + 1]) / 2;
        }

        fft.forward(signal);

        timestamp = event.time;

        bd.process(timestamp, fft.spectrum);

        if (bd.win_bpm_int_lo) {
          m_BeatTimer += bd.last_update;

          if (m_BeatTimer > (60.0 / bd.win_bpm_int_lo)) {
            m_BeatTimer -= (60.0 / bd.win_bpm_int_lo);
            clearClr[0] = 0.5 + Math.random() / 2;
            clearClr[1] = 0.5 + Math.random() / 2;
            clearClr[2] = 0.5 + Math.random() / 2;
            m_BeatCounter++;
          }
        }


        ftimer += bd.last_update;
        if (ftimer > 1.0 / 30.0) {
          vu.process(bd, ftimer);

          ftimer = 0;
        }

      }

      function init() {
        initProcessing();
        audio = document.getElementById('audio');
        audio.addEventListener('loadedmetadata', function() {
          loadedMetadata();
        }, false);
      }

      var audio, signal;

      // Trigger ready event when DOM is loaded
      addEventListener('DOMContentLoaded', function() {
        init();
      }, false);
