import { render, screen } from "@testing-library/react";
import App from "./App";

beforeEach(() => {
  localStorage.clear();
});

test("renders the login screen by default", () => {
  render(<App />);
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /continue to voidlab beta/i })
  ).toBeInTheDocument();
});
