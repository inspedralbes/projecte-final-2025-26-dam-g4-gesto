const express = require('express');
const router = express.Router();

/**
 * POST /api/gemini/generar-frase
 * Body: { signes: ["Hola", "Un", "Dos"] }
 * Retorna: { frase: "Hola! Som un o dos?" }
 */
router.post('/generar-frase', async (req, res) => {
    const { signes } = req.body;

    if (!signes || !Array.isArray(signes) || signes.length === 0) {
        return res.status(400).json({ error: 'Cal enviar un array de signes detectats.' });
    }

    // Filtrem el signe "none" i netegem la llista
    const signesNets = signes.filter(s => s && s.toLowerCase() !== 'none');

    if (signesNets.length === 0) {
        return res.status(400).json({ error: 'No hi ha signes vàlids per processar.' });
    }

    const prompt = `Ets un traductor expert en llengua de signes catalana (LSC).
L'usuari ha fet els següents signes/gestos amb les mans, en ordre: ${signesNets.join(', ')}.

IMPORTANT: Alguns noms de signes poden semblar estranys o contenir números i paraules combinades (ex: "1 Amic", "Hola Hola"). Ignora el format exacte i extreu la INTENCIÓ de la paraula clau principal.

La teva tasca és generar UNA SOLA frase natural, completa i coherent en català que representi el que l'usuari vol comunicar.

Regles estrictes:
- La frase ha de ser COMPLETA i tenir sentit gramatical complet (subjecte + verb + complement si cal).
- Escriu entre 5 i 15 paraules com a màxim.
- Usa les paraules clau dels signes de forma natural.
- Si veus números (Un, Dos, 1, 2...), interpreta'ls com a quantitats.
- Si veus "Hola" al principi, comença la frase amb una salutació.
- Respon ÚNICAMENT amb la frase final, sense explicacions, sense cometes, sense punts suspensius.`;

    try {
        // Llamada a la API local de Ollama (a través de la red de Docker)
        const response = await fetch(
            `http://ollama:11434/api/generate`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: process.env.OLLAMA_MODEL || 'gemma:2b', // Usa gemma:2b por defecto por las limitaciones de RAM
                    prompt: prompt,
                    stream: false,
                    options: {
                        temperature: 0.5,
                        num_predict: 200
                    }
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Error de Ollama API:', errorData);
            return res.status(500).json({ error: 'Error comunicant amb Ollama API. Assegurat que Ollama està corrent al port 11434.', detall: errorData });
        }

        const data = await response.json();
        const frase = data?.response?.trim();

        if (!frase) {
            return res.status(500).json({ error: 'Ollama no ha retornat cap frase.' });
        }

        console.log(`✅ Ollama ha generat: "${frase}" per als signes: [${signesNets.join(', ')}]`);
        res.json({ frase });

    } catch (error) {
        console.error('Error cridant a Ollama:', error);
        res.status(500).json({ error: 'Error intern cridant a Ollama API. ¿Està el servei d\\'Ollama en marxa?' });
    }
});

module.exports = router;
