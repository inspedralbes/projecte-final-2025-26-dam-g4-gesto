export class GestureService {
    constructor() {
        this.handLandmarker = null;
        this.model = null;
        this.enExecucio = false;

        this.fraseActual = [];
        this.potAfegirParaula = true;
        this.tempsUltimaParaula = 0;
        this.TEMPS_RESET_FRASE = 5000;

        this.estatAnterior = null;
        this.marcaTempsEstatAnterior = 0;
        this.MAX_TEMPS_ENTRE_PASSOS = 2000;

        this.ultimSigneDetectat = null;
        this.comptadorContinuita = 0;
        this.FRAMES_NECESSARIS = 4;

        this.classesSignes = ["agafar_fi", "agafar_inici", "dit_abaix_nas", "dit_tocant_pit", "mans_tancades", "none", "polze_costat"];
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
                        this.model = await tf.loadLayersModel('/entrenament_signes/model_web/model.json?t=' + Date.now());
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
        if (this.fraseActual.length > 0 && (timestamp - this.tempsUltimaParaula > this.TEMPS_RESET_FRASE)) {
            this.fraseActual = [];
        }

        if (this.estatAnterior && (timestamp - this.marcaTempsEstatAnterior > this.MAX_TEMPS_ENTRE_PASSOS)) {
            this.estatAnterior = null;
        }

        if (mans.length > 0) {
            const signeM1 = this._predirSigne(mans[0]);
            let signeM2 = (mans.length === 2) ? this._predirSigne(mans[1]) : null;


            let signeActual = signeM1;

            if (mans.length === 2 && (signeM1 === "mans_tancades" || signeM2 === "mans_tancades")) {
                signeActual = "mans_tancades_doble";
            }

            if (signeActual === this.ultimSigneDetectat) {
                this.comptadorContinuita++;
            } else {
                this.ultimSigneDetectat = signeActual;
                this.comptadorContinuita = 1;
            }

            if (this.comptadorContinuita < this.FRAMES_NECESSARIS) {
                return this.fraseActual.length > 0 ? this.fraseActual.join(" ") : "Esperant signes...";
            }

            if (signeActual === "none" || !signeActual) {
                this.potAfegirParaula = true;
                return this.fraseActual.length > 0 ? this.fraseActual.join(" ") : "Esperant signes...";
            }

            let novaParaula = null;

            // GESTOS ESTÀTICS
            if (signeActual === "dit_tocant_pit") {
                this.estatAnterior = null;
                novaParaula = "Jo";
            }

            // GESTOS DE SEQÜÈNCIA
            if (signeActual === "dit_abaix_nas") {
                this.estatAnterior = "dit_abaix_nas";
                this.marcaTempsEstatAnterior = timestamp;
            }

            if (signeActual === "polze_costat") {
                if (this.estatAnterior === "dit_abaix_nas") {
                    novaParaula = "Ell";
                    this.estatAnterior = null;
                }
            }

            if (signeActual === "mans_tancades_doble") {
                if (this.estatAnterior === "dit_abaix_nas") {
                    novaParaula = "Amic";
                    this.estatAnterior = null;
                }
            }

            if (signeActual === "agafar_inici") {
                this.estatAnterior = "agafar_inici";
                this.marcaTempsEstatAnterior = timestamp;
            }

            if (signeActual === "agafar_fi") {
                if (this.estatAnterior === "agafar_inici" && (timestamp - this.marcaTempsEstatAnterior < this.MAX_TEMPS_ENTRE_PASSOS)) {
                    novaParaula = "Agafar";
                    this.estatAnterior = null;
                }
            }

            // AFEGIR LA PARAULA A LA FRASE
            if (novaParaula && this.potAfegirParaula) {
                this.fraseActual.push(novaParaula);
                this.potAfegirParaula = false;
                this.tempsUltimaParaula = timestamp;
            }
        } else {
            // Si baixes les mans completament fora de la càmera
            this.potAfegirParaula = true;
        }

        return this.fraseActual.length > 0 ? this.fraseActual.join(" ") : "Esperant signes...";
    }

    detect(videoElement, timestamp) {
        if (!this.handLandmarker) return null;

        try {
            const result = this.handLandmarker.detectForVideo(videoElement, timestamp);

            const signe = this._analitzarMoviment(result.landmarks || [], timestamp);

            return { hands: result.landmarks || [], signo: signe };

        } catch (error) {
        }

        return null;
    }
}