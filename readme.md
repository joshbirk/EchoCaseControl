Echo Case Control
=================

Youtube video demo:

[![Echo Case Control Video](http://i.ytimg.com/vi/pzCuRf7Bd8w/hqdefault.jpg)](http://www.youtube.com/watch?v=pzCuRf7Bd8w)



This is a node.js application to be used with an Amazon Alexa Skill (for the Echo) to control Salesforce cases.

I'm going to put this up on my personal blog for a while to get some brave beta testers and then probably mirror the content over at developer.salesforce.com.

Following the instructions below will let you:

1. Use an Amazon Echo to list, open and modify your Salesforce Cases
2. Support for changing priority, status and posting to Chatter currently
3. A Chrome extension to have your browser follow the changes is optional.

What you will need:

1. An [Amazon Echo](http://www.amazon.com/gp/product/B00X4WHP5E?tag=googhydr-20&hvadid=78570979279&hvpos=1t1&hvexid=&hvnetw=g&hvrand=4522819249534712709&hvpone=&hvptwo=&hvqmt=b&hvdev=c&ref=pd_sl_11vaentyzr_b) or other Alexa enabled device.  If you don't have an Echo, consider [building one out of a Raspberry Pi](https://github.com/amzn/alexa-avs-raspberry-pi/blob/master/README.md).
2. An [Amazon Developer Account](http://developer.amazon.com/) to setup the Alexa Skill.
3. You can use [Amazon Lambda](http://aws.amazon.com/lambda/) to host the skill, but I'll be including instructions on using [Heroku](https://dashboard.heroku.com/).  So you'll want one or the other.
4. A [Salesforce Connected App](https://developer.salesforce.com/page/Connected_Apps), as I won't provide demo keys.  It doesn't take long and makes you in control of your own app.
5. A [Salesforce Developer Edition](http://developer.salesforce.com/signup) to test the app.  You'll be able to swap out with your production instance easy enough, but this will be good to kick the tires.

Ok, ready?  Let's go.

**Step 1**: Get the Connected App.  You'll need the keys for a few steps down the road.  For now you can ignore the redirect URI, we will fill that out when we get to the Amazon section.

**Step 2**: Clone the [Echo Case Control github repo](https://github.com/joshbirk/EchoCaseControl)

**Step 3**: I'm going to assume Heroku since it is what I know.  Go to the EchoCaseControl directory and use *heroku create* to create the new app and add the remote endpoint.  

In app.js, the "oauth_timeout" is currently set for the default settings.  This needs to be shorter than the OAuth timeout for your user for the refresh loop to work.  You can change the code or set a config var for this.

Deploy the new app with *git push heroku master*.

**Step 4**: For any Salesforce instance you want to run Echo Case Control, add the [Echo Case Control](https://login.salesforce.com/packaging/installPackage.apexp?p0=04t37000000ANA4) unmanaged packaged.  This adds special REST endpoints, a Custom Object and a couple of triggers.  It's pretty lightweight, has some decent unit tests and shouldn't conflict with non-Echo functionality.

If you want to use the Chrome Extension, run the following in Anonymous Apex:

>EchoPushTopics.CreatePushTopics();

**Step 5**: Go to your Amazon Developer account.  Under the "Alexa" category, go to "[Alexa Skills Kit](https://developer.amazon.com/edw/home.html#/skills/list)" and click "Add New Skill"

Fill out the following, remember to save in between each one.

On the "Skill Information" section:

1. You can name it what you want.  I named mine "Echo Case Control".

2. Keep this as a Custom Interaction Model type

3. For invocation I recommend "salesforce".

On the "Interaction Model"

1. The intents I've used are listed on the "intents.json" file from the repo.  Copy and paste those into the top section.

2. The utterances I've used are listed in the "utterances.txt" file from the repo.  Copy and paste those into the bottom section.

For the "Configuration"

1. For Heroku, select "HTTPS" for the *Endpoint*.  Put in your domain with the '/echo' endpoint.  A la 'https:random-nature-thing.herokuapp.com/echo'

2. Select 'Yes' for Account Linking.

3. For  *Authorization URL*, things are a little tricky.  If you look down the page a bit you'll see the Amazon generated *Redirect URL*.  The randomly generated bit at the end is your vendor ID.  You'll need to add this to the end of 'https://login.salesforce.com/services/oauth2/authorize?redirect_uri=https://pitangui.amazon.com/spa/skill/account-linking-status.html?vendorId=' to form the full Authorization URL.  **This will also be the redirect URI for your connected app**.  

4. Add your Consumer Key from the Connected App as your *Client Id*.

5. Add "salesforce.com" and "herokuapp.com" as domains under the *Domain List*.

6. For *Authorization Grant Type*, select Auth Code Grant.  Add the same value as the redirectURI (your domain ending in /token) for the Access Token URI.  Add your Connected App's Consumer Secret for Client Secret.  For *Client Authentication Scheme*, select "Credentials in request body".

7. Privacy policy link is up to you.  I used the trusty old [Safe Harbor](http://investor.salesforce.com/about-us/investor/safe-harbor-statement/) just to get things running.

For the "SSL Certification" section:

1. Select " Mydevelopment endpoint is a subdomain of a domain that has a wildcard certificate from a certificate authority"

And then *finally* ... enable "Testing" under the Testing section.  This turns the feature on privately for your Alexa account.  At this point I don't have plans to make this a public Skill and unless you have the resources to run a Heroku app for every Salesforce customer wanting to use this - I don't recommend you do either.  If you are setting this up for a small team, a hobby Heroku account should suffice just fine.  The Heroku app itself requires no database resources to run as it is only a traffic cop. 

**Step 6:** Update your Connected App with the Amazon redirect URI. This will look like 'https://pitangui.amazon.com/spa/skill/account-linking-status.html?vendorId=' but with your randomly generated vendor ID at the end.  It's the last part of the Authorization URL you entered in #3 under the Amazon "Configuration" tab.

**Step 7 (optional):** Install the [Salesforce Case Control](https://chrome.google.com/webstore/detail/salesforce-echo-case-cont/jgehjigfmmdedecnalcjpkjbhlfcichb) Chrome extension for hands free control over Chrome while viewing and updating the cases.  It supports both Classic and Lightning UI's.

Again, to make it work you'll need to run this code from Anon Apex:

>EchoPushTopics.CreatePushTopics();


**Step 8:** Authenticate to your Salesforce instance in the Alexa app.  In the app, go to "Skills" in the left nav bar and search for "Echo Case" (or whatever you called you version.  Hit "enable" and it will kick off the OAuth flow.  

I've had some issues with the iOS app completing this process, you can also go to [alexa.amazon.com](https://alexa.amazon.com) and complete it there if it hangs.

If you get an "Unable to Link" error, double check that your token endpoint is correct on the Configuration page.  You can hit it directly from your browser and it should tell you "Post required.  Expiry set to X".  Before you try again, log completely out of Alexa in your browser.  The "Try Again Later" bit seems like it will stick around even after updating config.

Once you have it setup you should be able to start the interaction by saying:

>Alexa, Open Salesforce

Once connected you can get a list of your 5 most recent cases:

>Get My Latest Cases

And Alexa will list them.  In the Chrome extension they will be listed in the extension window as well.  You can then select a case:

>Open Case Number Three

If you have a specific case number, you could use that as well.

Then you can update the priority or status:

>Update Case to 'New|Working|Closed'

>Update Case to 'Low|Medium|High'

You can post to chatter using the following macros:

>Post to Chatter 'follow up'

will post 'We need to follow up with the customer' to the Chatter feed.

>Post to Chatter 'next'

will post 'This needs to be prioritized at the next meeting'

>Post to Chatter 'cannot replicate'

will post 'I cannot replicate this issue with the current information'

>Post to Chatter 'missing info'

will post 'This case is incomplete, we need more information'

These are just demo utterances.  You could modify them by changing the Alexa Skill intent model and the if chain in app.js.

If Alexa times out, just say 

>Alexa, Open Salesforce

or 

>Alexa, ask Salesforce to {command}

a la "Alexa, ask Salesforce to update case to high".  The custom objects from the package keep track of the case control per user.  Alexa will try to keep the conversation alive but if you pause too long it will time out.

So that is that.  I'm going to use this post as the main point of contact for the project while I am getting others to test it out.  Give me a shoutout in the boxes below or [on twitter](http://twitter.com/joshbirk) with feedback.  This is a subset of the functionality I'd like to see down the road, but it's important to prove out this core in the real world before expanding more.




