<img src='https://www.redditinc.com/assets/images/site/reddit-logo.png' width=15% height=15%/>

# Reddit AutoPost

Reddit post automation.

## Setup

Requires: [request](https://www.npmjs.com/package/request)

1. Install [Node.js](https://nodejs.org/en/)

2. Download and unzip this repo's release into your desired location. In this folder you'll see two `.bat` files: `setup.bat` and `run.bat`.

3. If you're on Windows, double clicking `setup.bat` will set up your project and install required packages. When it finishes, simply double click `run.bat` to run the script. Whenever you want to run it, just open `run.bat`. You can delete `setup.bat`; you won't need it again.

You can also set up manually by navigating to the directory and running:

`npm init`

`npm i request`

and to run, `node .`


## Creating Files

Account and post information is stored in `.json` files. You can copy the `example.json` files in both folders, open them with notepad, and edit them when you want to add posts or accounts.

## Adding Accounts

Account files are located in the `/accounts/` folder. They require:

1. `username` - your account username
2. `password` - your account password
3. `app id` - a reddit app id on your account
4. `secret` - that app's secret

![](https://cdn.discordapp.com/attachments/833909925255708682/869414396584132718/unknown.png)

You can obtain an app id and secret by visiting [this site](https://ssl.reddit.com/prefs/apps/) and selecting `create an application`. Filling out the form like below, clicking `create app`, and then clicking `edit` will reveal these values.

![](https://cdn.discordapp.com/attachments/833909925255708682/869415871657947146/unknown.png)

![](https://cdn.discordapp.com/attachments/833909925255708682/869417667713458176/app.PNG)

## Adding Posts

Post files determine the content of your posts and are located in the `/posts/` folder. They require:

1. `subreddit` - the subreddit you want to post to
2. `type` - the type of post: either "text," "image," or "link"
3. `title` - the title of your post
4. `content` - the content of your post, whether it be a text body or a url

![](https://cdn.discordapp.com/attachments/833909925255708682/869418125454639114/unknown.png)

## Running Commands

To actually make posts, you can run these commands in the command prompt window.

* `p {account} {post}` - make a single post. If you don't provide a "post", it will randomly select one. If you provide neither an "account" nor a "post", it will randomly select both.
* `l [delay in minutes]` - loop posting on a set interval. This method will cycle through all your accounts and posts.
* `f` - displays the names of each of your account/post files
* `c` - cancels any active loops

## Example

https://user-images.githubusercontent.com/77910109/127091630-d2c7267d-c6a3-445c-a54f-bf8ee46f6057.mp4

## What if thing no worky?

https://bigsnail.monster/configissue/1.gif
