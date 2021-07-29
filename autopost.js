const fs = require('fs');
const req = require('request');
const log = {
    send:function (output) {console.log(`\n\x1b[35m[AutoPost]\x1b[37m ${output}`)},
    err:function (output) {console.log(`\n\x1b[31m[Error]\x1b[37m ${output}`)}
}
log.send('Script started.\n');

// vars to control loop process
var interval = null;
var stage = [0, 0]; //accounts, posts

// Reading commands

process.openStdin().addListener("data", message => {
    
    let command = message.toString().trim().toLowerCase().split(/ +/g)[0];
    let args = message.toString().slice(command.length+1).trim().toLowerCase().split(/ +/g);

    if(!command) return;

    switch (command) {

        case 'p': case 'post':
            if (!args[0]) selectFiles('random');
            else selectFiles([args[0], args[1]])
            break;

        case 'l': case 'loop':
            if (!args[0] || isNaN(args[0]) || args[0]<.01) {
                log.err('Invalid delay specified.\n');
                return;
            }

            if (interval !== null) clearInterval(interval);
            stage = [0, 0];

            selectFiles('cycle'); // send first post then loop
            interval = setInterval (
                function () {
                    selectFiles('cycle');
                }, args[0]*60000
            );
            break;

        case 'f': case 'list': case 'files':

            function readPath (path) {
                let list = '\x1b[1m' + path[0].toUpperCase() + path.slice(1) + ' Files:\x1b[0m\n';
                let count = 0;
                if (fs.existsSync(`./${path}`)) {
                    fs.readdirSync(`./${path}`).filter(filename => filename.endsWith('.json')).forEach(file => {
                        list+=file.replace('.json','')+'\n';
                        count+=1;
                    })
                    if (count<1) list += '[EMPTY]\n';
                } else list += '[MISSING]\n';
                return [list, count]
            }

            var accountList = readPath('accounts');
            var postList = readPath('posts');

            log.send(`Found ${accountList[1]} accounts and ${accountList[1]} post files:\n`);
            console.log(accountList[0]+'\n'+postList[0])
            break;

        case 'c': case 'cancel':
            if (interval !== null){
                clearInterval(interval);
                interval = null;
                log.send('Loop stopped!\n');
            } else log.err('No loop to cancel!\n');
            break;

        default:
            log.send(`Invalid command. Try one of these:\n`)
            console.log(`\x1b[1mp {account} {post} \x1b[0m- make a single post\n\x1b[1ml [delay in minutes] \x1b[0m- loop posts\n\x1b[1mf \x1b[0m- display account and post files\n\x1b[1mc \x1b[0m- cancel loop\n`);
            break;
    }
});

// Deteriming file selection and loading account info

function randomFile (path, arr) { // arr = the array of account files as opposed to path
    try {
        var res = JSON.parse(fs.readFileSync(`./${path}/${arr[Math.floor(Math.random() * arr.length)]}`));
    } catch (err) {
        log.err('Invalid configuration file.\n');
        return null;
    }
    return res;
}

function setFile (path, arr, query) {
    let search = arr.find(file => file.toLowerCase().replace('.json','') === query);
    if(!search) {
        log.err(`Could not find configuration file in /${path}/\n`); 
        return null;
    }
    else try {
        var res = JSON.parse(fs.readFileSync(`./${path}/${search}`))
    } catch (err) {
        log.err('Invalid configuration file.\n');
        return null;
    }
    return res;
}

