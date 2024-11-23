export class SystemUsage {
    private usage: number = 0;
  
    constructor() {}
  
    public usePercent(percentage: number): number {
      if (percentage >= 10 && percentage <= 100 && percentage % 10 === 0) {
        this.usage = percentage;
      } else {
        throw new Error("올바른 값을 입력하세요 (10% 단위, 10% ~ 100%)");
      }
      return this.usage;
    }
  
    public getUsage(): number {
      return this.usage;
    }
}
