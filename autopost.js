/**
 * AutoPost Script
 * Created by nbee/bigsnailmonster 
 */
const fs = require('fs');
const req = require('request');
const log = {
    send:function (output) {console.log(`\n\x1b[35m[AutoPost]\x1b[37m ${output}\n`)},
    sending:function () {console.log(`\n\x1b[35m[AutoPost]\x1b[37m Sending...`)},
    err:function (output) {console.log(`\n\x1b[31m[Error]\x1b[37m ${output}\n`)}
}
log.send('Script started.');

// vars to control loop process
var interval = null;
var a = 0;
var p = 0;

// Sending posts
function createPost (account, post) {

    log.sending();

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
            log.err(`Failed to obtain token for account "${account.username}". Check to make sure your account credentials are valid.`);
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
                console.log(`\n\x1b[1mPost Status\x1b[0m: Failure\n\x1b[1mUsername\x1b[0m: ${account.username}\n\x1b[1mSubreddit\x1b[0m: ${post.subreddit}\n\x1b[1mTitle\x1b[0m: ${post.title}\n\x1b[1mType\x1b[0m: ${post.type}\n\x1b[1mContent\x1b[0m: ${post.content}\n\x1b[1mError Message\x1b[0m: ${body.json.errors[0][0]}\n`);
            }
            else {
                console.log(`\n\x1b[1mPost Status\x1b[0m: Success\n\x1b[1mUsername\x1b[0m: ${account.username}\n\x1b[1mSubreddit\x1b[0m: ${post.subreddit}\n\x1b[1mTitle\x1b[0m: ${post.title}\n\x1b[1mType\x1b[0m: ${post.type}\n\x1b[1mContent\x1b[0m: ${post.content}\n\x1b[1mPost Url\x1b[0m: ${body.json.data.url.replace('.json','')}\n`)
            }
        })
    })
}

// Deteriming file selection and loading account info

function randomFile (path, arr) { // arr = the array of account files as opposed to path
    try {
        var res = JSON.parse(fs.readFileSync(`./${path}/${arr[Math.floor(Math.random() * arr.length)]}`));
    } catch (err) {
        log.err('Invalid configuration file.');
        return null;
    }
    return res;
}

function setFile (path, arr, query) {
    let search = arr.find(file => file.toLowerCase().replace('.json','') === query);
    if(!search) {
        log.err(`Could not find configuration file in /${path}/`); 
        return null;
    }
    else try {
        var res = JSON.parse(fs.readFileSync(`./${path}/${search}`))
    } catch (err) {
        log.err('Invalid configuration file.');
        return null;
    }
    return res;
}

function selectFiles (input) {
    if (!fs.existsSync('./accounts') || !fs.existsSync('./posts')) {
        log.err('Missing directory! Make sure both the /accounts/ and /posts/ paths are present.');
        return;
    }

    let accounts = fs.readdirSync('./accounts').filter(filename => filename.endsWith('.json'));
    let posts = fs.readdirSync('./posts').filter(filename => filename.endsWith('.json'));

    if(accounts.length<1 || posts.length<1) {
        log.err('Missing configuration files! Make sure to add accounts and posts to their respective paths.');
        return;
    }

    switch (input) {
        case 'random': // randomly select post and account
            var account = randomFile('accounts', accounts);
            var post = randomFile('posts', posts);
            if (account !== null && post !== null) createPost(account, post);
            break;

        case 'cycle': // cycle through accounts and randomize posts
            try {
                var account = JSON.parse(fs.readFileSync(`./accounts/${accounts[a]}`))
            } catch (err) {
                log.err('Invalid account configuration file.');
                if (a+1>accounts.length-1) a = 0;
                else a++;
                return;
            }
            try {
                var post = JSON.parse(fs.readFileSync(`./posts/${posts[p]}`))
            } catch (err) {
                log.err('Invalid post configuration file.');
                if (p+1>posts.length-1) p = 0;
                else p++;
                return;
            }
            createPost(account, post);
            if (a+1>accounts.length-1) a = 0;
            else a++;
            if (p+1>posts.length-1) p = 0;
            else p++;
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

// Console chat for sending commands

process.openStdin().addListener("data", message => {
    
    message = message.toString();
    let command = message.trim().toLowerCase().split(/ +/g)[0];
    let args = message.slice(command.length+1).trim().toLowerCase().split(/ +/g);

    if(!command) return;

    switch (command) {

        case 'p': case 'post':
            if (!args[0]) selectFiles('random');
            else selectFiles([args[0], args[1]])
            break;

        case 'l': case 'loop':
            if (!args[0] || isNaN(args[0]) || args[0]<.1) {
                log.err('Invalid delay specified.');
                return;
            }
            if (interval !== null) clearInterval(interval);
            a = 0;
            p = 0;
            selectFiles('cycle'); // send first post then loop
            interval = setInterval (
                function () {
                    selectFiles('cycle');
                }, args[0]*60000
            );
            break;

        case 'f': case 'list': case 'files':
            var list = {
                accounts:'\x1b[1mAccount Files:\x1b[0m\n',
                posts:'\x1b[1mPost Files:\x1b[0m\n'
            }
            var count = {
                accounts:0,
                posts:0
            }
            if (fs.existsSync(`./accounts`)) {
                fs.readdirSync(`./accounts`).filter(filename => filename.endsWith('.json')).forEach(file => {
                    list.accounts+=file.replace('.json','')+'\n';
                    count.accounts+=1;
                })
            }
            if (fs.existsSync(`./posts`)) {
                fs.readdirSync(`./posts`).filter(filename => filename.endsWith('.json')).forEach(file => {
                    list.posts+=file.replace('.json','')+'\n';
                    count.posts+=1;
                })
            }
            if (count.accounts===0) list.accounts+='[EMPTY]\n';
            if (count.posts===0) list.posts+='[EMPTY]';
            log.send(`Found ${count.accounts} accounts and ${count.posts} post files:`);
            console.log(list.accounts+'\n'+list.posts+'\n')
            break;

        case 'c': case 'cancel':
            if (interval !== null){
                clearInterval(interval);
                interval = null;
                log.send('Loop stopped!');
            } else log.err('No loop to cancel!');
            break;

        default:
            log.send(`Invalid command. Try one of these:`)
            console.log(`\x1b[1mp {account} {post} \x1b[0m- make a single post\n\x1b[1ml [delay in minutes] \x1b[0m- loop posts\n\x1b[1mf \x1b[0m- display account and post files\n\x1b[1mc \x1b[0m- cancel loop\n`);
            break;
    }
});
