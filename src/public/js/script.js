(function(){
    const $name = document.getElementById('name');
    const $btn = document.querySelector('button');

    const name = localStorage.getItem('name');
    if (name) {
        $name.value = name;
    }

    $btn.addEventListener('click', () => {
        if (!$name.value) {
            return alert('Preencha seu nome');
        }

        const $video = document.createElement('video');
        const $chat = document.createElement('div');
        const $chatContainer = document.createElement('main');
        const $interface = document.createElement('footer');
        const $message = document.createElement('input');
        const $send = document.createElement('button');

        let seeking = false;
        let currentSocketChange = '';

        $video.src = 'assets/video.mp4';
        $video.controls = true;

        $chat.classList.add('chat');
        $chatContainer.classList.add('chat-container');
        $interface.classList.add('interface');
        $message.classList.add('message');
        $send.classList.add('send');
        $chat.appendChild($chatContainer);
        $chat.appendChild($interface);
        $interface.appendChild($message);
        $message.placeholder = 'Digite sua mensagem';
        $send.innerHTML = '<ion-icon name="send-outline"></ion-icon>';
        
        localStorage.setItem('name', $name.value);
        document.body.appendChild($video);
        document.body.appendChild($chat);
        document.body.removeChild($name);
        document.body.removeChild($btn);

        $video.addEventListener('loadedmetadata', () => {
            const socket = io({
                extraHeaders: {
                    name: $name.value
                }
            });

            socket.on('status', status => {
                currentSocketChange = 'status';
                setTimeout(() => {
                    currentSocketChange = '';
                }, 10)

                $video.currentTime = status.currentTime;
                if (!status.paused) {
                    $video.play();
                }
            })
            socket.on('pause', () =>  {
                currentSocketChange = 'pause';
                setTimeout(() => {
                    currentSocketChange = '';
                }, 10)

                $video.pause();
            })
            socket.on('play', () => {
                currentSocketChange = 'play';
                setTimeout(() => {
                    currentSocketChange = '';
                }, 10)

                $video.play();
            })
            socket.on('timeupdate', time => {
                currentSocketChange = 'seeking';
                setTimeout(() => {
                    currentSocketChange = '';
                }, 10)

                $video.currentTime = time;
            })
            socket.on('message', msg => {
                const $msg = document.createElement('div');
                $msg.classList.add('msg');

                const $user = document.createElement('b');
                const $content = document.createElement('span');
                $content.style.marginLeft = '5px';

                $user.textContent = `${msg.user}:`;
                $content.textContent = msg.content;

                $msg.appendChild($user);
                $msg.appendChild($content);

                $chatContainer.appendChild($msg);
            })
            socket.on('user-connected', name => {
                const $txt = document.createElement('i');
                $txt.textContent = `${name} conectou`;

                $chatContainer.appendChild($txt);
            })
            socket.on('user-disconnected', name => {
                const $txt = document.createElement('i');
                $txt.textContent = `${name} desconectou`;

                $chatContainer.appendChild($txt);
            })

            $video.addEventListener('pause', () => {
                if (currentSocketChange == 'pause' || currentSocketChange == 'status') {
                    return;
                }

                setTimeout(() => {
                    if (!seeking) {
                        socket.emit('pause');
                    }
                }, 1)
            })
            $video.addEventListener('play', () =>  {
                if (currentSocketChange == 'play' || currentSocketChange == 'status') {
                    return;
                }

                if (!seeking) {
                    socket.emit('play');
                }
            })
            $video.addEventListener('seeking', evt =>  {
                if (currentSocketChange == 'seeking' || currentSocketChange == 'status') {
                    return;
                }
                
                seeking = true;
                socket.emit('timeupdate', evt.target.currentTime);
                setTimeout(() => {
                    seeking = false;
                }, 3)
            })

            function sendMessage() {
                socket.emit('message', $message.value);
                $message.value = '';
            }
            $message.addEventListener('keyup', evt => {
                if (evt.key === 'Enter') {
                    sendMessage();
                }
            })
            $message.addEventListener('input', () => {
                if ($message.value) {
                    $interface.appendChild($send);
                } else {
                    $interface.removeChild($send);
                }
            })
            $send.addEventListener('click', sendMessage);
        })
    })
})()
