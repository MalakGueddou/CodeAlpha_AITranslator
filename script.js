document.addEventListener('DOMContentLoaded', function() {
    // Éléments du DOM
    const sourceLang = document.getElementById('source-lang');
    const targetLang = document.getElementById('target-lang');
    const swapBtn = document.getElementById('swap-btn');
    const inputText = document.getElementById('input-text');
    const outputText = document.getElementById('output-text');
    const translateBtn = document.getElementById('translate-btn');
    const copyBtn = document.getElementById('copy-btn');
    const speakBtn = document.getElementById('speak-btn');
    const clearBtn = document.getElementById('clear-btn');
    const charCounts = document.querySelectorAll('.char-count');

    // API de traduction fiable
    async function translateText(text, source, target) {
        // Si même langue, retourner le texte original
        if (source === target) {
            return text;
        }

        try {
            console.log(`🔍 Traduction: "${text.substring(0, 50)}..." de ${source} vers ${target}`);
            
            // API 1 : LibreTranslate (gratuite et fiable)
            const response = await fetch('https://libretranslate.com/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    q: text,
                    source: source,
                    target: target,
                    format: 'text'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Traduction réussie:', data.translatedText);
            return data.translatedText;

        } catch (error) {
            console.error('❌ Erreur API:', error);
            
            // Fallback : API alternative
            try {
                console.log('🔄 Essai avec API de secours...');
                const fallbackResponse = await fetch(
                    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`
                );
                
                const fallbackData = await fallbackResponse.json();
                if (fallbackData.responseStatus === 200) {
                    return fallbackData.responseData.translatedText;
                } else {
                    throw new Error('API de secours a échoué');
                }
            } catch (fallbackError) {
                console.error('❌ Toutes les APIs ont échoué:', fallbackError);
                return `🚫 Erreur de traduction. Le service est temporairement indisponible.\n\nEssayez de:\n- Vérifier votre connexion internet\n- Réessayer dans quelques instants\n- Utiliser un texte plus court`;
            }
        }
    }

    // Mettre à jour le compteur de caractères
    function updateCharCount() {
        if (charCounts[0]) {
            charCounts[0].textContent = `${inputText.value.length} caractères`;
        }
        if (charCounts[1]) {
            charCounts[1].textContent = `${outputText.value.length} caractères`;
        }
    }

    inputText.addEventListener('input', updateCharCount);

    // Événement de traduction principal
    translateBtn.addEventListener('click', async function() {
        const text = inputText.value.trim();
        
        if (!text) {
            alert('📝 Veuillez entrer du texte à traduire');
            return;
        }

        if (text.length > 1000) {
            alert('⚠️ Le texte est trop long (max 1000 caractères)');
            return;
        }

        let from = sourceLang.value;
        const to = targetLang.value;

        // Détection automatique si sélectionné
        if (from === 'auto') {
            from = detectLanguage(text);
        }

        // État de chargement
        translateBtn.textContent = '🔄 Traduction en cours...';
        translateBtn.disabled = true;
        outputText.value = '';
        outputText.placeholder = 'Traduction en cours...';

        try {
            const translatedText = await translateText(text, from, to);
            outputText.value = translatedText;
        } catch (error) {
            outputText.value = `❌ Erreur: ${error.message}\n\nVérifiez votre connexion internet et réessayez.`;
        } finally {
            // Restaurer le bouton
            translateBtn.textContent = '🌍 Traduire';
            translateBtn.disabled = false;
            updateCharCount();
        }
    });

    // Détection simple de la langue
    function detectLanguage(text) {
        const lowerText = text.toLowerCase();
        
        // Mots caractéristiques par langue
        const patterns = {
            'ar': /[\u0600-\u06FF]/, // Caractères arabes
            'en': /\b(the|and|is|in|to|of|a|an)\b/,
            'fr': /\b(le|la|les|de|et|est|un|une|des)\b/,
            'es': /\b(el|la|los|las|de|y|en)\b/,
            'de': /\b(der|die|das|und|ist|ein|eine)\b/,
            'tr': /\b(ve|bir|bu|şey|için|ama)\b/
        };

        for (const [lang, pattern] of Object.entries(patterns)) {
            if (pattern.test(lowerText)) {
                console.log(`🔍 Langue détectée: ${lang}`);
                return lang;
            }
        }

        // Par défaut
        return 'en';
    }

    // Échanger les langues
    swapBtn.addEventListener('click', function() {
        const temp = sourceLang.value;
        sourceLang.value = targetLang.value;
        targetLang.value = temp;

        // Échanger aussi le texte
        if (inputText.value || outputText.value) {
            const tempText = inputText.value;
            inputText.value = outputText.value;
            outputText.value = tempText;
            updateCharCount();
        }
    });

    // Copier la traduction
    copyBtn.addEventListener('click', async function() {
        if (!outputText.value.trim()) {
            alert('📋 Aucun texte à copier');
            return;
        }

        try {
            await navigator.clipboard.writeText(outputText.value);
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✅ Copié !';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        } catch (err) {
            alert('❌ Erreur lors de la copie');
        }
    });

    // Lecture vocale
    speakBtn.addEventListener('click', function() {
        if (!outputText.value.trim()) {
            alert('🔊 Aucun texte à lire');
            return;
        }

        const utterance = new SpeechSynthesisUtterance(outputText.value);
        const langMap = {
            'ar': 'ar-SA', // Arabe
            'fr': 'fr-FR', // Français
            'en': 'en-US', // Anglais
            'es': 'es-ES', // Espagnol
            'de': 'de-DE', // Allemand
            'tr': 'tr-TR'  // Turc
        };
        
        utterance.lang = langMap[targetLang.value] || 'fr-FR';
        window.speechSynthesis.speak(utterance);
    });

    // Effacer tout
    clearBtn.addEventListener('click', function() {
        inputText.value = '';
        outputText.value = '';
        updateCharCount();
        inputText.focus();
    });

    // Traduction avec Ctrl+Entrée
    inputText.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            translateBtn.click();
        }
    });

    // Initialisation
    updateCharCount();
    console.log('🚀 Traducteur initialisé et prêt !');
});