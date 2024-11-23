interface User {
    name: string;
    group: string;
    authority: string;
  }
  
  class UserManager {
    private users: User[] = [];
    private log: string[][] = [];
  
    // 사용자 생성
    public createUser(name: string, group: string, authority: string): void {
      const newUser: User = { name, group, authority };
      this.users.push(newUser);
      this.log.push([newUser.name, newUser.group, newUser.authority]);
    }
  
    // 사용자 읽기
    public readUser(name: string): User | undefined {
      const user = this.users.find(user => user.name === name);
      if (user) {
        this.log.push([user.name, user.group, user.authority]);
      } else {
        this.log.push([`User not found: ${name}`]);
      }
      return user;
    }
  
    // 모든 사용자 읽기
    public readAllUsers(): User[] {
      this.users.forEach(user => {
        this.log.push([user.name, user.group, user.authority]);
      });
      return this.users;
    }
  
    // 사용자 업데이트
    public updateUser(name: string, updatedInfo: Partial<User>): void {
      const user = this.users.find(user => user.name === name);
      if (user) {
        Object.assign(user, updatedInfo);
        this.log.push([user.name, user.group, user.authority]);
      } else {
        this.log.push([`User not found: ${name}`]);
      }
    }
  
    // 사용자 삭제
    public deleteUser(name: string): void {
      const index = this.users.findIndex(user => user.name === name);
      if (index !== -1) {
        const deletedUser = this.users.splice(index, 1);
        this.log.push([deletedUser[0].name, deletedUser[0].group, deletedUser[0].authority]);
      } else {
        this.log.push([`User not found: ${name}`]);
      }
    }
  
    // 로그 반환
    public getLog(): string[][] {
      return this.log;
    }
  }
  
  const userManager = new UserManager();
  
  // 사용자 생성
  userManager.createUser("Alice", "Admin", "rwx");
  userManager.createUser("Bob", "User", "r-x");
  
  // 사용자 읽기
  userManager.readUser("Alice");
  userManager.readAllUsers();
  
  // 사용자 업데이트
  userManager.updateUser("Alice", { group: "SuperAdmin" });
  
  // 사용자 삭제
  userManager.deleteUser("Bob");
  userManager.readAllUsers();
  
  // 로그 출력
  console.log(userManager.getLog());