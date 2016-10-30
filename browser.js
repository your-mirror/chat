(function() {
    var socket;
    var loginBlock = $('#loginBlock');
    var chatBlock = $('#chatBlock');

    document.forms.login.onsubmit = function() {
        var username = this.name.value;
        if (!isValidUsername(username)) {
            return false;
        }
        socket = new WebSocket("ws://localhost:3333");
        socket.onopen = function (event) {
            socket.send(JSON.stringify({type: 'register', name: username}));
            initSocketHandlers();
            showChat();
        };
        return false;
    };
    document.forms.publish.onsubmit = function() {
        var outgoingMessage = this.message.value;
        if (outgoingMessage.length === 0) {
            return false;
        }
        this.message.value = '';
        socket.send(JSON.stringify({
            type: 'publish',
            room: getCurrentTab().attr('id'),
            message: outgoingMessage
        }));
        return false;
    };
    function isValidUsername(text) {
        var isValid = true;
        if (text.length === 0) {
            showError('Укажите имя латинскими буквами');
            isValid = false;
        }
        else if (text.replace(/[^a-z0-9]/gi,'').length === 0) {
            showError('Используйте латиницу!');
            isValid = false;
        }
        return isValid;
    }
    function initSocketHandlers() {
       socket.onmessage = function(event) {
           showMessage(JSON.parse(event.data));
       };
       socket.onerror = function(error) {
           showError(error.message);
       };
       socket.onclose = function(event) {
           showError(event.reason);
           showLogin();
       };
    }
    function showLogin() {
        loginBlock.show();
        chatBlock.hide();
    }
    function showChat() {
        loginBlock.hide();
        chatBlock.show();
    }
    function showMessage(data) {
        var message = '' +
            '<dl class="dl-horizontal">' +
                '<dt>' + data.name + '</dt>' +
                '<dd>' + data.message +'</dd>' +
            '</dl>';
        chatBlock.find('#' + data.room).append(message);
    }
    function showError(message) {
        if (message.length === 0) {
            return;
        }
        var error = '' +
            '<div class="alert alert-danger alert-dismissible" role="alert">' +
                '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
                '<span>' + message + '</span>' +
            '</div>';
        document.getElementById('errors').innerHTML= error;
    }
    function getCurrentTab() {
        return chatBlock.find('.tab-pane.active');
    }
})();