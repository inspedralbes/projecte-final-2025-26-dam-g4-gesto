const express = require('express');
const router = express.Router();
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');


// Configuració de Multer per guardar el JSON temporalment
const upload = multer({ dest: 'temp_uploads/' });


router.post('/upload-dataset', upload.single('file'), async (req, res) => {
   try {
       if (!req.file || !req.body.gesto) {
           return res.status(400).json({ error: "Falten dades requerides: arxiu o nom del gest." });
       }


       const gesto = req.body.gesto;
       const tempPath = path.resolve(req.file.path);


       // --- RUTA ABSOLUTA CONFIGURADA EN TU DOCKER-COMPOSE ---
       // Según tu 'volumes', ./gesto está en /usr/src/gesto
       const baseProjectDir = '/usr/src/gesto/public/entrenament_signes';
       const dataPath = path.join(baseProjectDir, 'tutorial');       
       
       console.log(`Rebent dades JSON per al gest: '${gesto}'...`);
       
       // Verificación de seguridad para asegurar que el volumen está bien montado
       if (!fs.existsSync(baseProjectDir)) {
           console.error(`ERROR CRÍTICO: No se encuentra la ruta ${baseProjectDir} dentro del contenedor.`);
           return res.status(500).json({ error: "Error de configuración de carpetas en el servidor." });
       }


       if (!fs.existsSync(dataPath)) {
           fs.mkdirSync(dataPath, { recursive: true });
       }

       // Moure l'arxiu JSON al directori tutorial (usant copy i unlink per evitar EXDEV)
       const targetPath = path.join(dataPath, `${gesto}.json`);
       fs.copyFileSync(tempPath, targetPath);
       fs.unlinkSync(tempPath);

       console.log(`Dades guardades correctament a ${targetPath}.`);


       // Respondre al frontend ràpidament
       res.json({ message: "Dataset rebut correctament. L'entrenament ha començat en segon pla." });


       // Executar Python en segon pla
       console.log("Llançant procés d'entrenament amb Python...");
      
       // Usamos python3 que es el que instala tu Dockerfile de python:3.10-slim
       exec('python3 entrenar2.py', { cwd: baseProjectDir }, (error, stdout, stderr) => {
           if (error) {
               console.error(`Error durant l'entrenament: ${error.message}`);
               return;
           }
           if (stderr) {
               console.warn(`Avisos del procés de Python: ${stderr}`);
           }
           console.log(`Resultat de l'entrenament:\n${stdout}`);
           console.log("Procés finalitzat. Nou model llest per a la web.");
       });


   } catch (error) {
       console.error("Error processant el dataset:", error);
       res.status(500).json({ error: "Error intern del servidor processant el dataset." });
   }
});


router.post('/delete-gesture', async (req, res) => {
   try {
       if (!req.body.gesto) {
           return res.status(400).json({ error: "Falta el nom del gest a eliminar." });
       }

       const gesto = req.body.gesto;
       const baseProjectDir = '/usr/src/gesto/public/entrenament_signes';
       const dataPath = path.join(baseProjectDir, 'tutorial');
       const gesturePath = path.join(dataPath, `${gesto}.json`);

       console.log(`Intentant eliminar gest: '${gesto}'...`);

       // Verificar que el archivo existe
       if (!fs.existsSync(gesturePath)) {
           return res.status(404).json({ error: `El gest '${gesto}' no existe.` });
       }

       // Eliminar el archivo JSON
       fs.unlinkSync(gesturePath);
       console.log(`Gest '${gesto}' eliminat correctament de ${gesturePath}.`);

       // Respondre al frontend ràpidament
       res.json({ message: `Gest '${gesto}' eliminat. El model s'està reentrenant en segon pla.` });

       // Executar Python en segon pla per reentrenar sense el gesto
       console.log("Llançant procés de reentrenament amb Python...");
       exec('python3 entrenar2.py', { cwd: baseProjectDir }, (error, stdout, stderr) => {
           if (error) {
               console.error(`Error durant el reentrenament: ${error.message}`);
               return;
           }
           if (stderr) {
               console.warn(`Avisos del procés de Python: ${stderr}`);
           }
           console.log(`Resultat del reentrenament:\n${stdout}`);
           console.log("Procés de reentrenament finalitzat. Model actualitzat.");
       });

   } catch (error) {
       console.error("Error eliminant el gest:", error);
       res.status(500).json({ error: "Error intern del servidor eliminant el gest." });
   }
});


router.get('/list-gestures', async (req, res) => {
   try {
       const baseProjectDir = '/usr/src/gesto/public/entrenament_signes';
       const dataPath = path.join(baseProjectDir, 'tutorial');

       if (!fs.existsSync(dataPath)) {
           return res.json({ gestures: [] });
       }

       const files = fs.readdirSync(dataPath).filter(file => file.endsWith('.json'));
       const gestures = files.map(file => file.replace('.json', ''));

       res.json({ gestures });
   } catch (error) {
       console.error("Error llistant gestures:", error);
       res.status(500).json({ error: "Error intern del servidor llistant gestures." });
   }
});


module.exports = router;