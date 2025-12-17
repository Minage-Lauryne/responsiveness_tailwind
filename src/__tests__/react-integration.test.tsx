import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// Simple test component
function TestComponent() {
  return (
    <div>
      <h1>Hello World</h1>
      <button>Click me</button>
    </div>
  );
}

describe("React Integration", () => {
  it("should render React components", () => {
    render(<TestComponent />);

    expect(screen.getByText("Hello World")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Click me" }),
    ).toBeInTheDocument();
  });

  it("should support jest-dom matchers", () => {
    render(<TestComponent />);

    const heading = screen.getByText("Hello World");
    const button = screen.getByRole("button");

    expect(heading).toBeVisible();
    expect(button).toBeEnabled();
  });
});
