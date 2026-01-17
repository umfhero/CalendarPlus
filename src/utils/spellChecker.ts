/**
 * Advanced Spell Checker Utility
 * Provides intelligent spell checking with suggestions for poor spellers
 */

export interface SpellingError {
    word: string;
    startIndex: number;
    endIndex: number;
    suggestions: string[];
}

// Comprehensive common misspellings dictionary
const COMMON_MISSPELLINGS: { [key: string]: string[] } = {
    // Very common misspellings
    'teh': ['the'],
    'recieve': ['receive'],
    'occured': ['occurred'],
    'seperate': ['separate'],
    'definately': ['definitely'],
    'wierd': ['weird'],
    'untill': ['until'],
    'wich': ['which', 'witch'],
    'thier': ['their', 'there', 'they\'re'],
    'becuase': ['because'],
    'beleive': ['believe'],
    'freind': ['friend'],
    'goverment': ['government'],
    'occassion': ['occasion'],
    'recomend': ['recommend'],
    'begining': ['beginning'],
    'calender': ['calendar'],
    'enviroment': ['environment'],
    'existance': ['existence'],
    'fourty': ['forty'],
    'harrass': ['harass'],
    'independant': ['independent'],
    'neccessary': ['necessary'],
    'occassionally': ['occasionally'],
    'persue': ['pursue'],
    'questionaire': ['questionnaire'],
    'reccomend': ['recommend'],
    'succesful': ['successful'],
    'tommorow': ['tomorrow'],
    'unfortunatly': ['unfortunately'],
    'usefull': ['useful'],
    'wellcome': ['welcome'],
    'accomodate': ['accommodate'],
    'acheive': ['achieve'],
    'adress': ['address'],
    'alot': ['a lot'],
    'alright': ['all right'],
    'arguement': ['argument'],
    'basicly': ['basically'],
    'buisness': ['business'],
    'catagory': ['category'],
    'cemetary': ['cemetery'],
    'changable': ['changeable'],
    'collegue': ['colleague'],
    'comming': ['coming'],
    'commitee': ['committee'],
    'concious': ['conscious'],
    'curiousity': ['curiosity'],
    'definite': ['definite'],
    'desparate': ['desperate'],
    'developement': ['development'],
    'disapear': ['disappear'],
    'dissapoint': ['disappoint'],
    'embarass': ['embarrass'],
    'exagerate': ['exaggerate'],
    'excellant': ['excellent'],
    'experiance': ['experience'],
    'familar': ['familiar'],
    'finaly': ['finally'],
    'foriegn': ['foreign'],
    'goverment': ['government'],
    'grammer': ['grammar'],
    'greatful': ['grateful'],
    'gaurd': ['guard'],
    'happend': ['happened'],
    'harrass': ['harass'],
    'hieght': ['height'],
    'humerous': ['humorous'],
    'immediatly': ['immediately'],
    'incidently': ['incidentally'],
    'independant': ['independent'],
    'interupt': ['interrupt'],
    'irresistable': ['irresistible'],
    'knowlege': ['knowledge'],
    'liason': ['liaison'],
    'libary': ['library'],
    'lisence': ['license'],
    'maintainance': ['maintenance'],
    'medcine': ['medicine'],
    'millenium': ['millennium'],
    'minature': ['miniature'],
    'mischievious': ['mischievous'],
    'misspell': ['misspell'],
    'neice': ['niece'],
    'noticable': ['noticeable'],
    'occured': ['occurred'],
    'occurence': ['occurrence'],
    'pavillion': ['pavilion'],
    'peice': ['piece'],
    'perseverance': ['perseverance'],
    'personaly': ['personally'],
    'possesion': ['possession'],
    'prefered': ['preferred'],
    'privelege': ['privilege'],
    'probly': ['probably'],
    'publically': ['publicly'],
    'recieve': ['receive'],
    'refered': ['referred'],
    'relevent': ['relevant'],
    'religous': ['religious'],
    'repitition': ['repetition'],
    'rythm': ['rhythm'],
    'sence': ['sense', 'since'],
    'seperate': ['separate'],
    'sieze': ['seize'],
    'similiar': ['similar'],
    'sincerely': ['sincerely'],
    'speach': ['speech'],
    'succede': ['succeed'],
    'supercede': ['supersede'],
    'suprise': ['surprise'],
    'temperture': ['temperature'],
    'tendancy': ['tendency'],
    'therefor': ['therefore'],
    'truely': ['truly'],
    'twelfth': ['twelfth'],
    'tyrany': ['tyranny'],
    'underate': ['underrate'],
    'unfortunatly': ['unfortunately'],
    'untill': ['until'],
    'useable': ['usable'],
    'vaccuum': ['vacuum'],
    'visable': ['visible'],
    'wether': ['whether', 'weather'],
    'whereever': ['wherever'],
};

/**
 * Extract words from text, preserving their positions
 * Handles markdown syntax by ignoring code blocks and inline code
 */
