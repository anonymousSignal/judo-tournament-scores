import React from "react";
import {
  isRouteErrorResponse,
  Link,
  NavLink,
  Outlet,
  useLoaderData,
  useNavigation,
  useParams,
  useRouteError,
  useRouteLoaderData,
} from "react-router";

import { DEFAULT_WEIGHT_ID } from "./api.js";

const ROUND_ORDER = [
  "Final",
  "Bronze",
  "Semi-Final",
  "Repechage",
  "Quarter-Final",
  "Round of 16",
  "Round of 32",
];

function getAthlete(contest, side) {
  const suffix = side === "white" ? "w" : "b";
  const id = contest[`id_person_${side}`];
  const firstName = contest[`given_name_${side}`] ?? "";
  const lastName = contest[`family_name_${side}`] ?? "";

  return {
    id,
    name: `${firstName} ${lastName}`.trim(),
    country: contest[`country_${side}`],
    countryCode: contest[`country_short_${side}`],
    // IJF person IDs are positive numbers, sometimes returned as strings.
    winner: Number(id) > 0 && Number(contest.id_winner) === Number(id),
    ippon: Number(contest[`ippon_${suffix}`] ?? 0),
    wazaari: Number(contest[`waza_${suffix}`] ?? 0),
    yuko: Number(contest[`yuko_${suffix}`] ?? 0),
    penalties: Number(contest[`penalty_${suffix}`] ?? 0),
  };
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

function formatDuration(duration = "") {
  return duration.replace(/^00:/, "");
}

function scoreText(athlete) {
  return `${athlete.ippon} / ${athlete.wazaari} / ${athlete.yuko}`;
}

function Brand() {
  return (
    <Link className="brand" to={`/weights/${DEFAULT_WEIGHT_ID}`}>
      <span className="brand-stamp" aria-hidden="true">J</span>
      <span>
        <strong>SHIAI</strong>
        <small>Judo results</small>
      </span>
    </Link>
  );
}

function WeightSelector({ weights }) {
  return (
    <nav className="weight-selector" aria-label="Weight classes">
      {["Men", "Women"].map((gender) => (
        <div className="weight-group" key={gender}>
          <span>{gender}</span>
          <div>
            {weights
              .filter((weight) => weight.gender === gender)
              .map((weight) => (
                <NavLink
                  className={({ isActive }) =>
                    isActive
                      ? "weight-link is-active"
                      : "weight-link"
                  }
                  end
                  key={weight.id}
                  to={`/weights/${weight.id}`}
                >
                  {weight.label} kg
                </NavLink>
              ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function AthleteName({ athlete, side }) {
  return (
    <div className={`athlete-name athlete-name--${side}`}>
      <span className="country-code">{athlete.countryCode}</span>
      <strong>{athlete.name}</strong>
      {athlete.winner && <span className="winner-mark" aria-label="Winner">W</span>}
    </div>
  );
}

function ScoreMetrics({ athlete }) {
  return (
    <div className="score-metrics" aria-label={`Score for ${athlete.name}`}>
      <div><span>Ippon</span><strong>{athlete.ippon}</strong></div>
      <div><span>Waza-ari</span><strong>{athlete.wazaari}</strong></div>
      <div><span>Yuko</span><strong>{athlete.yuko}</strong></div>
      <div><span>Shido</span><strong>{athlete.penalties}</strong></div>
    </div>
  );
}

function MatchRow({ contest }) {
  const white = getAthlete(contest, "white");
  const blue = getAthlete(contest, "blue");

  return (
    <Link className="match-row" to={`/matches/${contest.contest_code_long}`}>
      <div className="bout-reference">
        <strong>{String(contest.fight_no).padStart(2, "0")}</strong>
        <span>Mat {contest.mat}</span>
      </div>
      <AthleteName athlete={white} side="white" />
      <div className="compact-score">
        <small>I / W / Y</small>
        <strong>{scoreText(white)}</strong>
        <strong>{scoreText(blue)}</strong>
      </div>
      <AthleteName athlete={blue} side="blue" />
      <div className="row-result">
        <span>Duration</span>
        <strong>{formatDuration(contest.duration)}</strong>
      </div>
      <span className="row-arrow" aria-hidden="true">→</span>
    </Link>
  );
}

export function RootLayout() {
  const navigation = useNavigation();

  return (
    <div className="app-frame">
      <div
        className={navigation.state === "idle" ? "route-progress" : "route-progress is-loading"}
        aria-hidden="true"
      />
      <header className="site-header">
        <Brand />
        <div className="header-source">
          <span>Official data</span>
          <a href="https://data.ijf.org/" target="_blank" rel="noreferrer">
            IJF Judobase <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>
      <Outlet />
      <footer className="site-footer">
        <Brand />
        <p>Educational interface using public IJF competition data</p>
      </footer>
    </div>
  );
}

export function ResultsPage() {
  const { contests, sourceUrl } = useLoaderData();
  const { weights } = useRouteLoaderData("root");
  const { weightId } = useParams();
  const event = contests[0];
  const activeWeight = weights.find((weight) => weight.id === weightId);
  const roundGroups = [];

  for (const round of ROUND_ORDER) {
    const matches = contests.filter((contest) => contest.round_name === round);
    matches.sort((first, second) => Number(second.fight_no) - Number(first.fight_no));

    if (matches.length > 0) {
      roundGroups.push({ round, matches });
    }
  }

  return (
    <main className="results-page">
      <title>{`${event.competition_name} ${event.weight} kg — SHIAI`}</title>

      <section className="event-masthead">
        <div className="event-code" aria-hidden="true">
          <span>IJF</span>
          <strong>GP</strong>
        </div>
        <div className="event-title">
          <p className="eyebrow">IJF World Tour · Completed</p>
          <h1>{event.competition_name}</h1>
          <p>{event.age} individual competition</p>
        </div>
        <dl className="event-facts">
          <div><dt>Date</dt><dd>{formatDate(event.competition_date)}</dd></div>
          <div><dt>City</dt><dd>{event.city}</dd></div>
          <div><dt>Division</dt><dd>{activeWeight?.gender} · {event.weight} kg</dd></div>
          <div><dt>Bouts</dt><dd>{contests.length} completed</dd></div>
        </dl>
      </section>

      <WeightSelector weights={weights} />

      <section className="bracket-results" aria-labelledby="results-heading">
        <header className="section-heading">
          <div>
            <p className="eyebrow">Competition results</p>
            <h2 id="results-heading">Full bracket</h2>
          </div>
          <div className="score-legend">
            <span><b>I</b> Ippon</span>
            <span><b>W</b> Waza-ari</span>
            <span><b>Y</b> Yuko</span>
          </div>
        </header>

        {roundGroups.map(({ round, matches }) => (
          <section className="round-group" key={round}>
            <header>
              <h3>{round}</h3>
              <span>{matches.length} {matches.length === 1 ? "bout" : "bouts"}</span>
            </header>
            <div className="match-list">
              {matches.map((contest) => (
                <MatchRow contest={contest} key={contest.id_fight} />
              ))}
            </div>
          </section>
        ))}

        <a className="api-link" href={sourceUrl} target="_blank" rel="noreferrer">
          Inspect this JSON response <span aria-hidden="true">↗</span>
        </a>
      </section>
    </main>
  );
}

export function MatchPage() {
  const { contest, sourceUrl } = useLoaderData();
  const white = getAthlete(contest, "white");
  const blue = getAthlete(contest, "blue");
  const winner = [white, blue].find((athlete) => athlete.winner);

  return (
    <main className="match-page">
      <title>{`${white.name} vs ${blue.name} — SHIAI`}</title>

      <Link className="back-link" to={`/weights/${contest.id_weight}`}>
        <span aria-hidden="true">←</span> {contest.weight} kg results
      </Link>

      <header className="match-heading">
        <div>
          <p className="eyebrow">{contest.competition_name}</p>
          <h1>{contest.round_name}</h1>
        </div>
        <div className="match-number">
          <span>Bout</span>
          <strong>{String(contest.fight_no).padStart(2, "0")}</strong>
        </div>
      </header>

      <section className="detail-scoreboard" aria-label="Official match score">
        <div className={`detail-athlete white-side${white.winner ? " is-winner" : ""}`}>
          <span className="side-label">White judogi</span>
          <small>{white.country}</small>
          <h2>{white.name}</h2>
          {white.winner && <strong className="detail-winner">Winner</strong>}
          <ScoreMetrics athlete={white} />
        </div>

        <div className="detail-result">
          <span>{contest.weight} kg</span>
          <strong>VS</strong>
        </div>

        <div className={`detail-athlete blue-side${blue.winner ? " is-winner" : ""}`}>
          <span className="side-label">Blue judogi</span>
          <small>{blue.country}</small>
          <h2>{blue.name}</h2>
          {blue.winner && <strong className="detail-winner">Winner</strong>}
          <ScoreMetrics athlete={blue} />
        </div>
      </section>

      <p className="winner-summary">
        {winner ? `Winner: ${winner.name}` : "Winner unavailable"}
      </p>

      <aside className="bout-facts" aria-label="Bout facts">
        <dl>
          <div><dt>Duration</dt><dd>{formatDuration(contest.duration)}</dd></div>
          <div><dt>Mat</dt><dd>{contest.mat}</dd></div>
          <div><dt>Golden score</dt><dd>{Number(contest.gs) === 1 ? "Yes" : "No"}</dd></div>
          <div><dt>Date</dt><dd>{formatDate(contest.competition_date)}</dd></div>
        </dl>
      </aside>

      <a className="api-link" href={sourceUrl} target="_blank" rel="noreferrer">
        Inspect official match JSON <span aria-hidden="true">↗</span>
      </a>
    </main>
  );
}

export function LoadingPage() {
  return (
    <main className="loading-page" aria-live="polite">
      <div className="loading-mark" aria-hidden="true">J</div>
      <p>Calling the IJF results API</p>
      <div className="loading-line"><span /></div>
    </main>
  );
}

export function RouteErrorPage() {
  const error = useRouteError();
  const status = isRouteErrorResponse(error) ? error.status : "API";
  const message = isRouteErrorResponse(error)
    ? error.data || error.statusText
    : "The results could not be loaded.";

  return (
    <main className="state-page">
      <span>{status}</span>
      <h1>Results unavailable</h1>
      <p>{String(message)}</p>
      <Link to={`/weights/${DEFAULT_WEIGHT_ID}`}>Try the default division</Link>
    </main>
  );
}

export function NotFoundPage() {
  return (
    <main className="state-page">
      <title>Page not found — SHIAI</title>
      <span>404</span>
      <h1>Outside the contest area</h1>
      <p>The requested judo result does not exist.</p>
      <Link to={`/weights/${DEFAULT_WEIGHT_ID}`}>Return to results</Link>
    </main>
  );
}
