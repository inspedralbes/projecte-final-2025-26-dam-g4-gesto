import os
# AIXÒ ÉS LA SOLUCIÓ A TOTS ELS PROBLEMES DE WEB: Forçar Keras Clàssic (v2)
os.environ["TF_USE_LEGACY_KERAS"] = "1"


import urllib.request
import pandas as pd
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import tensorflowjs as tfjs
import json # <-- Añadido para exportar las clases


# 1. CONFIGURACIÓ AUTOMÀTICA
DIRECTORI_DATASET = 'tutorial'
RUTA_EXPORTACIO = 'model_web_v2' # <-- Ruta directa al frontend


# Detecta las clases automáticamente leyendo los nombres de los archivos JSON
if not os.path.exists(DIRECTORI_DATASET):
    os.makedirs(DIRECTORI_DATASET)

import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

CLASSES = [d for d in os.listdir(DIRECTORI_DATASET) if os.path.isdir(os.path.join(DIRECTORI_DATASET, d)) or d.endswith('.json')]
CLASSES = [c.replace('.json', '') for c in CLASSES]
CLASSES = list(set(CLASSES))
print(f"Classes detectades automàticament: {CLASSES}")


if len(CLASSES) < 2:
   print("ERROR: Necessites almenys 2 gestos diferents dins de 'tutorial' per entrenar.")
   exit()


dades = []
etiquetes = []


# --- NOVA FUNCIÓ DE NORMALITZACIÓ ---
def normalize_flat_landmarks(flat_landmarks):
    if sum(flat_landmarks) == 0:
        return [0.0] * 63
        
    base_x, base_y, base_z = flat_landmarks[0], flat_landmarks[1], flat_landmarks[2]
    normalized = []
    max_dist = 0.0
    
    # Translació (posar la nina a 0,0,0)
    for i in range(0, 63, 3):
        nx = flat_landmarks[i] - base_x
        ny = flat_landmarks[i+1] - base_y
        nz = flat_landmarks[i+2] - base_z
        normalized.append([nx, ny, nz])
        
        dist = np.sqrt(nx**2 + ny**2 + nz**2)
        if dist > max_dist:
            max_dist = dist
            
    # Escala (dividir per la distància màxima)
    result = []
    if max_dist > 0:
        for point in normalized:
            result.extend([point[0]/max_dist, point[1]/max_dist, point[2]/max_dist])
    else:
        for point in normalized:
            result.extend([point[0], point[1], point[2]])
            
    return result

