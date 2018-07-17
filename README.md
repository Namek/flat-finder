# What?

My version of [modrzew/gumtree-scraper](https://github.com/modrzew/gumtree-scraper) that adds map and is built on top of JavaScript + Meteor instead of Python.

![the app](/screenshot.png)

# How to run it?

You simply run it as a meteor app.
1. Install [Meteor](https://www.meteor.com/)
2. Install dependencies: `meteor npm install`
3. Open command line, go to app folder and type in `meteor run`
4. open the URL shown on the console output (usually [http://localhost:3000](http://localhost:3000))
5. open second command line, go to app folder and run `meteor mongo`
6. using mongodb, insert a website to be scanned: `db.websites.insert({"type" : "gumtree", "url" : "https://www.gumtree.pl/s-mieszkania-i-domy-do-wynajecia/rzeszow/v1c9008l3200252p1"})`

# How to deploy it locally?

1. Install [Meteor](https://www.meteor.com/)
2. Install dependencies: `meteor npm install`
3. Create folder to deploy app: `mkdir /srv/flat-finder-meteor-app`
4. Open command line, go to app folder and build it: `meteor build /srv/flat-finder-meteor-app`
5. go there and unpack: `cd /srv/flat-finder-meteor-app && tar xzvf *.tar.gz && cd bundle`
6. `cat README` - read it to see how set ROOT_URL, MONGO_URL, PORT
7. make sure that mongodb is installed on your system and started as a service
8. make sure your firewall allows given port
9. launch `node main.js`
10. using mongodb, insert a website to be scanned: `db.websites.insert({"type" : "gumtree", "url" : "https://www.gumtree.pl/s-mieszkania-i-domy-do-wynajecia/rzeszow/v1c9008l3200252p1"})`

# Lessons learned

1. You can't ask Google Maps API for too much per sec for free :(
2. Meteor is actually kind of cool to quickly prototype those things but somewhat complicated with nested templates while passing down the data
