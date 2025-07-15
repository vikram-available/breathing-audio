/* js/faceDetection.js
   Single-file drop-in that:
   1. loads the two nets we need
   2. waits for <video> to reach *canplay*
   3. runs detection every 250 ms
   4. forwards the strongest expression to main.js    */

(async () => {
  const MODEL_URL = '/models';     // folder already in your project
  const video     = document.getElementById('webcam');
  const container = video.parentElement;     // keeps markup tidy

  /* ---------- 1. load weights ---------- */
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
  ]);
  console.log('Models loaded');

  /* ---------- 2. open webcam & wait for *canplay* ---------- */
  try {
    video.srcObject = await navigator.mediaDevices.getUserMedia({ video: true });
  } catch (err) {
    console.error('Webcam error:', err);
    alert('Cannot access webcam: ' + err.message);
    return;
  }

  await new Promise(res => video.addEventListener('canplay', res, { once: true }));

  /* ---------- 3. create canvas & start loop ---------- */
  const { videoWidth: w, videoHeight: h } = video;
  const canvas = faceapi.createCanvasFromMedia(video);
  canvas.width = w; canvas.height = h;
  container.appendChild(canvas);

  const size = { width: w, height: h };
  faceapi.matchDimensions(canvas, size);

  const intervalId = setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceExpressions();

    const resized = faceapi.resizeResults(detections, size);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    faceapi.draw.drawDetections(canvas, resized);
    faceapi.draw.drawFaceExpressions(canvas, resized);

    /* ---------- 4. hand dominant emotion to main.js ---------- */
    if (resized.length) {
      const expr   = resized[0].expressions;
      const domKey = Object.keys(expr).reduce((a, b) => expr[a] > expr[b] ? a : b);
      if (window.setEmotion) window.setEmotion(domKey);   // main.js cadence hook
    }
  }, 250);

  /* optional: stop loop when breathing app stops webcam */
  window.stopFaceDetection = () => {
    clearInterval(intervalId);
    video.srcObject?.getTracks().forEach(t => t.stop());
    canvas.remove();
  };
})();
