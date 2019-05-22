#! /usr/bin/env node

const path = require('path')
const fs = require('fs')
const program = require('commander')
let npmX = require('../lib')

program
    .command('install')
    .alias('i')
    .description('安装组件包')
    .action(option => {
        let currentDir = process.cwd()
        let packageJsonPath = path.join(currentDir, './package.json')
        try {
            let content = fs.readFileSync(packageJsonPath, 'utf8')
            content = JSON.parse(content)
            npmX.install(content.dependencies)
        } catch (e) {
            console.log(e)
        }
    })

program.parse(process.argv)