print("\n--- FASE 1: Càrrega de coordenades des de JSON o Imatges (Llegat) ---")
for classe in CLASSES:
    ruta_json = os.path.join(DIRECTORI_DATASET, f"{classe}.json")
    ruta_carpeta = os.path.join(DIRECTORI_DATASET, classe)
    
    if os.path.exists(ruta_json):
        print(f"Processant JSON de '{classe}'...")
        try:
            with open(ruta_json, 'r') as f:
                contingut = json.load(f)
                for mostra in contingut:
                    if "landmarks" in mostra and len(mostra["landmarks"]) == 126:
                        lm = mostra["landmarks"]
                        
                        # Comprovar si ja està normalitzat (nina prop de 0,0,0)
                        if abs(lm[0]) > 0.001 or abs(lm[1]) > 0.001:
                            hand1 = normalize_flat_landmarks(lm[0:63])
                            hand2 = normalize_flat_landmarks(lm[63:126])
                            lm = hand1 + hand2
                            
                        dades.append(lm)
                        etiquetes.append(classe)
                        
                        # DATA AUGMENTATION (Soroll aleatori)
                        noisy_lm = []
                        for i, val in enumerate(lm):
                            # No afegim soroll a la nina ni a punts buits
                            if val != 0 and i % 63 not in (0, 1, 2):
                                noisy_lm.append(val + np.random.uniform(-0.02, 0.02))
                            else:
                                noisy_lm.append(val)
                        dades.append(noisy_lm)
                        etiquetes.append(classe)
        except Exception as e:
            print(f"Error processant {ruta_json}: {e}")
            
    elif os.path.exists(ruta_carpeta):
        print(f"Processant imatges antigues de '{classe}' i convertint a JSON...")
        imatges = [img for img in os.listdir(ruta_carpeta) if img.endswith('.jpg') or img.endswith('.png')]
        
        if 'detector' not in locals():
            print("Carregant motor de MediaPipe (només el primer cop)...")
            MODEL_TASK_PATH = 'hand_landmarker.task'
            if not os.path.exists(MODEL_TASK_PATH):
                urllib.request.urlretrieve("https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task", MODEL_TASK_PATH)
            base_options = python.BaseOptions(model_asset_path=MODEL_TASK_PATH)
            options = vision.HandLandmarkerOptions(base_options=base_options, num_hands=2)
            detector = vision.HandLandmarker.create_from_options(options)
            
        noves_mostres = []
        for nom_imatge in imatges:
            ruta_imatge = os.path.join(ruta_carpeta, nom_imatge)
            try:
                mp_image = mp.Image.create_from_file(ruta_imatge)
                detection_result = detector.detect(mp_image)
                
                raw_hand1 = [0.0]*63
                raw_hand1_mirrored = [0.0]*63
                raw_hand2 = [0.0]*63
                raw_hand2_mirrored = [0.0]*63
                
                if detection_result.hand_landmarks and len(detection_result.hand_landmarks) > 0:
                    raw_hand1 = []
                    raw_hand1_mirrored = []
                    for landmark in detection_result.hand_landmarks[0]:
                        raw_hand1.extend([landmark.x, landmark.y, landmark.z])
                        raw_hand1_mirrored.extend([1.0 - landmark.x, landmark.y, landmark.z])
                
                if detection_result.hand_landmarks and len(detection_result.hand_landmarks) > 1:
                    raw_hand2 = []
                    raw_hand2_mirrored = []
                    for landmark in detection_result.hand_landmarks[1]:
                        raw_hand2.extend([landmark.x, landmark.y, landmark.z])
                        raw_hand2_mirrored.extend([1.0 - landmark.x, landmark.y, landmark.z])
                
                # Apliquem normalització
                norm_hand1 = normalize_flat_landmarks(raw_hand1)
                norm_hand2 = normalize_flat_landmarks(raw_hand2)
                norm_hand1_mirrored = normalize_flat_landmarks(raw_hand1_mirrored)
                norm_hand2_mirrored = normalize_flat_landmarks(raw_hand2_mirrored)
                
                coordenades = norm_hand1 + norm_hand2
                coordenades_mirrored = norm_hand1_mirrored + norm_hand2_mirrored
                
                if sum(coordenades) != 0:
                    noves_mostres.append({"label": classe, "landmarks": coordenades})
                    noves_mostres.append({"label": classe, "landmarks": coordenades_mirrored})
                    dades.append(coordenades)
                    dades.append(coordenades_mirrored)
                    etiquetes.append(classe)
                    etiquetes.append(classe)
                    
                    # DATA AUGMENTATION per imatges (Afegir soroll)
                    for _ in range(2): # Creem 2 mostres amb soroll per imatge
                        noisy = []
                        for i, val in enumerate(coordenades):
                            if val != 0 and i % 63 not in (0, 1, 2):
                                noisy.append(val + np.random.uniform(-0.02, 0.02))
                            else:
                                noisy.append(val)
                        dades.append(noisy)
                        etiquetes.append(classe)
            except Exception:
                pass
                
        if len(noves_mostres) > 0:
            with open(ruta_json, 'w') as f:
                json.dump(noves_mostres, f)
            print(f"  -> Creat {classe}.json amb {len(noves_mostres)} mostres (Ja normalitzades)!")


X = np.array(dades)
y = np.array(etiquetes)


print(f"\nExtracció completada! Tenim {len(X)} exemples vàlids.")


if len(X) == 0:
   print("ERROR: No s'ha detectat cap dada vàlida.")
   exit()


print("\n--- FASE 2: Entrenament del Model ---")
encoder = LabelEncoder()
y_codificat = encoder.fit_transform(y)


# 1. Comptem quantes classes REALS tenen coordenades vàlides
numero_classes_reals = len(encoder.classes_)
print(f"Classes finalment acceptades per a l'entrenament: {list(encoder.classes_)}")


if numero_classes_reals < 2:
   print("ERROR: Necessites almenys 2 gestos vàlids amb mans detectades per poder entrenar.")
   exit()


y_categoric = tf.keras.utils.to_categorical(y_codificat, num_classes=numero_classes_reals)


X_train, X_test, y_train, y_test = train_test_split(X, y_categoric, test_size=0.2, random_state=42)


# --- XARXA NEURONAL MILLORADA I MÉS PROFUNDA ---
model = tf.keras.Sequential([
   tf.keras.layers.Dense(256, activation='relu', input_shape=(126,)),
   tf.keras.layers.Dropout(0.3), # El Dropout evita que la IA memorice las fotos exactas
   tf.keras.layers.Dense(128, activation='relu'),
   tf.keras.layers.Dropout(0.2),
   tf.keras.layers.Dense(64, activation='relu'),
   tf.keras.layers.Dense(numero_classes_reals, activation='softmax')
])

# Ajustamos cómo aprende (50 epochs)
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
model.fit(X_train, y_train, epochs=50, batch_size=32, validation_data=(X_test, y_test))


print("\n--- FASE 3: Exportació Automàtica per a la Web ---")
# 1. Guardar el model sobrescribiendo el antiguo en la carpeta public/model_web
tfjs.converters.save_keras_model(model, RUTA_EXPORTACIO)


# 2. Generar el archivo classes.json
ruta_json = os.path.join(RUTA_EXPORTACIO, "classes.json")
with open(ruta_json, "w") as f:
   json.dump(list(encoder.classes_), f)


print(f"¡Model i etiquetes exportats correctament a '{RUTA_EXPORTACIO}'!")
