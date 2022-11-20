const express = require('express')
const app = express()
const redis = require('./redisUtil')
const cors = require("cors")
const dbConfig = require("./dbConfig")
app.use(cors()) // 解决跨域
app.use(express.json()) // 解析json请求
app.use(express.urlencoded({ extended: false })) // 解析URL-encoded请求
const mysql = require('mysql')
const db = mysql.createPool({
    host: dbConfig.mysqlOptions.host,
    user: dbConfig.mysqlOptions.user,
    password: dbConfig.mysqlOptions.password,
    port: dbConfig.mysqlOptions.port,
    database: dbConfig.mysqlOptions.database
})
app.listen(33307, () => {
    console.log('app listening on port 33307')
})
app.post('', (req, res) => {
    const key = req.body['key']
    const value = req.body['value']
    const type = req.body['type']
    if (type === 'link' && !value.startsWith('http')) {
        value = 'http://' + value
    }
    redisValue = {
        value: value,
        type: type
    }





    // avoid duplication
    redis.getValue(key).then(val => {
        if (val === null) {
            redis.setValue(key, JSON.stringify(redisValue))
            db.query("insert into clipBoard (content) values(?)", [value], (err, results) => {
                if (err) {
                    console.log(err)
                }
            })
        } else {
            if (JSON.parse(val).value !== value || JSON.parse(val).type !== type) {
                redis.setValue(key, JSON.stringify(redisValue))
                db.query("insert into clipBoard (content) values(?)", [value], (err, results) => {
                    if (err) {
                        console.log(err)
                    }
                })
            }
        }
    })

    console.log(new Date().toLocaleString(), "--post:", value)
    res.send(value)
})
app.get('', (req, res) => {

    res.sendFile(__dirname + '/index.html')
})

app.get('/*', (req, res) => {

    const key = req.path.slice(1)

    redis.getValue(key).then(val => {
        if (val === null) {
            res.end()
            return
        }
        const jsonValue = JSON.parse(val)

        console.log(new Date().toLocaleString(), "--get:", jsonValue.value)
        if (jsonValue.type === "text") {


            res.setHeader("Content-Type", "text/plain;charset=utf-8")

            res.send(jsonValue.value)
        } else if (jsonValue.type === "link") {
            res.redirect(302, jsonValue.value)
        } else { res.end() }
    })
})
