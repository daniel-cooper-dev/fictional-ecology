import type { DomainConfig } from '../types/domains.js';

export const customConfig: DomainConfig = {
  id: 'custom',
  name: 'Custom Element',
  namePlural: 'Custom Elements',
  icon: 'puzzle',
  color: '#bdc3c7',
  description: 'Create world elements that don\'t fit neatly into any other domain. Custom elements store their data as flexible JSON properties, letting you define whatever structure your world needs—unique systems, hybrid concepts, or entirely novel categories.',
  tableName: 'world_elements',
  category: 'meta',
  fields: [
    {
      name: 'properties',
      label: 'Properties',
      type: 'json',
      placeholder: '{"key": "value"}',
      helpText: 'A flexible JSON object for storing any structured data. Define whatever fields your custom element needs.',
    },
  ],
  elementTypes: ['custom'],
  elementTypeDescriptions: {
    custom: 'A freeform element for anything that doesn\'t fit the other domains. Define your own structure using flexible properties.',
  },
  prompts: [
    'What aspect of your world doesn\'t fit into the existing domains? Consider unique systems, hybrid concepts, or entirely new categories that make your world distinct.',
    'How does this custom element connect to the rest of your world? Even unique concepts gain depth when they interact with established systems like magic, ecology, or civilization.',
  ],
  magicPermeation: null,
  archetypes: [
    {
      id: 'language_system',
      name: 'Constructed Language',
      description: 'Define a language with phonology, grammar, and script.',
      element_type: 'custom',
      summary: 'A fully constructed language with its own sounds, grammar, writing system, and cultural context',
      detailed_notes: 'A constructed language (conlang) is one of the deepest acts of world-building. Language shapes thought, and a well-designed conlang reveals how its speakers perceive and categorize reality. Does the language have tenses for past and future, or does it treat time differently? Are there gendered nouns, or is gender irrelevant to grammar? How many words exist for concepts central to the culture — a seafaring people might have dozens of words for water, while a desert culture has dozens for sand. The writing system encodes cultural values: is it efficient (alphabetic) or beautiful (calligraphic)? Is literacy widespread or restricted? The phonology — the sounds of the language — determines its aesthetic: harsh consonant clusters for a warrior culture, flowing vowels for a poetic one.',
      fields: {
        properties: {
          phonology: 'Define the sound inventory — consonants, vowels, tones, and phonotactic rules (which sounds can appear where)',
          grammar: 'Define word order, case systems, verb conjugation, noun declension, and any unique grammatical features',
          script: 'Define the writing system — alphabet, syllabary, logographic, or other. Include directionality and medium (ink, carving, etc.)',
          example_phrases: 'Provide sample phrases with translations to demonstrate the language in action',
        },
      },
    },
    {
      id: 'religion_system',
      name: 'Religious System',
      description: 'A belief system with deities, cosmology, rituals, and clergy.',
      element_type: 'custom',
      summary: 'A complete religious system with gods, creation myths, sacred rituals, and organized clergy',
      detailed_notes: 'A religious system is more than a list of gods — it is a comprehensive framework for understanding existence. It answers the questions every culture asks: Where did we come from? Why do we suffer? What happens when we die? What must we do to live rightly? The answers shape laws, art, architecture, warfare, and daily life. A well-designed religion includes internal tensions — orthodoxy versus heresy, clergy versus laity, faith versus doubt — because living religions are never monolithic. Consider whether the gods are real, distant, or imaginary within your world, and how that affects the religion\'s credibility and power. Think about schisms, reformations, and how the religion has changed over time.',
      fields: {
        properties: {
          deities: 'List and describe the gods, spirits, or divine forces — their domains, personalities, relationships, and how they interact with mortals',
          creation_myth: 'The story of how the world began according to this religion — and how it may end',
          rituals: 'Key religious practices — daily prayers, seasonal festivals, life-transition ceremonies, sacrifices, and pilgrimages',
          clergy_structure: 'The organization of religious authority — priests, monks, oracles, hierarchies, training, and the relationship between clergy and secular power',
        },
      },
    },
    {
      id: 'economic_system',
      name: 'Economic System',
      description: 'Trade, currency, taxation, and resource distribution.',
      element_type: 'custom',
      summary: 'A complete economic framework covering currency, trade, taxation, and how wealth flows through society',
      detailed_notes: 'An economic system determines who has power, who has comfort, and who has nothing. It encompasses everything from the medium of exchange (metal coins, mana crystals, barter, debt-tokens) to the rules governing trade (free markets, guild monopolies, state control), taxation (what is taxed, at what rate, and who collects), and the distribution of resources (equitable, feudal, plutocratic). The economic system intersects with magic in critical ways: if magic can create food, what happens to farmers? If enchantment is a trade, who regulates quality? If mana is a resource, who owns the ley lines? Economic systems create winners and losers, and the tension between them drives much of a world\'s conflict.',
      fields: {
        properties: {
          currency: 'The medium of exchange — what it is, how it is minted or produced, and what backs its value',
          trade_goods: 'The major commodities traded — raw materials, finished goods, magical services, and luxury items',
          taxation: 'How the state extracts wealth — what is taxed, at what rates, and how compliance is enforced',
          markets: 'How trade is organized — free markets, guild halls, auction houses, state exchanges, and black markets',
        },
      },
    },
    {
      id: 'calendar_system',
      name: 'Calendar System',
      description: 'Timekeeping with months, weeks, holidays, astronomical basis.',
      element_type: 'custom',
      summary: 'A timekeeping system defining how a civilization measures days, seasons, and the passage of years',
      detailed_notes: 'A calendar system reflects a civilization\'s relationship with time, the cosmos, and what it considers important enough to commemorate. The structure may be based on astronomical observations (solar years, lunar months, stellar cycles), magical cycles (mana tides, ley line pulses, planar alignments), or arbitrary cultural conventions. The names of months and days carry meaning — named for gods, heroes, seasons, or historical events. Holidays mark the moments a culture pauses to remember, celebrate, or mourn. The calendar is also a tool of power: whoever defines the calendar defines the rhythm of daily life, the timing of religious observance, and the framework within which history is recorded. Rival calendars represent rival claims to cultural authority.',
      fields: {
        properties: {
          year_length: 'The length of a year and what astronomical or magical cycle it is based on',
          months: 'The months of the year — their names, lengths, and seasonal associations',
          weeks: 'The structure of weeks — how many days, their names, and which are rest days or market days',
          holidays: 'Major holidays and observances — what they commemorate, how they are celebrated, and their cultural significance',
        },
      },
    },
  ],
  defaultSortField: 'name',
};
