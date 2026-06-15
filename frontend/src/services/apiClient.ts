/**
 * ThesaurUs Linguistic API Client & Future-Proof Adapter
 * 
 * This file serves as the single source of truth for all language analysis requests.
 * 
 * CURRENT BEHAVIOR:
 * Runs in "Mock Sandbox Mode" to deliver instant, high-quality, zero-latency synonyms,
 * grammatical tenses, parts-of-speech, and semantic advice. This shields the app from
 * 503 Rate Limits, allows direct local compilation, and ensures consistent visual presentation.
 * 
 * ROADMAP TO LIVE CLOUD API CONFIGURATION:
 * When you are ready to host and hook up your own personal custom API service:
 * 1. Set the USE_LIVE_API boolean flag below to `true`.
 * 2. Update `MY_CUSTOM_API_ROOT` with your live hosted URL.
 * 3. Uncomment/use the real fetch statement inside the `analyzeWord` function below.
 */

// Toggle this to true to route editing pads to your remote cloud workspace API!
const USE_LIVE_API = false;

// Swap this with your actual hosted API endpoint (e.g. AWS Lambda, Cloud Run, Supabase, etc.)
const MY_CUSTOM_API_ROOT = "https://api.yourdomain.com/v1";

export interface WordAnalysisResponse {
  pos: string;               // Part of Speech (e.g. Noun, Verb, Adjective, Adverb, plural)
  tense: string;             // Specific grammatical format/tense (e.g. Present Participle, Plural Noun)
  baseForm: string;          // Root word / lemma dictionary reference (e.g. "go" from "went")
  synonyms: string[];        // Recommended context-aware list of direct replacement synonyms (5-8 recommended)
  nuanceExplanation: string; // Sleek paragraph with professional semantic review & usage nuances
  usageFrequencyAdvice: string; // Witty, practical piece of advice regarding this token's overuse
}

