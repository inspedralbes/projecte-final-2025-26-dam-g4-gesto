//Importar Mediapipe
export class GestureService {
    constructor() {
        this.handLandmarker = null;  // Instancia de HandLandmarker (corregido a minúscula inicial)
        this.isRunning = false;      // Indica si el servicio está en ejecución
        
        // Variables para la memoria (necesarias para detectar movimiento)
        // Guardar posiciones X de la mano
        this.historialPosicionesX = [];
        this.ultimoSaludo = 0;       // Timestamp del último saludo detectado
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
        if(historialX.length < 10) return false; // Necesitamos al menos 10 posiciones para detectar movimiento
        
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
        // Bucle for para detectar cada mano que haya en la pantalla
        for(let i = 0; i < manos.length; i++) {
            const mano = manos[i]; // Corregido: antes decía 'const manos = manos[i]', lo cual borraba la lista entera
            
            // Comprobar si la mano esta abierta
            if(this._esManoAbierta(mano)) {
                // Si la mano está abierta, guardamos su posición X en el historial
                this.historialPosicionesX.push(mano[0].x);
                
                // Limitar el historial a las últimas 15 posiciones para evitar que crezca indefinidamente
                if(this.historialPosicionesX.length > 15){
                    this.historialPosicionesX.shift(); // Eliminar la posición más antigua
                }

                // Comprobar si se ha detectado un movimiento de agitación (colocado dentro de si la mano está abierta)
                if(this._detectarAgitacion(this.historialPosicionesX)){
                    // Evitar el spam
                    if(timestamp - this.ultimoSaludo > 2000){
                        this.ultimoSaludo = timestamp; // Actualizar el timestamp del último saludo
                        this.historialPosicionesX = []; // Limpiar el historial para evitar detecciones repetidas
                        return "saludo"; // Devolver el gesto detectado
                    } // Si han pasado más de 2 segundos desde el último saludo
                    
                    return "Saludando..."; // Corregido: le faltaban las comillas, antes era una variable que no existía
                }
            }
        }
        return "Mano detectada"; // Agregado un retorno por defecto si no está saludando
    }

    // Procesamiento
    detect(videoElement, timestamp) {
        if(!this.handLandmarker) return null; 
        
        // Le pasamos el fotograma actual a MediaPipe para que busque manos
        const result = this.handLandmarker.detectForVideo(videoElement, timestamp);
        
        // Si se detectan manos, analizamos su posición para determinar el gesto
        if(result.landmarks && result.landmarks.length > 0){
            // Enviar las manos detectadas a la función de análisis para determinar el gesto
            const signo = this._analizarMovimiento(result.landmarks, timestamp);
            return { hands: result.landmarks, signo };
        }
        
        // Si no se detectan manos, limpiamos el historial de posiciones para evitar falsos positivos en el futuro
        this.historialPosicionesX = []; // Limpiar el historial si no se detectan manos
        return null;
    }
}