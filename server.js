var http = require('http');
var WebSocketServer = new require('ws');
var pg = require('pg');
var connectionParameters = { host: 'localhost', port: 5432, database: 'dev', user: 'dev', password: 'dev' };

var clients = {};
var webSocketServer = new WebSocketServer.Server({port: 3333});
webSocketServer.on('connection', function(ws) {
    var name;

    ws.on('message', function(message) {
        var data = JSON.parse(message);
        switch (data.type) {
            case 'register':
                var validName = data.name.replace(/[^a-z0-9]/gi,'');
                if (validName.length === 0 || clients.hasOwnProperty(data.name)) {
                    ws.close(1003, 'Укажите другое имя пользователя');
                    return;
                }
                name = validName;
                clients[validName] = ws;
                break;
            case 'publish':
                performPublish({
                    name: name,
                    room: data.room,
                    message: data.message
                });
                break;
            default:
                ws.close(1003, 'Не верный формат сообщения');
        }
    });
    ws.on('close', function() {
        if (typeof name === 'undefined' || !clients.hasOwnProperty(name)) {
            return;
        }
        delete clients[name];
    });

});

function performPublish(data) {
    pg.connect(connectionParameters, function(err, client, done) {
        if (err) {
            done();
        }
        var query = client.query(
            'INSERT into chat.message_history (name, room, message) VALUES($1, $2, $3)',
            [data.name, data.room, data.message]
        );
        query.on('end', function() {
            for(var key in clients)
                clients[key].send(JSON.stringify(data));
            done();
        });
    });
}