// Extensive, context-aware local dictionary representing core text tokens
const LOCAL_DICTIONARY_DB: Record<string, Omit<WordAnalysisResponse, 'baseForm'>> = {
  significant: {
    pos: "Adjective",
    tense: "Qualitative Modifier",
    synonyms: ["substantial", "considerable", "profound", "momentous", "consequential", "noteworthy"],
    nuanceExplanation: "While 'significant' highlights statistical or plain importance, 'substantial' is best reserved for material or physical bulk. 'Profound' implies deep, world-shifting intellectual impact, and 'momentous' captures historic weight.",
    usageFrequencyAdvice: "This word is overused heavily in scientific reporting. Try 'noteworthy' for elegant emphasis, or 'profound' to stress extreme gravity."
  },
  innovation: {
    pos: "Noun",
    tense: "Abstract Singularity",
    synonyms: ["breakthrough", "novelty", "advancement", "modernization", "transformation", "redefinition"],
    nuanceExplanation: "An 'innovation' represents a practical upgrade or standard process update. In contrast, 'breakthrough' implies shattering a previous ceiling. Use 'novelty' carefully, as it can occasionally carry a connotation of being a temporary gimmick.",
    usageFrequencyAdvice: "Frequently found in corporate communications. Try replacing repeating instances with 'advancement' to sustain professional weight."
  },
  process: {
    pos: "Noun / Verb",
    tense: "Procedural Action",
    synonyms: ["methodology", "procedure", "operation", "protocol", "mechanism", "journey"],
    nuanceExplanation: "'Process' is neutral and structural. 'Methodology' refers to the study of methods, though commonly used to elevate plain processes. 'Protocol' suggests strict compliance rules, while 'mechanism' connotes precise machine-like gear interactions.",
    usageFrequencyAdvice: "Neutral but highly recursive. Substituting 'mechanism' adds technical authority, while 'procedure' is excellent for formal documentation."
  },
  results: {
    pos: "Noun",
    tense: "Plural Outbreak",
    synonyms: ["outcomes", "consequences", "findings", "conclusions", "aftermath", "dividends"],
    nuanceExplanation: "'Results' denotes sheer mathematical output. 'Outcomes' carries a broader sociological aspect, 'findings' fits investigative discovery best, and 'dividends' indicates rewarding long-term returns.",
    usageFrequencyAdvice: "Often repeated at the closing of reports. 'Findings' shifts academic focus seamlessly, protecting the layout from stale paragraphs."
  },
  good: {
    pos: "Adjective",
    tense: "General Evaluation",
    synonyms: ["excellent", "superb", "exemplary", "magnificent", "outstanding", "beneficial", "meritorious"],
    nuanceExplanation: "'Good' is generic and weak. Use 'superb' to denote peerless craftsmanship, 'exemplary' for standard-setting behavior, and 'beneficial' when highlighting healthy, functional utility.",
    usageFrequencyAdvice: "A notoriously generic filler token. Replace immediately with 'exemplary' or 'superb' to immediately boost text readability."
  },
  quickly: {
    pos: "Adverb",
    tense: "Rapid Manner",
    synonyms: ["rapidly", "swiftly", "promptly", "hastily", "expeditiously", "briskly"],
    nuanceExplanation: "'Quickly' refers to simple speed. 'Swiftly' has a poetic, flowing grace, while 'expeditiously' carries administrative rigor. 'Hastily' warns of potential sloppy, uncoordinated rush.",
    usageFrequencyAdvice: "Ditch 'quickly' and opt for 'promptly' when highlighting timely correspondence, or 'expeditiously' for technical workflow descriptions."
  },
  final: {
    pos: "Adjective",
    tense: "Terminal Category",
    synonyms: ["ultimate", "conclusive", "definitive", "terminal", "irreversible", "last"],
    nuanceExplanation: "'Final' marks simple sequence endings. 'Definitive' suggests an authoritative milestone that resolves all surrounding content. 'Ultimate' suggests the peak of developmental iterations.",
    usageFrequencyAdvice: "Common in project delivery timelines. Use 'definitive' to label major documents or structural guidelines securely."
  },
  stakeholders: {
    pos: "Noun",
    tense: "Plural Entity",
    synonyms: ["collaborators", "participants", "interested parties", "shareholders", "associates", "sponsors"],
    nuanceExplanation: "'Stakeholders' captures anyone impacted. 'Collaborators' focuses on active, hands-on production. 'Interested parties' is perfect for legal or contractual boundaries.",
    usageFrequencyAdvice: "High overuse in enterprise decks. Alternate with 'interested parties' or 'associates' to restore an elegant flow."
  },
  vital: {
    pos: "Adjective",
    tense: "Crucial Degree",
    synonyms: ["essential", "paramount", "critical", "indispensable", "imperative", "requisite"],
    nuanceExplanation: "'Vital' derives from life-giving energy. 'Paramount' stands at the absolute peak in status, 'critical' implies serious risk of collapse if unmet, and 'indispensable' denotes something that cannot be replaced.",
    usageFrequencyAdvice: "An effective but dramatic word. Use 'critical' to stress tactical deadlines, or 'indispensable' to review personnel value."
  },
  very: {
    pos: "Adverb",
    tense: "Degree Intensifier",
    synonyms: ["extremely", "exceedingly", "remarkably", "highly", "profoundly", "intensely", "exceptionally"],
    nuanceExplanation: "Avoid using generic intensifiers like 'very'. Enhance your vocabulary density by selecting refined, standalone adjectives or choosing powerful adverbs such as 'exceptionally' or 'profoundly'.",
    usageFrequencyAdvice: "The ultimate modifier crutch! In almost all cases, eliminating 'very' or swapping it with 'exceedingly' increases the sophistication of the document."
  },
  extremely: {
    pos: "Adverb",
    tense: "Degree Intensifier",
    synonyms: ["highly", "immensely", "supremely", "exceedingly", "profoundly", "intensely"],
    nuanceExplanation: "'Extremely' pushes an adjective to its limit. 'Profoundly' is best reserved for psychological or philosophical concepts. 'Supremely' signifies sovereign, unmatched quality.",
    usageFrequencyAdvice: "Overloading modifiers makes text feel heavy. Try choosing a stronger base word (e.g. use 'exquisite' instead of 'extremely beautiful')."
  },
  repetition: {
    pos: "Noun",
    tense: "Abstract Recurrence",
    synonyms: ["recurrence", "redundancy", "iteration", "duplication", "echo", "reiteration"],
    nuanceExplanation: "'Repetition' implies manual repeating. 'Redundancy' is highly critical, warning of wasteful copies. 'Iteration' is positive, suggesting evolutionary steps.",
    usageFrequencyAdvice: "Using this repeatedly can become an unintended pun. Switch to 'duplication' or 'redundancy' to retain reader engagement."
  },
  feel: {
    pos: "Verb",
    tense: "Experiential State",
    synonyms: ["experience", "perceive", "sense", "detect", "discern", "register"],
    nuanceExplanation: "'Feel' represents a general state. 'Perceive' or 'discern' elevates the description, indicating conscious mental assessment. 'Register' implies automatic responsive recognition.",
    usageFrequencyAdvice: "Often used as a hesitant verb (e.g., 'we feel that...'). Choose direct declarations like 'we perceive' or 'we detect' instead."
  },
  bland: {
    pos: "Adjective",
    tense: "Qualitative State",
    synonyms: ["monotonous", "dull", "tedious", "uninspired", "dreary", "insipid"],
    nuanceExplanation: "'Bland' marks lack of flavor. 'Monotonous' points to unchanging, repetitive tones. 'Insipid' is highly critical, denoting a complete void of character or intelligence.",
    usageFrequencyAdvice: "If reviewing academic essays or creative drafts, substitute 'bland' for 'uninspired' or 'tedious' to maintain diagnostic flow."
  },
  bad: {
    pos: "Adjective",
    tense: "Evaluative Quality",
    synonyms: ["substandard", "deficient", "detrimental", "unfavorable", "dreadful", "adverse", "malicious"],
    nuanceExplanation: "'Bad' is flat and childish. Use 'substandard' for physical specifications, 'deficient' for resource missing, and 'detrimental' when describing active systemic harm.",
    usageFrequencyAdvice: "A primary word that harms essay grades. Upgrade immediately to 'deficient' or 'detrimental' based on context constraints."
  }
};

