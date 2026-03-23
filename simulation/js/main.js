//Your JavaScript goes in here
/*
=========================================================
 Experiment 1: Image Enhancement using Smoothing and Sharpening Filters
 Clean Virtual Lab UI + OpenCV.js only (no extra libraries)
 Live Apply: ALWAYS ON (no toggle)
 Right panel removed: no logBox required
=========================================================
*/

cv["onRuntimeInitialized"] = () => {
  // ---------- UI Elements ----------
  const fileInput = document.getElementById("fileInput");
  const sampleSelect = document.getElementById("sampleSelect");
  const filterSelect = document.getElementById("filterSelect");

  const runBtn = document.getElementById("runBtn"); // optional manual re-apply
  const resetBtn = document.getElementById("resetBtn");
  const downloadBtn = document.getElementById("downloadBtn");

  const inputCanvas = document.getElementById("inputCanvas");
  const outputCanvas = document.getElementById("outputCanvas");

  const statusText = document.getElementById("statusText");
  const statusDot = document.getElementById("statusDot");

  const imageMeta = document.getElementById("imageMeta");
  const origMeta = document.getElementById("origMeta");
  const procMeta = document.getElementById("procMeta");

  // ---------- State ----------
  let src = null; // cv.Mat (RGBA)
  let srcW = 0;
  let srcH = 0;
  let lastLoadedURL = null;

  // ---------- Helpers ----------
  function setStatus(text, color) {
    if (statusText) statusText.textContent = text;
    if (statusDot && color) statusDot.style.background = color;
  }

  function enableActions(isEnabled) {
    runBtn.disabled = !isEnabled;
    resetBtn.disabled = !isEnabled;
    downloadBtn.disabled = !isEnabled;
  }

  function safeDeleteMat(mat) {
    try {
      if (mat) mat.delete();
    } catch (e) {
      // ignore
    }
  }

  function clearOutputCanvas() {
    const ctx = outputCanvas.getContext("2d");
    ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    procMeta.textContent = "—";
  }

  function resetToOriginal() {
    if (!src) return;
    cv.imshow(outputCanvas, src);
    procMeta.textContent = "Reset to original";
  }

  function readOdd(id, fallback) {
    const el = document.getElementById(id);
    let v = el ? Number(el.value) : fallback;
    if (!Number.isFinite(v)) v = fallback;

    v = Math.max(1, Math.round(v));
    if (v % 2 === 0) v += 1;
    return v;
  }

  function readNumber(id, fallback) {
    const el = document.getElementById(id);
    let v = el ? Number(el.value) : fallback;
    if (!Number.isFinite(v)) v = fallback;
    return v;
  }

  function getParams(choice) {
    switch (choice) {
      case "mean":
        return { k: readOdd("meanKNum", 3) };
      case "gaussian":
        return {
          k: readOdd("gaussKNum", 5),
          sigma: readNumber("gaussSigmaNum", 1.0),
        };
      case "median":
        return { k: readOdd("medianKNum", 5) };
      case "laplacian":
        return {
          k: readOdd("lapKNum", 3),
          scale: readNumber("lapScaleNum", 1.0),
        };
      case "unsharp":
        return {
          k: readOdd("usKNum", 5),
          amount: readNumber("usAmountNum", 1.0),
          threshold: readNumber("usThreshNum", 0),
        };
      default:
        return {};
    }
  }

  // Unsharp with optional threshold (OpenCV.js only)
  function unsharpMask(srcMat, k, amount, threshold) {
    const blurred = new cv.Mat();
    cv.GaussianBlur(srcMat, blurred, new cv.Size(k, k), 0);

    const mask = new cv.Mat();
    cv.subtract(srcMat, blurred, mask);

    const dst = new cv.Mat();

    if (threshold > 0) {
      // abs(mask) -> gray -> threshold -> RGBA mask
      const zero = new cv.Mat(mask.rows, mask.cols, mask.type(), [0, 0, 0, 0]);
      const absMask = new cv.Mat();
      cv.absdiff(mask, zero, absMask);
      zero.delete();

      const gray = new cv.Mat();
      cv.cvtColor(absMask, gray, cv.COLOR_RGBA2GRAY);

      const bin = new cv.Mat();
      cv.threshold(gray, bin, threshold, 255, cv.THRESH_BINARY);

      const binRGBA = new cv.Mat();
      cv.cvtColor(bin, binRGBA, cv.COLOR_GRAY2RGBA);

      const scaled = new cv.Mat();
      cv.addWeighted(mask, amount, mask, 0, 0, scaled);

      const tmp = new cv.Mat();
      cv.add(srcMat, scaled, tmp);

      const inv = new cv.Mat();
      cv.bitwise_not(binRGBA, inv);

      const part1 = new cv.Mat();
      const part2 = new cv.Mat();
      cv.bitwise_and(tmp, binRGBA, part1);
      cv.bitwise_and(srcMat, inv, part2);
      cv.add(part1, part2, dst);

      // cleanup
      blurred.delete();
      mask.delete();
      absMask.delete();
      gray.delete();
      bin.delete();
      binRGBA.delete();
      scaled.delete();
      tmp.delete();
      inv.delete();
      part1.delete();
      part2.delete();
    } else {
      // dst = src + amount*(src - blurred)
      cv.addWeighted(srcMat, 1.0, mask, amount, 0, dst);
      blurred.delete();
      mask.delete();
    }

    return dst;
  }

  // Apply selected filter to src and show on output canvas
  function applyFilter() {
    if (!src) return;

    const choice = filterSelect.value;
    const p = getParams(choice);

    setStatus("Processing…", "#f59e0b");

    let dst = new cv.Mat();

    try {
      switch (choice) {
        case "mean": {
          cv.blur(src, dst, new cv.Size(p.k, p.k));
          procMeta.textContent = `Mean (k=${p.k})`;
          break;
        }

        case "gaussian": {
          cv.GaussianBlur(src, dst, new cv.Size(p.k, p.k), p.sigma);
          procMeta.textContent = `Gaussian (k=${p.k}, σ=${p.sigma})`;
          break;
        }

        case "median": {
          cv.medianBlur(src, dst, p.k);
          procMeta.textContent = `Median (k=${p.k})`;
          break;
        }

        case "laplacian": {
          const gray = new cv.Mat();
          cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

          const lap = new cv.Mat();
          cv.Laplacian(gray, lap, cv.CV_8U, p.k, p.scale, 0, cv.BORDER_DEFAULT);

          cv.cvtColor(lap, dst, cv.COLOR_GRAY2RGBA);

          gray.delete();
          lap.delete();

          procMeta.textContent = `Laplacian (k=${p.k}, scale=${p.scale})`;
          break;
        }

        case "unsharp": {
          dst.delete();
          dst = unsharpMask(src, p.k, p.amount, p.threshold);
          procMeta.textContent = `Unsharp (k=${p.k}, amt=${p.amount}, thr=${p.threshold})`;
          break;
        }

        default: {
          src.copyTo(dst);
          procMeta.textContent = "No filter";
        }
      }

      cv.imshow(outputCanvas, dst);
      setStatus("Ready", "#22c55e");
    } catch (err) {
      setStatus("Error", "#ef4444");
      console.error(err);
    } finally {
      safeDeleteMat(dst);
    }
  }

  function loadImageFromURL(url) {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      inputCanvas.width = img.width;
      inputCanvas.height = img.height;
      outputCanvas.width = img.width;
      outputCanvas.height = img.height;

      const ctx = inputCanvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      // free previous src
      safeDeleteMat(src);

      // read new
      src = cv.imread(inputCanvas);
      srcW = img.width;
      srcH = img.height;

      // UI meta
      imageMeta.textContent = `${srcW} × ${srcH}`;
      origMeta.textContent = `${srcW}×${srcH}`;
      procMeta.textContent = "—";

      enableActions(true);
      setStatus("Ready", "#22c55e");

      // Auto-apply immediately (Live Apply always ON)
      applyFilter();
    };

    img.onerror = () => {
      setStatus("Error", "#ef4444");
      console.error("Failed to load image.");
    };

    img.src = url;
  }

  // ---------- Events ----------
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (sampleSelect) sampleSelect.value = "";

    if (lastLoadedURL) {
      URL.revokeObjectURL(lastLoadedURL);
      lastLoadedURL = null;
    }

    lastLoadedURL = URL.createObjectURL(file);
    setStatus("Loading image…", "#f59e0b");
    loadImageFromURL(lastLoadedURL);
  });

  if (sampleSelect) {
    sampleSelect.addEventListener("change", () => {
      const v = sampleSelect.value;
      if (!v) return;
      setStatus("Loading sample…", "#f59e0b");
      loadImageFromURL(v);
    });
  }

  // Manual re-apply (optional)
  runBtn.addEventListener("click", applyFilter);

  // Reset output to original (but keep live apply behavior on next change)
  resetBtn.addEventListener("click", () => {
    if (!src) return;
    resetToOriginal();
    setStatus("Ready", "#22c55e");
  });

  // Download processed output
  downloadBtn.addEventListener("click", () => {
    if (!src) return;
    const link = document.createElement("a");
    link.download = `processed_${filterSelect.value}.png`;
    link.href = outputCanvas.toDataURL("image/png");
    link.click();
  });

  // Filter change => auto apply
  filterSelect.addEventListener("change", () => applyFilter());

  // Any parameter change => auto apply
  function bindAutoApply(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", applyFilter);
    el.addEventListener("change", applyFilter);
  }

  [
    "meanKNum",
    "gaussKNum",
    "gaussSigmaNum",
    "medianKNum",
    "lapKNum",
    "lapScaleNum",
    "usKNum",
    "usAmountNum",
    "usThreshNum",
    // also bind sliders (in case user drags them)
    "meanK",
    "gaussK",
    "gaussSigma",
    "medianK",
    "lapK",
    "lapScale",
    "usK",
    "usAmount",
    "usThresh",
  ].forEach(bindAutoApply);

  // ---------- Init ----------
  setStatus("OpenCV.js ready", "#22c55e");
  enableActions(false);
  imageMeta.textContent = "No image loaded";
  origMeta.textContent = "—";
  procMeta.textContent = "—";
  clearOutputCanvas();
};

