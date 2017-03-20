'use strict'

const Telegram = require('telegram-node-bot')
const TelegramBaseController = Telegram.TelegramBaseController
const StartController = Telegram.StartController
const TextCommand = Telegram.TextCommand

var fs = require('fs');
var config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

var telegram_key = config.telegram_key

console.log("telegram_key: " + config.telegram_key)


Array.prototype.contains = function(element){
    return this.indexOf(element) > -1;
};

const tg = new Telegram.Telegram(telegram_key,
{ 
    workers: 1,
    webAdmin: {
        port: config.local_port,
        host: 'localhost'
    }
})

function makeDir(dirname)
{
    if (!fs.existsSync(dirname)){
        fs.mkdirSync(dirname);
    }
}


tg.onMaster(() => {
    //setting up storage
    makeDir('./.storage')
})


class BroadcastController extends TelegramBaseController {
   /**
   * @param {Scope} $
   */
    broadcastHandler($) {

        var admin_list = config.admins
        $.getChat()
        .then(chatInfo => {
            // console.log(chatInfo.username)

            if(admin_list.indexOf(chatInfo.username) <= -1)
            {
                $.sendMessage("You are not authorized to broadcast messages.")
                return
            }
            else
            {
                $.runForm(form, (result) => {
                    //console.log(result)
                    //$.sendMessage('registered!')
                })
            }
        })

        // if(var telegram_key = config.telegram_key)
        const form = {
            bcast: {

                q: 'Which message would you like to broadcast?',
                error: 'sorry, wrong input',
                validator: (message, callback) => {

                    var chat_ids_dir = './.storage/'
                    if (!fs.existsSync(chat_ids_dir)){
                        $.sendMessage("There are no clients registered to updates.")
                    }

                    var files = fs.readdirSync(chat_ids_dir);
                    
                    for (var i = 0, len = files.length; i < len; i++) {
                        tg.api.sendMessage(files[i], message.text.toString())
                    }
                    $.sendMessage("Your message has been broadcasted")

                    return
                    }
            }
        }
    }

    get routes() {
        return {
            'broadcastCommand': 'broadcastHandler'
        }
    }
}

class HelpController extends TelegramBaseController {
   /**
   * @param {Scope} $
   */
    helpHandler($) {
        $.sendMessage('This bot allows registered users to broadcast a list of messages to users or groups which subscribed to it')
        $.sendMessage('/subscribe to receive new updates')
        $.sendMessage('/broadcast to send a message to all the subscribed users')
    }

    get routes() {
        return {
            'helpCommand': 'helpHandler'
        }
    }
}

class OtherwiseController extends TelegramBaseController {
    handle() {
        console.log('otherwise')
    }
}

class RegisterController extends TelegramBaseController {
   /**
   * @param {Scope} $
   */
    registerHandler($) {

        var chat_id = "./.storage/" + $.chatId.toString()
        fs.writeFile(chat_id, function (err) {
                            if (err) return console.log(err);
                            console.log('File saved: ' + chat_id);
                        });
        
        $.sendMessage('You are now subscribed to NEM news updates')
    }

    get routes() {
        return {
            'registerCommand': 'registerHandler'
        }
    }
}

tg.router
    .when(new TextCommand('/help', 'helpCommand'), new HelpController())
    .when(new TextCommand('/broadcast', 'broadcastCommand'), new BroadcastController())
    .when(new TextCommand('/register', 'registerCommand'),new RegisterController())
    .otherwise(new OtherwiseController())

console.log("Starting bot!")
