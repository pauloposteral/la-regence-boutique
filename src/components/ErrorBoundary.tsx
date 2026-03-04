import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4">
            <span className="text-5xl mb-4">☕</span>
            <h2 className="font-display text-2xl font-semibold mb-2">Algo deu errado</h2>
            <p className="font-body text-sm text-muted-foreground mb-6 max-w-md">
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>
            <Button onClick={() => window.location.reload()} variant="outline" className="font-body text-sm">
              Recarregar página
            </Button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
