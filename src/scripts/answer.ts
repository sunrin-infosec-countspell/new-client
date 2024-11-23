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
    
    // 생성자에서 자동 로드 제거
    constructor() {}

    public async loadRandomVirus() {
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
            const selectedVirus = virusTypes[selectedVirusType];
            if (selectedVirus) {
                this.virus = { ...selectedVirus }; // 깊은 복사로 데이터 저장
                this.virusName = selectedVirusType.toString(); // 문자열로 명시적 변환
                console.log(`Selected virus type: ${this.virusName}`);
                console.log('Virus properties:', this.virus);
            } else {
                throw new Error('Selected virus type not found in data');
            }
            
        } catch (error) {
            console.error('Error loading virus type:', error);
            // 기본값 설정
            this.virusName = '';
            this.virus = {
                "system-overload": false,
                "network-overload": false,
                "user-modification": false,
                "event-log-modification": false,
                "virus-activation": false,
                "admin-privilege-escalation": false,
                "file-modification": false
            };
        }
    }

    public async loadSpecificVirus(virusType: keyof VirusTypes) {
        try {
            const response = await fetch('/virusTypes/virus.json');
            if (!response.ok) throw new Error('Failed to load virus data');
            
            const virusTypes: VirusTypes = await response.json();
            
            const selectedVirus = virusTypes[virusType];
            if (selectedVirus) {
                this.virus = { ...selectedVirus }; // 깊은 복사로 데이터 저장
                this.virusName = virusType.toString(); // 문자열로 명시적 변환
                console.log(`Loaded specific virus type: ${this.virusName}`);
                console.log('Virus properties:', this.virus);
            } else {
                throw new Error(`Virus type ${virusType} not found`);
            }
            
        } catch (error) {
            console.error('Error loading specific virus type:', error);
            // 에러 시 기본값 유지
        }
    }

    public checkVirusName(userGuess: string): boolean {
        console.log(`Comparing: "${this.virusName}" with "${userGuess}"`);
        const result = this.virusName.toLowerCase() === userGuess.toLowerCase();
        console.log(`Match result: ${result}`);
        return result;
    }

    public getVirusName(): string {
        return this.virusName;
    }

    public getVirusProperties(): Virus {
        return { ...this.virus };
    }
}