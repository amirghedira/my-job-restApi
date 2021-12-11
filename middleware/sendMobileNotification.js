var Request = require("request");
module.exports = (content, recipient) => {
    Request.post({
        "headers": { "content-type": "application/json" },
        "url": "https://exp.host/--/api/v2/push/send",
        body: JSON.stringify({
            to: recipient,
            sound: 'default',
            title: 'Notification',
            body: content
        })

    }, (error, response, body) => {
        if (error) {
            return console.dir(error);
        }
        console.dir(JSON.parse(body));

    });

}


// mobileNotification("Order Payed", user.notificationToken)
