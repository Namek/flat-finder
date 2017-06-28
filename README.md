# What?

My version of [modrzew/gumtree-scraper](https://github.com/modrzew/gumtree-scraper) that adds map and is built on top of JavaScript + Meteor instead of Python.

![the app](/screenshot.png)

# How to run it?

You simply run it as a meteor app.
1. Install [Meteor](https://www.meteor.com/)
2. open command line, go to app folder and type in `meteor run`
3. open the URL shown on the console output (usually [http://localhost:3000](http://localhost:3000))

# Lessons learned

1. You can't ask Google Maps API for too much per sec for free :(
2. Meteor is actually kind of cool to quickly prototype those things but somewhat complicated with nested templates while passing down the data
