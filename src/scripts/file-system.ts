import * as path from 'path'
export interface FileNode
{
    parent: DirectoryNode;
    data : string;
    name : string;
    id: string;
}
export interface DirectoryNode
{
    parent: DirectoryNode|null;
    child : (DirectoryNode|FileNode)[];
    name : string;
    id: string;
}


export class GameFileSystem
{
    private root_node:DirectoryNode
    private current_node:DirectoryNode
    constructor(
    ){
        this.root_node = {parent:null, child:[], name:'/', id:"Directory"};
        this.current_node = this.root_node
    }
    public goRoot():void
    {
        this.current_node = this.root_node;
        return;
    }
    public ListDirectory(): string {
        let output = "";
        
        this.current_node.child.forEach(item => {
            const isDirectory = item.id === "Directory";
            const permissions = isDirectory ? "drwxr-xr-x" : "-rw-r--r--";
            const owner = "user";
            const group = "user";
            const size = isDirectory ? 4096 : 
                'data' in item ? item.data.length : 0;
            
            const date = new Date().toLocaleString('en-us', {
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }).replace(',', '');
    
            // 디렉토리 표시를 위한 간단한 마커 사용
            const displayName = isDirectory ? `[D]${item.name}` : item.name;
            
            output += `${permissions} 1 ${owner} ${group} ${size.toString().padStart(5)} ${date} ${displayName}\n`;
        });
        
        return output;
    }
    
    public StepInto(dst:string):string
    {
        let target:string=this.extractMeaningfulName(dst)
        for(let node of this.current_node.child)
        {
            if(node.name===target)
            {
                if(node.id==='Directory')
                {
                    this.current_node=(node as DirectoryNode);
                    return this.current_node;
                }
                else
                {
                    console.log(`${target} is not directory`)
                    return this.current_node;
                }

            }
        }
        console.log(`can't found ${target}`);
        return false;
    }
    public StepOut():string
    {
        if(this.current_node.parent!==null)
        {
            this.current_node=this.current_node.parent;   
        }
        return this.current_node;
    }
    public DeleteNode(name:string):void
    {
        this.current_node.child = this.current_node.child.filter(item => item.name!== name);
        return;
    }
    public FileData(name:string):string|null
    {
        for(let node of this.current_node.child)
        {
            if(node.name===name)
            {
                if(node.id==='File')
                {
                    return (node as FileNode).data;
                }
                else if(node.id==='Directory')
                {
                    return null;
                }
                else
                {
                    return null;
                }
            }
        }
        return null;
    }
    public MakeFile(name:string, data:string):void
    {
        let curr_directory:DirectoryNode = this.current_node
        curr_directory.child.push({parent:this.current_node, data:data, name:name, id:"File"})
        return;
    }
    public MakeDirectory(name:string):void
    {
        let curr_directory = this.current_node;
        curr_directory.child.push({parent:this.current_node, child:[], name:name, id:"Directory"})
        return;
    }
    public CurrentDirectory():string 
    {
        let parts: string[] = [];
        let iterate_node: DirectoryNode | null = this.current_node;
        while (iterate_node && iterate_node.parent) 
        {
            parts.unshift(iterate_node.name);
            iterate_node = iterate_node.parent;
        }
        return '/' + parts.join('/');
    }
    public ls():void
    {
        for(let x of JSON.parse(this.ListDirectory()))
        {
            console.log(x.name,':', x.id);
        }
        return
    }
    public pwd():void
    {
        console.log(this.CurrentDirectory());
    }
    public extractMeaningfulName(pathString: string): string 
    {
    const parts = pathString.split('/');
    const meaningfulNames: string[] = [];
    for (const part of parts) 
    {
        if (part === '' || part === '.' || part === '..') 
        {
        continue;
        }
        let processedPart = part.replace(/^(\.+)/, '').replace(/(\.+)$/, '');
        if (processedPart.length > 0) 
        {
        meaningfulNames.push(processedPart);
        }
    }
    if (meaningfulNames.length > 0)
    {
        return meaningfulNames[0];
    } 
    else 
    {
        return '';
    }
    }
    public mkdir(path:string):boolean
    {
        let target:string=this.extractMeaningfulName(path)
        for(let i of this.current_node.child)
        {
            if(i.name===target)
            {
                console.log(`${target} is already exists`)
                return false;
            }
        }
        this.MakeDirectory(this.extractMeaningfulName(path));
        return true;
    }
    public rmdir(path:string):boolean
    {
        let target:string=this.extractMeaningfulName(path)
        for(let i of this.current_node.child)
        {
            if(i.name===target)
            {
                if(i.id==='File')
                {
                    console.log(`${target} is not directory`);
                    return false;
                }
                else
                {
                    this.DeleteNode(target);
                    return true;
                }   
            }
        }
        console.log(`${target} is not found`);
        return false
    }
    public rm(path:string):boolean
    {
        let target:string=this.extractMeaningfulName(path)
        for(let i of this.current_node.child)
        {
            if(i.name===target)
            {
                if(i.id==='Directory')
                {
                    console.log(`${target} is not file`);
                    return false;
                }
                else
                {
                    this.DeleteNode(target);
                    return true;
                }   
            }
        }
        console.log(`${target} is not found`);
        return false
    }
    public make(path:string, data:string):boolean
    {
        let target:string=this.extractMeaningfulName(path)
        for(let i of this.current_node.child)
        {
            if(i.name===target)
            {
                console.log(`${target} is already exists`)
                return false;
            }
        }
        this.MakeFile(target, data);
        return true;
    }
    public edit(path:string, data:string):boolean
    {
        let target:string=this.extractMeaningfulName(path)
        for(let i of this.current_node.child)
        {
            if(i.name===target)
            {
                if(i.id==='File')
                {
                    (i as FileNode).data = data;
                    return true
                }
                else
                {
                    console.log(`${target} is not file`)
                    return false
                }
            }
        }
        console.log(`can't found ${target}`)
        return false
    }
    public cat(path:string):boolean
    {
        let file:FileNode;
        let count:number;
        let buffer:string="";
        let target:string=this.extractMeaningfulName(path)
        for(let i of this.current_node.child)
        {
            if(i.name===target)
            {
                if(i.id==='File')
                {
                    count=0;
                    file = (i as FileNode);
                    for(let j=0; j<file.data.length; j++)
                    {
                        buffer+=file.data[j];
                        count+=1;
                        if(count%50==0)
                        {
                            count=0;
                            buffer+='\n'
                        }
                    }
                    console.log(buffer);
                    return true
                }
                else
                {
                    console.log(`${target} is not file`)
                    return false
                }
            }
        }
        console.log(`can't found ${target}`)
        return false
    }

