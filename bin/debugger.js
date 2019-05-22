const path = require('path')
const fs = require('fs')
let npmX = require('../lib')

let currentDir = process.cwd()
let packageJsonPath = path.join(currentDir, './example/package.json')
try {
    let content = fs.readFileSync(packageJsonPath, 'utf8')
    content = JSON.parse(content)
    npmX.install(content.dependencies)
} catch (e) {
    console.log(e)
}
