import React from "react";
import { render } from "react-dom";
import Map from "./Map";

const App = () => (
  <div>
    <Map />
  </div>
);

render(<App />, document.getElementById("root"));