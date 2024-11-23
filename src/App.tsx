import { useState, useEffect, useRef } from 'react'
import { Client, Socket as NakamaSocket } from '@heroiclabs/nakama-js'
import { NetworkSystem } from './scripts/network'
import { GameFileSystem } from './scripts/file-system'
import { SystemUsage } from './scripts/usage'
import { UserManager } from './scripts/user'
import { Answer } from './scripts/answer'  
import './css/effect.css'
import './css/terminal.css'

function App() {
  const serverKey = 'defaultkey'
  const serverAddr = '192.168.57.175'
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  let matchId = "";

  const [client] = useState<Client>(new Client(serverKey, serverAddr));
  const [socket] = useState<NakamaSocket>(client.createSocket());
  const [Network] = useState<NetworkSystem>(new NetworkSystem());
  const [FileSystem] = useState<GameFileSystem>(new GameFileSystem());
  const [System] = useState<SystemUsage>(new SystemUsage());
  const [Users] = useState<UserManager>(new UserManager());
  const [VirusSystem] = useState<Answer>(new Answer());  // Answer 인스턴스 생
  
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isDisabled, setIsDisabled] = useState<boolean>(false);
  const [isMatched, setIsMatched] = useState<boolean>(false);

  const [command, setCommand] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('game@server:~$');
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const connectToServer = async () => {
      if(isConnected){
        return
      }

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

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [command]); 

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
      setCommand(prev => [...prev, `${currentPath} ${newCommand}`]);
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
    const [command, ...args] = newCommand.split(' ');
    if(!isMatched){
      switch (command) {
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
      switch (command) {
        case 'pwd':
          setCommand(prev => [...prev, FileSystem.CurrentDirectory()]);
          break;
          case 'ls':
            const dirList = FileSystem.ListDirectory();
            dirList.split('\n').forEach(line => {
                if (line.trim()) {
                    setCommand(prev => [...prev, line]);
                }
            });
            break;
        case 'cd':
          if(args[0] === '..'){
            FileSystem.StepOut();
          } else {
            FileSystem.StepInto(args[0]);
          }
          setCurrentPath(`game@veritas:${FileSystem.CurrentDirectory()}$`);
          break;
        case 'network':
          setCommand(prev => [...prev, 'Fetching network packets...']);
          setCommand(prev => [...prev, Network.getPackets()]);
          break;
        case 'system':
          setCommand(prev => [...prev, `System CPU Usage: ${System.getUsage()}%`]);
          break;
        case 'users':
          const userList = Users.readAllUsers();
          setCommand(prev => [...prev, 'User List:']);
          userList.forEach(user => {
            setCommand(prev => [...prev, `${user.name} (${user.group}) - ${user.authority}`]);
          });
          break;
        case 'answer':
          if (args.length === 0) {
            setCommand(prev => [...prev, 'Usage: answer <virus-name>']);
            break;
          }
          console.log("Checking virus name:", args[0]);
          if (VirusSystem.checkVirusName(args[0])) {
            setCommand(prev => [...prev, 'Correct! You have identified the virus.']);
            socket.leaveMatch(matchId);
          } else {
            setCommand(prev => [...prev, 'Incorrect virus identification. Try again.']);
          }
          break;
        case "clear":
          clearCommand();
          break;
        case "exit":
          matchExit();
          break;
        default:
          setCommand(prev => [...prev, 'Command not found']);
          break;
      }
    }
  };

  const matchExit = () => {
    socket.leaveMatch(matchId);
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
        setIsDisabled(false);
        const matchedPlayers = matched.users.map(user => user.presence.user_id);

        const match = await socket.joinMatch(null, matched.token);
        matchId = match.match_id;

        setCommand(prev => [...prev, 'Match found! Starting program...']);
        setCommand(prev => [...prev, `ssh game@veritas.${matchedPlayers[1]}.com`]);
        clearCommand();
        showMessage("welcomeGameMessage");
        pathChange('game@veritas:~$');

        // 시스템 초기화
        initializeSystem();
        
        // 바이러스 로드 및 시뮬레이션
        await VirusSystem.loadRandomVirus();
        await simulateVirusBehavior();

        setIsDisabled(false);

        socket.onmatchdata = (matchData) => {
            console.log("Match data received:", matchData);
        }
    }
}
  
  // 시스템 초기화 함수
  const initializeSystem = () => {
    // 파일 시스템 초기화
    FileSystem.goRoot();
    FileSystem.MakeDirectory("home");
    FileSystem.StepInto("home");
    FileSystem.MakeDirectory("user");
    FileSystem.StepInto("user");
    FileSystem.MakeDirectory("documents");
    FileSystem.MakeDirectory("downloads");
    FileSystem.make("user_data.txt", "Important user data");
    FileSystem.make("config.ini", "System configuration");
  
    // 네트워크 초기화
    Network.addRandomPackets(10, true); // 정상적인 네트워크 트래픽
  
    // 사용자 초기화
    Users.createUser("admin", "administrators", "root");
    Users.createUser("user", "users", "standard");
    
    // 시스템 사용량 초기화
    System.usePercent(30); // 기본 시스템 사용량
  };
  
  // 바이러스 시뮬레이션 함수 수정
  const simulateVirusBehavior = async () => {
    try {
      await VirusSystem.loadRandomVirus();
      const virus = VirusSystem.virus;
      
      // 시스템 과부하 시뮬레이션
      if (virus["system-overload"]) {
        const usage = Math.floor(Math.random() * 5 + 6) * 10; // 60%~100%
        System.usePercent(usage);
        setCommand(prev => [...prev, `Warning: High CPU usage detected: ${usage}%`]);
        // 과부하로 인한 임시 파일 생성
        FileSystem.make("temp" + Date.now() + ".tmp", "System overflow data");
      }
  
      // 네트워크 과부하 시뮬레이션
      if (virus["network-overload"]) {
        Network.addRandomPackets(30, false);
        setCommand(prev => [...prev, "Warning: Unusual network activity detected"]);
        // 의심스러운 네트워크 로그 파일 생성
        FileSystem.make("network.log", "Suspicious network activity detected");
      }
  
      // 사용자 수정 시뮬레이션
      if (virus["user-modification"]) {
        Users.createUser("malicious_user", "administrators", "root");
        Users.updateUser("user", { authority: "restricted" });
        setCommand(prev => [...prev, "New user account created: malicious_user"]);
        FileSystem.make("user.log", "User permission changes detected");
      }
  
      // 이벤트 로그 수정 시뮬레이션
      if (virus["event-log-modification"]) {
        Network.addPacket("127.0.0.1", "unknown", "Event log cleared");
        FileSystem.make("system.log", "Modified system logs");
        FileSystem.make("audit.log", "Cleared audit trails");
        setCommand(prev => [...prev, "System logs have been modified"]);
      }
  
      // 바이러스 활성화 시뮬레이션
      if (virus["virus-activation"]) {
        FileSystem.MakeDirectory("hidden");
        FileSystem.StepInto("hidden");
        FileSystem.make("virus.exe", "Malicious content");
        FileSystem.make("payload.dat", "Encrypted malware payload");
        FileSystem.StepOut();
        setCommand(prev => [...prev, "Unknown process started: virus.exe"]);
      }
  
      // 관리자 권한 상승 시뮬레이션
      if (virus["admin-privilege-escalation"]) {
        Users.updateUser("malicious_user", { authority: "system" });
        FileSystem.make("sudo.log", "Privilege escalation detected");
        System.usePercent(45); // 권한 상승으로 인한 시스템 부하 증가
        setCommand(prev => [...prev, "Warning: Unauthorized privilege escalation detected"]);
      }
  
      // 파일 수정 시뮬레이션
      if (virus["file-modification"]) {
        FileSystem.MakeDirectory("encrypted");
        FileSystem.StepInto("encrypted");
        const files = ["doc1.txt", "doc2.txt", "data.db"];
        files.forEach(file => {
          FileSystem.make(file + ".encrypted", "Ransomware encrypted content");
        });
        FileSystem.StepOut();
        FileSystem.make("ransom_note.txt", "Your files have been encrypted");
        setCommand(prev => [...prev, "Multiple files have been encrypted"]);
      }
  
    } catch (error) {
      console.error("Error in virus simulation:", error);
    }
  };

  return (
    <>
      <div className='wrapMonitor'>
        <div className='monitor'>
          <div className='terminal' ref={terminalRef}>
            {command.map((item, index) => (
              <div key={index} className='command-line'>
                {item.startsWith('game@') ? (
                  <span>{item}</span>
                ) : (
                  <span className='system-message'>{item}</span>
                )}
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