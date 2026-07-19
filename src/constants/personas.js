export const PERSONAS = [
  {
    id: "fan",
    label: "Fan",
    description: "International fan attending FIFA World Cup 2026",
    icon: "🏟️",
    suggestedQuestions: [
      "Where is Gate C from Section B2?",
      "Is it crowded near the food court right now?",
      "How do I get back to Manhattan from here?",
      "What is the accessible route to my seat?",
      "Where is the nearest medical aid station?",
      "What food options are near Section A1?"
    ]
  },
  {
    id: "staff",
    label: "Staff / Volunteer",
    description: "Venue staff or volunteer managing stadium operations",
    icon: "🦺",
    suggestedQuestions: [
      "Which sections are over 90% capacity?",
      "Suggest crowd redistribution for the north entrance",
      "What is the current wait time at Gate B?",
      "Alert me if south stand exceeds 95% capacity",
      "Give me a summary of current crowd status",
      "What areas need immediate volunteer support?"
    ]
  }
];

export const DEFAULT_PERSONA = PERSONAS[0];
