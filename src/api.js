const API_BASE_URL = "https://data.ijf.org/api/get_json";

// to keep it small and simple for the showcase I use the hardcoded Id
// all the related data is fetched dynamically
export const COMPETITION_ID = "3081";
export const DEFAULT_WEIGHT_ID = "2";

function createApiUrl(action, parameters = {}) {
  const url = new URL(API_BASE_URL);
  url.searchParams.set("params[action]", action);

  for (const [key, value] of Object.entries(parameters)) {
    url.searchParams.set(`params[${key}]`, value);
  }
  return url;
}

async function requestIjf(action, parameters, signal) {
  const url = createApiUrl(action, parameters);
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Response("The IJF data service is unavailable.", {
      status: response.status,
      statusText: response.statusText,
    });
  }
  const data = await response.json();
  return { data, sourceUrl: url.toString() };
}

export async function loadCompetition(signal) {
  const { data } = await requestIjf(
    "competition.categories_full", // API actions found in the official IJF website requests
    { id_competition: COMPETITION_ID },
    signal,
  );

  const weights = [];

  for (const group of Object.values(data)) {
    const gender = group.gender === "f" ? "Women" : "Men";

    for (const [id, label] of Object.entries(group.categories)) {
      weights.push({ id, label, gender });
    }
  }
  return { weights };
}

export async function loadMatches(weightId, signal) {
  const { data, sourceUrl } = await requestIjf(
    "contest.find",
    {
      id_competition: COMPETITION_ID,
      id_weight: weightId,
    },
    signal,
  );

  const contests = Array.isArray(data.contests) ? data.contests : [];

  if (contests.length === 0) {
    throw new Response("Weight class not found.", { status: 404 });
  }
  return { contests, sourceUrl };
}

export async function loadMatch(contestCode, signal) {
  const { data, sourceUrl } = await requestIjf(
    "contest.find",
    {
      contest_code: contestCode,
      part: "info,score_list,media,events",
    },
    signal,
  );

  const contest = data.contests?.[0];

  if (!contest) {
    throw new Response("Match not found.", { status: 404 });
  }
  return { contest, sourceUrl };
}
