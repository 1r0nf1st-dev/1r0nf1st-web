const JOKE_API = 'https://official-joke-api.appspot.com/random_joke';

export interface JokeData {
  id: string;
  setup: string;
  punchline: string;
  type?: string;
}

interface JokeApiResponse {
  id: number;
  type: string;
  setup: string;
  punchline: string;
}

async function fetchFromJokeApi(): Promise<JokeData> {
  const response = await fetch(JOKE_API, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Joke API failed: ${response.status}`);
  }
  const data = (await response.json()) as JokeApiResponse;
  return {
    id: String(data.id),
    setup: data.setup ?? '',
    punchline: data.punchline ?? '',
    type: data.type,
  };
}

/** Fallback jokes when external API is down */
const FALLBACK_JOKES: JokeData[] = [
  {
    id: 'fb-1',
    setup: 'Why do programmers prefer dark mode?',
    punchline: 'Because light attracts bugs!',
    type: 'programming',
  },
  {
    id: 'fb-2',
    setup: 'How do you comfort a JavaScript bug?',
    punchline: 'You console it!',
    type: 'programming',
  },
  {
    id: 'fb-3',
    setup: 'Why did the developer go broke?',
    punchline: 'Because he used up all his cache!',
    type: 'programming',
  },
  {
    id: 'fb-4',
    setup: 'Why do Java developers wear glasses?',
    punchline: 'Because they can\'t C#!',
    type: 'programming',
  },
  {
    id: 'fb-5',
    setup: 'What do you call a programmer from Finland?',
    punchline: 'Nerdic!',
    type: 'programming',
  },
];

function getFallbackJoke(): JokeData {
  const index = Math.floor(Math.random() * FALLBACK_JOKES.length);
  return FALLBACK_JOKES[index];
}

export async function fetchRandomJoke(): Promise<JokeData> {
  try {
    return await fetchFromJokeApi();
  } catch {
    return getFallbackJoke();
  }
}
