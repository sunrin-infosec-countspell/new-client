interface Virus {
    "system-overload": boolean,
    "network-overload": boolean,
    "user-modification": boolean,
    "event-log-modification": boolean,
    "virus-activation": boolean,
    "admin-privilege-escalation": boolean,
    "file-modification": boolean
}

interface VirusTypes {
    virus: Virus,
    warm: Virus,
    trojan: Virus,
    ransomware: Virus,
    spyware: Virus,
    rootkit: Virus,
    botnet: Virus
}

export class Answer {
    virus: Virus = {
        "system-overload": false,
        "network-overload": false,
        "user-modification": false,
        "event-log-modification": false,
        "virus-activation": false,
        "admin-privilege-escalation": false,
        "file-modification": false
    }

    virusName: string = '';

    constructor() {
        this.loadRandomVirus();
    }

    private async loadRandomVirus() {
        try {
            const response = await fetch('/virusTypes/virus.json');
            if (!response.ok) throw new Error('Failed to load virus data');
            
            const virusTypes: VirusTypes = await response.json();
            
            // 바이러스 타입들의 키 배열 생성
            const virusKeys = Object.keys(virusTypes) as (keyof VirusTypes)[];
            
            // 랜덤하게 바이러스 타입 선택
            const randomIndex = Math.floor(Math.random() * virusKeys.length);
            const selectedVirusType = virusKeys[randomIndex];
            
            // 선택된 바이러스 데이터 저장
            this.virus = virusTypes[selectedVirusType];
            this.virusName = selectedVirusType;
            
            console.log(`Loaded virus type: ${selectedVirusType}`);
            
        } catch (error) {
            console.error('Error loading virus type:', error);
        }
    }

    // 비동기 초기화를 위한 정적 팩토리 메서드
    public static async createWithVirus(): Promise<Answer> {
        const answer = new Answer();
        await answer.loadRandomVirus();
        return answer;
    }

    // 특정 바이러스 타입 로드
    public async loadSpecificVirus(virusType: keyof VirusTypes) {
        try {
            const response = await fetch('/virusTypes/virus.json');
            if (!response.ok) throw new Error('Failed to load virus data');
            
            const virusTypes: VirusTypes = await response.json();
            
            if (virusTypes[virusType]) {
                this.virus = virusTypes[virusType];
                this.virusName = virusType;
                console.log(`Loaded specific virus type: ${virusType}`);
            } else {
                throw new Error(`Virus type ${virusType} not found`);
            }
            
        } catch (error) {
            console.error('Error loading specific virus type:', error);
        }
    }
}