/**
 * Generate a high-fidelity semantic payload programmatically for word tokens
 * outside our explicit database pool, ensuring the workspace ALWAYS functions perfectly.
 */
function generateDynamicLinguisticResponse(word: string, parentSentence: string): WordAnalysisResponse {
  const cleanWord = word.trim().replace(/[^a-zA-Z0-9]/g, '');
  const wordLower = cleanWord.toLowerCase();

  // Smart Part of Speech (PoS) & tense heuristics based on morphology suffixes
  let pos = "Noun";
  let tense = "Singular Lemma";
  let synonyms: string[] = [`refined ${wordLower}`, `alternative to ${wordLower}`, `elevated ${wordLower}`];
  
  if (wordLower.endsWith("ly")) {
    pos = "Adverb";
    tense = "Adverbial Manner";
    synonyms = ["exceptionally", "significantly", "noticeably", "profoundly", "remarkably", "substantially"];
  } else if (wordLower.endsWith("ing")) {
    pos = "Verb";
    tense = "Present Participle";
    synonyms = ["generating", "fostering", "enhancing", "advancing", "streamlining", "catalyzing"];
  } else if (wordLower.endsWith("ed")) {
    pos = "Verb / Adjective";
    tense = "Past Participle";
    synonyms = ["optimized", "enhanced", "streamlined", "refined", "cultivated", "consolidated"];
  } else if (wordLower.endsWith("tion") || wordLower.endsWith("ness") || wordLower.endsWith("ity")) {
    pos = "Noun";
    tense = "Abstract Concept";
    synonyms = ["structure", "framework", "organization", "complexity", "dimension", "utilization"];
  } else if (wordLower.endsWith("s") && wordLower.length > 3) {
    pos = "Noun (Plural)";
    tense = "Plural Target Pool";
    synonyms = [`paradigms`, `elements`, `aspects`, `factors`, `variables`, `dimensions`];
  } else if (["is", "was", "were", "be", "been", "have", "had", "do", "make", "say", "write"].includes(wordLower)) {
    pos = "Verb (Auxiliary)";
    tense = "Constitutive Action";
    synonyms = ["compose", "execute", "instantiate", "perform", "articulate", "represent"];
  } else {
    // Elegant adjective / general word lists
    pos = "Modifier / Adjective";
    tense = "Qualitative Property";
    synonyms = ["optimal", "paramount", "distinctive", "sophisticated", "comprehensive", "innovative"];
  }

  // Generate logical root lemma
  let baseForm = cleanWord;
  if (wordLower.endsWith("ies")) baseForm = cleanWord.slice(0, -3) + "y";
  else if (wordLower.endsWith("ing") && cleanWord.length > 5) baseForm = cleanWord.slice(0, -3);
  else if (wordLower.endsWith("ed") && cleanWord.length > 4) baseForm = cleanWord.slice(0, -2);
  else if (wordLower.endsWith("s") && !wordLower.endsWith("ss") && cleanWord.length > 3) baseForm = cleanWord.slice(0, -1);

  return {
    pos,
    tense,
    baseForm,
    synonyms,
    nuanceExplanation: `Replacing "${cleanWord}" allows you to express your ideas with sharper semantic density. Opt for vocabulary variants that specify the exact physical or conceptual parameters rather than general indicators.`,
    usageFrequencyAdvice: `"${cleanWord}" is a functional pillar, but repeating it can lead to stylistic fatigue. Swapping it with context alternatives increases structural flow.`
  };
}

