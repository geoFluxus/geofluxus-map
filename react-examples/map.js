import React from "react";
import { render } from "react-dom";
import ReactMap from "./reactMap";

const App = () => (
  <div>
    <ReactMap />
  </div>
);

render(<App />, document.getElementById("root1"));