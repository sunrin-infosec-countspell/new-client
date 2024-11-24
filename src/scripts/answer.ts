interface Virus {
    "system-overload": boolean,
    "network-overload": boolean,
    "user-modification": boolean,
    "event-log-modification": boolean,
    "virus-activation": boolean,
    "admin-privilege-escalation": boolean,
    "file-modification": boolean
}

enum VirusType {
    Virus = 'virus',
    Worm = 'worm',
    Trojan = 'trojan',
    Ransomware = 'ransomware',
    Spyware = 'spyware',
    Rootkit = 'rootkit',
    Botnet = 'botnet'
}

interface VirusTypes {
    [key: string]: Virus;
}

export class Answer {
    private virus: Virus = {
        "system-overload": false,
        "network-overload": false,
        "user-modification": false,
        "event-log-modification": false,
        "virus-activation": false,
        "admin-privilege-escalation": false,
        "file-modification": false
    }

    private virusType: VirusType | null = null;
    
    constructor() {}

    public async loadRandomVirus(): Promise<{success: boolean, virusType?: VirusType, error?: string}> {
        try {
            const response = await fetch('/virusTypes/virus.json');
            if (!response.ok) throw new Error('Failed to load virus data');
            
            const virusTypes: VirusTypes = await response.json();
            
            if (!virusTypes || typeof virusTypes !== 'object') {
                throw new Error('Invalid virus data format');
            }

            // enum 값들의 배열 생성
            const availableTypes = Object.values(VirusType);
            const validTypes = availableTypes.filter(type => 
                type in virusTypes
            );

            if (validTypes.length === 0) {
                throw new Error('No valid virus types found');
            }

            // 시간 값을 포함하여 랜덤하게 바이러스 타입 선택
            const now = new Date().getTime();
            const randomIndex = Math.floor((Math.random() * now) % validTypes.length);           
            const selectedType = validTypes[randomIndex] as VirusType;
            
            // 선택된 바이러스 데이터 저장
            this.virusType = selectedType;
            this.virus = { ...virusTypes[selectedType] };

            console.log('Selected virus:', {
                type: selectedType,
                properties: this.virus
            });

            return {
                success: true,
                virusType: selectedType
            };
            
        } catch (error) {
            console.error('Error in loadRandomVirus:', error);
            this.virusType = null;
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    public async loadSpecificVirus(virusType: VirusType): Promise<{success: boolean, error?: string}> {
        try {
            const response = await fetch('/virusTypes/virus.json');
            if (!response.ok) throw new Error('Failed to load virus data');
            
            const virusTypes: VirusTypes = await response.json();
            
            if (virusType in virusTypes) {
                this.virus = { ...virusTypes[virusType] };
                this.virusType = virusType;
                console.log(`Loaded virus type: ${virusType}`);
                return { success: true };
            } else {
                throw new Error(`Virus type ${virusType} not found`);
            }
            
        } catch (error) {
            console.error('Error loading specific virus type:', error);
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    public checkVirusName(userGuess: string): boolean {
        if (!this.virusType) return false;

        const normalizedGuess = userGuess.toLowerCase();
        const currentVirus = this.virusType.toLowerCase();

        console.log(`Comparing: "${currentVirus}" with "${normalizedGuess}"`);
        const result = currentVirus === normalizedGuess;
        console.log(`Match result: ${result}`);
        
        return result;
    }

    public getCurrentVirusType(): VirusType | null {
        return this.virusType;
    }

    public getVirusProperties(): Virus {
        return { ...this.virus };
    }
}