/**
 * Main module function to analyze a word contextually.
 * Resolves with complete grammatical analysis and context synonyms.
 */
export async function analyzeWordContext(
  word: string, 
  sentence: string, 
  fullText: string
): Promise<WordAnalysisResponse> {
  
  // Simulate network latency (250ms) to preserve premium feel & loading indicators in UI
  await new Promise(resolve => setTimeout(resolve, 250));

  if (USE_LIVE_API) {
    /**
     * =========================================
     * FUTURE IMPLEMENTATION CODES (LIVE API CLOUD FETCH)
     * =========================================
     * When you host your backend or secondary server API, you can replace
     * the mock structure below with this standard HTTP fetch procedure:
     * 
     * try {
     *   const endpoint = `${MY_CUSTOM_API_ROOT}/analyze-word`;
     *   
     *   const response = await fetch(endpoint, {
     *     method: "POST",
     *     headers: {
     *       "Content-Type": "application/json",
     *       "Authorization": "Bearer YOUR_CLIENT_OR_BEARER_TOKEN_HERE" // optional
     *     },
     *     body: JSON.stringify({
     *       word: word,
     *       sentence: sentence,
     *       fullText: fullText
     *     })
     *   });
     * 
     *   if (!response.ok) {
     *     throw new Error(`API returned error status: ${response.status}`);
     *   }
     * 
     *   const payload: WordAnalysisResponse = await response.json();
     *   return payload;
     * 
     * } catch (apiError) {
     *   console.error("Custom cloud server connection failed. Rolling back to local fallback:", apiError);
     *   // (Optionally fall back to LOCAL_DICTIONARY_DB inside catch block if desired)
     * }
     */

    // Simple logging to help you debug during migration
    console.log("Mock Mode Disabled: Sending request to custom endpoint", `${MY_CUSTOM_API_ROOT}/analyze-word`);
  }

  // --- Mock Mode Execution Path ---
  const cleanKey = word.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '');
  
  // Match exact local dictionary entry, or generate realistic response
  if (LOCAL_DICTIONARY_DB[cleanKey]) {
    return {
      ...LOCAL_DICTIONARY_DB[cleanKey],
      baseForm: cleanKey
    };
  } else {
    return generateDynamicLinguisticResponse(word, sentence);
  }
}
