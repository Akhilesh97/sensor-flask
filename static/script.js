let isCollecting = false;
let timer = 0;
let intervalId = null;
let magnetometer = null;
let mag_x = 0, mag_y = 0, mag_z = 0;

function postData(data) {
  console.log("Posting to backend:", data); // 👈 ADD THIS

  fetch('/collect', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  });
}

function startTimer() {
  timer = 0;
  document.getElementById("timer").textContent = timer;
  intervalId = setInterval(() => {
    timer += 1;
    document.getElementById("timer").textContent = timer;
  }, 1000);
}

function stopTimer() {
  clearInterval(intervalId);
}

function handleSensorData(event) {
  if (!isCollecting) return;

  const entry = {
    timestamp: new Date().toISOString(),
    acc_x: event.acceleration?.x || 0,
    acc_y: event.acceleration?.y || 0,
    acc_z: event.acceleration?.z || 0,
    gyro_alpha: event.rotationRate?.alpha || 0,
    gyro_beta: event.rotationRate?.beta || 0,
    gyro_gamma: event.rotationRate?.gamma || 0,
    mag_x,
    mag_y,
    mag_z
  };
  console.log(entry);
  postData(entry);
}

function initSensors() {
  if (window.DeviceMotionEvent) {
    window.addEventListener("devicemotion", handleSensorData, true);
  }

  // Initialize magnetometer
  if ('Magnetometer' in window) {
    try {
      magnetometer = new Magnetometer({ frequency: 10 });  // 10 Hz
      magnetometer.addEventListener('reading', () => {
        mag_x = magnetometer.x || 0;
        mag_y = magnetometer.y || 0;
        mag_z = magnetometer.z || 0;
      });
      magnetometer.addEventListener('error', event => {
        console.error('Magnetometer error:', event.error.name);
      });
    } catch (e) {
      console.error("Failed to start Magnetometer:", e);
    }
  } else {
    console.warn("Magnetometer not supported on this device.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initSensors();

  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const statusText = document.getElementById("status");

  startBtn.onclick = () => {
    isCollecting = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    statusText.textContent = "Collecting sensor data...";
    startTimer();
    if (magnetometer) magnetometer.start();
  };

  stopBtn.onclick = () => {
    isCollecting = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    stopTimer();
    if (magnetometer) magnetometer.stop();
    statusText.textContent = "Stopped. Saving data...";

    fetch('/stop', {
      method: 'POST'
    })
    .then(res => res.json())
    .then(data => {
      statusText.textContent = `Data saved to ${data.filename}`;
    });
  };
});
