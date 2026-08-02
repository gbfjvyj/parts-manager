// 零件管理器 - 本地服务器 (禁缓存)
// 启动: node server.js  →  http://localhost:3000
var http=require('http'),fs=require('fs'),path=require('path');
var PORT=3000;
var MIME={'.html':'text/html; charset=utf-8','.js':'application/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};

http.createServer(function(req,res){
  var fp=req.url==='/'?'/index.html':req.url.split('?')[0];
  fp=path.join(__dirname,fp);
  if(!fp.startsWith(__dirname)){res.writeHead(403);res.end('Forbidden');return}
  fs.readFile(fp,function(err,data){
    if(err){res.writeHead(404);res.end('Not Found');return}
    var ext=path.extname(fp);
    res.writeHead(200,{'Content-Type':MIME[ext]||'application/octet-stream','Cache-Control':'no-cache, no-store, must-revalidate','Pragma':'no-cache','Expires':'0'});
    res.end(data);
  });
}).listen(PORT,function(){console.log('http://localhost:'+PORT)});
