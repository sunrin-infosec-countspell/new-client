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

  //let matchId = "";

  const [client] = useState<Client>(new Client(serverKey, serverAddr));
  const [socket] = useState<NakamaSocket>(client.createSocket());
  const [Network] = useState<NetworkSystem>(new NetworkSystem());
  const [FileSystem] = useState<GameFileSystem>(new GameFileSystem());
  const [SystemStat] = useState<SystemUsage>(new SystemUsage());
  const [Users] = useState<UserManager>(new UserManager());
  const [VirusSystem] = useState<Answer>(new Answer()); 
  
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isDisabled, setIsDisabled] = useState<boolean>(false);
  const [isMatched, setIsMatched] = useState<boolean>(false);
  const [userHP, setUserHP] = useState<number>(100);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [matchId, setMatchId] = useState<string>("");
  const [totalDamage, setTotalDamage] = useState<number>(0);
  const maxHP = 100;


  const [command, setCommand] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('game@server:~$');
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userHP <= 0) {
      setCommand((prev) => [...prev, 'Your HP has dropped to 0. Game Over.']);
      setIsMatched(false);
      showMessage('PanicMessage');
      sendMatchState('victory');
      setUserHP(100); // Reset HP
      clearCommand()
      pathChange('game@server:~$');
      setTotalDamage(0); // Reset damage
    }
  }, [userHP]);

  // HP 감소 로직 수정
  useEffect(() => {
    let hpTimer: NodeJS.Timeout;

    if (isMatched) {
      hpTimer = setInterval(() => {
        const newDamage = calculateHPDecay(elapsedTime);
        setUserHP(prev => {
          const newHP = Math.max(0, prev - newDamage);
          return Number(newHP.toFixed(1)); // 소수점 한자리까지만 표시
        });
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(hpTimer);
      setElapsedTime(0);
      setTotalDamage(0);
      setUserHP(100);
    }

    return () => clearInterval(hpTimer);
  }, [isMatched]);

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

  useEffect(() => {
    if (elapsedTime > 0) {
      const hpDecay = calculateHPDecay(elapsedTime);
      setTotalDamage(prevDamage => prevDamage + hpDecay);
    }
  }, [elapsedTime]);
  
  const calculateHPDecay = (time: number): number => {
    const totalDuration = 900; // 15분 = 900초
    const k = 2; // 감소 속도 조절 지수
  
    const t = time >= totalDuration ? totalDuration : time;
    const decay = maxHP * (Math.pow(t / totalDuration, k) - Math.pow((t - 1) / totalDuration, k));
  
    return decay;
  };
  
  const resetGameState = () => {
    setUserHP(100);
    setTotalDamage(0);
    setElapsedTime(0);
    setIsMatched(false);
  };

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

  const applyDamage = (damage: number) => {
    setUserHP(prev => {
      const newHP = Math.max(0, prev - damage);
      return Number(newHP.toFixed(1));
    });
  };

  const pathChange = (path: string) => {
    setCurrentPath(path);
  }

  const clearCommand = () => {
    setCommand([]);
  }

  const sendMatchState = (gameState: string) => {
    const opCode = 1;
    const data = { "gameState": gameState };
    const encodedData = new TextEncoder().encode(JSON.stringify(data));
    socket.sendMatchState(matchId, opCode, encodedData);
    console.log("Match data sent:", data);
  };

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
                  if (line.includes('<dir>')) {
                      const styledLine = line.replace(
                          /<dir>(.*?)<\/dir>/g, 
                          (_, name) => name 
                      );
                      setCommand(prev => [...prev, styledLine]);
                  } else {
                      setCommand(prev => [...prev, line]);
                  }
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
          setCommand(prev => [...prev, `System CPU Usage: ${SystemStat.getUsage()}%`]);
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
          const currentVirus = VirusSystem.getCurrentVirusType();
          console.log("Checking virus name:", args[0], "against:", currentVirus);
          
          if (!currentVirus) {
            setCommand(prev => [...prev, 'Error: No virus type is currently set']);
            break;
          }
          
          if (VirusSystem.checkVirusName(args[0])) {
            setCommand(prev => [...prev, 'Correct! You have identified the virus.']);
            sendMatchState('defeat');
            showMessage('winMessage');
            resetGameState();
          } else {
            applyDamage(40);
            setCommand(prev => [...prev, 'Incorrect virus identification. Try again.']);
            setIsDisabled(true);
            showMessage('panicMessage');
            setIsDisabled(false);
          } 
          break;
        case "clear":
          clearCommand();
          break;
        case "virus":
          showMessage('virusType');
          break;
        case "help":
          showMessage('gameHelpMessage');
          break;
        case "exit":
          matchExit();
          break;
        case "health":
          setCommand(prev => [...prev, `Player HP: ${Math.floor(userHP)}`]);
          break;
        case 'cat':
          if (args.length === 0) {
              setCommand(prev => [...prev, 'Usage: cat <filename>']);
              break;
          }
          const fileContent = FileSystem.FileData(args[0]);
          if (fileContent !== null) {
              fileContent.split('\n').forEach(line => {
                  setCommand(prev => [...prev, line]);
              });
          } else {
              setCommand(prev => [...prev, `cat: ${args[0]}: No such file or directory`]);
          }
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

  // Match 데이터 처리 함수를 분리하고 에러 처리 강화
const handleMatchData = (matchData: any) => {
  console.log("Match data received:", matchData);
  try {
    const decoder = new TextDecoder();
    const data = JSON.parse(decoder.decode(matchData.data));
    console.log("Decoded match data:", data);

    switch (data.gameState) {
      case 'victory':
        setCommand(prev => [...prev, 'Congratulations! You have won the game.']);
        setIsDisabled(true);
        showMessage('winMessage');
        clearCommand();
        setIsMatched(false);
        pathChange('game@server:~$');
        resetGameState();
        break;
      case 'defeat':
        setCommand(prev => [...prev, 'You have been defeated.']);
        setIsDisabled(true);
        showMessage('panicMessage');
        clearCommand();
        setIsDisabled(false);
        pathChange('game@server:~$');
        resetGameState();
        break;
      default:
        console.warn("Unknown game state received:", data.gameState);
    }
  } catch (error) {
    console.error("Error processing match data:", error);
  }
};

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

    // 새로운 matchmaker listener 설정
    socket.onmatchmakermatched = async (matched) => {
      try {
        console.log("Matchmaker matched:", matched);
        setIsMatched(true);
        const matchedPlayers = matched.users.map(user => user.presence.user_id);

        const match = await socket.joinMatch(null, matched.token);
        setMatchId(match.match_id);
        console.log("Match joined:", matchId);
        
        // Match data listener 설정
        socket.onmatchdata = handleMatchData;

        setCommand(prev => [...prev, 'Match found! Starting program...']);
        setCommand(prev => [...prev, `ssh game@veritas.${matchedPlayers[1]}.com`]);
        clearCommand();
        showMessage("welcomeGameMessage");
        pathChange('game@veritas:~$');

        // 시스템 초기화
        initializeSystem();
        
        // 바이러스 로드 및 시뮬레이션
        const virusResult = await VirusSystem.loadRandomVirus();
        if (!virusResult.success || !virusResult.virusType) {
          throw new Error('Failed to load virus');
        }

        await simulateVirusBehavior();
        setIsDisabled(false);

      } catch (error) {
        console.error("Error in match setup:", error);
        setCommand(prev => [...prev, 'Error initializing game. Please try again.']);
        setIsMatched(false);
        setIsDisabled(false);
      }
    };

    socket.addMatchmaker(matchMakerQuery, minCount, maxCount);
  };
  
  // 시스템 초기화 함수
  const initializeSystem = () => {
    // 루트 디렉토리로 이동
    FileSystem.goRoot();

    // 기본 시스템 디렉토리 구조
    FileSystem.MakeDirectory("etc");
    FileSystem.MakeDirectory("var");
    FileSystem.MakeDirectory("usr");
    FileSystem.MakeDirectory("home");

    // /etc 디렉토리 설정
    FileSystem.StepInto("etc");
    FileSystem.make("passwd", "root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000:user:/home/user:/bin/bash");
    FileSystem.make("shadow", "root:$6$xyz....:18888:0:99999:7:::\nuser:$6$abc....:18888:0:99999:7:::");
    FileSystem.make("hostname", "veritas-system");
    FileSystem.make("hosts", "127.0.0.1 localhost\n192.168.1.1 gateway");
    FileSystem.StepOut();

    // /var 디렉토리 설정
    FileSystem.StepInto("var");
    FileSystem.MakeDirectory("log");
    FileSystem.StepInto("log");
    FileSystem.make("syslog", "System startup completed\nServices initialized\nNetwork connectivity established");
    FileSystem.make("auth.log", "Session opened for user admin\nSuccessful sudo command\nSSH login accepted");
    FileSystem.make("kern.log", "Kernel: CPU0 initialized\nKernel: Memory management started\nKernel: Network interfaces detected");
    FileSystem.make("cron.log", "Daily update triggered\nSystem maintenance scheduled\nBackup process started");
    FileSystem.StepOut();
    FileSystem.StepOut();

    // /home 디렉토리 설정
    FileSystem.StepInto("home");
    FileSystem.MakeDirectory("user");
    FileSystem.StepInto("user");
    
    // 사용자 디렉토리 구조
    const userDirs = ["Documents", "Downloads", "Pictures", "Videos", "Desktop"];
    userDirs.forEach(dir => FileSystem.MakeDirectory(dir));

    // 기본 사용자 파일들
    FileSystem.make(".bashrc", "export PATH=$PATH:/usr/local/bin\nalias ll='ls -la'\nalias update='apt update'");
    FileSystem.make(".bash_history", "ls -la\ncd Documents\ncat config.txt\nsudo apt update");
    FileSystem.make("user_config.ini", "[Settings]\ntheme=dark\nlanguage=en\nnotifications=true");

    // 문서 디렉토리 설정
    FileSystem.StepInto("Documents");
    FileSystem.make("notes.txt", "Meeting notes from last week\nProject deadlines\nImportant contacts");
    FileSystem.make("config.conf", "# System Configuration\nport=8080\nhost=localhost\ndebug=false");
    FileSystem.StepOut();

    // 다운로드 디렉토리 설정
    FileSystem.StepInto("Downloads");
    FileSystem.make("downloaded_file.zip", "Binary content...");
    FileSystem.make("install.sh", "#!/bin/bash\necho 'Installing...'\napt install package");
    FileSystem.StepOut();

    // 초기 위치로 복귀
    FileSystem.goRoot();
    FileSystem.StepInto("home");
    FileSystem.StepInto("user");

    // 네트워크 초기화 - 정상 트래픽 생성
    Network.addRandomPackets(15, true);

    // 사용자 계정 초기화
    Users.createUser("root", "administrators", "root");
    Users.createUser("admin", "administrators", "admin");
    Users.createUser("user", "users", "standard");
    
    // 시스템 사용량 초기 설정
    SystemStat.usePercent(25); // 기본 시스템 사용량
};
  
  // 바이러스 시뮬레이션 함수 수정
const simulateVirusBehavior = async () => {
  try {
      const virusProps = VirusSystem.getVirusProperties();
      
      // 시스템 과부하 시뮬레이션
      if (virusProps["system-overload"]) {
          const usage = Math.round((Math.floor(Math.random() * 3 + 8) * 10)/10)*10; // 80-100%의 10의 배수
          SystemStat.usePercent(usage);
          setCommand(prev => [...prev, `Warning: High CPU usage detected: ${usage}%`]);
          FileSystem.make("high_cpu.log", `Process using excessive CPU: pid=${Math.floor(Math.random() * 10000)}`);
      }

      // 네트워크 과부하 시뮬레이션
      if (virusProps["network-overload"]) {
          Network.addRandomPackets(50, false);
          FileSystem.make("network_traffic.log", "Unusual outbound connections detected\nHigh bandwidth usage on port 445\nMultiple connection attempts to unknown hosts");
      }

      // 이벤트 로그 수정 시뮬레이션
      if (virusProps["event-log-modification"]) {
          FileSystem.StepInto("var");
          FileSystem.StepInto("log");
          // 기존 로그 파일 변조
          FileSystem.edit("auth.log", "log cleared for security purposes");
          FileSystem.edit("syslog", "system maintenance completed");
          // 의심스러운 새 로그 파일
          FileSystem.make("unusual_activity.log", "System maintenance\nScheduled backup\nRoutine cleanup");
          FileSystem.StepOut();
          FileSystem.StepOut();
      }

      // 바이러스 활성화 시뮬레이션
      if (virusProps["virus-activation"]) {
          FileSystem.MakeDirectory(".hidden");
          FileSystem.StepInto(".hidden");
          FileSystem.make("virus.exe", "MZ\x90\x00\x03\x00...");
          FileSystem.make("config.dat", FileSystem.genHex(100));
          FileSystem.StepOut();
          // 의심스러운 프로세스 흔적
          FileSystem.make("strange_process.pid", "12345");
      }

      // 관리자 권한 상승 시뮬레이션
      if (virusProps["admin-privilege-escalation"]) {
          Users.createUser("backdoor", "administrators", "root");
          FileSystem.StepInto("etc");
          FileSystem.edit("passwd", FileSystem.FileData("passwd") + "\nbackdoor:x:0:0::/home/backdoor:/bin/bash");
          FileSystem.edit("shadow", FileSystem.FileData("shadow") + "\nbackdoor:$6$hacked....:18888:0:99999:7:::");
          FileSystem.StepOut();
      }

      // 파일 수정 시뮬레이션
      if (virusProps["file-modification"]) {
          // 재귀적 파일 암호화 시뮬레이션
          FileSystem.StepInto("home");
          FileSystem.StepInto("user");
          FileSystem.mutateFile();
          FileSystem.make("READ_ME.txt", "Your files have been encrypted. Send 1 BTC to address: 1A1zP1...");
      }
      
      // 원래 위치로 복귀
      FileSystem.goRoot();
      FileSystem.StepInto("home");
      FileSystem.StepInto("user");

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
                ) : item.includes('[D]') ? (
                  <span>
                    {item.split('[D]').map((part, i) => {
                      if (i === 0) return <span key={`part-${i}`}>{part}</span>;
                      return (
                          <span key={`part-${i}`}>
                              <span style={{ color: '#3498db', fontWeight: 'bold' }}>{part}</span>
                          </span>
                      );
                  })}
                  </span>
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
              placeholder={isDisabled ? "waiting system..." : "Enter command... /help for help"}  
              style={{ cursor: isDisabled ? 'not-allowed' : 'text' }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default App