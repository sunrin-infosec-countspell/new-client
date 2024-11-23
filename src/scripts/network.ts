import { format } from 'date-fns';

interface Packet {
    timestamp: string;
    source_ip: string;
    destination_ip: string;
    content: string;
}

class NetworkSystem {
    private packets: Packet[] = [];

    constructor(private dummyData: string[]) {}

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
    public addRandomPacket(): void {
        const packet: Packet = {
            timestamp: this.getTime(),
            source_ip: `192.168.1.${this.getRandomIndex(255) + 1}`, // 랜덤 IP 생성
            destination_ip: `192.168.1.${this.getRandomIndex(255) + 1}`,
            content: this.dummyData[this.getRandomIndex(this.dummyData.length)] // 무작위 dummy 데이터
        };

        this.packets.push(packet);
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
    public getPackets(): string[] {
        return this.packets.map(packet => 
            `[${packet.timestamp}] ${packet.source_ip} -> ${packet.destination_ip}: ${packet.content}`
        );
    }
}

// Dummy 데이터 배열
const dummyData: string[] = [
    "User login attempt",
    "File upload successful",
    "Error: Connection timeout",
    "New device connected",
    "Packet loss detected",
    "Firewall rule updated",
    "DNS query for example.com",
    "Malicious traffic blocked",
    "Authentication failed",
    "System reboot scheduled"
];

// 네트워크 시스템 인스턴스 생성
const networkSystem = new NetworkSystem(dummyData);

// 5개의 랜덤 패킷 추가
for (let i = 0; i < 5; i++) {
    networkSystem.addRandomPacket();
}