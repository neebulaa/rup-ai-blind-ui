const API_URL = "https://hendlyhugging-rup-ai.hf.space/predict";
const video = document.getElementById("webcam");
const canvas = document.getElementById("canvas");
const captureBtn = document.getElementById("captureBtn");
const switchCamera = document.getElementById("switch-camera");
let predicting = false;
let currentSpeechText = ""; // <-- Track current speech text
let facingModeEnv = true;

// Start webcam
async function startWebcam(facingMode = 'environment') {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {
            facingMode
        } });
        video.srcObject = stream;
    } catch (err) {
        console.error("Error accessing webcam:", err);
    }
}

startWebcam();

// Speak function (Indonesia)
function speak(text) {
    return new Promise((resolve) => {
        // Store what is being spoken now
        currentSpeechText = text;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "id-ID";

        utterance.onend = () => {
            currentSpeechText = ""; // Reset after finished speaking
            resolve();
        };

        // Speak the text
        speechSynthesis.speak(utterance);
    });
}

// Instruction on page load
window.addEventListener("load", () => {
    setTimeout(() => {
        speak("Tekan layar anda untuk mengambil gambar uang");
    }, 500);
});

// Capture function
async function captureAndPredict() {
    if (navigator.vibrate) {
        navigator.vibrate(100);
    }

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append("image", blob, "capture.jpg");

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                body: formData
            });

            const result = await response.json();
            console.log("Prediction:", result);

            if (result.confidence <= 70) {
                setTimeout(async () => {
                    toast.warn(`Gagal!`, `Arahkan ke mata uang`);
                    await speak(`Tolong arahkan kamera ke mata uang`);
                    predicting = false;
                    speak("Tekan layar anda untuk mengambil gambar uang");
                }, 500);
            } else {
                setTimeout(async () => {
                    toast.info(`${result.class.charAt(0).toUpperCase() + result.class.slice(1)}!`, `Prediksi dengan Presentase ${result.confidence}%`);
                    await speak(`Ini adalah ${result.class}`);
                    predicting = false;
                    speak("Tekan layar anda untuk mengambil gambar uang");
                }, 500);
            }
            
        } catch (err) {
            console.error("Error predicting:", err);
            setTimeout(async () => {
                toast.error(`Gagal!`, `Kesalahan Server`);
                await speak("Terjadi kesalahan saat memproses gambar, server tidak terbuka");
                predicting = false;
                speak("Tekan layar anda untuk mengambil gambar uang");
            }, 500);
        }
    }, "image/jpeg");
}

switchCamera.addEventListener('click', function(){
    facingModeEnv = !facingModeEnv;
    startWebcam(facingModeEnv ? 'environment' : 'user');
});

window.addEventListener('click', function(e){
    console.log(e.target);
    if (!predicting && e.target.id != 'switch-camera') {
        if (
            speechSynthesis.speaking &&
            currentSpeechText === "Tekan layar anda untuk mengambil gambar uang"
        ) {
            speechSynthesis.cancel();
        }
    
        predicting = true;
        captureAndPredict();
    }
});

// Capture button listener
captureBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!predicting) {
        if (
            speechSynthesis.speaking &&
            currentSpeechText === "Tekan layar anda untuk mengambil gambar uang"
        ) {
            speechSynthesis.cancel();
        }

        predicting = true;
        captureAndPredict();
    }
});
