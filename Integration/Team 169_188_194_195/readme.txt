Microservices Integrated with this team:
i) Push Notification 
ii) Dynamic Pricing Analysis 

How it is done:

The microservices which we have implemented run locally on the system. To make it accessable globally we use bore, which makes the port on which the microservice is running on to global. Bore issues a new port on which it runs and using it the api can be called. 

This is done for both push notification and dynamic pricing analysis, where they call the "bore-url/send-push"(CustomizedParts.js) and "bore-url/package-price" (EditPackages.js)

So whenever the action is done(add package/checkout button is clicked), it calls the respective api and a communication is formed. 

For the pusher api to work, the team with which we integrated had to add in the pusher api in their frontend, which is responsible for the pop up to be displayed on their browser.( Also the push notif. are only displayed if - i) It is HTTPS or ii)localhost, it will not work in HTTP as the site is not secured and notifications are turned off).