    public edit_name(path:string, name:string):boolean
    {
        let target:string=this.extractMeaningfulName(path)
        for(let i of this.current_node.child)
        {
            if(i.name===target)
            {
                i.name=name
                return true
            }
        }
        console.log(`can't found ${target}`)
        return false
    }
    private generateHexString(length: number): string {
        const hexChars = '0123456789abcdef';
        let result = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * hexChars.length);
            result += hexChars[randomIndex];
        }
        return result;
    }

    // function 키워드 제거
    private Probability(probability: number): boolean {
        const randomNumber = Math.random();
        if (randomNumber < probability) {
            return true;
        } else {
            return false;
        }
    }

    // function 키워드 제거
    public genHex(length: number): string {
        const hexChars = '0123456789abcdef';
        let result = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * hexChars.length);
            result += hexChars[randomIndex];
        }
        return result;
    }

    // function 키워드 제거
    public mutateFile(directory: DirectoryNode = this.current_node): void {
        for (let node of directory.child) {
            if (node.id === 'File') {
                if (this.Probability(0.7)) {
                    const original_file_size = (node as FileNode).data.length;
                    (node as FileNode).data = this.genHex(original_file_size);
                }
            } else if (node.id === 'Directory') {
                if (this.Probability(0.4)) {
                    this.mutateFile(node as DirectoryNode);
                }
            }
        }
    }
}

export function GenMap(fs:GameFileSystem, userName:string):void
{
    fs.MakeDirectory("C");
    fs.StepInto("C");
    fs.MakeDirectory("ProgramFiles")
    fs.MakeDirectory("Windows")
    fs.MakeDirectory("Users");
    fs.StepInto("Users");
    fs.MakeDirectory(userName);
    fs.StepInto(userName);
    fs.MakeDirectory("Downloads")
    fs.MakeDirectory("Documents")
    fs.MakeDirectory("Videos")
    fs.MakeDirectory("Pictures")
    fs.MakeDirectory("Musics")
}
