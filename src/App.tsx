import { useState } from 'react';
import './App.css';
import ProfileEditor from './components/ProfileEditor';
import ChatInterface from './components/ChatInterface';
import AssessmentView from './components/AssessmentView';
import { Message } from './services/ConversationEngine';

function App() {
  const [view, setView] = useState<'profile' | 'chat' | 'assessment'>('profile');
  const [history, setHistory] = useState<Message[]>([]);

  const handleResetInterview = () => {
    setHistory([]);
  };

  return (
    <div className="container">
      <header className="flex items-center justify-between" style={{ marginBottom: '2rem' }}>
        <h1>SmartHire</h1>
        <nav>
          <button onClick={() => setView('profile')} disabled={view === 'profile'}>
            Recruiter Profile
          </button>
          <button onClick={() => setView('chat')} disabled={view === 'chat'}>
            Live Interview
          </button>
          <button onClick={() => setView('assessment')} disabled={view === 'assessment'}>
            Assessment
          </button>
        </nav>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {view === 'profile' && (
          <div className="card" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <ProfileEditor onReset={handleResetInterview} />
          </div>
        )}

        {view === 'chat' && (
          <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '70vh' }}>
            <ChatInterface history={history} setHistory={setHistory} />
          </div>
        )}

        {view === 'assessment' && (
          <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '70vh' }}>
            <AssessmentView history={history} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
