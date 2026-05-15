// TF des de npm (evita conflicte amb MediaPipe)
// MediaPipe des de CDN dinàmic (forma original que funcionava)
import * as tf from '@tensorflow/tfjs'

export class GestureService {
  handLandmarker = null
  model = null
  enExecucio = false

  gestCongelat = null
  tempsCongelat = 0
  DURADA_MISSATGE = 1200

  gestPendent = null
  compteConfirmacio = 0
  FRAMES_CONFIRMACIO = 3

  classesSignes = []

  constructor () {
    // Inicialització de variables d'estat
  }

  async initialize () {
    try {
      const { HandLandmarker, FilesetResolver } = await import(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/vision_bundle.mjs',
      )

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm',
      )

      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
      })

      console.log('✅ HandLandmarker inicialitzat correctament')

      await tf.ready()
      console.log('✅ TensorFlow.js llest. Backend:', tf.getBackend())

      const noCache = '?t=' + Date.now()
      const basePath = '/entrenament_signes/model_web_v2/'

      const classesResponse = await fetch(basePath + 'classes.json' + noCache)
      if (classesResponse.ok) {
        this.classesSignes = await classesResponse.json()
        console.log('✅ Clases cargadas:', this.classesSignes)
      } else {
        console.warn('⚠️ No se encontró classes.json')
      }

      this.model = await tf.loadLayersModel(basePath + 'model.json' + noCache)
      console.log('✅ Model carregat correctament')

      this.enExecucio = true
    } catch (error) {
      console.error('Error inicialitzant GestureService:', error)
      throw error
    }
  }

  destroy () {
    this.enExecucio = false
    if (this.model) {
      this.model.dispose()
      this.model = null
    }
    if (this.handLandmarker) {
      this.handLandmarker.close()
      this.handLandmarker = null
    }
    this.gestCongelat = null
    this.gestPendent = null
    this.compteConfirmacio = 0
    console.log('✅ GestureService V2 destruït correctament.')
  }

  _normalizeFlatLandmarks (flatLandmarks) {
    const sum = flatLandmarks.reduce((a, b) => Math.abs(a) + Math.abs(b), 0)
    if (sum === 0) {
      return Array.from({ length: 63 }).fill(0)
    }

    const baseX = flatLandmarks[0]
    const baseY = flatLandmarks[1]
    const baseZ = flatLandmarks[2]
    const normalized = []
    let maxDist = 0

    for (let i = 0; i < 63; i += 3) {
      const nx = flatLandmarks[i] - baseX
      const ny = flatLandmarks[i + 1] - baseY
      const nz = flatLandmarks[i + 2] - baseZ
      normalized.push([nx, ny, nz])

      const dist = Math.hypot(nx, ny, nz)
      if (dist > maxDist) {
        maxDist = dist
      }
    }

    const result = []
    if (maxDist > 0) {
      for (const point of normalized) {
        result.push(point[0] / maxDist, point[1] / maxDist, point[2] / maxDist)
      }
    } else {
      for (const point of normalized) {
        result.push(point[0], point[1], point[2])
      }
    }

    return result
  }

  _predirSigne (mans) {
    if (!this.model) {
      return null
    }

    const rawHand1 = []
    const rawHand2 = []

    if (mans.length > 0) {
      for (let i = 0; i < mans[0].length; i++) {
        rawHand1.push(mans[0][i].x, mans[0][i].y, mans[0][i].z)
      }
    } else {
      for (let i = 0; i < 63; i++) {
        rawHand1.push(0)
      }
    }

    if (mans.length > 1) {
      for (let i = 0; i < mans[1].length; i++) {
        rawHand2.push(mans[1][i].x, mans[1][i].y, mans[1][i].z)
      }
    } else {
      for (let i = 0; i < 63; i++) {
        rawHand2.push(0)
      }
    }

    const normHand1 = this._normalizeFlatLandmarks(rawHand1)
    const normHand2 = this._normalizeFlatLandmarks(rawHand2)
    const coordenadesPlanes = normHand1.concat(normHand2)

    let inputTensor = null
    let prediccio = null

    try {
      inputTensor = tf.tensor2d([coordenadesPlanes])
      prediccio = this.model.predict(inputTensor)

      const index = prediccio.argMax(1).dataSync()[0]
      const confianca = prediccio.max().dataSync()[0]
      const gestAdivinat = this.classesSignes[index]

      return confianca > 0.8 ? gestAdivinat : null
    } catch (error) {
      console.error('Error en _predirSigne:', error)
      return null
    } finally {
      if (inputTensor) {
        inputTensor.dispose()
      }
      if (prediccio) {
        prediccio.dispose()
      }
    }
  }

  _analitzarMoviment (mans, timestamp) {
    if (this.gestCongelat && (timestamp - this.tempsCongelat < this.DURADA_MISSATGE)) {
      return this.gestCongelat
    } else {
      this.gestCongelat = null
    }

    if (mans.length > 0) {
      const signeActual = this._predirSigne(mans)

      if (!signeActual) {
        return null
      }

      if (signeActual === this.gestPendent) {
        this.compteConfirmacio++
      } else {
        this.gestPendent = signeActual
        this.compteConfirmacio = 1
      }

      if (this.compteConfirmacio >= this.FRAMES_CONFIRMACIO) {
        this.gestCongelat = signeActual
        this.tempsCongelat = timestamp
        this.compteConfirmacio = 0
        this.gestPendent = null
        return signeActual
      }

      return null
    }

    this.gestPendent = null
    this.compteConfirmacio = 0
    return null
  }

  detect (videoElement, timestamp) {
    if (!this.handLandmarker) {
      return null
    }

    try {
      const result = this.handLandmarker.detectForVideo(videoElement, timestamp)

      if (result.landmarks && result.landmarks.length > 0) {
        const signe = this._analitzarMoviment(result.landmarks, timestamp)
        return { hands: result.landmarks, signo: signe }
      }

      if (this.gestCongelat && (timestamp - this.tempsCongelat < this.DURADA_MISSATGE)) {
        return { hands: [], signo: this.gestCongelat }
      }
    } catch (error) {
      console.error('Error en detect:', error)
    }

    return null
  }
}
