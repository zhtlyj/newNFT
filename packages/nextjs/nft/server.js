const express =require('express');
const mysql=require('mysq12');
const bodyParser =require('body-parser');
const cors =require('cors');
const app=express();
const port =3001;


const pool = mysql.createPool({
host:'localhost',
user:'root',
password:'1234',
database:'NFT'
});
app.listen(port,()=>{
    console.log('服务器运行在端口 ${port}')
});

