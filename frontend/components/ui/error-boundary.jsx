'use client';
import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='flex min-h-screen items-center justify-center p-8 text-center'>
          <div>
            <h2 className='mb-2 text-xl font-bold'>Algo salió mal</h2>
            <p className='mb-4 text-sm text-muted'>Ocurrió un error inesperado. Recargá la página.</p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className='rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white'
            >
              Recargar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
