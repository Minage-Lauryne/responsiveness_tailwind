'use client';

import { Component, ReactNode } from "react";
import ErrorPage from "./ErrorPage";

interface Props {
  children: ReactNode;
  isLoggedIn: boolean;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorPage isLoggedIn={this.props.isLoggedIn} />;
    }

    return this.props.children;
  }
}
