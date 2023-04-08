import React, { useState, useEffect, useMemo } from 'react';
import './App.css';

function App() {
  const [ facts, setFacts ] = useState([]);
  const [ parameter, setParameter ] = useState([])
  const [ listening, setListening ] = useState(false);
  const clientId = useMemo(() => Date.now(), [])

  useEffect( () => {
    if (!listening) {
    }
  }, [listening, facts, clientId]);

  async function startJob() {
    const events = new EventSource(`http://localhost:3000/events?clientId=${clientId}`);

    events.onmessage = (event) => {
      const parsedData = JSON.parse(event.data);
      setFacts((facts) => facts.concat(parsedData));
      if (parsedData.complete) {
        events.close()
        setListening(false)
      }
    };

    setListening(true);
    
    await fetch(`http://localhost:3000/start?clientId=${clientId}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ parameter })
    })
  }

  return (
    <>
    <input disabled={listening} value={parameter} onChange={e => setParameter(e.target.value)} />
    <button disabled={listening} onClick={startJob}>Iniciar</button>
    {listening && <span>Executando...</span>}
    <table className="stats-table">
      <thead>
        <tr>
          <th>Parameter</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        {
          facts.sort((a, b) => b.now - a.now).map((fact, i) =>
            <tr key={i}>
              <td>{fact.parameter} [{fact.current}/{fact.total}]</td>
              <td>{fact.now}</td>
            </tr>
          )
        }
      </tbody>
    </table>
    </>
  );
}

export default App;