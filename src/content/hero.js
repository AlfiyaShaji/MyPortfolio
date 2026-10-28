// All visible hero copy and career facts live here so they can be edited
// without touching layout, scene or animation code.

export const identity = {
  name: 'Alfiya Shaji',
  monogram: 'AS',
}

export const hero = {
  headline: ['I build.', 'I teach.', "I explore what's next."],
  // Optional: the end of the last headline line to set in the accent gradient.
  headlineAccent: "what's next.",
  role: 'GenAI Mentor · Full-Stack Developer',
  description:
    'I build web applications, work across the full stack, and help learners explore modern development and generative AI.',
  primaryCta: 'Explore my journey',
  secondaryCta: 'View my work',
  scrollHint: 'Scroll to explore',
}

// One entry per journey stage, in scroll order. `id` is used for anchors and
// must stay stable; everything else is display copy.
export const stages = [
  {
    id: 'first-line',
    index: '01',
    label: 'The First Line of Code',
    title: 'It started with a single line.',
    body: 'Curiosity about how things work on the web turned into writing code, one line at a time.',
  },
  {
    id: 'web-development',
    index: '02',
    label: 'Web Development',
    title: 'Building for the web.',
    body: 'WordPress sites, SEO and front-end development: learning how real interfaces take shape and get found.',
  },
  {
    id: 'full-stack',
    index: '03',
    label: 'Full-Stack Development',
    title: 'From interfaces to whole systems.',
    body: 'Connecting frontends to APIs, backends and databases.',
    project: {
      name: 'DeepCampus',
      summary: 'A campus placement platform with candidate, institution and recruiter workflows.',
    },
  },
  {
    id: 'genai-mentoring',
    index: '04',
    label: 'Generative AI & Mentoring',
    title: 'Now: teaching what comes next.',
    body: 'Bringing that full-stack foundation to generative AI, and mentoring learners as they explore it.',
    roles: ['GenAI Mentor', 'Full-Stack Developer'],
  },
]

// In-scene labels for the full-stack layers (rendered to small canvas textures).
export const layerLabels = ['Frontend', 'API', 'Backend', 'Database']
