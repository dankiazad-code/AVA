import { StrictMode, Component, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#0a0a0a', color:'white', fontFamily:'Inter,sans-serif', gap:'1rem' }}>
          <img src="/ava-icon.png" alt="AVA" style={{ width:56, borderRadius:12 }} />
          <h1 style={{ fontSize:'1.5rem', fontWeight:700 }}>Etwas ist schiefgelaufen</h1>
          <p style={{ color:'#888', fontSize:'0.9rem' }}>Bitte laden Sie die Seite neu.</p>
          <button onClick={() => window.location.reload()} style={{ marginTop:'0.5rem', padding:'0.6rem 1.5rem', background:'#0078ff', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontSize:'0.9rem' }}>
            Neu laden
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