function extractWords(text: string): { word: string; start: number; end: number }[] {
    const words: { word: string; start: number; end: number }[] = [];

    // Remove code blocks
    let cleanText = text.replace(/```[\s\S]*?```/g, (match) => ' '.repeat(match.length));
    // Remove inline code
    cleanText = cleanText.replace(/`[^`]+`/g, (match) => ' '.repeat(match.length));
    // Remove URLs
    cleanText = cleanText.replace(/https?:\/\/[^\s]+/g, (match) => ' '.repeat(match.length));

    // Match words (letters, apostrophes for contractions, hyphens for compound words)
    const wordRegex = /\b[a-zA-Z]+(?:[''][a-zA-Z]+)?(?:-[a-zA-Z]+)?\b/g;
    let match;

    while ((match = wordRegex.exec(cleanText)) !== null) {
        words.push({
            word: match[0],
            start: match.index,
            end: match.index + match[0].length
        });
    }

    return words;
}

/**
 * Check spelling and return errors with suggestions
 */
export async function checkSpelling(text: string): Promise<SpellingError[]> {
    const errors: SpellingError[] = [];
    const words = extractWords(text);

    for (const { word, start, end } of words) {
        const lowerWord = word.toLowerCase();

        // Check if it's a known misspelling
        if (COMMON_MISSPELLINGS[lowerWord]) {
            const suggestions = COMMON_MISSPELLINGS[lowerWord].map(s =>
                word[0] === word[0].toUpperCase() ? capitalize(s) : s
            );

            errors.push({
                word,
                startIndex: start,
                endIndex: end,
                suggestions
            });
            continue;
        }

        // Generate suggestions for potential misspellings
        const suggestions = generateAdvancedSuggestions(word);
        if (suggestions.length > 0) {
            errors.push({
                word,
                startIndex: start,
                endIndex: end,
                suggestions
            });
        }
    }

    return errors;
}

/**
 * Generate advanced suggestions using multiple algorithms
 */
function generateAdvancedSuggestions(word: string): string[] {
    const suggestions = new Set<string>();
    const lowerWord = word.toLowerCase();

    // Check for doubled letters that should be single
    const doubleLetterFixes = fixDoubledLetters(lowerWord);
    doubleLetterFixes.forEach(s => suggestions.add(s));

    // Check for common letter swaps
    const swapFixes = fixCommonSwaps(lowerWord);
    swapFixes.forEach(s => suggestions.add(s));

    // Check for missing letters
    const missingLetterFixes = fixMissingLetters(lowerWord);
    missingLetterFixes.forEach(s => suggestions.add(s));

    // Check for extra letters
    const extraLetterFixes = fixExtraLetters(lowerWord);
    extraLetterFixes.forEach(s => suggestions.add(s));

    // Capitalize if original was capitalized
    const result = Array.from(suggestions).slice(0, 5);
    if (word[0] === word[0].toUpperCase()) {
        return result.map(capitalize);
    }

    return result;
}

function capitalize(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

function fixDoubledLetters(word: string): string[] {
    const fixes: string[] = [];
    for (let i = 0; i < word.length - 1; i++) {
        if (word[i] === word[i + 1]) {
            const fixed = word.slice(0, i) + word.slice(i + 1);
            if (COMMON_MISSPELLINGS[word] || fixed.length >= 3) {
                fixes.push(fixed);
            }
        }
    }
    return fixes;
}

function fixCommonSwaps(word: string): string[] {
    const fixes: string[] = [];
    const commonSwaps = [
        ['ie', 'ei'], ['ei', 'ie'],
        ['er', 're'], ['re', 'er'],
        ['al', 'le'], ['le', 'al'],
    ];

    for (const [from, to] of commonSwaps) {
        if (word.includes(from)) {
            fixes.push(word.replace(from, to));
        }
    }

    return fixes;
}

function fixMissingLetters(word: string): string[] {
    const fixes: string[] = [];
    const commonMissing = ['e', 'a', 'i', 'o', 'u', 'l', 'r', 'n', 's', 't'];

    // Try adding common letters at various positions
    for (let i = 0; i <= word.length; i++) {
        for (const letter of commonMissing) {
            const fixed = word.slice(0, i) + letter + word.slice(i);
            // Only suggest if it looks reasonable
            if (fixed.length <= word.length + 2) {
                fixes.push(fixed);
            }
        }
    }

    return fixes.slice(0, 10); // Limit to avoid too many suggestions
}

function fixExtraLetters(word: string): string[] {
    const fixes: string[] = [];

    // Try removing each letter
    for (let i = 0; i < word.length; i++) {
        const fixed = word.slice(0, i) + word.slice(i + 1);
        if (fixed.length >= 2) {
            fixes.push(fixed);
        }
    }

    return fixes;
}

/**
 * Replace a misspelled word in text with a correction
 */
export function replaceWord(text: string, error: SpellingError, replacement: string): string {
    return text.substring(0, error.startIndex) + replacement + text.substring(error.endIndex);
}
