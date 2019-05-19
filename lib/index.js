const path = require('path')
const fs = require('fs')
const tar = require('tar')
const serverPath = path.resolve('../server')
const clientPath = path.resolve('../client')
let dependenciesMods = []
let componentsDir = '@xsyx-components'

function _isExist(filePath) {
    try {
        fs.accessSync(filePath)
    } catch (err) {
        return false
    }
    return true
}


//下载组件包,并修改usingComponents路径
function _downloadModules(depList) {
    for (let mod of depList) {
        let dist = path.join(serverPath, mod.dist)
        let modDir = path.join(mod.path)
        try {
            fs.mkdirSync(modDir)
            fs.createReadStream(dist).pipe(
                tar.x({
                    strip: 1,
                    C: modDir
                })
            ).on('close', () => {
                let packageJson = fs.readFileSync(path.join(`${modDir}/`,'package.json'),'utf8') 
                packageJson =  JSON.parse(packageJson)  || {}
                let dependencies = packageJson.dependencies || {}
                let depList = []
                for(let depKey  of Object.keys(dependencies)){
                    depList.push({
                        name:depKey,
                        version:dependencies[depKey]
                    })
                }
                let modJsonPath =  path.join(`${modDir}`,`${mod.name}.json`)
                let modJson = fs.readFileSync(modJsonPath, 'utf8')
                modJson = JSON.parse(modJson)
                let usingComponents = {}
                for(let dep of depList){
                    let index = _hasMod(dep) 
                    usingComponents[dep.name] =  dependenciesMods[index].path 
                }  
                modJson.usingComponents = usingComponents 
                fs.writeFileSync(modJsonPath, JSON.stringify(modJson))
            })
        } catch (e) {
            console.log(e)
        }
    }
}
//是否已经存在版本一样的相同包
function _hasMod(mod) {
    return dependenciesMods.findIndex((value, index) => {
        return (value.version === mod.version && value.name === mod.name)
    })
}

//是否已经存在版本不一样的相同包
function _hasDiffVersionMod(mod, pagesUsedMods) {
    return pagesUsedMods.findIndex((value, index) => {
        return (value.name === mod.name && value.version !== mod.version)
    })
}

//处理组件内部依赖的组件，如果页面依赖中没有这个组件，就可以直接安装
function _splitDependMods(depList) {
    let pagesUsedMods = []
    pagesUsedMods = dependenciesMods.filter((item) => {
        return !item.belonger
    })
    for (let item of depList) {
        if (item.belonger) {
            if (hasDiffVersionMod(item, pagesUsedMods) === -1) {
                item.belonger = ''
                item.path = `/${componentsDir}/${item.name}`,
            } else {
                let belonger = item.belonger
                belonger = belonger.split('|')
                belonger = belonger.join(`/${componentsDir}/`)
                item.path = `${belonger}/${componentsDir}/${item.name}`
            }
        } else {
            item.path = `/${componentsDir}/${item.name}` 
        }
    }
}
//全部收集好 所有的依赖 再一次生成所有的 安装包
function _getDependJson(dep, belonger) {
    let {
        name,
        version
    } = dep
    let jsonPath = path.join(serverPath, `mod-${name}/index.json`)
    try {
        let content = fs.readFileSync(jsonPath, 'utf8')
        content = JSON.parse(content)
        let versions = content.versions || {}
        let info = versions[version]
        if (info && _hasMod(dep) === -1) {
            dependenciesMods.push({
                name,
                version,
                dist: info.dist,
                belonger
            })
            let dependencies = info.dependencies
            if (dependencies && Object.keys(dependencies).length > 0) {
                _collectDependMods(dependencies, `${belonger}|${name}`)
            }
        }
    } catch (e) {
        console.log(e)
    }
}

//收集依赖关系
function _collectDependMods(dependencies, belonger = '') {
    for (let key of Object.keys(dependencies)) {
        _getDependJson({
            name: key,
            version: dependencies[key]
        }, belonger)
    }

}

//安装包
async function install(dependencies = {}) {
    _collectDependMods(dependencies)
    console.log(dependenciesMods)
    _splitDependMods(dependenciesMods)
    _downloadModules(dependenciesMods)
}


module.exports = {
    install,
}