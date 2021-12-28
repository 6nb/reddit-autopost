<img src='https://www.redditinc.com/assets/images/site/reddit-logo.png' width=15% height=15%/>

# Reddit AutoPost

Reddit post automation with NodeJS.

## Setup

Install [NodeJS](https://nodejs.org/en/) and [request](https://www.npmjs.com/package/request). Download and unzip the repo.

On windows run `setup.bat` then `run.bat`. Alternatively, 

`npm init -y`

`npm i request`

and `node .` to run


## Creating Files

Account and post information is stored in `.json` files. Use `example.json` as a formatting guide.

### Adding Accounts

Account files are located in the `/accounts/` folder and require this info:


![](https://user-images.githubusercontent.com/77910109/147604625-adf881b5-13fa-45a4-8176-3ef783f71c9f.png)

You can obtain an app id and secret by visiting [this site](https://ssl.reddit.com/prefs/apps/) and selecting `create an application`. Fill out the form, click `create app`, then click `edit` to show the values.

![](https://user-images.githubusercontent.com/77910109/147604640-53eac8b6-5494-4ed2-871f-d14534b6ded8.png)

![](https://user-images.githubusercontent.com/77910109/147604657-326ecc31-2000-4d37-adad-d58f34271e22.png)

### Adding Posts

Post configs are stored in the `/posts/` folder and require this info:

![](https://user-images.githubusercontent.com/77910109/147604671-9e21be4c-e44e-488a-8ecb-3c7b1520a165.png)

`type` = the type of post: "text," "image," or "link"

`content` = either some text or a url depending on type

## Running Commands
Enter these into the terminal to start posting:

* `p {account} {post}` - make a single post. You can leave out account or post for random selection.
* `l [delay in minutes]` - loop posting on a set interval, cycling through your accounts and posts.
* `f` - list account and posts files.
* `c` - cancel active loops

## Example

https://user-images.githubusercontent.com/77910109/127091630-d2c7267d-c6a3-445c-a54f-bf8ee46f6057.mp4
