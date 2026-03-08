// TF des de npm (evita conflicte amb MediaPipe)
// MediaPipe des de CDN dinàmic (forma original que funcionava)
import * as tf from '@tensorflow/tfjs';

export class GestureService {
   constructor() {
       this.handLandmarker = null;
       this.model = null;
       this.enExecucio = false;

       this.gestCongelat = null;
       this.tempsCongelat = 0;
       this.DURADA_MISSATGE = 3000;

       this.gestPendent = null;
       this.compteConfirmacio = 0;
       this.FRAMES_CONFIRMACIO = 3;

       this.classesSignes = [];
   }

   async initialize() {
       try {
           const { HandLandmarker, FilesetResolver } = await import(
               'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/vision_bundle.mjs'
           );

           const vision = await FilesetResolver.forVisionTasks(
               'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm'
           );

           this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
               baseOptions: {
                   modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                   delegate: "GPU"
               },
               runningMode: "VIDEO",
               numHands: 2
           });

           console.log("✅ HandLandmarker inicialitzat correctament");

           await tf.ready();
           console.log("✅ TensorFlow.js llest. Backend:", tf.getBackend());

           const noCache = '?t=' + Date.now();
           const basePath = '/entrenament_signes/model_web_v2/';

           const classesResponse = await fetch(basePath + 'classes.json' + noCache);
           if (classesResponse.ok) {
               this.classesSignes = await classesResponse.json();
               console.log("✅ Clases cargadas:", this.classesSignes);
           } else {
               console.warn("⚠️ No se encontró classes.json");
           }

           this.model = await tf.loadLayersModel(basePath + 'model.json' + noCache);
           console.log("✅ Model carregat correctament");

           this.enExecucio = true;

       } catch (error) {
           console.error("Error inicialitzant GestureService:", error);
           throw error;
       }
   }

   destroy() {
       this.enExecucio = false;
       if (this.model) {
           this.model.dispose();
           this.model = null;
       }
       if (this.handLandmarker) {
           this.handLandmarker.close();
           this.handLandmarker = null;
       }
       this.gestCongelat = null;
       this.gestPendent = null;
       this.compteConfirmacio = 0;
       console.log("✅ GestureService V2 destruït correctament.");
   }

   _predirSigne(ma) {
       if (!this.model) return null;

       const coordenadesPlanes = [];
       for (let i = 0; i < ma.length; i++) {
           coordenadesPlanes.push(ma[i].x);
           coordenadesPlanes.push(ma[i].y);
           coordenadesPlanes.push(ma[i].z);
       }

       let inputTensor = null;
       let prediccio = null;

       try {
           inputTensor = tf.tensor2d([coordenadesPlanes]);
           prediccio = this.model.predict(inputTensor);

           const index = prediccio.argMax(1).dataSync()[0];
           const confianca = prediccio.max().dataSync()[0];
           const gestAdivinat = this.classesSignes[index];

           return confianca > 0.80 ? gestAdivinat : null;

       } catch (err) {
           console.error("Error en _predirSigne:", err);
           return null;
       } finally {
           if (inputTensor) inputTensor.dispose();
           if (prediccio) prediccio.dispose();
       }
   }

   _analitzarMoviment(mans, timestamp) {
       if (this.gestCongelat && (timestamp - this.tempsCongelat < this.DURADA_MISSATGE)) {
           return this.gestCongelat;
       } else {
           this.gestCongelat = null;
       }

       if (mans.length > 0) {
           const signeActual = this._predirSigne(mans[0]);

           if (!signeActual) return null;

           if (signeActual === this.gestPendent) {
               this.compteConfirmacio++;
           } else {
               this.gestPendent = signeActual;
               this.compteConfirmacio = 1;
           }

           if (this.compteConfirmacio >= this.FRAMES_CONFIRMACIO) {
               this.gestCongelat = signeActual;
               this.tempsCongelat = timestamp;
               this.compteConfirmacio = 0;
               this.gestPendent = null;
               return signeActual;
           }

           return null;
       }

       this.gestPendent = null;
       this.compteConfirmacio = 0;
       return null;
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
           console.error("Error en detect:", error);
       }

       return null;
   }
}