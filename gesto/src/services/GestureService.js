export class GestureService {
    constructor() {
        this.handLandmarker = null;
        this.model = null;
        this.enExecucio = false;

        this.gestCongelat = null;
        this.tempsCongelat = 0;
        this.DURADA_MISSATGE = 3000;

        this.estatAnterior = null;
        this.marcaTempsEstatAnterior = 0;
        this.MAX_TEMPS_ENTRE_PASSOS = 2000;

        this.classesSignes = ["dit_abaix_nas", "mans_tancades", "none", "polze_costat"];
    }

    async initialize() {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.js';
        script.async = true;

        return new Promise((resolve, reject) => {
            script.onload = async () => {
                try {
                    const { HandLandmarker, FilesetResolver } = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.js");
                    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");

                    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
                        baseOptions: {
                            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                            delegate: "GPU"
                        },
                        runningMode: "VIDEO",
                        numHands: 2
                    });

                    try {
                        this.model = await tf.loadLayersModel('/model_web/model.json?t=' + Date.now());
                    } catch (errorModel) {
                        console.error("Error en carregar model.json:", errorModel);
                    }

                    this.enExecucio = true;
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            script.onerror = () => reject(new Error('Error en carregar MediaPipe'));
            document.head.appendChild(script);
        });
    }

    _predirSigne(ma) {
        if (!this.model) return null;

        let coordenadesPlanes = [];
        for (let i = 0; i < ma.length; i++) {
            coordenadesPlanes.push(ma[i].x);
            coordenadesPlanes.push(ma[i].y);
            coordenadesPlanes.push(ma[i].z);
        }

        return tf.tidy(() => {
            const inputTensor = tf.tensor2d([coordenadesPlanes]);
            const prediccio = this.model.predict(inputTensor);

            const index = prediccio.argMax(1).dataSync()[0];
            const confianca = prediccio.max().dataSync()[0];

            if (confianca > 0.75) {
                return this.classesSignes[index];
            }
            return null;
        });
    }

    _analitzarMoviment(mans, timestamp) {
        if (this.gestCongelat && (timestamp - this.tempsCongelat < this.DURADA_MISSATGE)) {
            return this.gestCongelat;
        } else {
            this.gestCongelat = null;
        }

        if (mans.length > 0) {
            const signeActual = this._predirSigne(mans[0]);

            if (!signeActual || signeActual === "none") return "Mà detectada";

            if (signeActual === "dit_abaix_nas") {
                this.estatAnterior = "dit_abaix_nas";
                this.marcaTempsEstatAnterior = timestamp;
                return "Mà detectada";
            }

            if (signeActual === "polze_costat") {
                if (this.estatAnterior === "dit_abaix_nas" && (timestamp - this.marcaTempsEstatAnterior < this.MAX_TEMPS_ENTRE_PASSOS)) {
                    this.estatAnterior = null;
                    this.gestCongelat = "Ell";
                    this.tempsCongelat = timestamp;
                    return "Ell";
                }
                return "Mà detectada";
            }

            if (signeActual === "mans_tancades") {
                if (this.estatAnterior === "dit_abaix_nas" && (timestamp - this.marcaTempsEstatAnterior < this.MAX_TEMPS_ENTRE_PASSOS)) {
                    this.estatAnterior = null;
                    this.gestCongelat = "Amic";
                    this.tempsCongelat = timestamp;
                    return "Amic";
                }
                return "Mà detectada";
            }
        }

        return "Mà detectada";
    }

    detect(videoElement, timestamp) {
        if (!this.handLandmarker) return null;

        try {
            const result = this.handLandmarker.detectForVideo(videoElement, timestamp);

            if (result.landmarks && result.landmarks.length > 0) {
                const signe = this._analitzarMoviment(result.landmarks, timestamp);
                return { hands: result.landmarks, signo: signe };
            }

            if (this.gestCongelat && (timestamp - this.tempsCongelat < this.DURADA_MISSATGE)) {
                return { hands: [], signo: this.gestCongelat };
            }
        } catch (error) {
        }

        return null;
    }
}