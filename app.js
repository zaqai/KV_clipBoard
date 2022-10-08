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
app.post('/push', (req, res) => {
    const key = req.body['key']
    const value = req.body['value']
    // avoid duplication
    redis.getValue(key).then(val => {
        if (val !== value) {
            redis.setValue(key, value)
            db.query("insert into clipBoard (content) values(?)", [value], (err, results) => {
                if (err) {
                    console.log(err)
                }
            })
        }
    })
    console.log(new Date().toLocaleString(), "--post:", value)
    res.send(value)
})
app.get('/pull/*', (req, res) => {
    const paths = req.path.split('/')
    const key = paths[paths.length - 1]
    redis.getValue(key).then(val => {
        console.log(new Date().toLocaleString(), "--get:", val)
        res.send(val)
    })
})
