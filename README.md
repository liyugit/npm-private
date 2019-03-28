## Demo 运行 （命令行模式）

1.根目录 yarn 

2.cd 到 client 目录

3.执行 ‘node ../bin/index.js’,安装依赖包

4.依赖关系为，client目录下package.json寻找依赖，依赖包 a,b; a依赖c的1.0.0版本，b依赖c的1.0.1版本;c依赖d；d又回头依赖a；

5.已经全部下载到了node_modules目录，结构为a，b，c（1.0.0版本）,d平级排开，c(1.0.1)版本在b的node_modules下面，d并没有让a重新安装第二遍


## 不通过npm，下载npm包方案

### 服务端（sever目录）

模拟了一个十分简易的私有仓库

模拟了a，b，c，d 四个模块，4个目录下面有index.json的索引，表示版本，依赖，下载包的地址

模块c的index.json 

```
{
    "versions":{
        "1.0.0":{
            "dependencies":{
                "d":"1.0.0"
            },
            "dist":"/mod-c/download/c-1.0.0.tgz"
        },
        "1.0.1":{
            "dependencies":{
                "d":"1.0.0"
            },
            "dist":"/mod-c/download/c-1.0.1.tgz"
        }
    }
}

```

### 客户端命令 (bin/index.js)


#### 1.收集依赖关系 ，从获取上面描述的模版index.json 开始


```

let content = fs.readFileSync(jsonPath,'utf8')
content = JSON.parse(content)
let versions = content.versions || {}
let info = versions[version]
//hasMod(dep) 去重处理
if(info && hasMod(dep) === -1){
    dependenciesMods.push({
        name,
        version,
        dist:info.dist,
        belonger
    })
    let dependencies =  info.dependencies
    if(dependencies && Object.keys(dependencies).length > 0){
        collectDependMods(dependencies,name)
    }

```

#### 2，根据依赖关系，下载包文件

```
    //已经存在不同版本的包了 此时需要把包安装在被依赖的包的node_modules中
    if(isExist(modDir)){
        let belongerModsDir = path.join(modulesPath,`${mod.belonger}/node_modules/`) 
        if(!isExist(belongerModsDir)){
            fs.mkdirSync(belongerModsDir) 
        }
        modDir = path.join(belongerModsDir,mod.name) 
    }
    try{
        fs.mkdirSync(modDir)
        fs.createReadStream(dist).pipe(
            tar.x({
                strip: 1,
                C: modDir  
            })
        )
    }
    catch(e){
        console.log(e)
    }

```