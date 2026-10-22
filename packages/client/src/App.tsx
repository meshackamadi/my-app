import { useState, useEffect } from 'react';
import { Button } from './components/ui/button';

function App() {
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    fetch('/api/hello')
      .then((response) => response.json())
      .then((data) => setMessage(data.message))
      .catch((error) => console.error('Error fetching message:', error));
  }, []);

  return (
    <div className="p-4">
      <p className="font-bold p-4 text-3xl">{message}</p>
      <Button>Click Me</Button>
    </div>
  );
}

export default App;
