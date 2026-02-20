//Importar Mediapipe
export class GestureService {
    constructor() {
        this.handLandmarker = null;  // Instancia de HandLandmarker (corregido a minúscula inicial)
        this.isRunning = false;      // Indica si el servicio está en ejecución

        // Variables para la memoria (necesarias para detectar movimiento)
        // Guardar posiciones X de la mano
        this.historialPosicionesX = [];
        this.ultimoSaludo = 0;       // Timestamp del último saludo detectado
        this.ultimoSaludo2 = 0;

        // Variables para el gesto "Adeu"
        this.adeuPaso = 0;          // Controla la secuencia de abrir/cerrar
        this.adeuUltimoTiempo = 0;  // Para reiniciar si el usuario se queda a medias
        this.ultimoSaludo = 0;
        this.ultimoAdeu = 0;
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
                    this.handLandmarker = await HandLandmarker.createFromOptions(vision, { // Corregido a handLandmarker
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

    // Funciones 
    // Comprobar si la mano está abierta 
    _esManoAbierta(landmarks) {
        const indiceAbierto = landmarks[8].y < landmarks[5].y;
        const medioAbierto = landmarks[12].y < landmarks[9].y;
        const anularAbierto = landmarks[16].y < landmarks[13].y;
        const meniqueAbierto = landmarks[20].y < landmarks[17].y;

        return indiceAbierto && medioAbierto && anularAbierto && meniqueAbierto;
    }

    _detectarAgitacion(historialX) {
        if (historialX.length < 10) return false; // Necesitamos al menos 10 posiciones para detectar movimiento

        // Buscamos el valor más pequeño (más a la izquierda) y el más grande (más a la derecha)
        const minX = Math.min(...historialX);
        const maxX = Math.max(...historialX);

        // Calculamos la diferencia entre esos dos puntos
        const distanciaRecorrida = maxX - minX;

        // La pantalla mide de 0.0 a 1.0 en ancho.
        // Si la distancia es mayor a 0.08 (el 8% del ancho de la pantalla), consideramos que saludó.
        return distanciaRecorrida > 0.05;
    }

    // Analizar el movimiento de la mano para determinar el gesto
    _analizarMovimiento(manos, timestamp) {

        if (timestamp - this.ultimoAdeu < 2000) {
            return "Adeu";
        }

        if (timestamp - this.ultimoSaludo2 < 2000) {
            return "Hola";
        }

        // Bucle for para detectar cada mano que haya en la pantalla
        for (let i = 0; i < manos.length; i++) {
            const mano = manos[i]; // Corregido: antes decía 'const manos = manos[i]', lo cual borraba la lista entera

            //Comprobar el gesto "Adeu" (prioridad a gestos complejos)
            if (this._detectarAdeu(mano, timestamp)) {
                this.historialPosicionesX = []; // Limpiamos la agitación por si acaso
                this.ultimoAdeu = timestamp;
                return "Adeu";
            }

            if(this._esSaludo2(mano)) {
                this.historialPosicionesX = []; // Limpiamos la agitación
                this.ultimoMarinero = timestamp; 
                return "Hola";
            }

            // Comprobar si la mano esta abierta
            if (this._esManoAbierta(mano)) {
                // Si la mano está abierta, guardamos su posición X en el historial
                this.historialPosicionesX.push(mano[0].x);

                // Limitar el historial a las últimas 15 posiciones para evitar que crezca indefinidamente
                if (this.historialPosicionesX.length > 15) {
                    this.historialPosicionesX.shift(); // Eliminar la posición más antigua
                }

                // Comprobar si se ha detectado un movimiento de agitación (colocado dentro de si la mano está abierta)
                if (this._detectarAgitacion(this.historialPosicionesX)) {
                    // Evitar el spam
                    if (timestamp - this.ultimoSaludo > 2000) {
                        this.ultimoSaludo = timestamp; // Actualizar el timestamp del último saludo
                        this.historialPosicionesX = []; // Limpiar el historial para evitar detecciones repetidas
                        return "saludo"; // Devolver el gesto detectado
                    } // Si han pasado más de 2 segundos desde el último saludo

                    return "Hola"; // Corregido: le faltaban las comillas, antes era una variable que no existía
                }
            }
        }
        return "Mano detectada"; // Agregado un retorno por defecto si no está saludando
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
        // Usamos trigonometría básica: medimos la distancia de la punta del pulgar (4) al centro de la palma (9)
        // y la comparamos con la base del pulgar (3) al centro. Si la punta está más lejos, está abierto.
        const distPunta = Math.hypot(landmarks[4].x - landmarks[9].x, landmarks[4].y - landmarks[9].y);
        const distBase = Math.hypot(landmarks[3].x - landmarks[9].x, landmarks[3].y - landmarks[9].y);
        return distPunta > distBase;
    }

    _detectarAdeu(mano, timestamp) {
        // 1. Condición estricta: el pulgar DEBE estar abierto. Si se cierra, cancelamos todo.
        if (!this._pulgarAbierto(mano)) {
            this.adeuPaso = 0;
            return false;
        }

        // 2. Si pasa mucho tiempo (más de 1.5 segundos) entre movimientos, reiniciamos la secuencia
        if (timestamp - this.adeuUltimoTiempo > 1500) {
            this.adeuPaso = 0;
        }

        // Leemos el estado actual de los 4 dedos
        const estanAbiertos = this._cuatroDedosAbiertos(mano);
        const estanCerrados = this._cuatroDedosCerrados(mano);

        // 3. Máquina de estados: Seguimos la secuencia lógica
        if (this.adeuPaso === 0 && estanAbiertos) {
            this.adeuPaso = 1; // Fase 1: Empezamos con la mano abierta
            this.adeuUltimoTiempo = timestamp;
        }
        else if (this.adeuPaso === 1 && estanCerrados) {
            this.adeuPaso = 2; // Fase 2: Cierra por primera vez
            this.adeuUltimoTiempo = timestamp;
        }
        else if (this.adeuPaso === 2 && estanAbiertos) {
            this.adeuPaso = 3; // Fase 3: Abre por primera vez
            this.adeuUltimoTiempo = timestamp;
        }
        else if (this.adeuPaso === 3 && estanCerrados) {
            this.adeuPaso = 4; // Fase 4: Cierra por segunda vez
            this.adeuUltimoTiempo = timestamp;
        }
        else if (this.adeuPaso === 4 && estanAbiertos) {
            // Fase 5: Abre por segunda vez -> ¡Gesto completado!
            this.adeuPaso = 0; // Reseteamos para poder volver a hacerlo
            return true;
        }

        return false;
    }

    // Comprobar si es un saludo marinero (mano abierta e inclinada diagonalmente)
    _esSaludo2(landmarks) {
        // La mano debe estar abierta
        if (!this._esManoAbierta(landmarks)) return false;

        // Calcular la inclinación trazando un vector de la muñeca (0) al nudillo medio (9)
        const dx = landmarks[9].x - landmarks[0].x;
        const dy = landmarks[9].y - landmarks[0].y;
        
        // Convertimos a grados. 
        // (En la pantalla web, apuntar recto arriba es -90º. Apuntar a la derecha es 0º, a la izquierda es -180º)
        const angulo = Math.atan2(dy, dx) * (180 / Math.PI);

        // Comprobar si el ángulo es diagonal ("inclinado ligeramente hacia arriba")
        // Mano derecha: entre -160º y -110º aprox.
        // Mano izquierda: entre -70º y -20º aprox.
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

        // Si no se detectan manos, limpiamos el historial de posiciones para evitar falsos positivos en el futuro
        this.historialPosicionesX = []; // Limpiar el historial si no se detectan manos
        return null;
    }
}