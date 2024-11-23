class SystemUsage {
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
  
  const systemUsage = new SystemUsage();
  
  console.log(systemUsage.usePercent(10));  // 10
  console.log(systemUsage.usePercent(20));  // 20
  console.log(systemUsage.usePercent(30));  // 30
  console.log(systemUsage.usePercent(40));  // 40
  console.log(systemUsage.usePercent(50));  // 50
  console.log(systemUsage.usePercent(60));  // 60
  console.log(systemUsage.usePercent(70));  // 70
  console.log(systemUsage.usePercent(80));  // 80
  console.log(systemUsage.usePercent(90));  // 90
  console.log(systemUsage.usePercent(100)); // 100