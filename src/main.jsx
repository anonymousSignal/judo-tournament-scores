import React from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  redirect,
  RouterProvider,
} from "react-router";

import {
  LoadingPage,
  MatchPage,
  NotFoundPage,
  ResultsPage,
  RootLayout,
  RouteErrorPage,
} from "./App.jsx";
import {
  DEFAULT_WEIGHT_ID,
  loadCompetition,
  loadMatch,
  loadMatches,
} from "./api.js";
import "./styles.css";

function competitionLoader({ request }) {
  return loadCompetition(request.signal);
}

function resultsLoader({ params, request }) {
  return loadMatches(params.weightId, request.signal);
}

function matchLoader({ params, request }) {
  return loadMatch(params.contestCode, request.signal);
}

const router = createBrowserRouter([
  {
    id: "root",
    path: "/",
    loader: competitionLoader,
    Component: RootLayout,
    HydrateFallback: LoadingPage,
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        loader: () => redirect(`/weights/${DEFAULT_WEIGHT_ID}`),
      },
      {
        path: "weights/:weightId",
        loader: resultsLoader,
        Component: ResultsPage,
      },
      {
        path: "matches/:contestCode",
        loader: matchLoader,
        Component: MatchPage,
      },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
