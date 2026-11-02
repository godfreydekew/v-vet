// Open roles on the public careers page. The id must match OPEN_ROLES in
// backend/app/api/routes/careers.py, which accepts the applications.

export type Role = {
  id: string;
  title: string;
  terms: string[];
  summary: string;
  about: string[];
  youWill: string[];
  lookingFor: string[];
  // Nice to have, not required.
  strongPlus: string[];
  howYouWork: string[];
  stack: string[];
};

export const ROLES: Role[] = [
  {
    id: "software-engineer",
    title: "Software Engineer",
    terms: ["Contract", "Remote, within Zimbabwe", "1-month probation"],
    summary:
      "Build the WhatsApp conversations, triage engine and dashboards that help farmers keep their animals alive.",
    about: [
      "V-Vet helps smallholder farmers in Zimbabwe look after their livestock through WhatsApp. A farmer describes a sick animal in their own words, by text or voice note, in Shona, Ndebele or English. V-Vet asks the right follow-up questions, works out how urgent the case is and, when it matters, gets it to a vet with the animal's full history.",
      "We're a small team, so you'll work across the whole product and your work will reach farmers quickly. The role starts with a one-month probation on a real piece of the product, with the potential to become a full-time role.",
    ],
    youWill: [
      "Build and improve the WhatsApp conversations farmers use to register animals, report sickness and record births.",
      "Work on our triage engine: turning vet-written knowledge into a versioned decision graph, and using LLMs to extract symptoms from farmers' messages.",
      "Build features in the vet and admin dashboards.",
      "Test the bot with real conversations, including in Shona and Ndebele, and improve how it understands and replies.",
      "Write tests, and help keep the system reliable for people who depend on it.",
    ],
    lookingFor: [
      "You care about solving real problems in Zimbabwe.",
      "You've built something on top of LLMs, such as tool calling, structured output or prompt design, in a job or a serious side project.",
      "You're comfortable working with APIs. Experience with the WhatsApp Business API is a bonus.",
      "You write Python.",
      "You speak Shona or Ndebele. Farmers talk to V-Vet in their own language, so you'll help with testing, wording and catching mistakes.",
      "You have at least 1 to 2 years of development experience, or projects that show you can do the work.",
      "You live in Zimbabwe.",
    ],
    strongPlus: [
      "You also write JavaScript or TypeScript, for our React dashboards.",
    ],
    howYouWork: [
      "You're comfortable with ambiguity and can make progress without detailed instructions.",
      "You write tests and check that things actually work.",
      "You communicate clearly in writing, because we work remotely.",
      "You work well independently in a small team and ask for help when you need it.",
      "You're curious about farmers and how they actually use the product.",
    ],
    stack: ["Python", "FastAPI", "PostgreSQL", "React", "TypeScript", "WhatsApp Business API", "OpenAI"],
  },
];

export const HIRING_STEPS = [
  {
    title: "Apply",
    text: "Send your CV, links to your work, and a short answer about something you built on top of an LLM.",
  },
  {
    title: "Coding task",
    text: "Straight after you apply, we email you a short coding task based on a real V-Vet problem, with instructions for sending it back.",
  },
  {
    title: "Review",
    text: "We review your application and your coding task together.",
  },
  {
    title: "Interview",
    text: "We go through your coding task with you, do some live coding (you can use AI tools), and talk about how you work.",
  },
];

export function getRole(id: string | undefined): Role | undefined {
  return ROLES.find((role) => role.id === id);
}
