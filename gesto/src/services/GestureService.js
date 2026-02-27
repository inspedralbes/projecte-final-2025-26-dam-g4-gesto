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

        // LO DEJAMOS VACÍO PARA QUE LO RELLENE PYTHON
        this.classesSignes = []; 
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

                    // --- NUEVA CARGA DINÁMICA DE MODELO Y CLASES ---
                    try {
                        const noCache = '?t=' + Date.now();
                        // Nueva ruta dentro de entrenament_signes
                        const basePath = '/entrenament_signes/model_web/'; 
                        
                        // 1. Cargamos el JSON de clases que genera Python
                        const classesResponse = await fetch(basePath + 'classes.json' + noCache);
                        if (classesResponse.ok) {
                            this.classesSignes = await classesResponse.json();
                            console.log("Clases cargadas correctamente desde Python:", this.classesSignes);
                        } else {
                            console.warn("No se encontró classes.json. ¿Has entrenado el modelo?");
                        }
                        
                        // 2. Cargamos el modelo
                        this.model = await tf.loadLayersModel(basePath + 'model.json' + noCache);
                        
                    } catch (errorCarga) {
                        console.error("Error cargando el modelo o las clases:", errorCarga);
                    }
                    // ------------------------------------------------

                    this.enExecucio = true;
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            script.onerror = () => reject(new Error('Error al cargar MediaPipe'));
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
        // Mantenemos tu lógica de "congelar" el mensaje en pantalla por unos segundos
        if (this.gestCongelat && (timestamp - this.tempsCongelat < this.DURADA_MISSATGE)) {
            return this.gestCongelat;
        } else {
            this.gestCongelat = null;
        }

        if (mans.length > 0) {
            // Aquí la IA adivina el gesto (ej: "DOS", "L", "polze_costat")
            const signeActual = this._predirSigne(mans[0]);

            if (!signeActual || signeActual === "none") return "Mà detectada";

            // ¡MAGIA AQUÍ! 
            // En lugar de hacer mil comprobaciones, si la IA detecta cualquier gesto
            // que NO sea 'none', simplemente congelamos ese nombre y lo mostramos.
            this.gestCongelat = signeActual;
            this.tempsCongelat = timestamp;
            return signeActual; 
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