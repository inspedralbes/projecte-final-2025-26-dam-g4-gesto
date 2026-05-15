const express = require('express');
const router = express.Router();

/**
 * POST /api/ia/generar-frase
 * Body: { signes: ["Hola", "Un", "Dos"] }
 * Retorna: { frase: "Hola, jo tinc un amic.", fontIA: true/false }
 */

// ── Diccionari de sinònims/correccions de signes ──────────────────────────
const ALIAS_SIGNES = {
  'jo': 'jo',
  'hola': 'Hola',
  'gracies': 'gràcies',
  'gràcies': 'gràcies',
  'amic': 'amic',
  'tenir': 'tinc',
  'adeu': 'adeu',
  'ell': 'ell',
  'ella': 'ella',
  'un': 'un',
  'una': 'una',
  'dos': 'dos',
  'tres': 'tres',
  '0': 'zero',
  '1': 'un',
  '2': 'dos',
  '3': 'tres',
};

// Converteix el nom d'un signe al mot català corresponent
function normalitzarSigne(s) {
  const clau = s.trim().toLowerCase();
  return ALIAS_SIGNES[clau] || s.trim();
}

// Comprova si la resposta del model és vàlida (no al·lucina)
function respostaEsValida(frase, signesNets) {
  if (!frase || frase.length < 3) return false;

  const fraseNorm = frase.toLowerCase();
  // Descarta respostes que semblen instruccions o metadades del model
  const patronsInvalids = [
    'la teva tasca', 'traductor', 'lleng', 'signe', 'frase:', 'resposta:', 'exemple', 'regla', 'instrucció',
    "d'or", 'quantitat', 'tasca és', 'genera', 'tradueix', 'paraules:',
  ];
  if (patronsInvalids.some(p => fraseNorm.includes(p))) return false;

  // Ha de contenir almenys 1 paraula clau dels signes
  const paraulesSigne = signesNets.map(s => normalitzarSigne(s).toLowerCase());
  const coincidencies = paraulesSigne.filter(p => fraseNorm.includes(p));
  return coincidencies.length >= Math.max(1, Math.floor(paraulesSigne.length / 2));
}

// Fallback: construeix una frase senzilla i correcta a partir dels signes
function construirFraseLocal(signesNets) {
  const paraules = signesNets.map(normalitzarSigne);
  if (paraules.length > 0) {
    paraules[0] = paraules[0].charAt(0).toUpperCase() + paraules[0].slice(1);
  }
  return paraules.join(' ') + '.';
}

router.post('/generar-frase', async (req, res) => {
  const { signes } = req.body;

  if (!signes || !Array.isArray(signes) || signes.length === 0) {
    return res.status(400).json({ error: 'Cal enviar un array de signes detectats.' });
  }

  const signesNets = signes.filter(s => s && s.toLowerCase() !== 'none');

  if (signesNets.length === 0) {
    return res.status(400).json({ error: 'No hi ha signes vàlids per processar.' });
  }

  const paraulesLlegibles = signesNets.map(normalitzarSigne).join(' ');

  // ── Sistema + exemples few-shot via /api/chat ──────────────────────────
  const messages = [
    {
      role: 'system',
      content: `Ets un expert traductor de Llengua de Signes Catalana (LSC) a text. 
La teva tasca és transformar una seqüència de signes (que sovint tenen l'estructura Subjecte-Objecte-Verb i posen els nombres al final) en una frase natural i gramaticalment correcta en català.
Regles:
1. Ordena la frase correctament en català (Subjecte-Verb-Objecte).
2. Conjuga els verbs adequadament.
3. Afegeix articles o preposicions on calgui.
4. Si hi ha un nombre major a 1, aplica el plural al nom corresponent (ex: "gos 10" -> "10 gossos").
Respon ÚNICAMENT amb la frase final en català, sense explicacions, prefixos ni cometes.`,
    },
    // Exemples amb estructura de Llengua de Signes (LSC)
    { role: 'user', content: 'Paraules: jo amic tenir' },
    { role: 'assistant', content: 'Jo tinc un amic.' },

    { role: 'user', content: 'Paraules: jo pa menjar voler' },
    { role: 'assistant', content: 'Jo vull menjar pa.' },

    { role: 'user', content: 'Paraules: gràcies tu ajudar jo' },
    { role: 'assistant', content: 'Gràcies per ajudar-me.' },

    // Exemple per ensenyar-li a usar el plural amb els nombres i reordenar
    { role: 'user', content: 'Paraules: jo gos tenir 10' },
    { role: 'assistant', content: 'Jo tinc 10 gossos.' },

    { role: 'user', content: 'Paraules: demà escola anar jo' },
    { role: 'assistant', content: 'Demà jo aniré a l\'escola.' },

    // Exemple avançat amb adjectius i nombres
    { role: 'user', content: 'Paraules: tu gat negre 2 tenir' },
    { role: 'assistant', content: 'Tu tens 2 gats negres.' },

    { role: 'user', content: 'Paraules: metge ajuda necessitar' },
    { role: 'assistant', content: 'Necessito l\'ajuda d\'un metge.' },

    // La petició real de l'usuari
    { role: 'user', content: `Paraules: ${paraulesLlegibles}` },
  ];

  try {
    let response;
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'gemma:2b',
        messages,
        stream: false,
        options: {
          temperature: 0.2,
          top_p: 0.9,
          num_predict: 60,
        },
      }),
    };

    try {
      response = await fetch('http://ollama:11434/api/chat', options);
    } catch (err) {
      console.warn("No s'ha pogut connectar a 'http://ollama:11434', provant a 'localhost'...");
      response = await fetch('http://127.0.0.1:11434/api/chat', options);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error de Ollama API:', errorData);
      const fraseLocal = construirFraseLocal(signesNets);
      console.log(`⚠️ Ollama ha fallat, usant fallback local: "${fraseLocal}"`);
      return res.json({ frase: fraseLocal, fontIA: false });
    }

    const data = await response.json();
    // /api/chat retorna la resposta a data.message.content (no a data.response)
    let frase = (data?.message?.content || data?.response || '').trim();

    // Neteja la resposta del model: elimina qualsevol prefix que el model pugui afegir
    frase = frase
      .replace(/^(ÚNICAMENT|NOMÉS|FRASE|RESPOSTA|RESULTAT|OUTPUT|ANSWER)\s*:\s*/i, '')
      .replace(/^frase:\s*/i, '')
      .replace(/^"(.*)"$/s, '$1')
      .replace(/^'(.*)'$/s, '$1')
      .split('\n')[0]
      .trim();

    // Validació: si sembla una al·lucinació, usem el fallback local
    if (!respostaEsValida(frase, signesNets)) {
      const fraseLocal = construirFraseLocal(signesNets);
      console.warn(`⚠️ Resposta invàlida del model: "${frase}". Usant fallback: "${fraseLocal}"`);
      return res.json({ frase: fraseLocal, fontIA: false });
    }

    console.log(`✅ IA ha generat: "${frase}" per als signes: [${signesNets.join(', ')}]`);
    res.json({ frase, fontIA: true });

  } catch (error) {
    console.error('Error cridant a Ollama:', error);
    const fraseLocal = construirFraseLocal(signesNets);
    console.log(`⚠️ Error crític, usant fallback local: "${fraseLocal}"`);
    res.json({ frase: fraseLocal, fontIA: false });
  }
});

module.exports = router;
