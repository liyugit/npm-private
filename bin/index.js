const path = require('path')
const fs = require('fs')

let npmPrivate = require('../lib')
let currentDir = process.cwd()
let packageJsonPath = path.join(currentDir, './client/package.json')
try {
    let content = fs.readFileSync(packageJsonPath, 'utf8')
    content = JSON.parse(content)
    npmPrivate.install(content.dependencies)
} catch (e) {
    console.log(e)
}