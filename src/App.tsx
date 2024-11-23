import { useState, useEffect } from 'react'
import { Client, Socket as NakamaSocket } from '@heroiclabs/nakama-js'
import './css/effect.css'
import './css/terminal.css'

function App() {
  const serverKey = 'defaultkey'
  const serverAddr = 'localhost'
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const [client] = useState<Client>(new Client(serverKey, serverAddr));
  const [socket] = useState<NakamaSocket>(client.createSocket());
  
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isDisabled, setIsDisabled] = useState<boolean>(false);
  const [isMatched, setIsMatched] = useState<boolean>(false);

  const [command, setCommand] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('game@server:~$');

  useEffect(() => {
    const connectToServer = async () => {
      try {
        const deviceid = 'mydeviceid'
        const create = true
        
        const session = await client.authenticateDevice(deviceid, create);
        await socket.connect(session, false);
        console.log("Session:", session);
        setIsDisabled(true);
        showMessage('welcomeMessage');
        setIsConnected(true);
        sleep(10000).then(() => {
          clearCommand();
          setIsDisabled(false);
        });
      } catch (error) {
        console.error("Connection error:", error);
        setIsConnected(false);
      }
    };

    connectToServer();

    return () => {
      if (socket && isConnected) {
        socket.disconnect(true);
        setIsConnected(false);
      }
    };
  }, []);

  const showMessage = async (path: string) => {
    try {
      const response = await fetch(`/messages/${path}.txt`);
      if (!response.ok) throw new Error('File not found');
      
      const text = await response.text();
      const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
  
      for (const line of lines) {
        await sleep(30);
        setCommand(prev => [...prev, line]);
      }
    } catch (error) {
      console.error('Error reading message:', error);
      setCommand(prev => [...prev, 'Message not found']);
    }
  };

  const handleInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isDisabled) { 
      const newCommand = (e.target as HTMLInputElement).value;
      setCommand([...command, newCommand]);
      checkCommand(newCommand);
      (e.target as HTMLInputElement).value = '';
    }
  }

  const pathChange = (path: string) => {
    setCurrentPath(path);
  }

  const clearCommand = () => {
    setCommand([]);
  }

  const checkCommand = (newCommand: string) => {
    const slicedCommand = newCommand.split(' ')[0];
    if(!isMatched){
      switch (slicedCommand) {
        case 'help':
          showMessage('helpMessage');
          break;
        case 'start':
          startMatchmaking();
          break;
        case 'exit':
          pathChange('game@server:~$');
          break;
        case 'clear':
          clearCommand();
          break;
        default:
          setCommand(prev => [...prev, 'command not found']);
          break;
      }
    } else {
      switch (slicedCommand) {
        case 'ls':
          break;
        case 'cd':
          break;
        case 'touch':
          break;
        case 'mkdir':
          break;
        default:
          setCommand(prev => [...prev, 'command not found']);
          break;
      }

    }
    
  }

  const startMatchmaking = async () => {
    if (!isConnected) {
      console.error("Not connected to server");
      return;
    }

    setIsDisabled(true); 
    setCommand(prev => [...prev, 'Searching for opponent...']);

    const matchMakerQuery = '*';
    const minCount = 2;
    const maxCount = 2;

    socket.addMatchmaker(matchMakerQuery, minCount, maxCount);

    socket.onmatchmakermatched = async (matched) => {
      console.log("Matchmaker matched:", matched);
      setIsMatched(true);
      const matchedPlayers = matched.users.map(user => user.presence.user_id);
      console.log("Matched players:", matchedPlayers);

      const match = await socket.joinMatch(null, matched.token);
      console.log("Successfully joined match:", match);
      
      setCommand(prev => [...prev, 'Match found! Starting program...']);
      setCommand(prev => [...prev, `ssh game@veritas.${matchedPlayers[1]}.com`]);
      clearCommand();
      showMessage("welcomeGameMessage");
      pathChange('game@veritas:~$');

      setIsDisabled(false); 

      socket.onmatchdata = (matchData) => {
        console.log("Match data received:", matchData);
      }
    }
  }

  return (
    <>
      <div className='wrapMonitor'>
        <div className='monitor'>
          <div className='terminal'>
            {command.map((item, index) => (
              <div key={index} className='command-line'>
                <span className='prompt'>{currentPath}</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className='input-line'>
            <span className='prompt'>{currentPath}</span>
            <input 
              type='text' 
              onKeyDown={handleInput}
              disabled={isDisabled}  
              autoFocus 
              spellCheck="false"
              placeholder={isDisabled ? "waiting system..." : "Enter command..."}  
              style={{ cursor: isDisabled ? 'not-allowed' : 'text' }}
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default App