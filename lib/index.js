const path = require('path')
const fs = require('fs')
const tar = require('tar')
const serverPath = path.resolve('../server')
const clientPath = path.resolve('../client')
let dependenciesMods = []

function isExist(filePath){
    try {
    fs.accessSync(filePath)
    } catch (err) {
        return false
    }
    return true
}


//下载安装包
function downloadModules(){
    let modulesPath = path.join(clientPath,'node_modules')
    if(!isExist(modulesPath)){
        fs.mkdirSync(modulesPath)
    }
    for(let mod of dependenciesMods){
        let dist = path.join(serverPath,mod.dist)
        let modDir = path.join(modulesPath,mod.name)
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
        
    }
}

//是否已经存在
function hasMod(mod){
  return  dependenciesMods.findIndex((value,index) => {
        return (value.version === mod.version && value.name === mod.name)
    })
}

function getDependJson(dep,belonger){
    let {name,version} = dep 
    let jsonPath = path.join(serverPath,`mod-${name}/index.json`)
    try{
        let content = fs.readFileSync(jsonPath,'utf8')
        content = JSON.parse(content)
        let versions = content.versions || {}
        let info = versions[version]
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
        }
    }
    catch(e){
        console.log(e)
    }
    
}
//收集依赖关系
function collectDependMods(dependencies,belonger=null){
    for( let key of Object.keys(dependencies)){
        getDependJson({name:key,version:dependencies[key]},belonger)
    }
    
}

//安装包
function install( dependencies = {} ){
    collectDependMods(dependencies)
    console.log(dependenciesMods)
    downloadModules() 
}


module.exports = {
    install,
}