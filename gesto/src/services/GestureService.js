// Importar Mediapipe
export class GestureService {
    constructor() {
        this.handLandmarker = null;  // Instancia de HandLandmarker
        this.isRunning = false;      // Indica si el servicio está en ejecución

        // Variables para la memoria (necesarias para detectar movimiento)
        // Guardar posiciones X de la mano
        this.historialPosicionesX = [];
        // NUEVO: Guardar posiciones Y de la mano (arriba y abajo)
        this.historialPosicionesY = [];
        
        // Timestamps
        this.ultimoSaludo = 0;       // Timestamp del último saludo detectado
        this.ultimoSaludo2 = 0;
        this.ultimoAdeu = 0;

        // Variables para el gesto "Adeu"
        this.adeuPaso = 0;          // Controla la secuencia de abrir/cerrar
        this.adeuUltimoTiempo = 0;  // Para reiniciar si el usuario se queda a medias

        // NUEVO: Sistema para congelar gestos en pantalla
        this.gestoCongelado = null;    // Guardará el texto ("Hola", "Gràcies", "Adeu")
        this.tiempoCongelado = 0;      // Guardará el momento exacto en que se detectó
        this.DURACION_MENSAJE = 3000;  // 3000 milisegundos = 3 segundos
    }

    // Inicializar el servicio, cargando el modelo de Mediapipe
    async initialize() {
        // Cargar MediaPipe desde CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.js';
        script.async = true;

        return new Promise((resolve, reject) => {
            script.onload = async () => {
                try {
                    const { HandLandmarker, FilesetResolver } = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.js");
                    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");

                    // Configurar el comportamiento del modelo de detección de manos
                    this.handLandmarker = await HandLandmarker.createFromOptions(vision, { 
                        baseOptions: {
                            // Cargar el modelo de detección de manos desde la URL proporcionada por Mediapipe
                            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                            delegate: "GPU" // Usar GPU para mejorar el rendimiento
                        },
                        runningMode: "VIDEO", // Indica que se procesarán videos en tiempo real
                        numHands: 2  // Detectar hasta 2 manos
                    });

                    this.isRunning = true; // Marcar el servicio como listo para procesar
                    console.log("IA Gesto initzialitzat correctament");
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };

            script.onerror = () => reject(new Error('Failed to load MediaPipe'));
            document.head.appendChild(script);
        });
    }

    // Comprobar si la mano está abierta 
    _esManoAbierta(landmarks) {
        const indiceAbierto = landmarks[8].y < landmarks[5].y;
        const medioAbierto = landmarks[12].y < landmarks[9].y;
        const anularAbierto = landmarks[16].y < landmarks[13].y;
        const meniqueAbierto = landmarks[20].y < landmarks[17].y;

        return indiceAbierto && medioAbierto && anularAbierto && meniqueAbierto;
    }

  _detectarAgitacion(historialX) {
        // Exigimos tener el historial completo (15 fotogramas) para asegurar 
        // que es un movimiento real y continuado, no un fallo de un segundo.
        if (historialX.length < 15) return false; 

        // Buscamos el valor más pequeño y el más grande
        const minX = Math.min(...historialX);
        const maxX = Math.max(...historialX);

        // Calculamos la distancia
        const distanciaRecorrida = maxX - minX;

        // Aumentamos el umbral del 0.05 (5%) al 0.15 (15%). 
        // Si aún salta muy rápido, súbelo a 0.20. Si cuesta mucho, bájalo a 0.12.
        return distanciaRecorrida > 0.15; 
    }
    // NUEVO: Detectar gesto de "Gràcies" hacia abajo
    _detectarGracias(historialY) {
        if(historialY.length < 10 ) return false;

        const posicionInicial = historialY[0];
        const posicionFinal = historialY[historialY.length - 1];
        // Calculamos la diferencia. Si es positiva, la mano ha bajado.
        const distanciaBajada = posicionFinal - posicionInicial;
        return distanciaBajada > 0.10;
    }

    // Analizar el movimiento de la mano para determinar el gesto
   // Analizar el movimiento de la mano para determinar el gesto
    _analizarMovimiento(manos, timestamp) {

        // Si hay un mensaje congelado y no han pasado 3 segundos, lo seguimos devolviendo
        if (this.gestoCongelado && (timestamp - this.tiempoCongelado < this.DURACION_MENSAJE)) {
            return this.gestoCongelado;
        } else {
            // Si ya pasaron los 3 segundos, quitamos el candado interno
            this.gestoCongelado = null;
        }

        // Bucle for para detectar cada mano que haya en la pantalla
        for (let i = 0; i < manos.length; i++) {
            const mano = manos[i]; 

            // Comprobar el gesto "Adeu" (prioridad a gestos complejos)
            if (this._detectarAdeu(mano, timestamp)) {
                this.historialPosicionesX = []; 
                this.historialPosicionesY = []; 
                this.gestoCongelado = "Adeu";   
                this.tiempoCongelado = timestamp;
                return "Adeu";
            }
            // Comprobar si la mano esta abierta para gestos de movimiento
            if (this._esManoAbierta(mano)) {
                // Guardamos posición X e Y en el historial
                this.historialPosicionesX.push(mano[0].x);
                this.historialPosicionesY.push(mano[0].y);

                // Limitar el historial a las últimas 15 posiciones
                if (this.historialPosicionesX.length > 15) {
                    this.historialPosicionesX.shift(); 
                    this.historialPosicionesY.shift(); 
                }

                // Detectar "Gràcies" (movimiento hacia abajo)
                if (this._detectarGracias(this.historialPosicionesY)) {
                    if (timestamp - this.ultimoSaludo > this.DURACION_MENSAJE) {
                        this.ultimoSaludo = timestamp;
                        this.historialPosicionesX = [];
                        this.historialPosicionesY = [];
                        
                        this.gestoCongelado = "Gràcies";
                        this.tiempoCongelado = timestamp;
                        return "Gràcies";
                    }
                }

                // Comprobar si se ha detectado un movimiento de agitación
                if (this._detectarAgitacion(this.historialPosicionesX)) {
                    if (timestamp - this.ultimoSaludo > this.DURACION_MENSAJE) {
                        this.ultimoSaludo = timestamp; 
                        this.historialPosicionesX = []; 
                        this.historialPosicionesY = []; 
                        
                        this.gestoCongelado = "Hola"; 
                        this.tiempoCongelado = timestamp;
                        return "Hola"; 
                    } 
                }

                // SOLUCIÓN DE LAS DOS MANOS:
                // Rompemos el bucle para procesar solo una mano a la vez en los historiales de movimiento.
                // Así evitamos que se mezclen las coordenadas de la mano izquierda y derecha.
                break; 
            }
        }
        return "Mano detectada";
    }

    // Comprobar si los 4 dedos (sin pulgar) están abiertos
    _cuatroDedosAbiertos(landmarks) {
        const indiceAbierto = landmarks[8].y < landmarks[5].y;
        const medioAbierto = landmarks[12].y < landmarks[9].y;
        const anularAbierto = landmarks[16].y < landmarks[13].y;
        const meniqueAbierto = landmarks[20].y < landmarks[17].y;
        return indiceAbierto && medioAbierto && anularAbierto && meniqueAbierto;
    }

    // Comprobar si los 4 dedos (sin pulgar) están cerrados sobre la palma
    _cuatroDedosCerrados(landmarks) {
        const indiceCerrado = landmarks[8].y > landmarks[5].y;
        const medioCerrado = landmarks[12].y > landmarks[9].y;
        const anularCerrado = landmarks[16].y > landmarks[13].y;
        const meniqueCerrado = landmarks[20].y > landmarks[17].y;
        return indiceCerrado && medioCerrado && anularCerrado && meniqueCerrado;
    }

    // Comprobar que el pulgar esté estirado (abierto)
    _pulgarAbierto(landmarks) {
        const distPunta = Math.hypot(landmarks[4].x - landmarks[9].x, landmarks[4].y - landmarks[9].y);
        const distBase = Math.hypot(landmarks[3].x - landmarks[9].x, landmarks[3].y - landmarks[9].y);
        return distPunta > distBase;
    }

    _detectarAdeu(mano, timestamp) {
        // 1. Si la IA pierde el pulgar por un milisegundo, simplemente ignoramos este fotograma.
        // ¡IMPORTANTE! Ya no reseteamos this.adeuPaso a 0, así evitamos arruinar la secuencia por un pequeño parpadeo de la cámara.
        if (!this._pulgarAbierto(mano)) {
            return false;
        }

        // Leemos el estado actual de los 4 dedos
        const estanAbiertos = this._cuatroDedosAbiertos(mano);
        const estanCerrados = this._cuatroDedosCerrados(mano);

        // 2. Reiniciar si el usuario se queda "congelado" a mitad de un movimiento por más de 1.5 segundos
        if (this.adeuPaso > 0 && (timestamp - this.adeuUltimoTiempo > 1500)) {
            this.adeuPaso = 0;
        }

        // 3. NUEVA MÁQUINA DE ESTADOS (Más fluida: Abierto -> Cerrado -> Abierto)
        
        // FASE 0: Esperando a que el usuario muestre la mano abierta
        if (this.adeuPaso === 0) {
            if (estanAbiertos) {
                this.adeuPaso = 1; 
                this.adeuUltimoTiempo = timestamp;
            }
        } 
        // FASE 1: La mano está abierta. Esperando a que se cierre.
        else if (this.adeuPaso === 1) {
            if (estanAbiertos) {
                // Truco: Mientras la mano siga abierta, actualizamos el tiempo. 
                // Así evitamos que el temporizador te caduque si te quedas con la mano abierta mucho rato.
                this.adeuUltimoTiempo = timestamp;
            } else if (estanCerrados) {
                this.adeuPaso = 2; // Avanza a mano cerrada
                this.adeuUltimoTiempo = timestamp;
            }
        } 
        // FASE 2: La mano está cerrada. Esperando a que se vuelva a abrir.
        else if (this.adeuPaso === 2) {
            if (estanCerrados) {
                // Actualizamos el tiempo mientras siga cerrada para que no caduque.
                this.adeuUltimoTiempo = timestamp;
            } else if (estanAbiertos) {
                // ¡Fase final! Se abrió, se cerró y se volvió a abrir. 
                this.adeuPaso = 0; // Reseteamos por si quiere volver a hacerlo luego
                return true;       // Disparamos el gesto "Adeu"
            }
        }

        return false;
    }
    // Comprobar si es un saludo marinero (mano abierta e inclinada diagonalmente)
    _esSaludo2(landmarks) {
        if (!this._esManoAbierta(landmarks)) return false;

        const dx = landmarks[9].x - landmarks[0].x;
        const dy = landmarks[9].y - landmarks[0].y;
        
        const angulo = Math.atan2(dy, dx) * (180 / Math.PI);

        const esInclinacionDerecha = angulo > -160 && angulo < -110;
        const esInclinacionIzquierda = angulo > -70 && angulo < -20;

        return esInclinacionDerecha || esInclinacionIzquierda;
    }

    // Procesamiento
    detect(videoElement, timestamp) {
        if (!this.handLandmarker) return null;

        // Le pasamos el fotograma actual a MediaPipe para que busque manos
        const result = this.handLandmarker.detectForVideo(videoElement, timestamp);

        // Si se detectan manos, analizamos su posición para determinar el gesto
        if (result.landmarks && result.landmarks.length > 0) {
            // Enviar las manos detectadas a la función de análisis para determinar el gesto
            const signo = this._analizarMovimiento(result.landmarks, timestamp);
            return { hands: result.landmarks, signo };
        }

        // NUEVO: Devolvemos el gesto congelado aunque ya no se vean las manos en cámara
        if (this.gestoCongelado && (timestamp - this.tiempoCongelado < this.DURACION_MENSAJE)) {
            return { hands: [], signo: this.gestoCongelado };
        } else {
            this.gestoCongelado = null; // Si ya pasó el tiempo, lo limpiamos
        }

        // Si no se detectan manos, limpiamos el historial de posiciones para evitar falsos positivos
        this.historialPosicionesX = []; 
        this.historialPosicionesY = []; // NUEVO: Limpiamos también el de Y
        return null;
    }
}