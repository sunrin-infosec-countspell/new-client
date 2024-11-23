import { format } from 'date-fns';

interface Packet {
    timestamp: string;
    source_ip: string;
    destination_ip: string;
    content: string;
}

export class NetworkSystem {
    private packets: Packet[] = [];

    dummygoodData: string[] = [
        "User login attempt from 172.16.0.100",
        "File upload successful: backup_20241124.zip",
        "Error: Connection timeout on port 8080",
        "New device connected: iPhone_12",
        "Packet loss detected: 2% on eth0",
        "Firewall rule updated: Allow port 443",
        "DNS query for example.com resolved",
        "Malicious traffic blocked from 203.0.113.42",
        "Authentication failed: max retries reached",
        "System reboot scheduled at 03:00 UTC",
        "Backup process completed successfully",
        "SSL certificate renewed: domain.com",
        "Database optimization completed",
        "System update installed: security patch",
        "Network bandwidth usage: 60%",
        "Cache cleared: 2.3GB freed",
        "User session timeout: admin_user",
        "Email server responding normally",
        "Load balancer health check: OK",
        "Memory usage at 45% threshold",
        "Disk cleanup completed: 500MB recovered",
        "Service restart: Apache server",
        "User password updated successfully",
        "HTTPS connection established",
        "Antivirus definitions updated",
        "Backup verification completed",
        "System temperature: 42°C normal",
        "RAM usage optimization complete",
        "Network latency: 15ms average",
        "CPU usage normalized to 30%"
     ];
    
    dummybadData: string[] = [
        "Suspicious port scan detected from 192.168.1.100",
        "Multiple failed SSH login attempts",
        "Unauthorized root access attempt",
        "Buffer overflow attack detected",
        "SQL injection attempt blocked",
        "Unusual outbound data transfer: 2.5GB",
        "Malware signature detected: trojan.win32",
        "Brute force attack on admin panel",
        "Suspicious process accessing system files",
        "DDoS attack pattern identified",
        "Unauthorized encryption activity",
        "Memory manipulation detected",
        "Suspicious registry modifications",
        "Command injection attempt",
        "Unauthorized API access attempt",
        "Backdoor connection detected: port 4444",
        "Cross-site scripting attempt",
        "Ransomware activity suspected",
        "Keylogger behavior detected",
        "Data exfiltration attempt blocked"
    ];

    // 현재 시간을 반환하는 함수
    private getTime(): string {
        const now: Date = new Date();
        return format(now, "yyyy-MM-dd HH:mm:ss.SSS");
    }

    // 랜덤 인덱스를 생성하는 함수
    private getRandomIndex(max: number): number {
        return Math.floor(Math.random() * max);
    }

    // 랜덤 패킷 추가 함수
    public addRandomPacket(isGood: boolean): void {
        const packet: Packet = {
            timestamp: this.getTime(),
            source_ip: `192.168.1.${this.getRandomIndex(255) + 1}`, // 랜덤 IP 생성
            destination_ip: `192.168.1.${this.getRandomIndex(255) + 1}`,
            content: isGood ? this.dummygoodData[this.getRandomIndex(this.dummygoodData.length)] : this.dummybadData[this.getRandomIndex(this.dummybadData.length)] // 무작위 dummy 데이터
        };

        this.packets.push(packet);
    }
    
    public addRandomPackets(count: number, isGood: boolean): void{
        for(let i = 0 ; i <= count ; i++){
            this.addRandomPacket(isGood);
        }
    }

    // 특정 패킷 추가 함수
    public addPacket(source_ip: string, destination_ip: string, content: string): void {
        const packet: Packet = {
            timestamp: this.getTime(),
            source_ip: source_ip,
            destination_ip: destination_ip,
            content: content
        };

        this.packets.push(packet);
    }

    // 패킷들을 문자열 배열로 반환하는 함수
    public getPackets(): string {
        let packets:string = "Timestamp\tSource IP\tDest IP\tContent\n";
        this.packets.map(packet => 
            packets += `[${packet.timestamp}] | ${packet.source_ip} -> ${packet.destination_ip} | ${packet.content}\n`
        );

        return packets
    }

    
}