import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { store } from "./components/store";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);

import "./catalog-redesign.css";

import "./catalog-v2.css";

import "./cart-redesign.css";

import "./auth-redesign.css";

import "./how-to-buy-v2.css";

import "./store-unified.css";

import "./retail-desktop-catalog.css";

import "./retail-truck.css";
