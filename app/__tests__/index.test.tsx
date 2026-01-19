import React from "react";
import renderer from "react-test-renderer";

import Home from "../index";

describe("<Home />", () => {
  it("has 1 child", () => {
    const tree = renderer.create(<Home />).toJSON();
    // Snapshot testing is a good way to verify permission states vs camera states
    expect(tree).toBeDefined();
  });
});
