const path = require('path')
const fs = require('fs')
const tar = require('tar')
const serverPath = 'https://registry.npm.taobao.org/'
const packagePre = '@xsyx/'
const requestPromise = require('request-promise')
const clientPath = path.resolve('../client')
let dependenciesMods = []
let pagesDependenciesMods = []
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
        let modDir = path.join('./', mod.path)
        try {
            fs.mkdirSync(modDir, {
                recursive: true
            })
            let dist = mod.dist
            requestPromise({
                url: dist
            }).pipe(
                tar.x({
                    strip: 1,
                    C: modDir
                })
            ).on('close', () => {
                let packageJson = fs.readFileSync(path.join(`${modDir}/`, 'package.json'), 'utf8')
                packageJson = JSON.parse(packageJson) || {}
                let dependencies = packageJson.dependencies || {}
                let depList = []
                for (let depKey of Object.keys(dependencies)) {
                    depList.push({
                        name: depKey.replace(packagePre, ''),
                        version: dependencies[depKey]
                    })
                }
                let modJsonPath = path.join(`${modDir}`, `${mod.name}.json`)
                let modJson = fs.readFileSync(modJsonPath, 'utf8')
                modJson = JSON.parse(modJson)
                let usingComponents = {}
                for (let dep of depList) {
                    let index = _hasMod(dep)
                    if (index !== -1) {
                        usingComponents[dep.name] = dependenciesMods[index].path
                    }
                }
                modJson.usingComponents = usingComponents
                try {
                    fs.writeFileSync(modJsonPath, JSON.stringify(modJson))
                } catch (e) {
                    console.log(e)
                }
            })
        } catch (e) {
            console.log(e)
        }
    }
}

//是否已经存在版本一样的相同包
function _hasMod(mod,depList) {
    depList = depList || dependenciesMods 
    return depList.findIndex((value, index) => {
        return (value.version === mod.version && value.name === mod.name)
    })
}

//是否已经存在版本不一样的相同包
function _hasDiffVersionMod(mod, pagesUsedMods) {
    return pagesUsedMods.findIndex((value, index) => {
        return (value.name === mod.name && value.version !== mod.version)
    })
}

//当有安装包位置提前放到第一级目录的时候，寻找归属于它的安装包，修改它的belonger
function _modifyBelonger(parentBelongerStr, parentModName, depList) {
    let belongerStr = `${parentBelongerStr}|${parentModName}`
    for (let dep of depList) {
        if (dep.belonger.indexOf(belongerStr) !== -1 ) {
            dep.belonger = dep.belonger.replace(belongerStr, `|${parentModName}`)
        }
    }
}

//处理组件的安装path，如果页面依赖中没有这个组件，就可以直接安装
function _splitDependMods(depList) {
    let directUsedMods = []
    directUsedMods = dependenciesMods.filter((item) => {
        return !item.belonger
    })
    for (let item of depList) {
        if (item.belonger) {
            if (_hasDiffVersionMod(item, directUsedMods) === -1) {
                let belonger = item.belonger
                item.belonger = ''
                _modifyBelonger(belonger, item.name, depList)
                item.path = `/${componentsDir}/${item.name}`
                directUsedMods.push(item)
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
    return depList
}

//全部收集好 所有的依赖 再一次生成所有的 安装包
async function _getDependJson(dep, belonger) {
    let {
        name,
        version
    } = dep
    let jsonPath = serverPath + `${name}`
    try {
        let content = await requestPromise({
            url: jsonPath
        })
        content = JSON.parse(content)
        let versions = content.versions || {}
        let info = versions[version]
        name = name.replace(packagePre, '')
        dep.name = name
        if (info && _hasMod(dep) === -1) {
            //属于页面依赖的模块
            if(_hasMod(dep,pagesDependenciesMods) !== -1){
                belonger = ''
            }
            dependenciesMods.push({
                name,
                version,
                dist: info.dist.tarball,
                belonger
            })
            let dependencies = info.dependencies
            if (dependencies && Object.keys(dependencies).length > 0) {
                await _collectDependMods(dependencies, `${belonger}|${name}`)
            }
        }
    } catch (e) {
        console.log(e)
    }
}
function getpagesDepend(dependencies){
    for (let key of Object.keys(dependencies)) {
        pagesDependenciesMods.push({
            name: key.replace(packagePre,''),
            version: dependencies[key]
        })
    }
}
//收集依赖关系
async function _collectDependMods(dependencies, belonger = '') {
    for (let key of Object.keys(dependencies)) {
        await _getDependJson({
            name: key,
            version: dependencies[key]
        }, belonger)
    }

}

//安装包
async function install(dependencies = {}) {
    getpagesDepend(dependencies)
    await _collectDependMods(dependencies)
    dependenciesMods = _splitDependMods(dependenciesMods)
    console.log(dependenciesMods)
    _downloadModules(dependenciesMods)
}


module.exports = {
    install,
}