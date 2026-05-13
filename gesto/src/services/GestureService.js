import * as tf from '@tensorflow/tfjs'

export class GestureService {
  constructor () {
    this.fraseActual = []
    this.potAfegirParaula = true
    this.tempsUltimaParaula = 0
    this.TEMPS_RESET_FRASE = 5000

    this.estatAnterior = null
    this.marcaTempsEstatAnterior = 0
    this.MAX_TEMPS_ENTRE_PASSOS = 2000

    this.ultimSigneDetectat = null
    this.comptadorContinuita = 0
    this.FRAMES_NECESSARIS = 4

    this.classesSignes = []
  }

  async initialize () {
    try {
      // Usem la mateixa versió que el V2 per evitar conflictes
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

      try {
        const noCache = '?t=' + Date.now()
        const basePath = '/entrenament_signes/model_web/'

        // Carregar etiquetes dinàmicament
        const classesResponse = await fetch(basePath + 'classes.json' + noCache)
        if (classesResponse.ok) {
          this.classesSignes = await classesResponse.json()
        }

        this.model = await tf.loadLayersModel(basePath + 'model.json' + noCache)
        console.log('Model IA carregat correctament amb ' + this.classesSignes.length + ' classes.')
      } catch (error) {
        console.error('Error en carregar model.json o classes.json:', error)
      }

      this.enExecucio = true
    } catch (error) {
      console.error('Error en la inicialització:', error)
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
  }

  _predirSigne (mans) {
    if (!this.model) {
      return null
    }

    const coordenadesPlanes = []

    if (mans.length > 0) {
      for (let i = 0; i < mans[0].length; i++) {
        coordenadesPlanes.push(mans[0][i].x, mans[0][i].y, mans[0][i].z)
      }
    } else {
      for (let i = 0; i < 63; i++) {
        coordenadesPlanes.push(0)
      }
    }

    if (mans.length > 1) {
      for (let i = 0; i < mans[1].length; i++) {
        coordenadesPlanes.push(mans[1][i].x, mans[1][i].y, mans[1][i].z)
      }
    } else {
      for (let i = 0; i < 63; i++) {
        coordenadesPlanes.push(0)
      }
    }

    try {
      return tf.tidy(() => {
        const inputTensor = tf.tensor2d([coordenadesPlanes])
        const prediccio = this.model.predict(inputTensor)

        const index = prediccio.argMax(1).dataSync()[0]
        const confianca = prediccio.max().dataSync()[0]

        if (confianca > 0.75) {
          return this.classesSignes[index]
        }
        return null
      })
    } catch {
      // L'error habitual serà que el model actual espera 63 punts i rep 126
      return null
    }
  }

  _analitzarMoviment (mans, timestamp) {
    if (this.fraseActual.length > 0 && (timestamp - this.tempsUltimaParaula > this.TEMPS_RESET_FRASE)) {
      this.fraseActual = []
    }

    if (this.estatAnterior && (timestamp - this.marcaTempsEstatAnterior > this.MAX_TEMPS_ENTRE_PASSOS)) {
      this.estatAnterior = null
    }

    if (mans.length > 0) {
      const signeActual = this._predirSigne(mans)

      if (signeActual === this.ultimSigneDetectat) {
        this.comptadorContinuita++
      } else {
        this.ultimSigneDetectat = signeActual
        this.comptadorContinuita = 1
      }

      if (this.comptadorContinuita < this.FRAMES_NECESSARIS) {
        return this.fraseActual.length > 0 ? this.fraseActual.join(' ') : 'Esperant signes...'
      }

      if (signeActual === 'none' || !signeActual) {
        this.potAfegirParaula = true
        return this.fraseActual.length > 0 ? this.fraseActual.join(' ') : 'Esperant signes...'
      }

      let novaParaula = null

      // GESTOS ESTÀTICS
      const gestosEstàtics = {
        dit_tocant_pit: 'Jo',
        mans_tancades: 'Amic',
        tenir: 'Tenir',
        1: '1',
        0: '0',
        hola: 'Hola',
        gracies: 'Gràcies',
      }

      if (gestosEstàtics[signeActual]) {
        this.estatAnterior = null
        novaParaula = gestosEstàtics[signeActual]
      } else {
        switch (signeActual) {
          case 'adeu_inici': { // GESTOS DE SEQÜÈNCIA
            this.estatAnterior = 'adeu_inici'
            this.marcaTempsEstatAnterior = timestamp

            break
          }
          case 'dit_abaix_nas': {
            this.estatAnterior = 'dit_abaix_nas'
            this.marcaTempsEstatAnterior = timestamp

            break
          }
          case 'polze_costat': {
            if (this.estatAnterior === 'dit_abaix_nas' && (timestamp - this.marcaTempsEstatAnterior < this.MAX_TEMPS_ENTRE_PASSOS)) {
              novaParaula = 'Ell'
              this.estatAnterior = null
            } else if (this.estatAnterior === 'adeu_inici' && (timestamp - this.marcaTempsEstatAnterior < this.MAX_TEMPS_ENTRE_PASSOS)) {
              novaParaula = 'Adeu'
              this.estatAnterior = null
            }

            break
          }
          case 'agafar_inici': {
            this.estatAnterior = 'agafar_inici'
            this.marcaTempsEstatAnterior = timestamp

            break
          }
          case 'agafar_fi': {
            if (this.estatAnterior === 'agafar_inici' && (timestamp - this.marcaTempsEstatAnterior < this.MAX_TEMPS_ENTRE_PASSOS)) {
              novaParaula = 'Agafar'
              this.estatAnterior = null
            }

            break
          }
          default: { if (!['none', '0', '1'].includes(signeActual) // FALLBACK PER GESTOS NOUS
            && !signeActual.includes('_inici') && !signeActual.includes('_fi') && !signeActual.includes('_costat')) {
            novaParaula = signeActual
            this.estatAnterior = null
          }
          }
        }
      }

      // AFEGIR LA PARAULA A LA FRASE
      if (novaParaula && this.potAfegirParaula) {
        this.fraseActual.push(novaParaula)
        this.potAfegirParaula = false
        this.tempsUltimaParaula = timestamp
      }
    } else {
      this.potAfegirParaula = true
    }

    return this.fraseActual.length > 0 ? this.fraseActual.join(' ') : 'Esperant signes...'
  }

  detect (videoElement, timestamp) {
    if (!this.handLandmarker) {
      return null
    }

    try {
      const result = this.handLandmarker.detectForVideo(videoElement, timestamp)
      let signe = null
      try {
        signe = this._analitzarMoviment(result.landmarks || [], timestamp)
      } catch (error) {
        console.error('Error predir signe:', error)
      }
      return { hands: result.landmarks || [], signo: signe }
    } catch (error) {
      console.error('Error detectForVideo:', error)
    }

    return null
  }

  handLandmarker = null
  model = null
  enExecucio = false
}