function selectFiles (input) {
    if (!fs.existsSync('./accounts') || !fs.existsSync('./posts')) {
        log.err('Missing directory! Make sure both the /accounts/ and /posts/ paths are present.\n');
        return;
    }

    let accounts = fs.readdirSync('./accounts').filter(filename => filename.endsWith('.json'));
    let posts = fs.readdirSync('./posts').filter(filename => filename.endsWith('.json'));
    let length = [accounts.length, posts.length]

    if(length[0]<1 || length[1]<1) {
        log.err('Missing configuration files! Make sure to add accounts and posts to their respective paths.\n');
        return;
    }

    switch (input) {
        case 'random': // randomly select post and account
            var account = randomFile('accounts', accounts);
            var post = randomFile('posts', posts);
            if (account !== null && post !== null) createPost(account, post);
            break;

        case 'cycle': // cycle through accounts and randomize posts
            function changeLoopStage (type) {
                if (stage[type]+1>length[type]-1) stage[type] = 0;
                else stage[type]++;
            }

            try {
                var account = JSON.parse(fs.readFileSync(`./accounts/${accounts[stage[0]]}`))
            } catch (err) {
                log.err('Invalid account configuration file.\n');
                changeLoopStage(0);
                return;
            }

            try {
                var post = JSON.parse(fs.readFileSync(`./posts/${posts[stage[1]]}`))
            } catch (err) {
                log.err('Invalid post configuration file.\n');
                changeLoopStage(1);
                return;
            }
            createPost(account, post);
            for (type=0;type<2;type++) {
                changeLoopStage(type);
            }
            break;

        default: // if arguments are provided, decide which to set and which to randomize. input is an array
            var account = setFile('accounts', accounts, input[0]);
            if (account === null) return;
            var post;
            if (input[1] === undefined) post = randomFile('posts', posts);
            else post = setFile('posts', posts, input[1]);
            if (post === null) return;
            createPost(account, post);
    }
}

// Sending posts
function createPost (account, post) {
    log.send('Sending...');

    // Obtain token
    req({
        url: 'https://www.reddit.com/api/v1/access_token',
        method: 'POST',
        form: {
            grant_type: 'password',
            username: account.username,
            password: account.password
        },
        headers: {
            authorization: `Basic ${Buffer.from(`${account.id}:${account.secret}`).toString('base64')}`,
            'user-agent': 'autopost'
            },
            json:true
    }, function (err, res, body) {
        if (res.statusCode !== 200 || body.error) {
            log.err(`Failed to obtain token for account "${account.username}". Check to make sure your account credentials are valid.\n`);
            return;
        }

        let text = 'post';
        let link = null;
        if(post.type === 'link' || post.type === 'image') link = post.content;
        else text = post.content;
        
        req({
            url: 'https://oauth.reddit.com/api/submit',
            method: 'POST',
            form:{
                'sr':post.subreddit,
                'api_type': "json",
                'title': post.title,
                'spoiler': false,
                'nsfw' : false,
                'resubmit': true,
                'sendreplies': false,
                'text':text,
                'kind':post.type,
                'url':link,
                "extension": "json"
            },
            headers:{
                'content-type': 'application/x-www-form-urlencoded',
                "authorization": "bearer " + body.access_token,
                "user-agent": 'autopost'
            },
            json:true
        }, function (err, res, body) {
            if (res.statusCode !== 200 || body.json.errors.length>0) { // note: post can fail with code 200, err doesnt return properly. second condition checks that
                console.log(`\n\x1b[1mPost Status\x1b[0m: \x1b[31mFailure\x1b[37m\n\x1b[1mUsername\x1b[0m: ${account.username}\n\x1b[1mSubreddit\x1b[0m: ${post.subreddit}\n\x1b[1mTitle\x1b[0m: ${post.title}\n\x1b[1mType\x1b[0m: ${post.type}\n\x1b[1mContent\x1b[0m: ${post.content}\n\x1b[1mError Message\x1b[0m: ${body.json.errors[0][0]}\n`);
            }
            else {
                console.log(`\n\x1b[1mPost Status\x1b[0m: \x1b[32mSuccess\x1b[37m\n\x1b[1mUsername\x1b[0m: ${account.username}\n\x1b[1mSubreddit\x1b[0m: ${post.subreddit}\n\x1b[1mTitle\x1b[0m: ${post.title}\n\x1b[1mType\x1b[0m: ${post.type}\n\x1b[1mContent\x1b[0m: ${post.content}\n\x1b[1mPost Url\x1b[0m: ${body.json.data.url.replace('.json','')}\n`)
            }
        })
    })
}